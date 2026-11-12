import pytest
from backend.app.engine.global_markets import global_markets_engine

def test_global_markets_data_integrity():
    res = global_markets_engine.get_global_indices()
    
    assert res.indices is not None
    assert len(res.indices) >= 15
    assert -1.0 <= res.sentiment_score <= 1.0
    assert res.global_sentiment in ["RISK_ON_BULLISH", "NEUTRAL_MIXED", "RISK_OFF_BEARISH"]

def test_gift_nifty_gap_prediction():
    res = global_markets_engine.get_global_indices()
    gap = res.gap_prediction
    
    assert gap.gift_nifty_ltp > 0
    assert gap.nifty50_previous_close > 0
    assert gap.gap_bias in ["STRONG_GAP_UP", "MILD_GAP_UP", "FLAT", "MILD_GAP_DOWN", "STRONG_GAP_DOWN"]
    assert len(gap.pre_market_advice) > 10

def test_global_categories_and_macro_benchmarks():
    res = global_markets_engine.get_global_indices()
    cats = res.categories
    
    assert "AMERICAS" in cats
    assert "ASIA_PACIFIC" in cats
    assert "EUROPE" in cats
    assert "COMMODITIES_CURRENCIES" in cats
    
    syms = [i.symbol for i in res.indices]
    assert "GIFTNIFTY" in syms
    assert "SPX" in syms
    assert "NDX" in syms
    assert "BRENT" in syms
    assert "USDINR" in syms
    assert "DXY" in syms
    assert "GOLD" in syms
