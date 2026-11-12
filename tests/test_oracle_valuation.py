import pytest
from backend.app.engine.oracle_valuation import oracle_valuation_engine

def test_oracle_valuation_known_stocks():
    # Test for RELIANCE
    res_rel = oracle_valuation_engine.analyze_stock("RELIANCE")
    assert res_rel.symbol == "RELIANCE"
    assert res_rel.fair_value > 0
    assert res_rel.bargain_buy_price < res_rel.fair_value
    assert res_rel.composite_score >= 0.0
    assert res_rel.pillar_buffett.moat_score >= 80.0
    assert res_rel.pillar_buffett.moat_rating == "WIDE_MOAT"
    assert res_rel.pillar_graham.piotroski_f_score >= 7
    assert res_rel.pillar_lynch.peg_ratio > 0

    # Test for TCS
    res_tcs = oracle_valuation_engine.analyze_stock("TCS")
    assert res_tcs.symbol == "TCS"
    assert res_tcs.pillar_buffett.roic_pct > 30.0
    assert res_tcs.pillar_graham.altman_z_score > 3.0

def test_oracle_valuation_unknown_stock_synthesis():
    # Test arbitrary stock ticker synthesis
    res_custom = oracle_valuation_engine.analyze_stock("CUSTOMCORP")
    assert res_custom.symbol == "CUSTOMCORP"
    assert res_custom.fair_value > 0
    assert res_custom.master_verdict in [
        "BUFFETT_FAT_PITCH", "ACCUMULATE_FAIR_PRICE",
        "WATCHLIST_FULLY_VALUED", "OVERVALUED_CHOPPY", "VALUE_TRAP_AVOID"
    ]
    assert len(res_custom.pillar_buffett.inversion_checks) == 4

def test_oracle_dcf_sensitivity():
    # Base valuation
    res_base = oracle_valuation_engine.analyze_stock("RELIANCE", custom_growth_rate=12.0, custom_discount_rate=11.0)
    
    # Higher growth rate should yield higher fair value
    res_high_growth = oracle_valuation_engine.analyze_stock("RELIANCE", custom_growth_rate=18.0, custom_discount_rate=11.0)
    assert res_high_growth.fair_value > res_base.fair_value

    # Higher discount rate should yield lower fair value
    res_high_discount = oracle_valuation_engine.analyze_stock("RELIANCE", custom_growth_rate=12.0, custom_discount_rate=14.0)
    assert res_high_discount.fair_value < res_base.fair_value
