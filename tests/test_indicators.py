import pytest
import pandas as pd
import numpy as np
from backend.app.engine.indicators import TechnicalIndicators

@pytest.fixture
def sample_ohlcv():
    """Generates 100 bars of deterministic price history for testing."""
    np.random.seed(42)
    dates = pd.date_range("2026-01-01", periods=100, freq="D")
    base_price = 1000.0
    returns = np.random.normal(0.001, 0.015, 100)
    close = base_price * np.exp(np.cumsum(returns))
    high = close * (1.0 + np.abs(np.random.normal(0.005, 0.005, 100)))
    low = close * (1.0 - np.abs(np.random.normal(0.005, 0.005, 100)))
    open_p = (high + low) / 2.0
    volume = np.random.randint(50000, 2000000, 100)
    
    return pd.DataFrame({
        "timestamp": dates,
        "open": open_p,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume
    })

def test_sma_calculation(sample_ohlcv):
    c = sample_ohlcv["close"]
    sma20 = TechnicalIndicators.sma(c, 20)
    
    # Warm-up check: First 19 values must be NaN
    assert sma20.iloc[:19].isna().all()
    assert not pd.isna(sma20.iloc[19])
    
    # Mathematical identity check
    expected_sma_20 = c.iloc[:20].mean()
    assert np.isclose(sma20.iloc[19], expected_sma_20, rtol=1e-5)

def test_rsi_bounds_and_values(sample_ohlcv):
    c = sample_ohlcv["close"]
    rsi = TechnicalIndicators.rsi(c, 14)
    
    # Check RSI range [0, 100]
    valid_rsi = rsi.dropna()
    assert (valid_rsi >= 0.0).all()
    assert (valid_rsi <= 100.0).all()

def test_no_look_ahead_bias(sample_ohlcv):
    """
    CRITICAL QUANT TEST:
    Modifying future data after bar T MUST NOT alter indicator values at bar T.
    """
    c = sample_ohlcv["close"].copy()
    t = 40
    
    rsi_orig = TechnicalIndicators.rsi(c, 14).iloc[t]
    macd_orig, _, _ = TechnicalIndicators.macd(c, 12, 26, 9)
    macd_val_orig = macd_orig.iloc[t]
    
    # Tamper with all future data after T
    c.iloc[t+1:] = c.iloc[t+1:] * 5.0
    
    rsi_tampered = TechnicalIndicators.rsi(c, 14).iloc[t]
    macd_tampered, _, _ = TechnicalIndicators.macd(c, 12, 26, 9)
    macd_val_tampered = macd_tampered.iloc[t]
    
    assert np.isclose(rsi_orig, rsi_tampered, rtol=1e-6)
    assert np.isclose(macd_val_orig, macd_val_tampered, rtol=1e-6)

def test_bollinger_bands_properties(sample_ohlcv):
    c = sample_ohlcv["close"]
    upper, middle, lower, bw = TechnicalIndicators.bollinger_bands(c, 20, 2.0)
    
    # Valid rows must strictly obey upper >= middle >= lower
    valid_idx = ~(upper.isna() | middle.isna() | lower.isna())
    assert (upper[valid_idx] >= middle[valid_idx]).all()
    assert (middle[valid_idx] >= lower[valid_idx]).all()

def test_pivot_points():
    pivots = TechnicalIndicators.pivot_points(high=105.0, low=95.0, close=100.0)
    assert pivots["P"] == 100.0
    assert pivots["R1"] == 105.0
    assert pivots["S1"] == 95.0
    assert pivots["R2"] == 110.0
    assert pivots["S2"] == 90.0

def test_full_indicator_suite(sample_ohlcv):
    res = TechnicalIndicators.compute_all_indicators(sample_ohlcv)
    assert "rsi_14" in res
    assert "macd" in res
    assert "bollinger" in res
    assert "trend_state" in res
    assert res["trend_state"] in ["STRONG_BULLISH", "BULLISH", "SIDEWAYS", "BEARISH", "STRONG_BEARISH"]
