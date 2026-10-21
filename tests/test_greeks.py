import pytest
import numpy as np
from backend.app.engine.greeks import OptionsMath

def test_black_scholes_call_and_put():
    s = 24800.0 # NIFTY Spot
    k = 24800.0 # ATM Strike
    t = 30.0 / 365.0 # 30 days
    r = 0.065 # 6.5%
    sigma = 0.14 # 14%
    
    call_price = OptionsMath.black_scholes_price(s, k, t, r, sigma, "CE")
    put_price = OptionsMath.black_scholes_price(s, k, t, r, sigma, "PE")
    
    # Prices must be strictly positive
    assert call_price > 0.0
    assert put_price > 0.0
    
    # Put-Call Parity: C - P = S - K * exp(-r * t)
    lhs = call_price - put_price
    rhs = s - k * np.exp(-r * t)
    assert np.isclose(lhs, rhs, atol=1.0)

def test_greeks_directional_signs():
    s = 24800.0
    k = 24800.0
    t = 15.0 / 365.0
    r = 0.065
    sigma = 0.15
    
    call_greeks = OptionsMath.calculate_greeks(s, k, t, r, sigma, "CE")
    put_greeks = OptionsMath.calculate_greeks(s, k, t, r, sigma, "PE")
    
    # Call Delta in (0, 1) and Put Delta in (-1, 0)
    assert 0.0 < call_greeks["delta"] < 1.0
    assert -1.0 < put_greeks["delta"] < 0.0
    
    # Gamma must be positive for both
    assert call_greeks["gamma"] > 0
    assert put_greeks["gamma"] > 0
    
    # Theta (time decay) must be negative
    assert call_greeks["theta"] < 0
    assert put_greeks["theta"] < 0
    
    # Vega must be positive
    assert call_greeks["vega"] > 0
    assert put_greeks["vega"] > 0

def test_implied_volatility_solver():
    s = 25000.0
    k = 25000.0
    t = 20.0 / 365.0
    r = 0.065
    target_vol = 0.18
    
    known_price = OptionsMath.black_scholes_price(s, k, t, r, target_vol, "CE")
    solved_iv = OptionsMath.implied_volatility(known_price, s, k, t, r, "CE")
    
    assert np.isclose(solved_iv, target_vol, atol=0.01)

def test_max_pain_calculation():
    strikes = [24000.0, 24500.0, 25000.0, 25500.0, 26000.0]
    call_oi = [10000, 25000, 80000, 150000, 200000]
    put_oi = [220000, 160000, 75000, 20000, 5000]
    
    max_pain = OptionsMath.calculate_max_pain(strikes, call_oi, put_oi)
    assert max_pain == 25000.0

def test_strategy_payoff():
    spot = 24850.0
    legs = [
        {"type": "CE", "side": "BUY", "strike": 24850.0, "premium": 150.0, "qty": 1},
        {"type": "CE", "side": "SELL", "strike": 25150.0, "premium": 50.0, "qty": 1}
    ]
    res = OptionsMath.simulate_strategy_payoff(spot, "Bull Call Spread", legs, lot_size=50)
    
    assert res["max_profit"] > 0
    assert res["max_loss"] < 0
    assert len(res["breakeven_points"]) >= 1
    assert res["estimated_charges"] > 0
