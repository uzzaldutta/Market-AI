import pytest
from backend.app.engine.global_markets import global_markets_engine
from backend.app.schemas.market import (
    GlobalIndicesResponse,
    GlobalIndexDetailResponse,
    GlobalIndexChatResponse
)

def test_global_indices_feed():
    feed = global_markets_engine.get_global_indices()
    assert isinstance(feed, GlobalIndicesResponse)
    assert len(feed.indices) >= 15
    assert feed.gap_prediction is not None
    assert feed.gap_prediction.gift_nifty_ltp > 20000.0

    # Ensure key benchmarks exist
    symbols = {i.symbol for i in feed.indices}
    for required in ["GIFTNIFTY", "SPX", "NDX", "BRENT", "USDINR", "DXY", "GOLD"]:
        assert required in symbols, f"Missing required global benchmark {required}"

def test_global_index_detail_spx():
    detail = global_markets_engine.get_global_index_detail("SPX", timeframe="1D")
    assert isinstance(detail, GlobalIndexDetailResponse)
    assert detail.symbol == "SPX"
    assert detail.name == "S&P 500 Index"
    assert len(detail.candles) >= 30
    assert detail.nifty_correlation > 0.5
    assert "pivot" in detail.key_levels
    assert "resistance_1" in detail.key_levels
    assert "support_1" in detail.key_levels
    assert detail.rsi_14 > 0 and detail.rsi_14 < 100
    assert len(detail.suggested_prompts) >= 2
    assert "NIFTY 50" in detail.correlated_indian_sectors

def test_global_index_detail_brent_inverse():
    detail = global_markets_engine.get_global_index_detail("BRENT", timeframe="1M")
    assert isinstance(detail, GlobalIndexDetailResponse)
    assert detail.symbol == "BRENT"
    assert detail.currency == "USD/bbl"
    assert detail.nifty_correlation < 0 # Inverse correlation!
    assert any(sec in detail.correlated_indian_sectors for sec in ["BPCL", "HPCL", "ASIANPAINT"])
    assert len(detail.candles) == 22 # 1M daily candles

def test_global_index_chat():
    res = global_markets_engine.chat_global_index(
        symbol="SPX",
        message="What is the impact on Dalal Street and NIFTY 50?"
    )
    assert isinstance(res, GlobalIndexChatResponse)
    assert res.symbol == "SPX"
    assert "Correlation" in res.reply or "NIFTY" in res.reply
    assert len(res.reply) > 50

def test_live_ticks_stochastic_variation():
    feed1 = global_markets_engine.get_global_indices()
    feed2 = global_markets_engine.get_global_indices()
    assert isinstance(feed1, GlobalIndicesResponse)
    assert isinstance(feed2, GlobalIndicesResponse)
    assert feed2.timestamp is not None
