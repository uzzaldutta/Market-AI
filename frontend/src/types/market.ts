export interface IndexItem {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  change_pct: number;
  high: number;
  low: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
}

export interface Quote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  change_pct: number;
  volume: number;
  day_52w_high?: number;
  day_52w_low?: number;
  market_cap?: number;
  data_quality: 'VERIFIED' | 'DELAYED' | 'SYNTHETIC';
  timestamp: string;
  is_market_open: boolean;
}

export interface MarketOverviewData {
  timestamp: string;
  is_market_open: boolean;
  market_status: 'OPEN' | 'CLOSED' | 'PRE_OPEN';
  indices: IndexItem[];
  market_breadth: {
    advances: number;
    declines: number;
    unchanged: number;
  };
  top_gainers: Quote[];
  top_losers: Quote[];
  sector_performance: Array<{
    sector: string;
    change_pct: number;
    trend: string;
  }>;
  fii_dii_activity?: {
    fii_net_crores: number;
    dii_net_crores: number;
    date: string;
  };
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface TechnicalIndicatorsData {
  symbol: string;
  timeframe: string;
  timestamp: string;
  sma: Record<string, number | null>;
  ema: Record<string, number | null>;
  rsi_14: number;
  macd: {
    line: number;
    signal: number;
    hist: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  adx_14: number;
  atr_14: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  vwap: number;
  obv: number;
  rvol: number;
  pivot_points: Record<string, number>;
  support_resistance: {
    support: number[];
    resistance: number[];
  };
  trend_state: string;
}

export interface OptionStrike {
  strike_price: number;
  call_oi: number;
  call_oi_change: number;
  call_ltp: number;
  call_iv: number;
  call_delta: number;
  call_gamma: number;
  call_theta: number;
  call_vega: number;
  put_oi: number;
  put_oi_change: number;
  put_ltp: number;
  put_iv: number;
  put_delta: number;
  put_gamma: number;
  put_theta: number;
  put_vega: number;
}

export interface OptionChainData {
  underlying_symbol: string;
  underlying_price: number;
  expiry_dates: string[];
  selected_expiry: string;
  pcr: number;
  max_pain: number;
  lot_size: number;
  strikes: OptionStrike[];
}

export interface StrategyPayoffPoint {
  underlying_price: number;
  expiry_pnl: number;
}

export interface StrategyPayoffData {
  strategy_name: string;
  max_profit: number;
  max_loss: number;
  breakeven_points: number[];
  risk_reward_ratio?: number;
  payoff_curve: StrategyPayoffPoint[];
  estimated_charges: number;
}

export interface PredictionData {
  symbol: string;
  prediction_timestamp: string;
  horizon: string;
  bullish_prob: number;
  bearish_prob: number;
  sideways_prob: number;
  expected_return_pct: number;
  estimated_volatility_pct: number;
  confidence_score: number;
  model_version: string;
  calibration_status: string;
  supporting_factors: string[];
  conflicting_factors: string[];
  warnings: string[];
}

export interface SignalData {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  status: 'ELIGIBLE' | 'WATCH' | 'BLOCKED' | 'NO_TRADE';
  strategy_type: string;
  timeframe: string;
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  risk_reward_ratio: number;
  reason_codes: string[];
  block_reasons: string[];
  generated_at: string;
}

export interface ScreenerRow {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change_pct: number;
  volume: number;
  rvol: number;
  rsi_14: number;
  trend: string;
  sma_50: number;
  sma_200: number;
  signal_status: 'ELIGIBLE' | 'WATCH' | 'BLOCKED' | 'NO_TRADE';
  ai_bullish_prob: number;
}

export interface PaperPosition {
  symbol: string;
  product_type: string;
  instrument_type?: 'EQUITY' | 'FUTURES' | 'OPTIONS';
  contract_display?: string;
  net_quantity: number;
  lot_size?: number;
  average_buy_price: number;
  current_market_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  pnl_percentage: number;
}

export interface PaperOrder {
  order_id: string;
  client_order_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  product_type: string;
  instrument_type?: 'EQUITY' | 'FUTURES' | 'OPTIONS';
  strike_price?: number;
  option_type?: 'CE' | 'PE';
  expiry_date?: string;
  lot_size?: number;
  quantity: number;
  filled_quantity: number;
  price: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export interface PaperAccount {
  account_name: string;
  base_currency: string;
  initial_balance: number;
  cash_balance: number;
  reserved_margin: number;
  portfolio_value: number;
  total_equity: number;
  unrealized_pnl: number;
  realized_pnl: number;
  day_pnl: number;
  positions: PaperPosition[];
  recent_orders: PaperOrder[];
}

export interface FavouriteItem {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change_pct: number;
  volume: number;
  is_favourite: boolean;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_url: string;
  timestamp: string;
  category: string;
  sentiment: string;
  sentiment_score: number;
  affected_symbols: string[];
  impact_severity: string;
}

export interface NewsCatalyst {
  id: string;
  headline: string;
  source: string;
  url?: string;
  time_ago: string;
  category: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentiment_score: number;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NewsTimingImpact {
  aggregated_sentiment: number;
  sentiment_label: string;
  total_sources_scanned: number;
  primary_catalyst?: string;
  event_risk_flag: boolean;
  event_warning?: string;
  timing_guidance: string;
}

export interface TradeTimingLevels {
  buy_zone_min: number;
  buy_zone_max: number;
  stop_loss: number;
  stop_loss_pct: number;
  target_1: number;
  target_1_pct: number;
  target_2: number;
  target_2_pct: number;
  risk_reward_ratio: number;
  breakeven_trigger: number;
  trailing_stop_rule: string;
}

export interface TimingChecklistItem {
  name: string;
  passed: boolean;
  description: string;
}

export interface TimingVerdict {
  status_code: 'PRIME_BUY' | 'WAIT_PULLBACK' | 'OVEREXTENDED' | 'HARVEST_PROFIT' | 'EVENT_HOLD';
  status_label: string;
  status_color: string;
  optimal_session_window: string;
  current_session_phase: string;
  order_action_type: string;
  readiness_score: number;
  timing_thesis: string;
  trigger_checklist: TimingChecklistItem[];
}

export interface StockTimingAnalysisData {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change: number;
  change_pct: number;
  vwap: number;
  day_high: number;
  day_low: number;
  candles: Candle[];
  timing: TimingVerdict;
  trade_levels: TradeTimingLevels;
  news_impact: NewsTimingImpact;
  recent_news: NewsCatalyst[];
  quantitative_scores: {
    technical_trend_score: number;
    news_catalyst_score: number;
    orderflow_absorption_score: number;
    gamma_regime_score: number;
    optimal_kelly_fraction: number;
  };
  timestamp: string;
}

export interface GlobalIndexItem {
  symbol: string;
  name: string;
  region: 'INDIA_OFFSHORE' | 'AMERICAS' | 'ASIA_PACIFIC' | 'EUROPE' | 'COMMODITIES_CURRENCIES';
  category: 'INDEX' | 'COMMODITY' | 'CURRENCY' | 'BOND';
  flag: string;
  currency: string;
  ltp: number;
  change: number;
  change_pct: number;
  high: number;
  low: number;
  sparkline: number[];
  market_status: 'OPEN' | 'CLOSED';
  last_updated: string;
}

export interface GapPrediction {
  gift_nifty_ltp: number;
  nifty50_previous_close: number;
  gap_points: number;
  gap_pct: number;
  gap_bias: 'STRONG_GAP_UP' | 'MILD_GAP_UP' | 'FLAT' | 'MILD_GAP_DOWN' | 'STRONG_GAP_DOWN';
  pre_market_advice: string;
}

export interface GlobalIndicesData {
  timestamp: string;
  global_sentiment: 'RISK_ON_BULLISH' | 'NEUTRAL_MIXED' | 'RISK_OFF_BEARISH';
  sentiment_score: number;
  gap_prediction: GapPrediction;
  indices: GlobalIndexItem[];
  categories: {
    INDIA_OFFSHORE: GlobalIndexItem[];
    AMERICAS: GlobalIndexItem[];
    ASIA_PACIFIC: GlobalIndexItem[];
    EUROPE: GlobalIndexItem[];
    COMMODITIES_CURRENCIES: GlobalIndexItem[];
  };
}

export interface GlobalIndexDetail {
  symbol: string;
  name: string;
  region: string;
  category: string;
  flag: string;
  currency: string;
  ltp: number;
  prev_close: number;
  open_price: number;
  high: number;
  low: number;
  change: number;
  change_pct: number;
  week_52_high: number;
  week_52_low: number;
  market_status: string;
  exchange_name: string;
  trading_hours_ist: string;
  timeframe: '1D' | '5D' | '1M' | '1Y';
  candles: Candle[];
  nifty_correlation: number;
  banknifty_correlation: number;
  impact_on_india: string;
  correlated_indian_sectors: string[];
  key_levels: {
    pivot: number;
    resistance_1: number;
    resistance_2: number;
    support_1: number;
    support_2: number;
    ema_20: number;
    sma_50: number;
  };
  rsi_14: number;
  institutional_briefing: string;
  suggested_prompts: string[];
}

export interface GlobalIndexChatResponse {
  symbol: string;
  reply: string;
  timestamp: string;
}

export interface InversionCheckItem {
  check_name: string;
  passed: boolean;
  description: string;
}

export interface PillarBuffettMoat {
  fair_value_dcf: number;
  margin_of_safety_pct: number;
  bargain_buy_price: number;
  moat_score: number;
  moat_rating: 'WIDE_MOAT' | 'NARROW_MOAT' | 'NO_MOAT';
  roic_pct: number;
  roe_pct: number;
  fcf_conversion_pct: number;
  debt_to_equity: number;
  owner_earnings_inr_cr: number;
  inversion_checks: InversionCheckItem[];
}

export interface PillarGrahamValue {
  graham_number: number;
  graham_discount_pct: number;
  piotroski_f_score: number;
  altman_z_score: number;
  solvency_status: 'SAFE_ZONE' | 'GREY_ZONE' | 'DISTRESS_RISK';
  current_ratio: number;
  ncav_per_share: number;
}

export interface PillarLynchGrowth {
  peg_ratio: number;
  lynch_category: 'FAST_GROWER' | 'STALWART' | 'CYCLICAL' | 'TURNAROUND' | 'SLOW_GROWER';
  earnings_growth_3yr_pct: number;
  pe_ratio: number;
  multibagger_potential_score: number;
  inventory_to_sales_health: 'HEALTHY' | 'WARNING';
}

export interface PillarSimonsMomentum {
  trend_alignment: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'SIDEWAYS' | 'BEARISH';
  above_200_sma: boolean;
  volume_profile_poc: number;
  value_area_position: 'ABOVE_VAH' | 'INSIDE_VALUE_AREA' | 'BELOW_VAL';
  gex_regime: 'LONG_GAMMA_STABLE' | 'SHORT_GAMMA_VOLATILE';
  quant_score: number;
}

export interface PillarDruckenmillerMacro {
  fii_dii_bias: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  smart_money_streak_days: number;
  sector_rrg_quadrant: 'LEADING' | 'IMPROVING' | 'WEAKENING' | 'LAGGING';
  macro_tailwind_score: number;
  crude_fx_sensitivity: 'BENEFICIARY' | 'NEUTRAL' | 'HEADWIND';
}

export interface OracleValuationData {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  master_verdict: string;
  master_verdict_label: string;
  master_verdict_badge: string;
  master_verdict_color: string;
  composite_score: number;
  fair_value: number;
  bargain_buy_price: number;
  margin_of_safety_pct: number;
  growth_rate_used_pct: number;
  discount_rate_used_pct: number;
  pillar_buffett: PillarBuffettMoat;
  pillar_graham: PillarGrahamValue;
  pillar_lynch: PillarLynchGrowth;
  pillar_simons: PillarSimonsMomentum;
  pillar_druckenmiller: PillarDruckenmillerMacro;
  master_summary: string;
  timestamp: string;
}

export interface CopilotQueryResponse {
  query: string;
  intent: 'STOCK_ANALYSIS' | 'SCREENER' | 'PORTFOLIO_RISK' | 'MARKET_OUTLOOK' | 'GENERAL';
  primary_symbol?: string;
  executive_answer: string;
  key_takeaways: string[];
  suggested_actions: Array<{ label: string; action: string }>;
  confidence_score: number;
  timestamp: string;
}

export interface StockDuelMetric {
  metric_name: string;
  val_a: number;
  val_b: number;
  unit: string;
  winner: 'A' | 'B' | 'TIE';
  description: string;
}

export interface StockDuelResponse {
  symbol_a: string;
  name_a: string;
  ltp_a: number;
  composite_score_a: number;
  verdict_badge_a: string;
  symbol_b: string;
  name_b: string;
  ltp_b: number;
  composite_score_b: number;
  verdict_badge_b: string;
  winner_symbol: string;
  winner_reason: string;
  metrics: StockDuelMetric[];
  timestamp: string;
}

export interface BlockDealItem {
  id: string;
  symbol: string;
  company_name: string;
  client_name: string;
  deal_type: 'BUY' | 'SELL';
  quantity: number;
  trade_price: number;
  deal_value_cr: number;
  time_str: string;
  exchange: string;
}

export interface BlockDealsResponse {
  timestamp: string;
  total_deals: number;
  total_value_cr: number;
  net_institutional_bias: 'NET_BUYING' | 'NET_SELLING' | 'BALANCED';
  deals: BlockDealItem[];
}

export interface MarketAlertItem {
  id: string;
  alert_type: string;
  severity: string;
  symbol: string;
  title: string;
  message: string;
  time_ago: string;
  action_url?: string;
}

export interface AlertsFeedResponse {
  unread_count: number;
  alerts: MarketAlertItem[];
}

// --- RESEARCH DOSSIER SCHEMAS ---
export interface PeerComparisonItem {
  symbol: string;
  pe_ratio: number;
  pb_ratio: number;
  roe_pct: number;
  market_cap_cr: number;
}

export interface ResearchDossierResponse {
  symbol: string;
  company_name: string;
  isin: string;
  sector: string;
  market_cap_cr: number;
  ltp: number;
  dcf_fair_value: number;
  margin_of_safety_pct: number;
  graham_number: number;
  verdict: string;
  investment_thesis: string;
  key_strengths: string[];
  key_risks: string[];
  pillar_scores: Record<string, number>;
  peer_comparison: PeerComparisonItem[];
  analyst_rating: string;
  target_price: number;
  generated_at: string;
}

// --- OPTIONS STRATEGY BUILDER SCHEMAS ---
export interface OptionLeg {
  strike: number;
  option_type: 'CE' | 'PE';
  side: 'BUY' | 'SELL';
  quantity: number;
  premium: number;
  iv: number;
}

export interface OptionStrategyRequest {
  symbol: string;
  spot_price: number;
  days_to_expiry: number;
  risk_free_rate?: number;
  legs: OptionLeg[];
  strategy_name?: string;
}

export interface StrategyPayoffPoint {
  underlying_price: number;
  payoff_at_expiry: number;
  payoff_t_plus_n: number;
}

export interface OptionStrategyPayoffResponse {
  strategy_name: string;
  spot_price: number;
  max_profit: number;
  max_loss: number;
  risk_reward_ratio: number;
  breakeven_points: number[];
  probability_of_profit_pct: number;
  net_delta: number;
  net_gamma: number;
  net_theta: number;
  net_vega: number;
  net_debit_credit: number;
  payoff_curve: StrategyPayoffPoint[];
  timestamp: string;
}

// --- LEVEL-3 ORDER BOOK SCHEMAS ---
export interface MarketDepthLevel {
  price: number;
  quantity: number;
  orders: number;
  cumulative_qty: number;
  is_iceberg: boolean;
}

export interface OrderBookDepthResponse {
  symbol: string;
  ltp: number;
  spread: number;
  spread_pct: number;
  total_bid_qty: number;
  total_ask_qty: number;
  order_flow_imbalance: number;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  iceberg_detected: Array<{
    side: string;
    price: number;
    quantity: number;
    orders: number;
    type: string;
  }>;
  timestamp: string;
}

// --- STRATEGY AUTO-OPTIMIZER SCHEMAS ---
export interface StrategyOptimizationRequest {
  strategy_type: string;
  symbol: string;
  stop_loss_pct_range: number[];
  risk_reward_range: number[];
  candle_limit?: number;
}

export interface OptimizationIterationResult {
  stop_loss_pct: number;
  risk_reward: number;
  total_trades: number;
  win_rate_pct: number;
  profit_factor: number;
  sharpe_ratio: number;
  net_pnl: number;
  max_drawdown_pct: number;
}

export interface StrategyOptimizationResponse {
  strategy_type: string;
  symbol: string;
  best_parameters: Record<string, any>;
  best_sharpe: number;
  best_win_rate: number;
  total_combinations_tested: number;
  results: OptimizationIterationResult[];
  recommendation: string;
  timestamp: string;
}

// --- INSTITUTIONAL PRE-TRADE CHECKLIST & RISK GATE SCHEMAS ---
export interface PreTradeCheckRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  account_equity?: number;
  instrument_type?: 'EQUITY' | 'FUTURES' | 'OPTIONS';
  product_type?: 'CNC' | 'MIS' | 'NRML';
}

export interface FrictionTaxBreakdown {
  stt: number;
  exchange_turnover_fee: number;
  sebi_charges: number;
  stamp_duty: number;
  gst: number;
  total_taxes_and_charges: number;
  breakeven_points_needed: number;
}

export interface PreTradeCheckItem {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  value_str: string;
  description: string;
}

export interface PreTradeCheckResponse {
  symbol: string;
  side: string;
  order_value: number;
  risk_amount_inr: number;
  risk_pct_of_equity: number;
  reward_amount_inr: number;
  risk_reward_ratio: number;
  recommended_1pct_quantity: number;
  recommended_2pct_quantity: number;
  portfolio_concentration_pct: number;
  confluence_bias: string;
  friction: FrictionTaxBreakdown;
  checks: PreTradeCheckItem[];
  readiness_score: number;
  overall_status: 'INSTITUTIONAL_READY' | 'ACCEPTABLE_WITH_CAUTION' | 'BLOCKED_HIGH_RISK';
  advisory_message: string;
  timestamp: string;
}






