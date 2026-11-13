"""
Unit Tests for Autonomous Real-Time Trade Alert & Simple Recommendation Engine.
Verifies retail budget constraints, safety net boundaries, risk-reward ratios,
and 1-click execution into the paper trading portfolio.
"""

import pytest
from backend.app.engine.auto_alert_engine import auto_alert_engine
from backend.app.engine.paper_engine import paper_engine

def test_auto_alerts_generation_and_budget_tiers():
    resp = auto_alert_engine.get_live_alerts()
    assert resp.total_active >= 3
    assert len(resp.active_alerts) >= 3

    # Test UNDER_5K budget filtering
    under_5k_resp = auto_alert_engine.get_live_alerts(budget_tier="UNDER_5K")
    assert under_5k_resp.total_active >= 1
    for alert in under_5k_resp.active_alerts:
        assert alert.budget_tier == "UNDER_5K"
        assert alert.capital_required_inr <= 5000.0, f"{alert.headline} capital exceeds ₹5,000"

def test_trade_alert_safety_and_risk_reward_rules():
    resp = auto_alert_engine.get_live_alerts()
    for alert in resp.active_alerts:
        # 1. Price boundaries
        assert alert.stop_loss_price < alert.entry_price_min, f"SL {alert.stop_loss_price} not below entry {alert.entry_price_min}"
        assert alert.target_1_price > alert.entry_price_max, f"Target 1 {alert.target_1_price} not above entry {alert.entry_price_max}"
        assert alert.target_2_price > alert.target_1_price, f"Target 2 {alert.target_2_price} not above Target 1 {alert.target_1_price}"

        # 2. Risk-to-Reward ratio strictly >= 2.0
        assert alert.risk_reward_ratio >= 2.0, f"R:R ratio {alert.risk_reward_ratio} below 2.0"

        # 3. Rupee metrics
        assert alert.max_loss_inr < 0, "Max loss in INR must be negative"
        assert alert.target_1_profit_inr > 0, "Target 1 profit must be positive"
        assert alert.target_2_profit_inr > alert.target_1_profit_inr

        # 4. Plain English explanation and timing rules
        assert len(alert.plain_english_reason) > 20
        assert len(alert.best_entry_time) > 5
        assert len(alert.order_valid_till) > 5
        assert alert.win_probability_pct >= 80.0

def test_auto_alert_1click_paper_execution():
    resp = auto_alert_engine.get_live_alerts(budget_tier="UNDER_5K")
    target_alert = resp.active_alerts[0]

    # Execute trade in virtual ledger
    exec_res = auto_alert_engine.execute_in_paper_trading(alert_id=target_alert.alert_id, lots=1)
    assert exec_res["success"] is True
    assert exec_res["status"] == "FILLED"
    assert exec_res["executed_price"] > 0
    assert exec_res["safety_net_stop_loss"] == target_alert.stop_loss_price
    assert exec_res["profit_target_1"] == target_alert.target_1_price

    # Verify position is recorded in Paper Trading Engine
    summary = paper_engine.get_account_summary()
    assert len(summary.positions) > 0
    symbols_held = [p.symbol for p in summary.positions]
    assert target_alert.symbol in symbols_held

def test_auto_alerts_transparency_performance_stats():
    stats = auto_alert_engine.get_performance_stats()
    assert stats.today_win_rate_pct >= 70.0
    assert stats.total_calls_today > 0
    assert stats.targets_hit_today >= 1
    assert stats.total_net_profit_inr > 0
    assert len(stats.recent_closed_alerts) > 0
