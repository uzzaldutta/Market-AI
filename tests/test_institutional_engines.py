"""
Automated Unit Tests for Institutional Quant Engines:
- Option Dealer Gamma Exposure (GEX) & Zero-Gamma Inversion
- Order Flow Volume Profile (POC, VAH, VAL) & Anchored VWAP
- FII/DII Participant Open Interest Positioning & Smart Money Divergence
- Sector Relative Strength Rotation Matrix (RRG Quadrants)
- Fractional Kelly Criterion Risk Sizing & Capital Allocation
"""

import pytest
import pandas as pd
import numpy as np

from backend.app.engine.gamma_exposure import gamma_engine
from backend.app.engine.volume_profile import volume_engine
from backend.app.engine.participant_oi import participant_oi_engine
from backend.app.engine.sector_rotation import sector_rotation_engine
from backend.app.engine.risk_allocator import risk_allocator

def test_gamma_exposure_engine():
    res = gamma_engine.calculate_gex_profile("NIFTY50")
    assert res["symbol"] == "NIFTY50"
    assert "total_net_gex_cr" in res
    assert "gamma_flip_level" in res
    assert res["gamma_flip_level"] > 0
    assert res["regime"] in ["LONG_GAMMA", "SHORT_GAMMA", "NEUTRAL_TRANSITION"]
    assert res["market_action"] in ["MEAN_REVERSION", "EXPANSION_BREAKOUT", "WATCH_BREAK"]
    assert len(res["strikes"]) >= 5
    assert res["major_call_wall"] > 0
    assert res["major_put_wall"] > 0

def test_volume_profile_engine():
    # Synthetic trending candles
    np.random.seed(42)
    n = 50
    base = 24000.0
    drift = np.linspace(0, 500, n)
    noise = np.random.normal(0, 30, n)
    closes = base + drift + noise
    highs = closes + np.random.uniform(10, 40, n)
    lows = closes - np.random.uniform(10, 40, n)
    volumes = np.random.randint(50000, 200000, n)

    df = pd.DataFrame({
        "timestamp": [f"2026-11-{i+1:02d}" for i in range(n)],
        "open": closes - 5,
        "high": highs,
        "low": lows,
        "close": closes,
        "volume": volumes
    })

    vp = volume_engine.compute_volume_profile(df, bins=25)
    assert vp["poc"] > 0
    assert vp["vah"] >= vp["val"]
    assert vp["val"] <= vp["poc"] <= vp["vah"]
    assert vp["total_volume"] == int(volumes.sum())
    assert vp["va_status"] in ["ABOVE_VALUE_AREA", "BELOW_VALUE_AREA", "INSIDE_VALUE_AREA"]
    assert len(vp["profile_bins"]) == 25

    # Anchored VWAP test
    avwap = volume_engine.compute_anchored_vwap(df)
    assert "session_start" in avwap
    assert "swing_high" in avwap
    assert "swing_low" in avwap
    assert avwap["session_start"]["current_avwap"] > 0
    assert avwap["session_start"]["upper_1sd"] >= avwap["session_start"]["current_avwap"]
    assert avwap["session_start"]["lower_1sd"] <= avwap["session_start"]["current_avwap"]

def test_participant_oi_engine():
    flows = participant_oi_engine.get_participant_oi_analytics()
    assert "cycle_phase" in flows
    assert "smart_money_divergence" in flows
    assert "fii" in flows["participants"]
    assert "client" in flows["participants"]

    fii_data = flows["participants"]["fii"]
    assert 0.0 <= fii_data["long_ratio_pct"] <= 100.0
    assert fii_data["stance"] in ["NET_LONG", "NET_SHORT"]

    client_data = flows["participants"]["client"]
    assert 0.0 <= client_data["long_ratio_pct"] <= 100.0

def test_sector_rotation_engine():
    matrix = sector_rotation_engine.compute_rotation_matrix()
    assert matrix["benchmark"] == "NIFTY50"
    assert len(matrix["sectors"]) == 14

    quadrants = set(s["quadrant"] for s in matrix["sectors"])
    valid_quadrants = {"LEADING", "WEAKENING", "LAGGING", "IMPROVING"}
    assert quadrants.issubset(valid_quadrants)

    for s in matrix["sectors"]:
        assert s["rs_ratio"] > 0
        assert s["rs_momentum"] > 0
        assert s["action"] in ["ACCUMULATE_BULLISH", "TRAIL_PROFITS", "AVOID_OR_SHORT", "WATCH_EARLY_REVERSAL"]

def test_risk_allocator_engine():
    # Profitable edge setup: 65% win rate, 1:2 Risk/Reward
    res = risk_allocator.calculate_kelly_sizing(
        account_equity=1000000.0,
        entry_price=2500.0,
        stop_loss=2450.0, # 50 risk
        target_price=2600.0, # 100 reward (b = 2.0)
        win_probability=0.65,
        lot_size=1,
        max_capital_risk_pct=1.5
    )

    assert res["has_edge"] is True
    assert res["risk_reward_ratio"] == 2.0
    assert res["recommended_quantity"] > 0
    # Hard risk ceiling check: Risk cannot exceed 1.5% of 10,00,000 = 15,000 INR
    assert res["capital_at_risk_inr"] <= 15000.0
    assert res["expected_value_inr"] > 0

    # Negative expectancy test: 30% win rate, 1:1 Risk/Reward
    neg_res = risk_allocator.calculate_kelly_sizing(
        account_equity=1000000.0,
        entry_price=100.0,
        stop_loss=90.0,
        target_price=110.0,
        win_probability=0.30,
        lot_size=1,
        max_capital_risk_pct=1.5
    )
    assert neg_res["has_edge"] is False
    assert neg_res["recommended_quantity"] == 0
