-- ============================================================================
-- BHARAT MARKET INTELLIGENCE PLATFORM
-- Database Schema Migration: 001_initial_schema.sql
-- Target: PostgreSQL / Supabase Compatible
-- ============================================================================

-- Enable required extensions (if running on Supabase / PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. INSTRUMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL UNIQUE,          -- e.g., 'RELIANCE', 'TCS', 'NIFTY50', 'BANKNIFTY'
    exchange VARCHAR(10) NOT NULL DEFAULT 'NSE', -- 'NSE', 'BSE', 'MCX'
    name VARCHAR(255) NOT NULL,
    instrument_type VARCHAR(20) NOT NULL,       -- 'EQUITY', 'INDEX', 'FUTURES', 'OPTIONS'
    sector VARCHAR(100),
    industry VARCHAR(100),
    lot_size INT NOT NULL DEFAULT 1,
    tick_size NUMERIC(10, 4) NOT NULL DEFAULT 0.05,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_type ON instruments(instrument_type);
CREATE INDEX IF NOT EXISTS idx_instruments_sector ON instruments(sector);

-- ----------------------------------------------------------------------------
-- 2. MARKET CANDLES (OHLCV)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_candles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,              -- '1m', '5m', '15m', '1h', '1D'
    timestamp TIMESTAMPTZ NOT NULL,
    open NUMERIC(14, 4) NOT NULL,
    high NUMERIC(14, 4) NOT NULL,
    low NUMERIC(14, 4) NOT NULL,
    close NUMERIC(14, 4) NOT NULL,
    volume BIGINT NOT NULL DEFAULT 0,
    vwap NUMERIC(14, 4),
    turnover NUMERIC(18, 4),
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_candle_sym_tf_time UNIQUE (symbol, timeframe, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_candles_lookup ON market_candles(symbol, timeframe, timestamp DESC);

-- ----------------------------------------------------------------------------
-- 3. MARKET QUOTES (LTP & Depth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL UNIQUE,
    ltp NUMERIC(14, 4) NOT NULL,
    open NUMERIC(14, 4) NOT NULL,
    high NUMERIC(14, 4) NOT NULL,
    low NUMERIC(14, 4) NOT NULL,
    close NUMERIC(14, 4) NOT NULL,               -- Previous close
    change NUMERIC(10, 4) NOT NULL,
    change_pct NUMERIC(8, 4) NOT NULL,
    volume BIGINT NOT NULL DEFAULT 0,
    bid_price NUMERIC(14, 4),
    bid_qty INT,
    ask_price NUMERIC(14, 4),
    ask_qty INT,
    day_52w_high NUMERIC(14, 4),
    day_52w_low NUMERIC(14, 4),
    market_cap NUMERIC(20, 2),
    data_quality VARCHAR(20) NOT NULL DEFAULT 'VERIFIED', -- 'VERIFIED', 'DELAYED', 'SYNTHETIC'
    quote_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. OPTION SNAPSHOTS (Chain & Greeks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS option_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    underlying_symbol VARCHAR(32) NOT NULL,
    expiry_date DATE NOT NULL,
    strike_price NUMERIC(12, 2) NOT NULL,
    option_type VARCHAR(4) NOT NULL,             -- 'CE', 'PE'
    ltp NUMERIC(10, 2) NOT NULL,
    change NUMERIC(10, 2),
    volume BIGINT NOT NULL DEFAULT 0,
    open_interest BIGINT NOT NULL DEFAULT 0,
    oi_change BIGINT NOT NULL DEFAULT 0,
    iv NUMERIC(8, 4),
    delta NUMERIC(8, 4),
    gamma NUMERIC(8, 6),
    theta NUMERIC(8, 4),
    vega NUMERIC(8, 4),
    rho NUMERIC(8, 4),
    bid_price NUMERIC(10, 2),
    ask_price NUMERIC(10, 2),
    snapshot_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_option_snapshot UNIQUE (underlying_symbol, expiry_date, strike_price, option_type, snapshot_timestamp)
);

CREATE INDEX IF NOT EXISTS idx_opt_chain ON option_snapshots(underlying_symbol, expiry_date, strike_price);

-- ----------------------------------------------------------------------------
-- 5. TECHNICAL FEATURES (Computed Pre-aggregates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    rsi_14 NUMERIC(8, 4),
    macd NUMERIC(10, 4),
    macd_signal NUMERIC(10, 4),
    macd_hist NUMERIC(10, 4),
    sma_20 NUMERIC(14, 4),
    sma_50 NUMERIC(14, 4),
    sma_200 NUMERIC(14, 4),
    ema_20 NUMERIC(14, 4),
    ema_50 NUMERIC(14, 4),
    bb_upper NUMERIC(14, 4),
    bb_middle NUMERIC(14, 4),
    bb_lower NUMERIC(14, 4),
    adx_14 NUMERIC(8, 4),
    atr_14 NUMERIC(10, 4),
    vwap NUMERIC(14, 4),
    rvol NUMERIC(8, 2),
    trend_state VARCHAR(20),                     -- 'STRONG_BULLISH', 'BULLISH', 'SIDEWAYS', 'BEARISH', 'STRONG_BEARISH'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tech_features UNIQUE (symbol, timeframe, timestamp)
);

-- ----------------------------------------------------------------------------
-- 6. NEWS ITEMS & NEWS ASSESSMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline VARCHAR(512) NOT NULL,
    summary TEXT,
    source VARCHAR(100) NOT NULL,
    source_url TEXT,
    publication_timestamp TIMESTAMPTZ NOT NULL,
    category VARCHAR(50) NOT NULL,               -- 'EARNINGS', 'REGULATORY', 'MERGERS', 'ORDERS', 'MACRO', 'GLOBAL'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    sentiment VARCHAR(20) NOT NULL,              -- 'VERY_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'VERY_BEARISH'
    sentiment_score NUMERIC(5, 4) NOT NULL,     -- Range: -1.0 to +1.0
    impact_severity VARCHAR(20) NOT NULL,        -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    ai_reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_assess_symbol ON news_assessments(symbol);

-- ----------------------------------------------------------------------------
-- 7. MODEL REGISTRY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,              -- 'LOGISTIC_REGRESSION', 'GRADIENT_BOOSTING', 'RANDOM_FOREST'
    horizon VARCHAR(20) NOT NULL,                -- 'INTRADAY_60M', '1_SESSION', '3_SESSIONS', '5_SESSIONS'
    training_start TIMESTAMPTZ NOT NULL,
    training_end TIMESTAMPTZ NOT NULL,
    accuracy NUMERIC(6, 4),
    f1_score NUMERIC(6, 4),
    brier_score NUMERIC(6, 4),                   -- Probability calibration metric
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    model_artifacts_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. PREDICTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL,
    model_id UUID REFERENCES model_registry(id),
    horizon VARCHAR(20) NOT NULL,
    prediction_timestamp TIMESTAMPTZ NOT NULL,
    bullish_prob NUMERIC(6, 4) NOT NULL,
    bearish_prob NUMERIC(6, 4) NOT NULL,
    sideways_prob NUMERIC(6, 4) NOT NULL,
    expected_return NUMERIC(8, 4) NOT NULL,
    estimated_volatility NUMERIC(8, 4) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,     -- 0 to 100
    supporting_factors JSONB,
    conflicting_factors JSONB,
    is_calibrated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preds_sym_time ON predictions(symbol, prediction_timestamp DESC);

-- ----------------------------------------------------------------------------
-- 9. TRADE SIGNALS & SIGNAL OUTCOMES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL,
    direction VARCHAR(10) NOT NULL,              -- 'LONG', 'SHORT', 'NEUTRAL'
    status VARCHAR(20) NOT NULL,                 -- 'ELIGIBLE', 'WATCH', 'BLOCKED', 'NO_TRADE'
    strategy_type VARCHAR(50) NOT NULL,          -- 'MOMENTUM_BREAKOUT', 'PULLBACK_TREND', 'MEAN_REVERSION'
    timeframe VARCHAR(20) NOT NULL,              -- 'INTRADAY', 'SWING', 'POSITIONAL'
    entry_price NUMERIC(14, 4),
    stop_loss NUMERIC(14, 4),
    target_1 NUMERIC(14, 4),
    target_2 NUMERIC(14, 4),
    risk_reward_ratio NUMERIC(6, 2),
    reason_codes JSONB,                          -- Array of strings e.g. ["RSI_OVERSOLD", "VOLUME_CONFIRMED"]
    block_reasons JSONB,                         -- If BLOCKED, reason e.g. ["EARNINGS_ANNOUNCEMENT_TODAY"]
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signal_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
    realized_outcome VARCHAR(20) NOT NULL,       -- 'TARGET_1_HIT', 'TARGET_2_HIT', 'STOP_LOSS_HIT', 'EXPIRED'
    pnl_percentage NUMERIC(8, 4) NOT NULL,
    bars_held INT NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. BACKTEST RUNS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backtest_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_name VARCHAR(100) NOT NULL,
    universe JSONB NOT NULL,                     -- e.g. ["NIFTY50", "RELIANCE", "TCS"]
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital NUMERIC(14, 2) NOT NULL DEFAULT 1000000.00, -- Default INR 10,00,000
    parameters JSONB NOT NULL,
    total_trades INT NOT NULL DEFAULT 0,
    win_rate NUMERIC(6, 4),
    net_profit NUMERIC(14, 2),
    net_return_pct NUMERIC(8, 4),
    cagr NUMERIC(8, 4),
    max_drawdown_pct NUMERIC(8, 4),
    sharpe_ratio NUMERIC(6, 4),
    sortino_ratio NUMERIC(6, 4),
    profit_factor NUMERIC(6, 4),
    total_commission_paid NUMERIC(12, 2),
    equity_curve JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- 'RUNNING', 'COMPLETED', 'FAILED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. PAPER TRADING (ACCOUNTS, ORDERS, FILLS, POSITIONS, LEDGER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paper_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,                                -- Nullable for single user / local session
    account_name VARCHAR(100) NOT NULL DEFAULT 'Primary Virtual Portfolio',
    base_currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 1000000.00,
    cash_balance NUMERIC(14, 2) NOT NULL DEFAULT 1000000.00,
    reserved_margin NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES paper_accounts(id) ON DELETE CASCADE,
    client_order_id VARCHAR(64) NOT NULL UNIQUE, -- For idempotent submission
    symbol VARCHAR(32) NOT NULL,
    side VARCHAR(10) NOT NULL,                   -- 'BUY', 'SELL'
    order_type VARCHAR(15) NOT NULL,             -- 'MARKET', 'LIMIT', 'STOP_LOSS'
    product_type VARCHAR(10) NOT NULL DEFAULT 'CNC', -- 'CNC' (Cash Delivery), 'MIS' (Intraday), 'NRML' (F&O)
    quantity INT NOT NULL,
    filled_quantity INT NOT NULL DEFAULT 0,
    price NUMERIC(14, 4),
    trigger_price NUMERIC(14, 4),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED'
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_fills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES paper_orders(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES paper_accounts(id),
    symbol VARCHAR(32) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    fill_price NUMERIC(14, 4) NOT NULL,
    slippage NUMERIC(8, 4) NOT NULL DEFAULT 0.00,
    brokerage_fees NUMERIC(10, 2) NOT NULL DEFAULT 20.00, -- Flat ₹20 per executed order (standard Indian discount broker model)
    stt_tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stamp_duty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_charges NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    fill_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES paper_accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    product_type VARCHAR(10) NOT NULL,
    net_quantity INT NOT NULL DEFAULT 0,
    average_buy_price NUMERIC(14, 4) NOT NULL DEFAULT 0.00,
    current_market_price NUMERIC(14, 4) NOT NULL DEFAULT 0.00,
    unrealized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paper_pos UNIQUE (account_id, symbol, product_type)
);

CREATE TABLE IF NOT EXISTS paper_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES paper_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL,       -- 'DEPOSIT', 'ORDER_FILL_BUY', 'ORDER_FILL_SELL', 'FEE_DEDUCTION', 'DIVIDEND'
    amount NUMERIC(14, 2) NOT NULL,              -- Positive for credit, negative for debit
    balance_after NUMERIC(14, 2) NOT NULL,
    reference_id VARCHAR(64),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. USER WATCHLISTS & USER ALERTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    symbols JSONB NOT NULL DEFAULT '[]',         -- Array of string ticker symbols
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    symbol VARCHAR(32) NOT NULL,
    alert_type VARCHAR(30) NOT NULL,             -- 'PRICE_ABOVE', 'PRICE_BELOW', 'RSI_OVERBOUGHT', 'RSI_OVERSOLD', 'BREAKOUT'
    trigger_value NUMERIC(14, 4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. DATA INGESTION RUNS (Observability)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) NOT NULL,               -- 'EOD_CANDLES', 'INTRADAY_STREAM', 'OPTION_CHAIN_POLL'
    status VARCHAR(20) NOT NULL,                 -- 'SUCCESS', 'PARTIAL', 'FAILED'
    items_processed INT NOT NULL DEFAULT 0,
    latency_ms INT,
    error_message TEXT,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Default permissive policy for single-user/anonymous session, secure for authenticated users
CREATE POLICY allow_all_on_paper_accounts ON paper_accounts FOR ALL USING (true);
CREATE POLICY allow_all_on_paper_orders ON paper_orders FOR ALL USING (true);
CREATE POLICY allow_all_on_paper_positions ON paper_positions FOR ALL USING (true);
CREATE POLICY allow_all_on_user_watchlists ON user_watchlists FOR ALL USING (true);
CREATE POLICY allow_all_on_user_alerts ON user_alerts FOR ALL USING (true);
