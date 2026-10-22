from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

# --- ENUMS ---
class InstrumentType(str, Enum):
    EQUITY = "EQUITY"
    INDEX = "INDEX"
    FUTURES = "FUTURES"
    OPTIONS = "OPTIONS"

class SignalStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    WATCH = "WATCH"
    BLOCKED = "BLOCKED"
    NO_TRADE = "NO_TRADE"

class SignalDirection(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    NEUTRAL = "NEUTRAL"

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class OptionType(str, Enum):
    CE = "CE"
    PE = "PE"

# --- MARKET & INSTRUMENT SCHEMAS ---
class InstrumentBase(BaseModel):
    symbol: str
    exchange: str = "NSE"
    name: str
    instrument_type: InstrumentType = InstrumentType.EQUITY
    sector: Optional[str] = None
    industry: Optional[str] = None
    lot_size: int = 1
    tick_size: float = 0.05
    is_active: bool = True

class CandleItem(BaseModel):
    timestamp: str # ISO string or YYYY-MM-DD HH:MM
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: Optional[float] = None

class QuoteResponse(BaseModel):
    symbol: str
    ltp: float
    open: float
    high: float
    low: float
    close: float
    change: float
    change_pct: float
    volume: int
    day_52w_high: Optional[float] = None
    day_52w_low: Optional[float] = None
    market_cap: Optional[float] = None
    data_quality: str = "VERIFIED" # VERIFIED, DELAYED, SYNTHETIC
    timestamp: str
    is_market_open: bool = False

class MarketOverviewIndex(BaseModel):
    symbol: str
    name: str
    ltp: float
    change: float
    change_pct: float
    high: float
    low: float
    trend: str # BULLISH, BEARISH, NEUTRAL

class MarketOverviewResponse(BaseModel):
    timestamp: str
    is_market_open: bool
    market_status: str # OPEN, CLOSED, PRE_OPEN
    indices: List[MarketOverviewIndex]
    market_breadth: Dict[str, int] # advances, declines, unchanged
    top_gainers: List[QuoteResponse]
    top_losers: List[QuoteResponse]
    sector_performance: List[Dict[str, Any]]
    fii_dii_activity: Optional[Dict[str, Any]] = None

# --- TECHNICAL INDICATORS SCHEMAS ---
class TechnicalIndicatorResponse(BaseModel):
    symbol: str
    timeframe: str
    timestamp: str
    sma: Dict[str, Optional[float]] # 5, 10, 20, 50, 100, 200
    ema: Dict[str, Optional[float]] # 5, 10, 20, 50, 100, 200
    rsi_14: Optional[float]
    macd: Dict[str, Optional[float]] # line, signal, hist
    stochastic: Dict[str, Optional[float]] # k, d
    adx_14: Optional[float]
    atr_14: Optional[float]
    bollinger: Dict[str, Optional[float]] # upper, middle, lower, bandwidth
    vwap: Optional[float]
    obv: Optional[float]
    rvol: Optional[float]
    pivot_points: Dict[str, float] # P, R1, R2, R3, S1, S2, S3
    support_resistance: Dict[str, List[float]] # support: [], resistance: []
    trend_state: str # STRONG_BULLISH, BULLISH, SIDEWAYS, BEARISH, STRONG_BEARISH

# --- OPTIONS & GREEKS SCHEMAS ---
class OptionStrikeData(BaseModel):
    strike_price: float
    call_oi: int
    call_oi_change: int
    call_ltp: float
    call_iv: float
    call_delta: float
    call_gamma: float
    call_theta: float
    call_vega: float
    put_oi: int
    put_oi_change: int
    put_ltp: float
    put_iv: float
    put_delta: float
    put_gamma: float
    put_theta: float
    put_vega: float

class OptionChainResponse(BaseModel):
    underlying_symbol: str
    underlying_price: float
    expiry_dates: List[str]
    selected_expiry: str
    pcr: float
    max_pain: float
    lot_size: int
    strikes: List[OptionStrikeData]

class StrategyPayoffPoint(BaseModel):
    underlying_price: float
    expiry_pnl: float
    target_pnl: Optional[float] = None

class StrategyPayoffResponse(BaseModel):
    strategy_name: str
    max_profit: float
    max_loss: float
    breakeven_points: List[float]
    risk_reward_ratio: Optional[float]
    payoff_curve: List[StrategyPayoffPoint]
    estimated_charges: float

# --- AI PREDICTION & REASONING SCHEMAS ---
class PredictionResponse(BaseModel):
    symbol: str
    prediction_timestamp: str
    horizon: str # INTRADAY_60M, 1_SESSION, 3_SESSIONS, 5_SESSIONS
    bullish_prob: float
    bearish_prob: float
    sideways_prob: float
    expected_return_pct: float
    estimated_volatility_pct: float
    confidence_score: float # 0 - 100
    model_version: str
    calibration_status: str # CALIBRATED, UNCALIBRATED
    supporting_factors: List[str]
    conflicting_factors: List[str]
    warnings: List[str]

class SignalResponse(BaseModel):
    id: str
    symbol: str
    direction: SignalDirection
    status: SignalStatus
    strategy_type: str
    timeframe: str
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: float
    risk_reward_ratio: float
    reason_codes: List[str]
    block_reasons: List[str]
    generated_at: str

# --- BACKTESTING SCHEMAS ---
class BacktestRequest(BaseModel):
    strategy_name: str
    symbols: List[str]
    start_date: str
    end_date: str
    initial_capital: float = 1000000.0
    timeframe: str = "1D"
    slippage_pct: float = 0.0005 # 0.05%
    parameters: Dict[str, Any] = Field(default_factory=dict)

class TradeLogItem(BaseModel):
    symbol: str
    direction: str
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    quantity: int
    gross_pnl: float
    fees: float
    net_pnl: float
    return_pct: float
    exit_reason: str

class BacktestResponse(BaseModel):
    id: str
    strategy_name: str
    initial_capital: float
    final_equity: float
    total_net_profit: float
    net_return_pct: float
    cagr: float
    max_drawdown_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    profit_factor: float
    win_rate: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    expectancy: float
    total_fees_paid: float
    equity_curve: List[Dict[str, Any]]
    trades: List[TradeLogItem]

# --- PAPER TRADING SCHEMAS ---
class PaperOrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: int
    price: Optional[float] = None
    trigger_price: Optional[float] = None
    product_type: str = "CNC" # CNC, MIS, NRML, FUT, OPT
    instrument_type: str = "EQUITY" # EQUITY, FUTURES, OPTIONS
    strike_price: Optional[float] = None
    option_type: Optional[str] = None # CE, PE
    expiry_date: Optional[str] = None
    lot_size: int = 1
    client_order_id: Optional[str] = None

class PaperOrderResponse(BaseModel):
    order_id: str
    client_order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    product_type: str
    instrument_type: str = "EQUITY"
    strike_price: Optional[float] = None
    option_type: Optional[str] = None
    expiry_date: Optional[str] = None
    lot_size: int = 1
    quantity: int
    filled_quantity: int
    price: Optional[float]
    status: OrderStatus
    rejection_reason: Optional[str] = None
    created_at: str

class PaperPositionResponse(BaseModel):
    symbol: str
    product_type: str
    instrument_type: str = "EQUITY"
    contract_display: str = ""
    net_quantity: int
    lot_size: int = 1
    average_buy_price: float
    current_market_price: float
    unrealized_pnl: float
    realized_pnl: float
    pnl_percentage: float

class PaperAccountResponse(BaseModel):
    account_name: str
    base_currency: str
    initial_balance: float
    cash_balance: float
    reserved_margin: float
    portfolio_value: float
    total_equity: float
    unrealized_pnl: float
    realized_pnl: float
    day_pnl: float
    positions: List[PaperPositionResponse]
    recent_orders: List[PaperOrderResponse]

# --- SCREENER SCHEMAS ---
class ScreenerFilterRequest(BaseModel):
    preset: Optional[str] = None
    exchange: Optional[str] = "NSE"
    min_market_cap_cr: Optional[float] = None
    min_rvol: Optional[float] = None
    min_rsi: Optional[float] = None
    max_rsi: Optional[float] = None
    trend: Optional[str] = None # BULLISH, BEARISH
    above_sma_200: Optional[bool] = None
    above_sma_50: Optional[bool] = None
    macd_bullish_cross: Optional[bool] = None

class ScreenerRow(BaseModel):
    symbol: str
    name: str
    sector: str
    ltp: float
    change_pct: float
    volume: int
    rvol: float
    rsi_14: float
    trend: str
    sma_50: float
    sma_200: float
    signal_status: SignalStatus
    ai_bullish_prob: float

class ScreenerResponse(BaseModel):
    total: int
    data: List[ScreenerRow]

# --- NEWS & INTELLIGENCE SCHEMAS ---
class NewsItemResponse(BaseModel):
    id: str
    headline: str
    summary: str
    source: str
    source_url: str
    timestamp: str
    category: str
    sentiment: str
    sentiment_score: float
    affected_symbols: List[str]
    impact_severity: str

# --- FAVOURITES / WATCHLIST SCHEMAS ---
class FavouriteToggleRequest(BaseModel):
    symbol: str

class FavouriteItemResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    ltp: float
    change_pct: float
    volume: int
    is_favourite: bool = True

