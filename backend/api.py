from __future__ import annotations

import asyncio
import json
import sqlite3
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from consumer import DB_PATH, get_processed_count, inject_fraud, run_consumer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STARTED_AT = datetime.now(timezone.utc)


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.on_event("startup")
async def startup() -> None:
    asyncio.create_task(run_consumer())


@app.get("/transactions/recent")
def transactions_recent() -> dict:
    conn = _db()
    rows = conn.execute(
        """
        SELECT tx_id, user_id, amount, tx_type, status, final_score, timestamp
        FROM transactions_recent
        ORDER BY timestamp DESC
        LIMIT 20
        """
    ).fetchall()
    conn.close()
    return {"transactions": [dict(r) for r in rows]}


@app.get("/stats")
def stats() -> dict:
    conn = _db()

    total_count = get_processed_count()
    fraud_count = conn.execute(
        "SELECT COUNT(*) FROM fraud_cases WHERE status = 'FRAUD'"
    ).fetchone()[0]
    suspicious_count = conn.execute(
        "SELECT COUNT(*) FROM fraud_cases WHERE status = 'SUSPICIOUS'"
    ).fetchone()[0]
    flagged_amount = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM fraud_cases"
    ).fetchone()[0]

    rule_rows = conn.execute("SELECT rules_triggered FROM fraud_cases").fetchall()
    signal_breakdown: dict[str, int] = {}
    for row in rule_rows:
        for rule in json.loads(row["rules_triggered"] or "[]"):
            signal_breakdown[rule] = signal_breakdown.get(rule, 0) + 1

    alert_rows = conn.execute(
        """
        SELECT created_at FROM fraud_cases
        WHERE created_at >= datetime('now', '-60 seconds')
        """
    ).fetchall()

    now = datetime.now(timezone.utc)
    buckets = [0] * 20
    for row in alert_rows:
        created = datetime.fromisoformat(row["created_at"].replace(" ", "T") + "+00:00")
        age = (now - created).total_seconds()
        if 0 <= age <= 60:
            bucket_index = int((60 - age) // 3)
            if 0 <= bucket_index < 20:
                buckets[bucket_index] += 1

    tp = conn.execute(
        "SELECT COUNT(*) FROM fraud_cases WHERE status='FRAUD' AND is_fraud_gt=1"
    ).fetchone()[0]
    fp = conn.execute(
        "SELECT COUNT(*) FROM fraud_cases WHERE status='FRAUD' AND is_fraud_gt=0"
    ).fetchone()[0]

    fn = conn.execute(
        """
        SELECT COUNT(*) FROM fraud_cases
        WHERE is_fraud_gt=1 AND status!='FRAUD'
        """
    ).fetchone()[0]

    conn.close()

    precision = (tp / (tp + fp)) if (tp + fp) else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) else 0.0

    return {
        "total_count": int(total_count),
        "fraud_count": int(fraud_count),
        "suspicious_count": int(suspicious_count),
        "flagged_amount": float(flagged_amount or 0.0),
        "signal_breakdown": signal_breakdown,
        "alert_timeseries": buckets,
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
    }


@app.post("/inject-fraud")
def inject_fraud_now() -> dict:
    tx = inject_fraud()
    return {"tx_id": tx["tx_id"], "status": "QUEUED", "rules_triggered": []}


@app.get("/health")
def health() -> dict:
    uptime = (datetime.now(timezone.utc) - STARTED_AT).total_seconds()
    return {"status": "ok", "uptime_seconds": int(uptime)}
