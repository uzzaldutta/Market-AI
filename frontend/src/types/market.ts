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

