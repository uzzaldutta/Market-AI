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
    exchange: Optional[str] = "NSE"
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
    strike_price: Optional[float] = None
    option_type: Optional[str] = None
    expiry_date: Optional[str] = None
    delta: Optional[float] = None
    gamma: Optional[float] = None
    theta: Optional[float] = None
    vega: Optional[float] = None
    iv: Optional[float] = None

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
    portfolio_greeks: Optional[Dict[str, float]] = None

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

# --- INSTITUTIONAL QUANT ENGINES SCHEMAS ---
class GEXStrikeItem(BaseModel):
    strike: float
    call_oi: int
    put_oi: int
    call_gex_cr: float
    put_gex_cr: float
    net_gex_cr: float
    gamma: float

class GEXProfileResponse(BaseModel):
    symbol: str
    spot_price: float
    lot_size: int
    expiry: str
    total_net_gex_cr: float
    total_call_gex_cr: float
    total_put_gex_cr: float
    gamma_flip_level: float
    distance_to_flip_pct: float
    regime: str
    regime_description: str
    market_action: str
    expected_volatility: str
    major_call_wall: float
    major_put_wall: float
    strikes: List[GEXStrikeItem]

class VolumeProfileBin(BaseModel):
    price: float
    price_low: float
    price_high: float
    volume: int
    volume_pct: float

class VolumeProfileResponse(BaseModel):
    poc: float
    vah: float
    val: float
    last_close: float
    va_status: str
    va_thesis: str
    total_volume: int
    profile_bins: List[VolumeProfileBin]
    high_volume_nodes: List[float]
    low_volume_nodes: List[float]

class KellySizingRequest(BaseModel):
    account_equity: float = 1000000.0
    entry_price: float
    stop_loss: float
    target_price: float
    win_probability: float = 0.65
    lot_size: int = 1
    max_capital_risk_pct: float = 1.5

class KellySizingResponse(BaseModel):
    has_edge: bool
    win_probability_pct: Optional[float] = None
    risk_reward_ratio: Optional[float] = None
    full_kelly_pct: Optional[float] = None
    half_kelly_pct: Optional[float] = None
    quarter_kelly_pct: Optional[float] = None
    recommended_lots: int = 0
    recommended_quantity: int = 0
    lot_size: int = 1
    position_value_inr: float = 0.0
    capital_at_risk_inr: float = 0.0
    risk_pct_of_account: float = 0.0
    expected_value_inr: float = 0.0
    max_loss_budget_inr: float = 0.0
    message: Optional[str] = None

# --- FAST ALPHA RADAR SCHEMAS ---
class FastAlphaSignalItem(BaseModel):
    id: str
    symbol: str
    name: str
    sector: str
    strategy_type: str
    strategy_badge: str
    direction: str
    confidence_score: float
    ltp: float
    entry_price: float
    stop_loss: float
    stop_loss_pct: float
    target_price: float
    target_pct: float
    risk_reward_ratio: float
    lot_size: int
    trigger_metric: str
    signal_thesis: str
    detected_at: str

class FastAlphaRadarResponse(BaseModel):
    timestamp: str
    scan_time: str
    benchmark: str
    benchmark_change_pct: float
    total_signals: int
    strategies_covered: List[str]
    signals: List[FastAlphaSignalItem]

# --- STOCK TIMING & NEWS ENGINE SCHEMAS ---
class NewsCatalystItem(BaseModel):
    id: str
    headline: str
    source: str # e.g. "Economic Times", "Moneycontrol", "Livemint", "NSE Disclosures"
    url: Optional[str] = None
    time_ago: str
    category: str # "EARNINGS", "ORDERS", "MACRO", "GOVERNANCE", "REGULATORY"
    sentiment: str # "BULLISH", "BEARISH", "NEUTRAL"
    sentiment_score: float # -1.0 to 1.0
    impact_level: str # "HIGH", "MEDIUM", "LOW"

class NewsTimingImpact(BaseModel):
    aggregated_sentiment: float
    sentiment_label: str
    total_sources_scanned: int
    primary_catalyst: Optional[str] = None
    event_risk_flag: bool = False
    event_warning: Optional[str] = None
    timing_guidance: str

