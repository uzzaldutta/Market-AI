import pytest
from backend.app.engine.copilot_engine import copilot_engine
from backend.app.engine.stock_duel import stock_duel_engine
from backend.app.engine.block_deals import block_deals_engine
from backend.app.engine.alerts_engine import alerts_engine

def test_copilot_stock_query():
    res = copilot_engine.process_query("Analyze Reliance DCF valuation and moat")
    assert res.intent == "STOCK_ANALYSIS"
    assert res.primary_symbol == "RELIANCE"
    assert len(res.key_takeaways) > 0
    assert len(res.suggested_actions) > 0
    assert "Reliance Industries" in res.executive_answer or "RELIANCE" in res.executive_answer

def test_copilot_portfolio_stress_test():
    res = copilot_engine.process_query("What happens if NIFTY drops 300 points?")
    assert res.intent == "PORTFOLIO_RISK"
    assert "stress test" in res.executive_answer.lower()
    assert len(res.suggested_actions) >= 1

def test_stock_duel_engine():
    res = stock_duel_engine.duel("HDFCBANK", "ICICIBANK")
    assert res.symbol_a == "HDFCBANK"
    assert res.symbol_b == "ICICIBANK"
    assert res.winner_symbol in ["HDFCBANK", "ICICIBANK"]
    assert len(res.metrics) >= 5
    assert len(res.winner_reason) > 20

def test_block_deals_engine():
    res = block_deals_engine.get_block_deals()
    assert res.total_deals >= 5
    assert res.total_value_cr > 100.0
    assert res.net_institutional_bias in ["NET_BUYING", "NET_SELLING", "BALANCED"]
    for deal in res.deals:
        assert deal.deal_value_cr > 0
        assert len(deal.client_name) > 3

def test_alerts_engine_and_webhook():
    feed = alerts_engine.get_alerts_feed()
    assert feed.unread_count > 0
    assert len(feed.alerts) >= 3

    wh = alerts_engine.test_webhook_dispatch("TELEGRAM", test_symbol="TATAMOTORS")
    assert wh.status == "SUCCESS"
    assert wh.payload_dispatched["symbol"] == "TATAMOTORS"
    assert "TELEGRAM" in wh.message
