"""
Automated Unit Tests for Fast Alpha Radar Engine:
- Relative Strength Absorption (Zero-Lag vs NIFTY 50)
- VWAP-ORB (Opening Range Breakout)
- Intraday Open Interest Velocity (Short Squeeze Detection)
- Z-Score Statistical Arbitrage (Mean Reversion)
"""

import pytest
from backend.app.engine.fast_alpha_radar import fast_alpha_radar

def test_fast_alpha_radar_scanning():
    res = fast_alpha_radar.scan_fast_alpha()
    assert "timestamp" in res
    assert "scan_time" in res
    assert res["benchmark"] == "NIFTY 50"
    assert "total_signals" in res
    assert len(res["strategies_covered"]) == 4
    assert len(res["signals"]) > 0

    for sig in res["signals"]:
        assert sig["id"]
        assert sig["symbol"]
        assert sig["strategy_type"] in [
            "RELATIVE_STRENGTH_ABSORPTION",
            "VWAP_OPENING_RANGE_BREAKOUT",
            "OI_VELOCITY_SHORT_SQUEEZE",
            "ZSCORE_MEAN_REVERSION"
        ]
        assert sig["direction"] in ["LONG", "SHORT"]
        assert sig["confidence_score"] >= 80.0
        assert sig["entry_price"] > 0
        assert sig["stop_loss"] > 0
        assert sig["target_price"] > 0
        assert sig["risk_reward_ratio"] >= 1.5

def test_fast_alpha_radar_strategy_filter():
    filtered = fast_alpha_radar.scan_fast_alpha(signal_filter="RELATIVE_STRENGTH_ABSORPTION")
    for sig in filtered["signals"]:
        assert sig["strategy_type"] == "RELATIVE_STRENGTH_ABSORPTION"