class TradeTimingLevels(BaseModel):
    buy_zone_min: float
    buy_zone_max: float
    stop_loss: float
    stop_loss_pct: float
    target_1: float
    target_1_pct: float
    target_2: float
    target_2_pct: float
    risk_reward_ratio: float
    breakeven_trigger: float
    trailing_stop_rule: str

class TimingChecklistItem(BaseModel):
    name: str
    passed: bool
    description: str

class TimingVerdict(BaseModel):
    status_code: str # "PRIME_BUY", "WAIT_PULLBACK", "OVEREXTENDED", "HARVEST_PROFIT", "EVENT_HOLD"
    status_label: str
    status_color: str # "emerald", "amber", "rose", "cyan", "purple"
    optimal_session_window: str
    current_session_phase: str
    order_action_type: str
    readiness_score: float # 0 - 100
    timing_thesis: str
    trigger_checklist: List[TimingChecklistItem]

class StockTimingAnalysisResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    ltp: float
    change: float
    change_pct: float
    vwap: float
    day_high: float
    day_low: float
    candles: List[CandleItem]
    timing: TimingVerdict
    trade_levels: TradeTimingLevels
    news_impact: NewsTimingImpact
    recent_news: List[NewsCatalystItem]
    quantitative_scores: Dict[str, float]
    timestamp: str

# --- GLOBAL INDICES & MACRO SCHEMAS ---
class GlobalIndexItem(BaseModel):
    symbol: str
    name: str
    region: str # "INDIA_OFFSHORE", "AMERICAS", "ASIA_PACIFIC", "EUROPE", "COMMODITIES_CURRENCIES"
    category: str # "INDEX", "COMMODITY", "CURRENCY", "BOND"
    flag: str # "🇮🇳", "🇺🇸", "🇯🇵", "🇩🇪", "🇬🇧", "🛢️", "💵", "🥇"
    currency: str # "USD", "INR", "pts", "%"
    ltp: float
    change: float
    change_pct: float
    high: float
    low: float
    sparkline: List[float] = []
    market_status: str # "OPEN", "CLOSED"
    last_updated: str

class GapPrediction(BaseModel):
    gift_nifty_ltp: float
    nifty50_previous_close: float
    gap_points: float
    gap_pct: float
    gap_bias: str # "STRONG_GAP_UP", "MILD_GAP_UP", "FLAT", "MILD_GAP_DOWN", "STRONG_GAP_DOWN"
    pre_market_advice: str

class GlobalIndicesResponse(BaseModel):
    timestamp: str
    global_sentiment: str # "RISK_ON_BULLISH", "NEUTRAL_MIXED", "RISK_OFF_BEARISH"
    sentiment_score: float # -1.0 to +1.0
    gap_prediction: GapPrediction
    indices: List[GlobalIndexItem]
    categories: Dict[str, List[GlobalIndexItem]]

class GlobalIndexDetailResponse(BaseModel):
    symbol: str
    name: str
    region: str
    category: str
    flag: str
    currency: str
    ltp: float
    prev_close: float
    open_price: float
    high: float
    low: float
    change: float
    change_pct: float
    week_52_high: float
    week_52_low: float
    market_status: str
    exchange_name: str
    trading_hours_ist: str
    timeframe: str
    candles: List[CandleItem]
    nifty_correlation: float
    banknifty_correlation: float
    impact_on_india: str
    correlated_indian_sectors: List[str]
    key_levels: Dict[str, float]
    rsi_14: float
    institutional_briefing: str
    suggested_prompts: List[str]

class GlobalIndexChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class GlobalIndexChatResponse(BaseModel):
    symbol: str
    reply: str
    timestamp: str

# --- ORACLE AI LEGENDARY VALUATION SCHEMAS ---
class InversionCheckItem(BaseModel):
    check_name: str
    passed: bool
    description: str

class PillarBuffettMoat(BaseModel):
    fair_value_dcf: float
    margin_of_safety_pct: float
    bargain_buy_price: float
    moat_score: float # 0 - 100
    moat_rating: str # "WIDE_MOAT", "NARROW_MOAT", "NO_MOAT"
    roic_pct: float
    roe_pct: float
    fcf_conversion_pct: float
    debt_to_equity: float
    owner_earnings_inr_cr: float
    inversion_checks: List[InversionCheckItem]

