from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime

import numpy as np
from sklearn.ensemble import IsolationForest


class FraudModel:
    def __init__(self, contamination: float = 0.05):
        self.clf = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
        )
        self.trained = False
        self.min_score = -1.0
        self.max_score = 0.0

        self.user_amounts: dict[str, list[float]] = defaultdict(list)
        self.user_timestamps: dict[str, deque[float]] = defaultdict(deque)

    def fit(self, X: np.ndarray) -> None:
        self.clf.fit(X)
        scores = self.clf.score_samples(X)
        self.min_score = float(scores.min())
        self.max_score = float(scores.max())
        self.trained = True

    def _timestamp_seconds(self, timestamp: str) -> float:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).timestamp()

    def extract_features(self, tx: dict) -> tuple[list[float], dict]:
        user_id = tx.get("user_id", "unknown")
        amount = float(tx.get("amount", 0.0))
        old_balance = float(tx.get("old_balance", 0.0))
        new_balance = float(tx.get("new_balance", 0.0))
        tx_type = tx.get("tx_type", "")
        timestamp = tx.get("timestamp", datetime.utcnow().isoformat())
        injected_fraud_type = tx.get("injected_fraud_type")

        history = self.user_amounts[user_id]
        if len(history) >= 2:
            user_avg = float(np.mean(history))
            user_std = float(np.std(history))
        else:
            user_avg = amount
            user_std = 1.0

        amount_zscore = (amount - user_avg) / (user_std + 1e-6)

        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        hour_of_day = dt.hour

        is_new_device = 1 if injected_fraud_type else 0
        balance_drop_ratio = (old_balance - new_balance) / (old_balance + 1e-6)

        current_ts = self._timestamp_seconds(timestamp)
        window = self.user_timestamps[user_id]
        while window and (current_ts - window[0]) > 60:
            window.popleft()
        tx_velocity_1min = len(window) + 1

        features_list = [
            float(amount_zscore),
            float(hour_of_day),
            float(is_new_device),
            float(balance_drop_ratio),
            float(tx_velocity_1min),
        ]
        features_dict = {
            "amount": amount,
            "tx_type": tx_type,
            "amount_zscore": float(amount_zscore),
            "hour_of_day": int(hour_of_day),
            "is_new_device": int(is_new_device),
            "balance_drop_ratio": float(balance_drop_ratio),
            "tx_velocity_1min": int(tx_velocity_1min),
        }
        return features_list, features_dict

    def update_state(self, tx: dict) -> None:
        user_id = tx.get("user_id", "unknown")
        amount = float(tx.get("amount", 0.0))
        timestamp = tx.get("timestamp", datetime.utcnow().isoformat())
        current_ts = self._timestamp_seconds(timestamp)

        self.user_amounts[user_id].append(amount)
        if len(self.user_amounts[user_id]) > 500:
            self.user_amounts[user_id] = self.user_amounts[user_id][-500:]

        self.user_timestamps[user_id].append(current_ts)

    def score(self, features: list[float]) -> float:
        if not self.trained:
            return 0.5
        raw = self.clf.score_samples([features])[0]
        normalised = (raw - self.min_score) / (self.max_score - self.min_score + 1e-9)
        return float(1.0 - normalised)
