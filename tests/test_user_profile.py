"""
Unit Tests for User Profile, Custom Scrip Tracking, and Script Personalization Engine.
Verifies multi-user isolation, persistent disk storage, custom scrip additions with price alerts,
and algorithmic rule management.
"""

import pytest
from backend.app.engine.user_profile_engine import user_profile_engine
from backend.app.schemas.market import (
    AddScripRequest, UpdateScripRequest, AddCustomScriptRuleRequest,
    UpdateUserProfileRequest
)

def test_default_user_profile_initialization():
    profile = user_profile_engine.get_profile("default_user")
    assert profile.user_id == "default_user"
    assert profile.budget_tier in ("UNDER_5K", "UNDER_10K", "UNDER_25K", "UNLIMITED")
    assert profile.max_capital_per_trade_inr > 0
    assert len(profile.scrips) >= 1
    assert len(profile.custom_rules) >= 1

def test_user_personalization_update():
    user_id = "test_trader_alpha"
    update_req = UpdateUserProfileRequest(
        display_name="Alpha Scalper",
        budget_tier="UNDER_10K",
        max_capital_per_trade_inr=8000.0,
        max_daily_loss_limit_inr=-2000.0,
        risk_appetite="AGGRESSIVE",
        sound_alerts_enabled=True
    )
    profile = user_profile_engine.update_profile(user_id, update_req)
    assert profile.user_id == user_id
    assert profile.display_name == "Alpha Scalper"
    assert profile.budget_tier == "UNDER_10K"
    assert profile.max_capital_per_trade_inr == 8000.0
    assert profile.max_daily_loss_limit_inr == -2000.0
    assert profile.risk_appetite == "AGGRESSIVE"

def test_user_scrip_lifecycle_and_isolation():
    user_a = "trader_a"
    user_b = "trader_b"

    # User A adds RELIANCE
    req_a = AddScripRequest(
        symbol="RELIANCE",
        name="Reliance Industries",
        exchange="NSE",
        instrument_type="CASH_EQUITY",
        target_entry_price=2950.0,
        alert_condition="PRICE_BELOW",
        notes="Key support buy level",
        custom_budget_inr=6000.0
    )
    profile_a = user_profile_engine.add_scrip(user_a, req_a)
    assert any(s.symbol == "RELIANCE" for s in profile_a.scrips)

    # User B should NOT have RELIANCE (User Isolation)
    profile_b = user_profile_engine.get_profile(user_b)
    assert not any(s.symbol == "RELIANCE" for s in profile_b.scrips)

    # User A updates RELIANCE
    scrip_a = next(s for s in profile_a.scrips if s.symbol == "RELIANCE")
    update_scrip_req = UpdateScripRequest(
        target_entry_price=2940.0,
        notes="Lowered entry to 2940"
    )
    updated_profile_a = user_profile_engine.update_scrip(user_a, scrip_a.scrip_id, update_scrip_req)
    updated_scrip = next(s for s in updated_profile_a.scrips if s.scrip_id == scrip_a.scrip_id)
    assert updated_scrip.target_entry_price == 2940.0
    assert updated_scrip.notes == "Lowered entry to 2940"

    # User A deletes RELIANCE
    final_profile_a = user_profile_engine.delete_scrip(user_a, scrip_a.scrip_id)
    assert not any(s.scrip_id == scrip_a.scrip_id for s in final_profile_a.scrips)

def test_user_custom_script_rule_management():
    user_id = "quant_user_1"
    rule_req = AddCustomScriptRuleRequest(
        title="Supertrend Breakout Scalp",
        description="Alerts when 5m Supertrend turns green with volume",
        indicator="PRICE_BREAKOUT",
        condition_operator="GREATER_THAN",
        threshold_value=1.5,
        action_message="Supertrend Breakout Confirmed"
    )
    profile = user_profile_engine.add_custom_rule(user_id, rule_req)
    assert any(r.title == "Supertrend Breakout Scalp" for r in profile.custom_rules)

    rule = next(r for r in profile.custom_rules if r.title == "Supertrend Breakout Scalp")
    assert rule.indicator == "PRICE_BREAKOUT"
    assert rule.threshold_value == 1.5

    # Delete rule
    updated_profile = user_profile_engine.delete_custom_rule(user_id, rule.script_id)
    assert not any(r.script_id == rule.script_id for r in updated_profile.custom_rules)

def test_user_scrip_alert_toggle_and_synthesis():
    user_id = "test_toggle_user"
    req = AddScripRequest(
        symbol="INFY",
        name="Infosys Ltd",
        exchange="NSE",
        instrument_type="CASH_EQUITY",
        target_entry_price=1850.0,
        alert_condition="PRICE_BELOW",
        notes="Dip buy near 50 EMA",
        custom_budget_inr=5550.0
    )
    profile = user_profile_engine.add_scrip(user_id, req)
    scrip = next(s for s in profile.scrips if s.symbol == "INFY")
    assert scrip.alert_triggered is False

    # Toggle alert trigger
    toggled = user_profile_engine.toggle_scrip_alert(user_id, scrip.scrip_id)
    toggled_scrip = next(s for s in toggled.scrips if s.scrip_id == scrip.scrip_id)
    assert toggled_scrip.alert_triggered is True

    # Synthesize alerts
    alerts = user_profile_engine.get_user_alerts(user_id)
    assert len(alerts) >= 1
    infy_alert = next(a for a in alerts if a.symbol == "INFY")
    assert infy_alert.status == "IN_BUY_ZONE"
    assert infy_alert.capital_required_inr == 5550.0
    assert infy_alert.stop_loss_price < infy_alert.entry_price_min

def test_auto_alerts_user_integration():
    from backend.app.engine.auto_alert_engine import auto_alert_engine
    res = auto_alert_engine.get_live_alerts(budget_tier="MY_SCRIPS", user_id="test_toggle_user")
    assert res.total_active >= 1
    assert any("INFY" in a.symbol for a in res.active_alerts)

    # Clean up test user
    del_ok = user_profile_engine.delete_user_profile("test_toggle_user")
    assert del_ok is True
