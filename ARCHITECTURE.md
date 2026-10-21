# ARCHITECTURE SPECIFICATION: Bharat Market Intelligence Platform

## 1. System Topology

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|               Next.js 14 App Router + TypeScript + Tailwind CSS                 |
|             Lightweight Charts + Lucide Icons + TanStack Query                  |
+---------------------------------------------------------------------------------+
                                       |
                                       | HTTPS / JSON REST & WebSockets
                                       v
+---------------------------------------------------------------------------------+
|                                 API GATEWAY                                     |
|                         FastAPI Application Server                              |
|           CORS Middleware, Rate Limiter, Auth JWT/Session Validation             |
+---------------------------------------------------------------------------------+
                                       |
     +---------------------------------+---------------------------------+
     |                                 |                                 |
     v                                 v                                 v
+-----------------------+   +-----------------------+   +-----------------------+
|  MARKET DATA SERVICE  |   |  ANALYTICS & ML ENGINE |   | PAPER TRADING ENGINE  |
| - Provider Adapters   |   | - Technical Indicators|   | - Double-Entry Ledger |
| - Candle Ingestion    |   | - Options Greeks      |   | - Risk Circuit Breaker|
| - Symbol Resolver     |   | - Multi-Horizon Models|   | - Position Manager    |
| - Market Hours (IST)  |   | - Explainable Signals |   | - Order Fills Engine  |
+-----------------------+   +-----------------------+   +-----------------------+
            |                          |                            |
            +--------------------------+----------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
|                               PERSISTENCE TIER                                  |
|            PostgreSQL (Supabase Compatible) / SQLite Local Driver               |
|            Row Level Security (RLS) + Temporal Time-Series Indices              |
+---------------------------------------------------------------------------------+
```

## 2. Core Modules & Responsibilities

### 2.1 Backend Architecture (`/backend`)
- **`app/api/`**: Modular API routers:
  - `/overview`: Market breadth, indices (NIFTY 50, BANK NIFTY, India VIX), sector heatmaps.
  - `/instruments`: Symbol search, profile, current quotes, OHLCV candles (1m, 5m, 15m, 1h, 1D).
  - `/technical`: Calculations for 20+ technical indicators with warm-up periods.
  - `/screener`: Multi-filter criteria query engine with institutional screen presets.
  - `/options`: Option chains, Black-Scholes Greeks, IV, PCR, Max Pain, Payoff simulations.
  - `/predictions`: AI multi-horizon predictions with calibrated probabilities and factor explanations.
  - `/signals`: Explainable recommendation engine (`ELIGIBLE`, `WATCH`, `BLOCKED`, `NO_TRADE`).
  - `/backtest`: Strategy execution, equity curve, drawdown, transaction cost modeling.
  - `/paper`: Virtual account balance, idempotent order placement, fill simulator, positions.
  - `/news`: Curated Indian financial market news, sentiment scoring, and company announcements.
  - `/admin`: Health monitoring, provider latency, data freshness, model registry.
- **`app/providers/`**:
  - `base.py`: Abstract `BaseMarketDataProvider` interface.
  - `yfinance_provider.py`: Live and historical quotes for NSE/BSE stocks & indices (`.NS`).
  - `synthetic_provider.py`: Deterministic fixture provider for reproducible tests & offline runs.
- **`app/engine/`**:
  - `indicators.py`: Pure numpy/pandas mathematical implementations of technical indicators.
  - `greeks.py`: Black-Scholes options pricing and Greeks calculation (Delta, Gamma, Theta, Vega, Rho, IV).
  - `ml_models.py`: Feature engineering, Logistic Regression & Gradient Boosting models with calibration.
  - `backtester.py`: Walk-forward event-driven backtesting engine with realistic Indian charges.
  - `paper_engine.py`: Double-entry accounting ledger and risk gate engine.

### 2.2 Database Layer (`/database`)
19 normalized tables:
- `instruments`: Symbol metadata, exchange, tick size, lot size.
- `market_candles`: Historical OHLCV bars indexed by symbol and timestamp.
- `market_quotes`: Real-time / delayed quotes, bid/ask, day volume.
- `option_snapshots`: Option chain snapshots, strikes, expiries, call/put OI, Greeks.
- `technical_features`: Pre-computed indicator values.
- `news_items` & `news_assessments`: Market news, sentiment, affected tickers.
- `predictions`: Model directional and volatility forecasts with explainability.
- `trade_signals` & `signal_outcomes`: Transparent signal generation and actual performance.
- `model_registry`: Versioned model metadata and calibration metrics.
- `backtest_runs`: Parameters, equity curves, and performance metrics.
- `paper_accounts`, `paper_orders`, `paper_fills`, `paper_positions`, `paper_ledger_entries`: Complete trading ledger.
- `user_watchlists`, `user_alerts`: User customization.
- `data_ingestion_runs`: Observability audit trail.

### 2.3 Regulatory & Compliance Safeguards
- Clear labeling of simulated vs live data.
- Prominent statutory disclaimers regarding SEBI registration.
- No execution of live real-money trades.
