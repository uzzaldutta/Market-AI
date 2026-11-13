import pytest
from backend.app.schemas.market import PreTradeCheckRequest, OrderSide
from backend.app.engine.pretrade_engine import pretrade_engine

def test_pretrade_validation_institutional_pass():
    req = PreTradeCheckRequest(
        symbol="RELIANCE",
        side=OrderSide.BUY,
        quantity=50,
        entry_price=2900.0,
        stop_loss=2850.0, # 50 pts risk (1.7%)
        target_price=3025.0, # 125 pts reward (1:2.5 RR)
        account_equity=1000000.0,
        instrument_type="EQUITY",
        product_type="CNC"
    )
    res = pretrade_engine.validate_trade(req)
    assert res.symbol == "RELIANCE"
    assert res.risk_amount_inr == 2500.0 # 50 * 50
    assert res.reward_amount_inr == 6250.0 # 50 * 125
    assert res.risk_reward_ratio == 2.5
    assert res.recommended_1pct_quantity == 200 # 10000 / 50
    assert res.friction.total_taxes_and_charges > 0
    assert res.friction.breakeven_points_needed > 0
    assert len(res.checks) == 6
    assert res.readiness_score >= 5
    assert res.overall_status in ["INSTITUTIONAL_READY", "ACCEPTABLE_WITH_CAUTION"]

def test_pretrade_validation_excessive_risk_warning():
    req = PreTradeCheckRequest(
        symbol="TCS",
        side=OrderSide.BUY,
        quantity=500, # Large quantity: 500 * 4000 = 20,00,000 INR (200% concentration)
        entry_price=4000.0,
        stop_loss=3800.0, # 200 pts risk * 500 = 1,00,000 INR risk (10% of equity)
        target_price=4200.0, # 1:1 RR (suboptimal)
        account_equity=1000000.0,
        instrument_type="EQUITY",
        product_type="CNC"
    )
    res = pretrade_engine.validate_trade(req)
    assert res.risk_pct_of_equity == 10.0 # 10% risk violates 1% rule
    assert res.risk_reward_ratio == 1.0 # 1:1 violates 1:2 rule
    assert res.portfolio_concentration_pct == 200.0
    assert res.overall_status == "BLOCKED_HIGH_RISK"
    # Find the fail checks
    fail_checks = [c for c in res.checks if c.status == "FAIL"]
    assert len(fail_checks) >= 2
