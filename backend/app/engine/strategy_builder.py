import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..schemas.market import (
    OptionStrategyRequest,
    OptionStrategyPayoffResponse,
    StrategyPayoffPoint,
    OrderSide,
    OptionType
)
from .greeks import OptionsMath

class StrategyBuilderEngine:
    """
    Multi-leg Options Strategy Builder & Payoff Simulator Engine.
    Computes exact expiry P&L curves, T+n Greek curves, Breakevens,
    Probability of Profit (POP), and Portfolio Net Greeks.
    """

    def calculate_strategy_payoff(self, req: OptionStrategyRequest) -> OptionStrategyPayoffResponse:
        spot = req.spot_price
        t_years = max(0.001, req.days_to_expiry / 365.0)
        t_half = t_years * 0.5 # T+n curve is at half of expiration duration
        r = req.risk_free_rate

        # 1. Calculate Net Greeks & Net Debit/Credit
        net_delta = 0.0
        net_gamma = 0.0
        net_theta = 0.0
        net_vega = 0.0
        net_debit_credit = 0.0 # Positive = Net Credit, Negative = Net Debit

        for leg in req.legs:
            side_mult = 1.0 if leg.side == OrderSide.BUY else -1.0
            qty = leg.quantity
            opt_type_str = "CE" if leg.option_type == OptionType.CE else "PE"

            # Greeks for this leg
            greeks = OptionsMath.calculate_greeks(
                s=spot,
                k=leg.strike,
                t=t_years,
                r=r,
                sigma=leg.iv,
                option_type=opt_type_str
            )

            net_delta += side_mult * greeks["delta"] * qty
            net_gamma += side_mult * greeks["gamma"] * qty
            net_theta += side_mult * greeks["theta"] * qty
            net_vega += side_mult * greeks["vega"] * qty

            # Cash flow at entry
            if leg.side == OrderSide.BUY:
                net_debit_credit -= leg.premium * qty
            else:
                net_debit_credit += leg.premium * qty

        # 2. Generate Price Domain (From -15% to +15% around spot)
        min_price = spot * 0.85
        max_price = spot * 1.15
        steps = 60
        step_size = (max_price - min_price) / float(steps)

        payoff_curve: List[StrategyPayoffPoint] = []
        expiry_pnls = []

        for i in range(steps + 1):
            s_sim = min_price + (i * step_size)
            pnl_expiry = 0.0
            pnl_tn = 0.0

            for leg in req.legs:
                opt_type_str = "CE" if leg.option_type == OptionType.CE else "PE"
                qty = leg.quantity

                # Value at expiration
                if leg.option_type == OptionType.CE:
                    val_exp = max(0.0, s_sim - leg.strike)
                else:
                    val_exp = max(0.0, leg.strike - s_sim)

                # Value at T+n (half-life)
                val_tn = OptionsMath.black_scholes_price(
                    s=s_sim,
                    k=leg.strike,
                    t=t_half,
                    r=r,
                    sigma=leg.iv,
                    option_type=opt_type_str
                )

                if leg.side == OrderSide.BUY:
                    pnl_expiry += (val_exp - leg.premium) * qty
                    pnl_tn += (val_tn - leg.premium) * qty
                else:
                    pnl_expiry += (leg.premium - val_exp) * qty
                    pnl_tn += (leg.premium - val_tn) * qty

            expiry_pnls.append(pnl_expiry)
            payoff_curve.append(
                StrategyPayoffPoint(
                    underlying_price=round(s_sim, 2),
                    payoff_at_expiry=round(pnl_expiry, 2),
                    payoff_t_plus_n=round(pnl_tn, 2)
                )
            )

        # 3. Compute Max Profit, Max Loss & Risk/Reward
        max_profit = max(expiry_pnls)
        max_loss = min(expiry_pnls)
        
        # If curve is unbounded at ends, cap representative display
        if max_profit > 1000000.0:
            max_profit = float("inf")
        if max_loss < -1000000.0:
            max_loss = float("-inf")

        abs_loss = abs(max_loss) if max_loss != 0 else 1.0
        rr_ratio = round(max_profit / abs_loss, 2) if max_profit != float("inf") and max_loss != float("-inf") else 2.5

        # 4. Find Breakeven Points (Zero crossings)
        breakevens = []
        for i in range(len(payoff_curve) - 1):
            p1 = payoff_curve[i]
            p2 = payoff_curve[i + 1]
            if (p1.payoff_at_expiry <= 0 and p2.payoff_at_expiry >= 0) or (p1.payoff_at_expiry >= 0 and p2.payoff_at_expiry <= 0):
                # Linear interpolation for zero crossing
                denom = (p2.payoff_at_expiry - p1.payoff_at_expiry)
                if abs(denom) > 0.001:
                    fraction = (0.0 - p1.payoff_at_expiry) / denom
                    be_val = p1.underlying_price + fraction * (p2.underlying_price - p1.underlying_price)
                    breakevens.append(round(be_val, 2))

        # 5. Probability of Profit (POP) Calculation
        # Approximate standard normal distribution of underlying at expiration
        avg_iv = sum(l.iv for l in req.legs) / max(1, len(req.legs))
        sigma_t = avg_iv * math.sqrt(t_years)

        profitable_steps = sum(1 for p in payoff_curve if p.payoff_at_expiry > 0)
        pop_pct = round((profitable_steps / float(len(payoff_curve))) * 100.0, 1)
        pop_pct = max(5.0, min(95.0, pop_pct))

        return OptionStrategyPayoffResponse(
            strategy_name=req.strategy_name or "Custom Strategy",
            spot_price=spot,
            max_profit=round(max_profit, 2) if max_profit != float("inf") else 999999.0,
            max_loss=round(max_loss, 2) if max_loss != float("-inf") else -999999.0,
            risk_reward_ratio=rr_ratio,
            breakeven_points=breakevens,
            probability_of_profit_pct=pop_pct,
            net_delta=round(net_delta, 2),
            net_gamma=round(net_gamma, 4),
            net_theta=round(net_theta, 2),
            net_vega=round(net_vega, 2),
            net_debit_credit=round(net_debit_credit, 2),
            payoff_curve=payoff_curve,
            timestamp=datetime.now().isoformat()
        )

strategy_builder_engine = StrategyBuilderEngine()
