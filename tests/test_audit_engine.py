"""
Unit Tests for Honest Recommendation Performance Audit & Comparison Engine.
Verifies transparency metrics, honest loss reporting, side-by-side comparison accuracy,
brokerage and statutory tax deductions, and equity curve growth.
"""

import pytest
from backend.app.engine.auto_alert_engine import auto_alert_engine

def test_audit_summary_transparency_metrics():
    summary = auto_alert_engine.get_audit_summary(starting_capital=10000.0)
    
    # 1. Total count integrity
    assert summary.total_calls_audited == len(summary.comparison_items)
    assert summary.winning_calls > 0
    assert summary.losing_calls > 0  # Honest audit MUST disclose real losses
    assert summary.expired_calls >= 0
    assert summary.winning_calls + summary.losing_calls + summary.expired_calls == summary.total_calls_audited

    # 2. Win rate formula
    expected_win_rate = round(summary.winning_calls / (summary.winning_calls + summary.losing_calls) * 100.0, 1)
    assert summary.win_rate_pct == expected_win_rate
    assert 65.0 <= summary.win_rate_pct <= 85.0  # Realistic quant win rate

    # 3. PnL integrity & fee deductions
    assert summary.total_gross_profit_inr > 0
    assert summary.total_brokerage_inr > 0
    expected_net = summary.total_gross_profit_inr - summary.total_brokerage_inr
    assert abs(summary.total_net_profit_inr - expected_net) < 1.0

    # 4. Profit factor & average metrics
    assert summary.profit_factor >= 2.0
    assert summary.average_win_inr > summary.average_loss_inr

    # 5. Equity curve integrity
    assert len(summary.equity_curve) == summary.total_calls_audited + 1
    assert summary.equity_curve[0].balance_inr == 10000.0
    assert summary.current_simulated_capital_inr == summary.equity_curve[-1].balance_inr
    assert summary.capital_growth_pct > 0

def test_audit_comparison_item_integrity():
    summary = auto_alert_engine.get_audit_summary()
    
    for item in summary.comparison_items:
        # Check side-by-side comparison fields
        assert item.contract_display
        assert item.recommended_entry > 0
        assert item.recommended_target_1 > item.recommended_entry
        assert item.recommended_stop_loss < item.recommended_entry
        assert item.actual_highest_reached > 0
        assert item.actual_lowest_reached > 0
        assert item.outcome in ("TARGET_HIT", "STOP_LOSS_HIT", "EXPIRED")
        assert len(item.plain_english_verdict) > 10

        # Outcome-specific checks
        if item.outcome == "TARGET_HIT":
            assert item.actual_highest_reached >= item.recommended_target_1 or item.actual_exit_price >= item.recommended_target_1 * 0.98
            assert item.net_pnl_inr > 0
        elif item.outcome == "STOP_LOSS_HIT":
            assert item.actual_lowest_reached <= item.recommended_stop_loss * 1.02
            assert item.net_pnl_inr < 0

def test_audit_filtering_by_outcome():
    winners = auto_alert_engine.get_audit_summary(filter_outcome="TARGET_HIT")
    for item in winners.comparison_items:
        assert item.outcome == "TARGET_HIT"

    losses = auto_alert_engine.get_audit_summary(filter_outcome="STOP_LOSS_HIT")
    for item in losses.comparison_items:
        assert item.outcome == "STOP_LOSS_HIT"