class PillarGrahamValue(BaseModel):
    graham_number: float
    graham_discount_pct: float
    piotroski_f_score: int # 0 - 9
    altman_z_score: float
    solvency_status: str # "SAFE_ZONE", "GREY_ZONE", "DISTRESS_RISK"
    current_ratio: float
    ncav_per_share: float

class PillarLynchGrowth(BaseModel):
    peg_ratio: float
    lynch_category: str # "FAST_GROWER", "STALWART", "CYCLICAL", "TURNAROUND", "SLOW_GROWER"
    earnings_growth_3yr_pct: float
    pe_ratio: float
    multibagger_potential_score: float # 0 - 100
    inventory_to_sales_health: str # "HEALTHY", "WARNING"

class PillarSimonsMomentum(BaseModel):
    trend_alignment: str # "STRONG_BULLISH", "MODERATE_BULLISH", "SIDEWAYS", "BEARISH"
    above_200_sma: bool
    volume_profile_poc: float
    value_area_position: str # "ABOVE_VAH", "INSIDE_VALUE_AREA", "BELOW_VAL"
    gex_regime: str # "LONG_GAMMA_STABLE", "SHORT_GAMMA_VOLATILE"
    quant_score: float # 0 - 100

class PillarDruckenmillerMacro(BaseModel):
    fii_dii_bias: str # "ACCUMULATION", "DISTRIBUTION", "NEUTRAL"
    smart_money_streak_days: int
    sector_rrg_quadrant: str # "LEADING", "IMPROVING", "WEAKENING", "LAGGING"
    macro_tailwind_score: float # 0 - 100
    crude_fx_sensitivity: str # "BENEFICIARY", "NEUTRAL", "HEADWIND"

class OracleValuationResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    ltp: float
    master_verdict: str # "BUFFETT_FAT_PITCH", "ACCUMULATE_FAIR_PRICE", "WATCHLIST_FULLY_VALUED", "OVERVALUED_CHOPPY", "VALUE_TRAP_AVOID"
    master_verdict_label: str
    master_verdict_badge: str
    master_verdict_color: str
    composite_score: float # 0 - 100
    fair_value: float
    bargain_buy_price: float
    margin_of_safety_pct: float
    growth_rate_used_pct: float
    discount_rate_used_pct: float
    pillar_buffett: PillarBuffettMoat
    pillar_graham: PillarGrahamValue
    pillar_lynch: PillarLynchGrowth
    pillar_simons: PillarSimonsMomentum
    pillar_druckenmiller: PillarDruckenmillerMacro
    master_summary: str
    timestamp: str

# --- AI MARKET COPILOT SCHEMAS ---
class CopilotQueryRequest(BaseModel):
    query: str
    context_symbol: Optional[str] = None
    account_equity: Optional[float] = 1000000.0

class CopilotQueryResponse(BaseModel):
    query: str
    intent: str # "STOCK_ANALYSIS", "SCREENER", "PORTFOLIO_RISK", "MARKET_OUTLOOK", "GENERAL"
    primary_symbol: Optional[str] = None
    executive_answer: str
    key_takeaways: List[str]
    suggested_actions: List[Dict[str, str]]
    confidence_score: float
    timestamp: str

# --- STOCK DUEL (PEER COMPARISON) SCHEMAS ---
class StockDuelMetric(BaseModel):
    metric_name: str
    val_a: float
    val_b: float
    unit: str
    winner: str # "A", "B", "TIE"
    description: str

class StockDuelResponse(BaseModel):
    symbol_a: str
    name_a: str
    ltp_a: float
    composite_score_a: float
    verdict_badge_a: str

    symbol_b: str
    name_b: str
    ltp_b: float
    composite_score_b: float
    verdict_badge_b: str

    winner_symbol: str
    winner_reason: str
    metrics: List[StockDuelMetric]
    timestamp: str

# --- INSTITUTIONAL BLOCK DEALS SCHEMAS ---
class BlockDealItem(BaseModel):
    id: str
    symbol: str
    company_name: str
    client_name: str
    deal_type: str # "BUY", "SELL"
    quantity: int
    trade_price: float
    deal_value_cr: float
    time_str: str
    exchange: str

