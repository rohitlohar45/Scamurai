from __future__ import annotations

import json
import os
import random
import sqlite3
import time
from datetime import datetime, timezone

import numpy as np
import redis

from model import FraudModel
from rules import RuleEngine


STREAM_NAME = "transactions"
GROUP_NAME = "fraud-consumer-group"
CONSUMER_NAME = "fraud-consumer-1"
DB_PATH = "/app/fraud_detection.db"

_model = FraudModel(contamination=0.05)
_rules = RuleEngine()
_train_buffer: list[list[float]] = []
_retrain_buffer: list[list[float]] = []
_processed_count = 0
_started = False
STREAM_MAXLEN = 20000
DB_RETRY_BACKOFF_SECONDS = 0.05


def combine(ml_score: float, rule_score: float) -> tuple[float, str]:
    final_score = 0.6 * ml_score + 0.4 * rule_score
    if final_score >= 0.70:
        status = "FRAUD"
    elif final_score >= 0.50:
        status = "SUSPICIOUS"
    else:
        status = "CLEAR"
    return round(final_score, 4), status


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS fraud_cases (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_id           TEXT NOT NULL,
            user_id         TEXT,
            amount          REAL,
            tx_type         TEXT,
            ml_score        REAL,
            rule_score      REAL,
            final_score     REAL,
            rules_triggered TEXT,
            status          TEXT,
            is_fraud_gt     INTEGER,
            timestamp       TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions_recent (
            tx_id       TEXT PRIMARY KEY,
            user_id     TEXT,
            amount      REAL,
            tx_type     TEXT,
            status      TEXT,
            final_score REAL,
            timestamp   TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS transaction_outcomes (
            tx_id       TEXT PRIMARY KEY,
            status      TEXT,
            is_fraud_gt INTEGER
        )
        """
    )
    conn.commit()
    conn.close()


def save_recent_transaction(tx: dict, status: str, final_score: float) -> None:
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO transactions_recent
            (tx_id, user_id, amount, tx_type, status, final_score, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            tx.get("tx_id"),
            tx.get("user_id"),
            float(tx.get("amount", 0.0)),
            tx.get("tx_type"),
            status,
            float(final_score),
            tx.get("timestamp"),
        ),
    )
    conn.execute(
        """
        DELETE FROM transactions_recent
        WHERE tx_id NOT IN (
            SELECT tx_id FROM transactions_recent ORDER BY timestamp DESC LIMIT 20
        )
        """
    )
    conn.commit()
    conn.close()


def save_outcome(tx: dict, status: str) -> None:
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO transaction_outcomes
            (tx_id, status, is_fraud_gt)
        VALUES (?, ?, ?)
        """,
        (
            tx.get("tx_id"),
            status,
            int(tx.get("is_fraud_gt", 0)),
        ),
    )
    conn.commit()
    conn.close()


def save_alert(tx: dict, ml_score: float, rule_score: float, final_score: float, status: str, triggered_rules: list[str]) -> None:
    if status not in {"FRAUD", "SUSPICIOUS"}:
        return
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO fraud_cases
            (tx_id, user_id, amount, tx_type, ml_score, rule_score, final_score,
             rules_triggered, status, is_fraud_gt, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            tx.get("tx_id"),
            tx.get("user_id"),
            float(tx.get("amount", 0.0)),
            tx.get("tx_type"),
            float(ml_score),
            float(rule_score),
            float(final_score),
            json.dumps(triggered_rules),
            status,
            int(tx.get("is_fraud_gt", 0)),
            tx.get("timestamp"),
        ),
    )
    conn.commit()
    conn.close()


def create_injected_fraud_transaction() -> dict:
    fraud_type = random.choice(
        [
            "velocity",
            "balance_drain",
            "amount_spike",
            "large_cashout",
            "offhours_highamt",
        ]
    )
    amount = random.uniform(250000.0, 900000.0)
    old_balance = amount + random.uniform(1000.0, 20000.0)
    tx_type = "CASH-OUT" if fraud_type != "amount_spike" else "TRANSFER"
    now = datetime.now(timezone.utc)

    return {
        "tx_id": f"TXN-INJECT-{int(now.timestamp() * 1000)}",
        "user_id": "C_injected",
        "amount": round(amount, 2),
        "tx_type": tx_type,
        "old_balance": round(old_balance, 2),
        "new_balance": round(random.uniform(0.0, 100.0), 2),
        "dest_id": "M_injected",
        "is_fraud_gt": 1,
        "timestamp": now.isoformat(),
        "injected_fraud_type": fraud_type,
    }


def inject_fraud() -> dict:
    host = os.getenv("REDIS_HOST", "redis")
    client = redis.Redis(host=host, port=6379, decode_responses=True)
    tx = create_injected_fraud_transaction()
    client.xadd(STREAM_NAME, {"data": json.dumps(tx)}, maxlen=STREAM_MAXLEN)
    return tx


def get_processed_count() -> int:
    return _processed_count


def _consume_forever() -> None:
    global _started, _processed_count, _train_buffer, _retrain_buffer

    if _started:
        return
    _started = True
    init_db()

    host = os.getenv("REDIS_HOST", "redis")
    client = redis.Redis(host=host, port=6379, decode_responses=True)

    try:
        client.xgroup_create(STREAM_NAME, GROUP_NAME, id="0", mkstream=True)
    except redis.exceptions.ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise

    while True:
        messages = client.xreadgroup(
            GROUP_NAME,
            CONSUMER_NAME,
            streams={STREAM_NAME: ">"},
            count=50,
            block=1000,
        )
        if not messages:
            continue

        for stream_name, entries in messages:
            for message_id, payload in entries:
                data = payload.get("data")
                if not data:
                    client.xack(stream_name, GROUP_NAME, message_id)
                    continue

                try:
                    tx = json.loads(data)
                    feature_vector, features_dict = _model.extract_features(tx)

                    if not _model.trained and len(_train_buffer) < 1000:
                        _train_buffer.append(feature_vector)
                        if len(_train_buffer) == 1000:
                            _model.fit(np.array(_train_buffer))
                    elif _model.trained:
                        _retrain_buffer.append(feature_vector)

                    ml_score = _model.score(feature_vector)
                    rule_score, triggered_rules = _rules.evaluate(features_dict)
                    final_score, status = combine(ml_score, rule_score)

                    save_recent_transaction(tx, status, final_score)
                    save_outcome(tx, status)
                    save_alert(tx, ml_score, rule_score, final_score, status, triggered_rules)
                    _model.update_state(tx)

                    _processed_count += 1
                    if _model.trained and _processed_count % 10000 == 0 and _retrain_buffer:
                        _model.fit(np.array(_retrain_buffer[-10000:]))
                except json.JSONDecodeError as exc:
                    print(f"Failed to decode JSON for message {message_id}: {exc}")
                except sqlite3.OperationalError as exc:
                    print(f"SQLite write error for message {message_id}: {exc}")
                    time.sleep(DB_RETRY_BACKOFF_SECONDS)
                except Exception as exc:
                    print(f"Failed to process message {message_id}: {exc}")
                finally:
                    client.xack(stream_name, GROUP_NAME, message_id)


async def run_consumer() -> None:
    import asyncio

    await asyncio.to_thread(_consume_forever)
