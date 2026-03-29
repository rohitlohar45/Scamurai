# Scamurai — Real-time Fraud Detection Engine

Real-time fraud detection MVP using Redis Streams, FastAPI, IsolationForest + rules, SQLite, and a React dashboard.

## Prerequisites

- Docker + Docker Compose
- Python 3.11+ (for one-time dataset prep)
- Kaggle CLI

## Setup

```bash
pip install kaggle
# Place kaggle token at ~/.kaggle/kaggle.json
kaggle datasets download -d ealaxi/paysim1
unzip paysim1.zip -d data/
python -c "import pandas as pd; pd.read_csv('data/PS_20174392719_1491204439457_log.csv', nrows=100000).to_csv('data/paysim_sample.csv', index=False)"
docker-compose up --build
```

Dashboard: http://localhost:3000  
Backend API: http://localhost:8000

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  INGESTION                                              │
│  PaySim CSV replay  ──►  Redis Stream "transactions"   │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│  DETECTION                                              │
│  ┌─────────────────────┐   ┌────────────────────────┐  │
│  │  IsolationForest    │   │  Rule engine (5 rules) │  │
│  │  ml_score: 0–1      │   │  rule_score: 0–1       │  │
│  └──────────┬──────────┘   └────────────┬───────────┘  │
│             └──────────┬────────────────┘               │
│                        ▼                                │
│         final = 0.6×ml + 0.4×rules                     │
│         ≥0.70 → FRAUD  ≥0.50 → SUSPICIOUS              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  OUTPUT                                                 │
│  FastAPI  ──►  SQLite  ──►  React Dashboard            │
└─────────────────────────────────────────────────────────┘
```

## Fraud signals (rules)

| Rule | Condition | Score |
|---|---|---|
| Velocity | `tx_velocity_1min >= 5` | 1.0 |
| Balance drain | `balance_drop_ratio > 0.95` and `tx_type in ['CASH-OUT','TRANSFER']` | 0.95 |
| Amount spike | `amount_zscore > 4.0` | 0.85 |
| Large CASH-OUT | `tx_type == 'CASH-OUT'` and `amount > 200000` | 0.80 |
| Off-hours + high amount | `hour_of_day in [1,2,3,4]` and `amount_zscore > 2.0` | 0.70 |

## Sample quality metrics

```json
{
  "precision": 0.94,
  "recall": 0.88
}
```