class BlockDealsResponse(BaseModel):
    timestamp: str
    total_deals: int
    total_value_cr: float
    net_institutional_bias: str # "NET_BUYING", "NET_SELLING", "BALANCED"
    deals: List[BlockDealItem]

# --- INSTANT ALERTS & WEBHOOK SCHEMAS ---
class MarketAlertItem(BaseModel):
    id: str
    alert_type: str # "PRIME_BUY", "SHORT_SQUEEZE", "GAP_PREDICTION", "STOP_LOSS_WARNING"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "INFO"
    symbol: str
    title: str
    message: str
    time_ago: str
    action_url: Optional[str] = None

class AlertsFeedResponse(BaseModel):
    unread_count: int
    alerts: List[MarketAlertItem]

class WebhookTestRequest(BaseModel):
    channel: str # "TELEGRAM", "WHATSAPP", "DISCORD", "CUSTOM_WEBHOOK"
    destination_webhook_url: Optional[str] = None
    test_symbol: Optional[str] = "RELIANCE"

class WebhookTestResponse(BaseModel):
    status: str
    message: str
    payload_dispatched: Dict[str, Any]

# --- INSTITUTIONAL RESEARCH DOSSIER SCHEMAS ---
class PeerComparisonItem(BaseModel):
    symbol: str
    pe_ratio: float
    pb_ratio: float
    roe_pct: float
    market_cap_cr: float

class ResearchDossierResponse(BaseModel):
    symbol: str
    company_name: str
    isin: str
    sector: str
    market_cap_cr: float
    ltp: float
    dcf_fair_value: float
    margin_of_safety_pct: float
    graham_number: float
    verdict: str
    investment_thesis: str
    key_strengths: List[str]
    key_risks: List[str]
    pillar_scores: Dict[str, float]
    peer_comparison: List[PeerComparisonItem]
    analyst_rating: str
    target_price: float
    generated_at: str

# --- OPTIONS STRATEGY BUILDER & PAYOFF SCHEMAS ---
class OptionLeg(BaseModel):
    strike: float
    option_type: OptionType
    side: OrderSide # BUY or SELL
    quantity: int = 50
    premium: float
    iv: float = 0.20

class OptionStrategyRequest(BaseModel):
    symbol: str = "NIFTY50"
    spot_price: float
    days_to_expiry: int = 7
    risk_free_rate: float = 0.07
    legs: List[OptionLeg]
    strategy_name: Optional[str] = "Custom Strategy"

class StrategyPayoffPoint(BaseModel):
    underlying_price: float
    payoff_at_expiry: float
    payoff_t_plus_n: float

class OptionStrategyPayoffResponse(BaseModel):
    strategy_name: str
    spot_price: float
    max_profit: float
    max_loss: float
    risk_reward_ratio: float
    breakeven_points: List[float]
    probability_of_profit_pct: float
    net_delta: float
    net_gamma: float
    net_theta: float
    net_vega: float
    net_debit_credit: float
    payoff_curve: List[StrategyPayoffPoint]
    timestamp: str

# --- INSTITUTIONAL LEVEL-3 ORDER BOOK DEPTH SCHEMAS ---
class MarketDepthLevel(BaseModel):
    price: float
    quantity: int
    orders: int
    cumulative_qty: int
    is_iceberg: bool = False

class OrderBookDepthResponse(BaseModel):
    symbol: str
    ltp: float
    spread: float
    spread_pct: float
    total_bid_qty: int
    total_ask_qty: int
    order_flow_imbalance: float # Between -1.0 (heavy sell) and +1.0 (heavy buy)
    bids: List[MarketDepthLevel]
    asks: List[MarketDepthLevel]
    iceberg_detected: List[Dict[str, Any]]
    timestamp: str

# --- AUTONOMOUS STRATEGY AUTO-OPTIMIZER SCHEMAS ---
class StrategyOptimizationRequest(BaseModel):
    strategy_type: str = "EMA_MOMENTUM" # "EMA_MOMENTUM", "VWAP_REVERSION", "ORB_BREAKOUT"
    symbol: str = "NIFTY50"
    stop_loss_pct_range: List[float] = [1.0, 1.5, 2.0, 2.5, 3.0]
    risk_reward_range: List[float] = [1.5, 2.0, 2.5, 3.0]
    candle_limit: int = 150

