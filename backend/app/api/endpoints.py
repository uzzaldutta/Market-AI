"""
FastAPI REST API Endpoints Router for Bharat Market Intelligence Platform.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
import pandas as pd

from ..schemas.market import (
    MarketOverviewResponse, QuoteResponse, CandleItem,
    TechnicalIndicatorResponse, OptionChainResponse, StrategyPayoffResponse,
    PredictionResponse, SignalResponse, BacktestRequest, BacktestResponse,
    PaperOrderRequest, PaperOrderResponse, PaperAccountResponse,
    ScreenerFilterRequest, ScreenerResponse, NewsItemResponse,
    FavouriteToggleRequest, FavouriteItemResponse,
    GEXProfileResponse, VolumeProfileResponse,
    KellySizingRequest, KellySizingResponse,
    FastAlphaRadarResponse, StockTimingAnalysisResponse,
    GlobalIndicesResponse, GlobalIndexDetailResponse, GlobalIndexChatRequest, GlobalIndexChatResponse,
    OracleValuationResponse,
    CopilotQueryRequest, CopilotQueryResponse,
    StockDuelResponse, BlockDealsResponse,
    AlertsFeedResponse, WebhookTestRequest, WebhookTestResponse,
    ResearchDossierResponse, OptionStrategyRequest, OptionStrategyPayoffResponse,
    OrderBookDepthResponse, StrategyOptimizationRequest, StrategyOptimizationResponse,
    PreTradeCheckRequest, PreTradeCheckResponse
)
from ..providers.manager import get_market_data_provider
from ..core.nse_instruments import NSE_SYMBOL_INDEX, search_nse_instruments
from ..engine.indicators import TechnicalIndicators
from ..engine.greeks import OptionsMath
from ..engine.ml_models import MarketPredictor
from ..engine.signals import SignalEngine
from ..engine.backtester import BacktestEngine
from ..engine.paper_engine import paper_engine
from ..engine.screener import ScreenerEngine
from ..engine.news import NewsIntelligenceEngine
from ..engine.daily_recommendations import DailyRecommendationsEngine
from ..engine.gamma_exposure import gamma_engine
from ..engine.volume_profile import volume_engine
from ..engine.participant_oi import participant_oi_engine
from ..engine.sector_rotation import sector_rotation_engine
from ..engine.risk_allocator import risk_allocator
from ..engine.fast_alpha_radar import fast_alpha_radar
from ..engine.timing_engine import StockTimingEngine
from ..engine.global_markets import global_markets_engine
from ..engine.oracle_valuation import oracle_valuation_engine
from ..engine.copilot_engine import copilot_engine
from ..engine.stock_duel import stock_duel_engine
from ..engine.block_deals import block_deals_engine
from ..engine.alerts_engine import alerts_engine
from ..engine.dossier_engine import dossier_engine
from ..engine.strategy_builder import strategy_builder_engine
from ..engine.orderbook_engine import orderbook_depth_engine
from ..engine.optimizer_engine import strategy_optimizer_engine
from ..engine.pretrade_engine import pretrade_engine

router = APIRouter()

provider = get_market_data_provider()
predictor = MarketPredictor()
signal_engine = SignalEngine()
screener_engine = ScreenerEngine()
news_engine = NewsIntelligenceEngine()
daily_rec_engine = DailyRecommendationsEngine()
timing_engine = StockTimingEngine()

@router.get("/recommendations/daily")
def get_daily_recommendations(
    limit: int = Query(50, ge=1, le=100),
    asset_class: Optional[str] = Query(None),
    sector: Optional[str] = Query(None)
):
    """
    Synthesizes Technicals, AI Model probabilities, F&O positioning,
    News sentiment, and Stop-Loss invalidation levels to provide daily high-conviction trade setups
    across Equities, Index Options, Stock Options, and Futures.
    """
    return daily_rec_engine.generate_daily_recommendations(
        limit=limit,
        asset_class=asset_class,
        sector=sector
    )

@router.get("/overview", response_model=MarketOverviewResponse)
def get_market_overview():
    """Fetches high-level Indian market overview, breadth, and sector movement."""
    return provider.get_market_overview()

@router.get("/instruments/search")
def search_instruments(q: str = Query(..., min_length=1)):
    """Searches for NSE/BSE equities and indices."""
    return provider.search_symbols(q)

@router.get("/instruments/{symbol}/quote", response_model=QuoteResponse)
def get_instrument_quote(symbol: str):
    """Fetches latest quote with verified quality tag."""
    return provider.get_quote(symbol)

@router.get("/instruments/{symbol}/candles", response_model=List[CandleItem])
def get_instrument_candles(
    symbol: str,
    timeframe: str = Query("1D", pattern="^(1m|5m|15m|1h|1D)$"),
    count: int = Query(100, ge=10, le=500)
):
    """Fetches historical candlestick time series."""
    return provider.get_candles(symbol, timeframe, count)

@router.get("/instruments/{symbol}/indicators", response_model=TechnicalIndicatorResponse)
def get_instrument_indicators(
    symbol: str,
    timeframe: str = Query("1D", pattern="^(1m|5m|15m|1h|1D)$")
):
    """Calculates complete technical analysis indicators without look-ahead bias."""
    candles = provider.get_candles(symbol, timeframe, count=120)
    df = pd.DataFrame(candles)
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=404, detail="Insufficient price history for technical calculations")
        
    analysis = TechnicalIndicators.compute_all_indicators(df)
    return TechnicalIndicatorResponse(
        symbol=symbol.upper(),
        timeframe=timeframe,
        timestamp=str(df.iloc[-1]["timestamp"]),
        **analysis
    )

@router.get("/options/{symbol}/chain", response_model=OptionChainResponse)
def get_option_chain(symbol: str, expiry: Optional[str] = None):
    """Fetches live/computed options chain with Black-Scholes Greeks, PCR, and Max Pain."""
    return provider.get_option_chain(symbol, expiry)

@router.post("/options/payoff", response_model=StrategyPayoffResponse)
def calculate_strategy_payoff(payload: Dict[str, Any] = Body(...)):
    """Simulates option strategy payoff at expiration and mark-to-market scenarios."""
    spot = payload.get("spot", 24850.0)
    strategy_name = payload.get("strategy_name", "Bull Call Spread")
    legs = payload.get("legs", [
        {"type": "CE", "side": "BUY", "strike": spot, "premium": 180.0, "qty": 1},
        {"type": "CE", "side": "SELL", "strike": spot + 300, "premium": 65.0, "qty": 1}
    ])
    lot_size = payload.get("lot_size", 50)
    return OptionsMath.simulate_strategy_payoff(spot, strategy_name, legs, lot_size)

@router.get("/predictions/{symbol}", response_model=PredictionResponse)
def get_ai_prediction(
    symbol: str,
    horizon: str = Query("1_SESSION", pattern="^(INTRADAY_60M|1_SESSION|3_SESSIONS|5_SESSIONS)$")
):
    """Generates calibrated multi-horizon directional probabilities with factor attribution."""
    candles = provider.get_candles(symbol, timeframe="1D", count=100)
    df = pd.DataFrame(candles)
    pred = predictor.predict(df, horizon=horizon)
    now_ts = pd.Timestamp.now().isoformat()
    return PredictionResponse(
        symbol=symbol.upper(),
        prediction_timestamp=now_ts,
        **pred
    )

@router.get("/signals/{symbol}", response_model=SignalResponse)
def get_trade_signal(symbol: str):
    """Generates rule-based explainable trade setup recommendation."""
    candles = provider.get_candles(symbol, timeframe="1D", count=100)
    df = pd.DataFrame(candles)
    return signal_engine.generate_signal(symbol.upper(), df)

@router.post("/screener", response_model=ScreenerResponse)
def run_screener(filters: ScreenerFilterRequest):
    """Runs institutional screener across market universe."""
    return screener_engine.run_screen(filters)

@router.post("/backtest", response_model=BacktestResponse)
def run_backtest(req: BacktestRequest):
    """Executes walk-forward backtest simulation with Indian slippage and STT fee schedules."""
    target_sym = req.symbols[0] if req.symbols else "NIFTY50"
    candles = provider.get_candles(target_sym, timeframe=req.timeframe, count=250)
    df = pd.DataFrame(candles)
    engine = BacktestEngine(initial_capital=req.initial_capital, slippage_pct=req.slippage_pct)
    res = engine.run_strategy(target_sym, df, strategy=req.strategy_name)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.get("/paper/account", response_model=PaperAccountResponse)
def get_paper_account():
    """Returns virtual paper-trading account equity, P&L, and open positions."""
    # Update MTM for open positions
    open_syms = list(set([pos["symbol"] for pos in paper_engine.positions.values() if pos["net_quantity"] != 0]))
    quotes = {}
    for s in open_syms:
        try:
            q = provider.get_quote(s)
            quotes[s] = q["ltp"]
        except Exception:
            pass
    if quotes:
        paper_engine.update_mtm(quotes)
    return paper_engine.get_account_summary()

@router.post("/paper/orders", response_model=PaperOrderResponse)
def place_paper_order(order: PaperOrderRequest):
    """Executes simulated paper order across Equities, Futures and Options within virtual ledger."""
    quote = provider.get_quote(order.symbol)
    return paper_engine.place_order(order, current_market_price=quote["ltp"])

@router.post("/paper/reset", response_model=PaperAccountResponse)
def reset_paper_account(capital: float = Body(1000000.0, embed=True)):
    """Resets virtual paper trading portfolio back to clean ₹10,00,000 INR allocation."""
    paper_engine.reset_account(capital)
    return paper_engine.get_account_summary()

@router.get("/user/favourites", response_model=List[FavouriteItemResponse])
def get_user_favourites():
    """Fetches user starred/favourite instruments with live quote telemetry."""
    fav_syms = paper_engine.get_favourites()
    results = []
    for s in fav_syms:
        meta = NSE_SYMBOL_INDEX.get(s, {"name": f"{s} Ltd", "sector": "NSE Equities"})
        try:
            q = provider.get_quote(s)
            ltp = q.get("ltp", 1000.0)
            change_pct = q.get("change_pct", 0.0)
            vol = q.get("volume", 500000)
        except Exception:
            ltp = 1000.0
            change_pct = 0.0
            vol = 100000

        results.append(FavouriteItemResponse(
            symbol=s,
            name=meta.get("name", s),
            sector=meta.get("sector", "NSE"),
            ltp=ltp,
            change_pct=change_pct,
            volume=vol,
            is_favourite=True
        ))
    return results

@router.post("/user/favourites/toggle")
def toggle_user_favourite(req: FavouriteToggleRequest):
    """Toggles a symbol in user favourites list."""
    is_fav = paper_engine.toggle_favourite(req.symbol)
    return {
        "symbol": req.symbol.upper(),
        "is_favourite": is_fav,
        "favourites": paper_engine.get_favourites()
    }

@router.get("/news", response_model=List[NewsItemResponse])
def get_news(symbol: Optional[str] = None):
    """Returns categorized financial news and event impact intelligence."""
    return news_engine.get_market_news(symbol)

# --- INSTITUTIONAL QUANT ENGINES ENDPOINTS ---
@router.get("/options/{symbol}/gex", response_model=GEXProfileResponse)
def get_options_gex(symbol: str, expiry: Optional[str] = None):
    """
    Computes Option Dealer Gamma Exposure (GEX), Spot Gamma in INR Crores,
    Regime (Long/Short Gamma), and Zero-Gamma Volatility Inversion Flip Level.
    """
    return gamma_engine.calculate_gex_profile(symbol, expiry)

@router.get("/instruments/{symbol}/volume-profile", response_model=VolumeProfileResponse)
def get_instrument_volume_profile(
    symbol: str,
    timeframe: str = Query("1D", pattern="^(1m|5m|15m|1h|1D)$"),
    bins: int = Query(30, ge=10, le=60)
):
    """
    Computes Order Flow Volume Profile: Point of Control (POC), Value Area (VAH/VAL at 70%),
    and Low/High Volume Nodes.
    """
    candles = provider.get_candles(symbol, timeframe=timeframe, count=100)
    df = pd.DataFrame(candles)
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=404, detail="Insufficient price history for volume profile")
    return volume_engine.compute_volume_profile(df, bins=bins)

@router.get("/instruments/{symbol}/anchored-vwap")
def get_instrument_anchored_vwap(
    symbol: str,
    timeframe: str = Query("1D", pattern="^(1m|5m|15m|1h|1D)$")
):
    """
    Calculates Multi-Anchored VWAP (AVWAP) and Standard Deviation Dispersion Bands
    from session open, swing highs, and swing lows.
    """
    candles = provider.get_candles(symbol, timeframe=timeframe, count=100)
    df = pd.DataFrame(candles)
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=404, detail="Insufficient price history for Anchored VWAP")
    return volume_engine.compute_anchored_vwap(df)

@router.get("/derivatives/participant-flows")
def get_participant_flows():
    """
    Computes FII, DII, Proprietary, and Retail Client positioning across
    Index Futures and Options, FII Long/Short ratio, and Smart Money Divergence Index.
    """
    return participant_oi_engine.get_participant_oi_analytics()

@router.get("/sectors/rotation-matrix")
def get_sector_rotation_matrix():
    """
    Calculates Relative Rotation Graph (RRG) metrics across 14 NSE Sector Indices
    against NIFTY 50 benchmark (Leading, Weakening, Lagging, Improving quadrants).
    """
    return sector_rotation_engine.compute_rotation_matrix()

@router.post("/risk/kelly-sizing", response_model=KellySizingResponse)
def calculate_risk_kelly_sizing(req: KellySizingRequest):
    """
    Calculates mathematical position sizing using the Fractional Kelly Criterion,
    risk/reward ratio, and Value-at-Risk account caps.
    """
    return risk_allocator.calculate_kelly_sizing(
        account_equity=req.account_equity,
        entry_price=req.entry_price,
        stop_loss=req.stop_loss,
        target_price=req.target_price,
        win_probability=req.win_probability,
        lot_size=req.lot_size,
        max_capital_risk_pct=req.max_capital_risk_pct
    )

@router.get("/alpha/radar", response_model=FastAlphaRadarResponse)
def get_fast_alpha_radar(strategy: Optional[str] = Query(None)):
    """
    Sub-10ms Fast Alpha Radar scanning:
    - Zero-Lag Intraday Relative Strength (vs NIFTY 50)
    - 15-Minute VWAP Opening Range Breakouts (ORB)
    - Intraday Open Interest Velocity (Short Squeeze Detection)
    - Z-Score Statistical Arbitrage & Mean Reversion
    """
    return fast_alpha_radar.scan_fast_alpha(signal_filter=strategy)

@router.get("/timing/{symbol}", response_model=StockTimingAnalysisResponse)
def get_stock_timing_analysis(
    symbol: str,
    timeframe: str = Query("15m", pattern="^(5m|15m|1H|1D)$")
):
    """
    Evaluates precision Buy/Sell timing, visual trade overlay levels (Buy Zone, Stop Loss, T1, T2),
    intraday liquidity session windows, and multi-source financial news catalysts.
    """
    return timing_engine.analyze_stock_timing(symbol=symbol, timeframe=timeframe)

@router.get("/global-indices", response_model=GlobalIndicesResponse)
def get_global_indices():
    """
    Global Macro Telemetry:
    - GIFT NIFTY Opening Gap Predictor
    - Wall Street: S&P 500, NASDAQ 100, Dow Jones, Russell 2000
    - Asia-Pacific: Nikkei 225, Hang Seng, Shanghai Composite, KOSPI
    - Europe: FTSE 100, DAX 40, CAC 40
    - Commodities & Currencies: Brent Crude, WTI Crude, USD/INR, DXY Dollar Index, Gold, Silver, Yields
    """
    return global_markets_engine.get_global_indices()

@router.get("/global-indices/{symbol}/detail", response_model=GlobalIndexDetailResponse)
def get_global_index_detail(symbol: str, timeframe: str = Query("1D", pattern="^(1D|5D|1M|1Y)$")):
    """
    High-Resolution Global Index & Commodity Inspection:
    - Multi-timeframe historical candles (1D 5m, 5D 15m, 1M Daily, 1Y Weekly)
    - Dalal Street NIFTY / BANK NIFTY correlation coefficients
    - Affected Indian equities and sector sensitivity
    - 20 EMA, 50 SMA, RSI(14), and Pivot level bounds
    - Institutional macro hedge fund debrief
    """
    return global_markets_engine.get_global_index_detail(symbol=symbol, timeframe=timeframe)

@router.post("/global-indices/{symbol}/chat", response_model=GlobalIndexChatResponse)
def chat_global_index(symbol: str, req: GlobalIndexChatRequest):
    """
    Autonomous Global Macro Copilot Chat:
    Answers interactive queries about global asset momentum, key resistance/support,
    and macroeconomic transmission to Indian markets and corporate balance sheets.
    """
    return global_markets_engine.chat_global_index(symbol=symbol, message=req.message, history=req.history)

@router.get("/oracle/analyze/{symbol}", response_model=OracleValuationResponse)
def get_oracle_valuation(
    symbol: str,
    growth_rate_pct: Optional[float] = Query(None, ge=1.0, le=60.0),
    discount_rate_pct: Optional[float] = Query(None, ge=6.0, le=25.0)
):
    """
    Oracle AI Multi-Agent Valuation Engine:
    Autonomous institutional synthesis of Warren Buffett, Benjamin Graham,
    Peter Lynch, Jim Simons, and Stanley Druckenmiller for ANY manually entered stock.
    """
    return oracle_valuation_engine.analyze_stock(
        symbol=symbol,
        custom_growth_rate=growth_rate_pct,
        custom_discount_rate=discount_rate_pct
    )

# --- AI COPILOT & ADVANCED INSTITUTIONAL ENDPOINTS ---
@router.post("/copilot/query", response_model=CopilotQueryResponse)
def query_ai_copilot(req: CopilotQueryRequest):
    """Conversational natural-language institutional analyst for any stock, portfolio stress testing, and screening."""
    return copilot_engine.process_query(
        query=req.query,
        context_symbol=req.context_symbol,
        account_equity=req.account_equity or 1000000.0
    )

@router.get("/duel/compare", response_model=StockDuelResponse)
def compare_stocks(
    symbol_a: str = Query("HDFCBANK"),
    symbol_b: str = Query("ICICIBANK")
):
    """Pits two stocks head-to-head across DCF Valuation, Moat, ROIC, and declares an algorithmic winner."""
    return stock_duel_engine.duel(symbol_a=symbol_a, symbol_b=symbol_b)

@router.get("/deals/block-deals", response_model=BlockDealsResponse)
def get_block_deals():
    """Institutional dark pool and block deal radar (> ₹5 Cr) with verified client attribution."""
    return block_deals_engine.get_block_deals()

@router.get("/alerts/feed", response_model=AlertsFeedResponse)
def get_alerts_feed():
    """Real-time in-app notification center for Prime Buy zones, Short Squeezes, and Gap forecasts."""
    return alerts_engine.get_alerts_feed()

@router.post("/alerts/test-webhook", response_model=WebhookTestResponse)
def test_webhook_dispatch(req: WebhookTestRequest):
    """Tests automated webhook dispatching to Telegram, WhatsApp, Discord, or custom URLs."""
    return alerts_engine.test_webhook_dispatch(
        channel=req.channel,
        destination_url=req.destination_webhook_url,
        test_symbol=req.test_symbol or "RELIANCE"
    )

@router.get("/dossier/{symbol}", response_model=ResearchDossierResponse)
def get_equity_research_dossier(symbol: str):
    """Generates an institutional 5-pillar research dossier with valuation, peer comparisons, and target price."""
    return dossier_engine.generate_dossier(symbol=symbol)

@router.post("/options/strategy-payoff", response_model=OptionStrategyPayoffResponse)
def calculate_options_strategy_payoff(req: OptionStrategyRequest):
    """Multi-leg options strategy simulator computing exact expiry payoff, T+n Greek curves, and POP."""
    return strategy_builder_engine.calculate_strategy_payoff(req)

@router.get("/orderbook/depth/{symbol}", response_model=OrderBookDepthResponse)
def get_market_depth_and_icebergs(symbol: str):
    """Institutional Level-3 order book ladder, cumulative depth curves, and iceberg order detection."""
    return orderbook_depth_engine.get_order_book_depth(symbol=symbol)

@router.post("/backtest/optimize", response_model=StrategyOptimizationResponse)
def optimize_strategy_hyperparameters(req: StrategyOptimizationRequest):
    """Autonomous parameter grid search finding the optimal Stop-Loss % and Risk-Reward ratio on historical data."""
    return strategy_optimizer_engine.optimize_strategy(req)

@router.post("/paper/pretrade-check", response_model=PreTradeCheckResponse)
def run_pretrade_validation_gate(req: PreTradeCheckRequest):
    """Institutional pre-flight risk gate verifying 1% capital-at-risk, 1:2 R:R ratio, confluence, and exchange friction."""
    return pretrade_engine.validate_trade(req)

@router.get("/health")
def get_health_status():
    """Observability check for provider latency, market session, and database connectivity."""
    session = provider.get_market_session_info()
    return {
        "status": "HEALTHY",
        "service": "Bharat Market Intelligence Platform API",
        "provider": provider.name,
        "market_session": session,
        "version": "1.0.0"
    }
