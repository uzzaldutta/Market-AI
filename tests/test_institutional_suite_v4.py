import pytest
from backend.app.engine.dossier_engine import dossier_engine
from backend.app.engine.strategy_builder import strategy_builder_engine
from backend.app.engine.orderbook_engine import orderbook_depth_engine
from backend.app.engine.optimizer_engine import strategy_optimizer_engine
from backend.app.schemas.market import (
    OptionStrategyRequest,
    OptionLeg,
    OrderSide,
    OptionType,
    StrategyOptimizationRequest
)

def test_dossier_engine_synthesis():
    dossier = dossier_engine.generate_dossier("RELIANCE")
    assert dossier.symbol == "RELIANCE"
    assert dossier.dcf_fair_value > 0
    assert len(dossier.key_strengths) > 0
    assert len(dossier.key_risks) > 0
    assert len(dossier.peer_comparison) > 0
    assert dossier.analyst_rating in ["STRONG BUY", "HOLD / NEUTRAL", "UNDERPERFORM / TRIM"]
    assert "buffett_moat" in dossier.pillar_scores

def test_options_strategy_payoff_bull_call_spread():
    req = OptionStrategyRequest(
        symbol="NIFTY50",
        spot_price=24500.0,
        days_to_expiry=7,
        legs=[
            OptionLeg(strike=24500.0, option_type=OptionType.CE, side=OrderSide.BUY, quantity=50, premium=180.0, iv=0.14),
            OptionLeg(strike=24800.0, option_type=OptionType.CE, side=OrderSide.SELL, quantity=50, premium=50.0, iv=0.13)
        ],
        strategy_name="Bull Call Spread"
    )
    res = strategy_builder_engine.calculate_strategy_payoff(req)
    assert res.strategy_name == "Bull Call Spread"
    assert len(res.payoff_curve) > 30
    assert res.max_loss < 0
    assert res.max_profit > 0
    assert res.net_debit_credit < 0 # Net Debit spread
    assert res.probability_of_profit_pct > 0

def test_orderbook_depth_and_icebergs():
    res = orderbook_depth_engine.get_order_book_depth("TCS")
    assert res.symbol == "TCS"
    assert len(res.bids) == 10
    assert len(res.asks) == 10
    assert res.total_bid_qty > 0
    assert res.total_ask_qty > 0
    assert -1.0 <= res.order_flow_imbalance <= 1.0
    # Prices sorted properly
    assert res.bids[0].price > res.bids[-1].price
    assert res.asks[0].price < res.asks[-1].price

def test_strategy_parameter_optimizer():
    req = StrategyOptimizationRequest(
        strategy_type="EMA_MOMENTUM",
        symbol="NIFTY50",
        stop_loss_pct_range=[1.0, 2.0],
        risk_reward_range=[1.5, 2.0],
        candle_limit=80
    )
    res = strategy_optimizer_engine.optimize_strategy(req)
    assert res.strategy_type == "EMA_MOMENTUM"
    assert res.total_combinations_tested == 4
    assert len(res.results) == 4
    assert "optimal_stop_loss_pct" in res.best_parameters
    assert "optimal_risk_reward" in res.best_parameters
    assert res.best_win_rate >= 0