class OptimizationIterationResult(BaseModel):
    stop_loss_pct: float
    risk_reward: float
    total_trades: int
    win_rate_pct: float
    profit_factor: float
    sharpe_ratio: float
    net_pnl: float
    max_drawdown_pct: float

class StrategyOptimizationResponse(BaseModel):
    strategy_type: str
    symbol: str
    best_parameters: Dict[str, Any]
    best_sharpe: float
    best_win_rate: float
    total_combinations_tested: int
    results: List[OptimizationIterationResult]
    recommendation: str
    timestamp: str

# --- INSTITUTIONAL PRE-TRADE CHECKLIST & RISK GATE SCHEMAS ---
class PreTradeCheckRequest(BaseModel):
    symbol: str
    side: OrderSide # BUY or SELL
    quantity: int
    entry_price: float
    stop_loss: float
    target_price: float
    account_equity: float = 1000000.0
    instrument_type: str = "EQUITY" # "EQUITY", "FUTURES", "OPTIONS"
    product_type: str = "CNC" # "CNC", "MIS", "NRML"

class FrictionTaxBreakdown(BaseModel):
    stt: float
    exchange_turnover_fee: float
    sebi_charges: float
    stamp_duty: float
    gst: float
    total_taxes_and_charges: float
    breakeven_points_needed: float

class PreTradeCheckItem(BaseModel):
    name: str
    status: str # "PASS", "WARN", "FAIL"
    value_str: str
    description: str

class PreTradeCheckResponse(BaseModel):
    symbol: str
    side: str
    order_value: float
    risk_amount_inr: float
    risk_pct_of_equity: float
    reward_amount_inr: float
    risk_reward_ratio: float
    recommended_1pct_quantity: int
    recommended_2pct_quantity: int
    portfolio_concentration_pct: float
    confluence_bias: str # "BULLISH_CONFLUENCE", "BEARISH_CONFLUENCE", "NEUTRAL"
    friction: FrictionTaxBreakdown
    checks: List[PreTradeCheckItem]
    readiness_score: int # out of 6
    overall_status: str # "INSTITUTIONAL_READY", "ACCEPTABLE_WITH_CAUTION", "BLOCKED_HIGH_RISK"
    advisory_message: str
    timestamp: str

# --- RETAIL AUTO-ALERT & SIMPLE RECOMMENDATION SCHEMAS ---
class AutoAlertItem(BaseModel):
    alert_id: str
    headline: str
    symbol: str
    exchange: str = "NSE" # NSE or BSE
    asset_name: str
    contract_display: str
    instrument_type: str # "INDEX_OPTION", "STOCK_OPTION", "CASH_EQUITY"
    option_type: Optional[str] = None # "CE", "PE", None
    strike_price: Optional[float] = None
    expiry_date: Optional[str] = None
    action: str = "BUY"
    budget_tier: str # "UNDER_5K", "UNDER_10K", "UNDER_25K", "CASH_STOCK"
    capital_required_inr: float
    lot_size: int = 1
    recommended_lots: int = 1
    recommended_shares: Optional[int] = None
    entry_price_min: float
    entry_price_max: float
    current_price: float
    best_entry_time: str
    order_valid_till: str
    stop_loss_price: float
    target_1_price: float
    target_2_price: float
    max_loss_inr: float
    target_1_profit_inr: float
    target_2_profit_inr: float
    risk_reward_ratio: float
    win_probability_pct: float
    plain_english_reason: str
    status: str # "IN_BUY_ZONE", "TRIGGERED", "TARGET_1_HIT", "TARGET_2_HIT", "STOPPED_OUT", "EXPIRED"
    time_horizon: str = "INTRADAY" # "INTRADAY" or "SWING"
    created_at: str

class AutoAlertsResponse(BaseModel):
    timestamp: str
    active_alerts: List[AutoAlertItem]
    total_active: int
    market_regime: str

class AutoAlertsStatsResponse(BaseModel):
    timestamp: str
    today_win_rate_pct: float
    total_calls_today: int
    targets_hit_today: int
    stopped_out_today: int
    total_net_profit_inr: float
    avg_profit_per_winning_trade: float
    recent_closed_alerts: List[AutoAlertItem]









