# IMPLEMENTATION PLAN: Bharat Market Intelligence Platform (AI-Powered)

## Executive Summary
This document establishes the engineering roadmap for building a production-grade Indian Stock Market Intelligence Platform adhering to the Master Specification. The platform is designed for NSE & BSE equities, indices (NIFTY 50, BANK NIFTY), futures, and options. It features real data-provider integrations, verified technical analytics, AI-assisted multi-horizon directional & volatility prediction, rule-based explainability, options chain analytics with Greeks/payoffs, walk-forward backtesting, paper-trading with double-entry ledger reconciliation, and strict regulatory safeguards.

---

## Architecture Overview
- **Frontend**: Next.js 14 App Router, TypeScript (strict), Tailwind CSS, Lightweight Charts, Lucide Icons, TanStack Query, Radix UI accessible primitives. High information density financial terminal layout (dark-first with complete light mode).
- **Backend**: Python 3.12, FastAPI, Pydantic v2, NumPy, Pandas, Scipy, Scikit-Learn, Technical Indicators Engine, Options Math (Black-Scholes & Greeks), Backtesting Engine, Paper Trading Engine with idempotent ledgering.
- **Data Providers**: Multi-provider abstraction (`BaseMarketDataProvider`).
  - Primary live/historical: Yahoo Finance NSE adapter (`^NSEI`, `^NSEBANK`, `.NS` symbols) + NSE Official Disclosures & Announcements RSS / News parser.
  - Fallback / Mock provider: Deterministic synthetic fixture generator with Indian market hours (09:15 - 15:30 IST) for reproducible offline testing and CI/CD.
- **Database**: PostgreSQL (Supabase compatible) schema with 19 tables, Row-Level Security (RLS), temporal indices, and strict constraints. SQLite/PostgreSQL dual-driver support for local self-contained zero-config execution.

---

## Implementation Phases & Milestones

### Phase 1: Audit, Architecture, Database Migrations, & Provider Abstraction
- [x] Initial audit of workspace and runtime environment.
- [ ] Core architecture documentation and dependency setup.
- [ ] Complete database migration script (`001_initial_schema.sql`) covering all 19 entities (instruments, candles, quotes, options, news, signals, predictions, backtest, paper trading).
- [ ] Abstract provider interface `MarketDataProvider` and real implementations (`YFinanceNSEProvider`, `DeterministicFixtureProvider`).
- [ ] Provider validation suite with session-aware IST time handling.

### Phase 2: Market Overview, Quotes, Candles, & Technical Analysis Engine
- [ ] Core technical indicators implementation (SMA, EMA, RSI 14, MACD 12/26/9, Stochastic, ADX, ATR 14, Bollinger Bands, Donchian, VWAP, OBV, Pivot Points, Swing Structure).
- [ ] No look-ahead bias verification with unit test harness.
- [ ] Market overview endpoints (NIFTY 50, BANK NIFTY, India VIX, Market Breadth, Sector Momentum, Top Gainers/Losers).
- [ ] Interactive chart data streaming & candle endpoints with interval aggregation (1m, 5m, 15m, 1h, 1D).

### Phase 3: Stock Screener, Watchlists, News Centre & Explainable Signals
- [ ] Multi-criteria stock screener with predefined institutional screens (Momentum Breakout, Pullback in Trend, Unusual Volume, Oversold/Overbought, Event Risk).
- [ ] Explainable Signal Engine combining technical trend, momentum, volatility, and volume confirmation into explicit states (`ELIGIBLE`, `WATCH`, `BLOCKED`, `NO_TRADE`) with reason codes.
- [ ] News & Corporate Actions Intelligence module (fetching, deduplicating, categorizing, and scoring sentiment).
- [ ] User Watchlist management with persistent tracking.

### Phase 4: AI & Quantitative Prediction Engine
- [ ] Feature extraction pipeline (trend, momentum, volatility, relative strength vs Nifty, volume Z-scores).
- [ ] Calibrated probability models (Bullish, Bearish, Sideways) for defined horizons (1 Session, 3 Sessions, 5 Sessions).
- [ ] Feature importance and explainability breakdowns (supporting factors, conflicting factors, regime identification).
- [ ] Walk-forward chronological evaluation to prevent data leakage.
- [ ] Model registry and prediction accuracy tracking.

### Phase 5: Futures & Options Analytics Engine
- [ ] Options chain parser and Greeks calculation engine (Black-Scholes analytical model: Implied Volatility, Delta, Gamma, Theta, Vega, Rho).
- [ ] Put-Call Ratio (PCR) analysis, Max Pain calculation, and Open Interest change tracking.
- [ ] Strategy builder and payoff simulators (Long Call/Put, Bull Call Spread, Bear Put Spread, Straddle, Strangle).
- [ ] Pre-expiry vs Expiry mark-to-market scenario simulations with slippage and lot-size validation.

### Phase 6: Backtesting Laboratory
- [ ] Event-driven / vectorized walk-forward backtesting engine.
- [ ] Transaction cost and slippage modeling (STT, exchange fees, SEBI turnover fees, GST, stamp duty).
- [ ] Performance metrics computation (CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Calmar Ratio, Win Rate, Expectancy, Profit Factor).
- [ ] Visual equity curve and drawdown chart generation.

### Phase 7: Paper Trading Terminal & Risk Management
- [ ] Virtual account ledger with double-entry bookkeeping (cash balance, reserved margin, realized/unrealized P&L).
- [ ] Idempotent order execution simulation (Market, Limit, Stop-Loss).
- [ ] Position tracking with real-time mark-to-market valuations.
- [ ] Institutional risk gates: Max risk per trade (0.5%), Daily loss circuit (1.0%), Max portfolio exposure (2.0%), blocking illegal states.

### Phase 8: Frontend Dashboard, UI/UX, Observability & Hardening
- [ ] Next.js 14 Dark-First Professional Financial Terminal interface with Light Theme toggle.
- [ ] Responsive multi-pane layout: Top Nav, Market Ticker, Left Navigation, Main Workspace, Right-side Watchlist & Alert Drawer.
- [ ] Pages: Dashboard Overview, Screener, Instrument Analysis, Options Chain & Greeks, AI Predictions & Signals, Backtester, Paper Trading Terminal, News Feed, Admin & Health Monitor.
- [ ] End-to-end integration testing, linting, type-checking, and performance benchmarking.
- [ ] Compliance disclaimers and SEBI regulatory notices.
