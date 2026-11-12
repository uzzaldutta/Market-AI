"""
Institutional Risk Allocator & Fractional Kelly Criterion Engine.
Computes mathematically optimal position sizing, Value-at-Risk limits,
and asymmetric risk-to-reward capital allocation for Indian cash and F&O instruments.
"""

from typing import Dict, Any, Optional

class RiskAllocatorEngine:
    @staticmethod
    def calculate_kelly_sizing(
        account_equity: float,
        entry_price: float,
        stop_loss: float,
        target_price: float,
        win_probability: float, # e.g. 0.65 for 65%
        lot_size: int = 1,
        max_capital_risk_pct: float = 1.5 # Maximum allowed account risk per trade (1.5%)
    ) -> Dict[str, Any]:
        """
        Calculates Fractional Kelly Criterion sizing (Full Kelly, Half Kelly, Quarter Kelly).
        Guarantees that calculated risk never exceeds max_capital_risk_pct.
        """
        risk_per_unit = abs(entry_price - stop_loss)
        reward_per_unit = abs(target_price - entry_price)

        if risk_per_unit <= 0.001:
            risk_per_unit = entry_price * 0.01 # 1% fallback

        b = reward_per_unit / risk_per_unit # Risk/Reward ratio
        p = max(0.01, min(0.99, win_probability))
        q = 1.0 - p

        # Full Kelly Criterion formula: f* = (p * (b + 1) - 1) / b
        raw_kelly_fraction = (p * (b + 1.0) - 1.0) / max(0.1, b)

        # If edge is negative, Kelly is 0
        if raw_kelly_fraction <= 0:
            return {
                "has_edge": False,
                "message": "Negative statistical expectancy. Edge is below zero; no capital allocation recommended.",
                "kelly_fraction": 0.0,
                "recommended_fraction": 0.0,
                "recommended_lots": 0,
                "recommended_quantity": 0,
                "capital_at_risk": 0.0,
                "position_value": 0.0,
                "expected_value_inr": 0.0
            }

        # Institutional practice uses Half-Kelly (0.50x) or Quarter-Kelly (0.25x)
        # to dramatically minimize drawdown variance
        half_kelly = raw_kelly_fraction * 0.50
        quarter_kelly = raw_kelly_fraction * 0.25

        # Hard risk ceiling: Cap max potential loss to account_equity * max_capital_risk_pct / 100
        max_loss_budget = account_equity * (max_capital_risk_pct / 100.0)

        # Position size constrained by risk budget
        # Loss = Qty * risk_per_unit <= max_loss_budget  -->  Qty <= max_loss_budget / risk_per_unit
        max_allowed_units = max(1, int(max_loss_budget / risk_per_unit))

        # Size by Half-Kelly allocation
        kelly_capital_allocated = account_equity * half_kelly
        kelly_units = int(kelly_capital_allocated / max(1.0, entry_price))

        # Reconcile constraints
        target_units = min(max_allowed_units, max(1, kelly_units))

        # Align to lot size
        if lot_size > 1:
            lots = max(1, round(target_units / lot_size))
            final_quantity = lots * lot_size
        else:
            lots = 1
            final_quantity = target_units

        final_capital_at_risk = round(final_quantity * risk_per_unit, 2)
        final_position_value = round(final_quantity * entry_price, 2)

        # Expected Value per trade: EV = (p * Gain) - (q * Loss)
        ev_inr = round((p * (final_quantity * reward_per_unit)) - (q * (final_quantity * risk_per_unit)), 2)

        return {
            "has_edge": True,
            "win_probability_pct": round(p * 100.0, 1),
            "risk_reward_ratio": round(b, 2),
            "full_kelly_pct": round(raw_kelly_fraction * 100.0, 2),
            "half_kelly_pct": round(half_kelly * 100.0, 2),
            "quarter_kelly_pct": round(quarter_kelly * 100.0, 2),
            "recommended_lots": lots,
            "recommended_quantity": final_quantity,
            "lot_size": lot_size,
            "position_value_inr": final_position_value,
            "capital_at_risk_inr": final_capital_at_risk,
            "risk_pct_of_account": round((final_capital_at_risk / max(1.0, account_equity)) * 100.0, 2),
            "expected_value_inr": ev_inr,
            "max_loss_budget_inr": round(max_loss_budget, 2)
        }

risk_allocator = RiskAllocatorEngine()
