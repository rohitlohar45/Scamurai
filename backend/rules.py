class RuleEngine:
    def evaluate(self, features: dict) -> tuple[float, list[str]]:
        triggered = []
        scores = []

        if features["tx_velocity_1min"] >= 5:
            triggered.append("velocity")
            scores.append(1.0)

        if (
            features["balance_drop_ratio"] > 0.95
            and features["tx_type"] in ["CASH-OUT", "TRANSFER"]
        ):
            triggered.append("balance_drain")
            scores.append(0.95)

        if features["amount_zscore"] > 4.0:
            triggered.append("amount_spike")
            scores.append(0.85)

        if features["tx_type"] == "CASH-OUT" and features["amount"] > 200_000:
            triggered.append("large_cashout")
            scores.append(0.80)

        if features["hour_of_day"] in [1, 2, 3, 4] and features["amount_zscore"] > 2.0:
            triggered.append("offhours_highamt")
            scores.append(0.70)

        rule_score = max(scores) if scores else 0.0
        return rule_score, triggered
