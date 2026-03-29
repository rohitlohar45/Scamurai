import argparse
import json
import time
from datetime import datetime, timezone

import pandas as pd
import redis


def replay(rate: float = 1.0) -> None:
    client = redis.Redis(host="redis", port=6379, decode_responses=True)
    dataframe = pd.read_csv("/data/paysim_sample.csv")

    for idx, row in dataframe.iterrows():
        transaction = {
            "tx_id": f"TXN-{idx:06d}",
            "user_id": row["nameOrig"],
            "amount": round(float(row["amount"]), 2),
            "tx_type": row["type"],
            "old_balance": round(float(row["oldbalanceOrg"]), 2),
            "new_balance": round(float(row["newbalanceOrig"]), 2),
            "dest_id": row["nameDest"],
            "is_fraud_gt": int(row["isFraud"]),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "injected_fraud_type": None,
        }
        client.xadd("transactions", {"data": json.dumps(transaction)}, maxlen=2000)
        time.sleep(1.0 / rate)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--rate",
        type=float,
        default=1.0,
        help="Transactions per second (default: 1)",
    )
    args = parser.parse_args()
    replay(rate=args.rate)
