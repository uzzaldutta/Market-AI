import pytest
from datetime import datetime
import zoneinfo
from backend.app.engine.timing_engine import StockTimingEngine

def test_stock_timing_engine_session_phases():
    engine = StockTimingEngine()
    ist = zoneinfo.ZoneInfo("Asia/Kolkata")
    
    # Test Prime Window (e.g. Wednesday 10:30 IST)
    dt_prime = datetime(2026, 11, 11, 10, 30, tzinfo=ist)
    res_prime = engine.get_current_session_phase(dt_prime)
    assert res_prime["phase_code"] == "PRIME_INSTITUTIONAL"
    assert "09:45 - 11:30" in res_prime["optimal_window"]
    
    # Test Opening ORB Window (Wednesday 09:20 IST)
    dt_orb = datetime(2026, 11, 11, 9, 20, tzinfo=ist)
    res_orb = engine.get_current_session_phase(dt_orb)
    assert res_orb["phase_code"] == "OPENING_ORB"
    
    # Test Weekend
    dt_weekend = datetime(2026, 11, 14, 11, 0, tzinfo=ist) # Saturday
    res_weekend = engine.get_current_session_phase(dt_weekend)
    assert res_weekend["phase_code"] == "WEEKEND_PREP"

def test_multi_source_news_aggregation():
    engine = StockTimingEngine()
    
    # Test for SBIN
    news_res = engine.fetch_multi_source_news("SBIN")
    assert len(news_res["items"]) >= 2
    assert news_res["total_sources_scanned"] >= 2
    assert -1.0 <= news_res["aggregated_sentiment"] <= 1.0
    assert news_res["sentiment_label"] in ["STRONG_BULLISH", "MODERATE_BULLISH", "NEUTRAL", "BEARISH_WARNING"]
    assert "The Economic Times" in [item.source for item in news_res["items"]]

def test_analyze_stock_timing_response():
    engine = StockTimingEngine()
    
    res = engine.analyze_stock_timing("SBIN", timeframe="15m")
    assert res.symbol == "SBIN"
    assert res.ltp > 0
    assert res.trade_levels.buy_zone_min <= res.trade_levels.buy_zone_max
    assert res.trade_levels.stop_loss < res.trade_levels.buy_zone_min
    assert res.trade_levels.target_1 > res.trade_levels.buy_zone_max
    assert res.trade_levels.target_2 > res.trade_levels.target_1
    assert res.trade_levels.risk_reward_ratio >= 1.0
    assert len(res.timing.trigger_checklist) == 5
    assert 0.0 <= res.timing.readiness_score <= 100.0
    assert res.news_impact.total_sources_scanned >= 2
    assert len(res.recent_news) > 0
