import argparse
import json
import os
import time
from datetime import datetime, timezone

import pandas as pd
import redis


STREAM_MAXLEN = 20000


def replay(rate: float = 100.0) -> None:
    redis_host = os.getenv("REDIS_HOST", "redis")
    try:
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
    except ValueError:
        redis_port = 6379
    client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
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
        client.xadd("transactions", {"data": json.dumps(transaction)}, maxlen=STREAM_MAXLEN)
        time.sleep(1.0 / rate)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--rate",
        type=float,
        default=100.0,
        help="Transactions per second (default: 100)",
    )
    args = parser.parse_args()
    replay(rate=args.rate)
