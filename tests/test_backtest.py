import pytest
import pandas as pd
import numpy as np
from backend.app.engine.backtester import BacktestEngine

@pytest.fixture
def sample_trend_data():
    """Generates 120 bars of upward trending price action."""
    np.random.seed(101)
    dates = pd.date_range("2026-01-01", periods=120, freq="D")
    base = 2000.0
    drift = np.linspace(0, 0.35, 120) # 35% growth
    noise = np.random.normal(0, 0.015, 120)
    close = base * (1.0 + drift + np.cumsum(noise))
    high = close * 1.015
    low = close * 0.985
    open_p = (high + low) / 2.0
    volume = np.random.randint(100000, 1500000, 120)
    
    return pd.DataFrame({
        "timestamp": dates,
        "open": open_p,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume
    })

def test_backtest_execution_and_metrics(sample_trend_data):
    engine = BacktestEngine(initial_capital=1000000.0, slippage_pct=0.0005)
    result = engine.run_strategy("RELIANCE", sample_trend_data, strategy="TREND_BREAKOUT")
    
    assert "total_net_profit" in result
    assert "sharpe_ratio" in result
    assert "max_drawdown_pct" in result
    assert "win_rate" in result
    assert result["total_trades"] >= 0
    assert result["total_fees_paid"] >= 0.0
    assert len(result["equity_curve"]) > 0

def test_backtest_transaction_cost_deductions():
    engine = BacktestEngine()
    # Turnover of ₹1,00,000 INR
    charges = engine.calculate_charges(100000.0)
    # STT = 100, Brokerage = 20, etc. Total ~₹140
    assert charges > 50.0
    assert charges < 300.0
