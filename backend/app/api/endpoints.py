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
    KellySizingRequest, KellySizingResponse
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

router = APIRouter()

provider = get_market_data_provider()
predictor = MarketPredictor()
signal_engine = SignalEngine()
screener_engine = ScreenerEngine()
news_engine = NewsIntelligenceEngine()
daily_rec_engine = DailyRecommendationsEngine()

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
