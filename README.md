# Bharat Market Intelligence Platform 🇮🇳

An enterprise-grade, AI-powered financial intelligence and quantitative analytics terminal for the Indian Stock Market (NSE & BSE equities, indices, futures, and options).

Built strictly in accordance with SEBI regulatory safeguards for algorithmic research, explainable recommendations, walk-forward backtesting, and double-entry paper trading.

---

## 🌟 Core Features & Modules

1. **Market Overview & Telemetry**:
   - Live & delayed quotes for NIFTY 50, BANK NIFTY, India VIX, and major equities.
   - Advance/Decline market breadth meter and sector momentum heatmap.
   - Institutional FII/DII net flow telemetry.
   - Active IST market hours detection (09:15 - 15:30 IST) with clear `VERIFIED` / `DELAYED 15m` / `SYNTHETIC` badging.

2. **Technical Analysis Engine (Zero Look-Ahead Bias)**:
   - Moving Averages: SMA (5, 10, 20, 50, 100, 200) & EMA (5, 10, 20, 50, 100, 200).
   - Oscillators: Wilder's RSI (14), MACD (12/26/9), Stochastic Oscillator, ADX (+DI / -DI).
   - Volatility & Bands: ATR (14), Bollinger Bands, Donchian Channels.
   - Volume: VWAP, On-Balance Volume (OBV), Relative Volume (RVOL).
   - Price Structure: Floor Trader Pivot Points (P, R1-R3, S1-S3) & Swing Support/Resistance.

3. **Derivatives & Options Analytics (Black-Scholes & Greeks)**:
   - Full Option Chain matrix with Calls & Puts side-by-side.
   - Analytical Black-Scholes Greeks: Delta, Gamma, Theta (daily decay), Vega, Rho.
   - Implied Volatility (IV) solver via Newton-Raphson / Bisection.
   - Put-Call Ratio (PCR) and Max Pain calculation.
   - Interactive Strategy Payoff Simulator with Indian brokerage and STT schedule modeling.

4. **Calibrated AI Prediction Engine**:
   - Directional probabilities (Bullish, Bearish, Sideways) across multiple horizons: Intraday 60m, 1 Session, 3 Sessions, 5 Sessions.
   - Transparent factor attribution: Supporting evidence, conflicting factors, and volatility warnings.

5. **Explainable Trade Recommendations**:
   - Transparent state machine: `ELIGIBLE`, `WATCH`, `BLOCKED`, `NO_TRADE`.
   - Setup targets, stop-loss invalidation levels, and risk/reward calculations.
   - Explicit institutional reason codes and circuit breaker blocks.

6. **Institutional Stock Screener**:
   - Predefined screens: Strong Bullish Trend, Strong Bearish Trend, Momentum Breakout, Trend Pullback, Unusual Volume, Oversold, Overbought.
   - Multi-criteria custom filters with one-click CSV export.

7. **Walk-Forward Backtesting Laboratory**:
   - Realistic Indian transaction cost deductions: Brokerage (₹20/order), STT (0.1%), Exchange charges, SEBI turnover fees, Stamp duty, GST, and slippage.
   - Metrics: Net Profit, Return %, CAGR, Max Drawdown %, Sharpe Ratio, Sortino Ratio, Win Rate %, Profit Factor, Expectancy.
   - Trade history log and equity curve visualization.

8. **Paper Trading Terminal & Double-Entry Ledger**:
   - Virtual portfolio initialized with ₹10,00,000 INR.
   - Idempotent order placement (deduplicated by `client_order_id`).
   - Institutional risk gates: Max capital risk per trade (0.5%), Single-stock concentration limit (30%), Daily loss circuit breaker (1.0%).
   - Immutable transaction ledger and live Mark-to-Market (MTM) position tracking.

9. **News & Corporate Actions Intelligence**:
   - Indian macro, corporate results, regulatory announcements, and contract orders tagged by ticker with sentiment impact scoring.

10. **System Observability & Administration**:
    - Real-time provider latency, active market hours, database migration audit, model registry tracking.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict), Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, NumPy, Pandas, Scipy, Scikit-Learn.
- **Data Providers**: Multi-provider abstraction (`BaseMarketDataProvider`) with Yahoo Finance NSE adapter (`^NSEI`, `^NSEBANK`, `.NS` symbols) + offline deterministic synthetic fixture engine.
- **Database**: PostgreSQL (Supabase compatible) with 19 tables, Row-Level Security (RLS), temporal indices, and SQLite zero-config driver.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 18+ & npm

### 2. Backend Setup & Startup
```powershell
# Navigate to project root
cd C:\Users\SONY\.gemini\antigravity\scratch\bharat-market-ai

# Run all automated tests (28 test cases, 100% pass)
python -m pytest tests -v

# Start FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
```powershell
# In a separate terminal
cd C:\Users\SONY\.gemini\antigravity\scratch\bharat-market-ai\frontend

# Start Next.js development server
npm run dev
```
Terminal interface will be accessible at: `http://localhost:3000`

---

## 🧪 Automated Test Suite Audit

Run the test suite anytime:
```powershell
python -m pytest tests -v
```

Verified Test Results:
- **Total Tests**: 28
- **Passed**: 28 (100%)
- **Failed**: 0
- **Duration**: ~5.3 seconds
- **Suites**:
  - `tests/test_indicators.py`: Moving averages, RSI, Bollinger, Pivots, and **Strict Causality Verification (No Look-Ahead Bias)**.
  - `tests/test_greeks.py`: Black-Scholes pricing, Put-Call parity, Greeks signs, IV solver, Max Pain, Payoff curves.
  - `tests/test_paper_trading.py`: Initial balance, order fees, idempotent deduplication, risk limits, realized P&L.
  - `tests/test_backtest.py`: Walk-forward backtesting and Indian transaction tax schedules.
  - `tests/test_api.py`: FastAPI endpoints integration.

---

## ⚖️ Statutory & Compliance Notice

> **SEBI (Securities and Exchange Board of India) Advisory**:  
> The algorithms, indicators, probability models, and recommendations generated by this application are designed strictly for educational, research, and paper-trading simulation purposes. The platform intentionally does not execute live real-money trades. Algorithmic outputs do not constitute SEBI-registered investment advice or research analyst recommendations.
