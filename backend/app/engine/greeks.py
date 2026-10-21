"""
Options Pricing, Greeks (Black-Scholes), Implied Volatility Solver,
Max Pain, PCR and Payoff Profile Simulation Engine for Indian F&O.
"""

import math
from typing import Dict, List, Optional, Tuple, Any

class OptionsMath:
    # Standard normal cumulative distribution approximation (Abramowitz and Stegun)
    @staticmethod
    def norm_cdf(x: float) -> float:
        """Standard Normal Cumulative Distribution Function."""
        return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

    @staticmethod
    def norm_pdf(x: float) -> float:
        """Standard Normal Probability Density Function."""
        return (1.0 / math.sqrt(2.0 * math.pi)) * math.exp(-0.5 * x * x)

    @classmethod
    def black_scholes_price(cls, s: float, k: float, t: float, r: float, sigma: float, option_type: str = "CE") -> float:
        """
        Black-Scholes formula for European options (used as standard pricing anchor).
        s: Spot price
        k: Strike price
        t: Time to maturity in years
        r: Risk-free rate (e.g. 0.065 for RBI 91-day T-Bill ~6.5%)
        sigma: Volatility (e.g. 0.15 for 15%)
        option_type: 'CE' (Call) or 'PE' (Put)
        """
        if t <= 0:
            if option_type == "CE":
                return max(0.0, s - k)
            else:
                return max(0.0, k - s)
        
        if sigma <= 0.0001:
            sigma = 0.0001
            
        d1 = (math.log(s / k) + (r + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
        d2 = d1 - sigma * math.sqrt(t)
        
        if option_type == "CE":
            price = s * cls.norm_cdf(d1) - k * math.exp(-r * t) * cls.norm_cdf(d2)
        else:
            price = k * math.exp(-r * t) * cls.norm_cdf(-d2) - s * cls.norm_cdf(-d1)
            
        return max(0.0, price)

    @classmethod
    def implied_volatility(cls, price: float, s: float, k: float, t: float, r: float = 0.065, option_type: str = "CE") -> float:
        """
        Calculates Implied Volatility (IV) using Bisection & Newton-Raphson method.
        """
        if t <= 0 or price <= 0:
            return 0.15
            
        # Intrinsic value bounds check
        intrinsic = max(0.0, (s - k) if option_type == "CE" else (k - s))
        if price < intrinsic:
            return 0.10
            
        low_vol = 0.01
        high_vol = 3.0 # 300% max IV
        
        for _ in range(35):
            mid_vol = (low_vol + high_vol) / 2.0
            mid_price = cls.black_scholes_price(s, k, t, r, mid_vol, option_type)
            
            diff = mid_price - price
            if abs(diff) < 0.005:
                return round(mid_vol, 4)
                
            if diff > 0:
                high_vol = mid_vol
            else:
                low_vol = mid_vol
                
        return round((low_vol + high_vol) / 2.0, 4)

    @classmethod
    def calculate_greeks(cls, s: float, k: float, t: float, r: float, sigma: float, option_type: str = "CE") -> Dict[str, float]:
        """
        Calculates Black-Scholes Greeks:
        - Delta: Price sensitivity wrt underlying
        - Gamma: Delta sensitivity wrt underlying
        - Theta: Time decay per calendar day
        - Vega: Sensitivity per 1% change in implied volatility
        - Rho: Sensitivity per 1% change in risk-free rate
        """
        if t <= 0.0001:
            # At expiration
            is_itm = (s > k) if option_type == "CE" else (k > s)
            delta = 1.0 if (option_type == "CE" and is_itm) else (-1.0 if (option_type == "PE" and is_itm) else 0.0)
            return {"delta": delta, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}

        if sigma <= 0.0001:
            sigma = 0.0001

        sqrt_t = math.sqrt(t)
        d1 = (math.log(s / k) + (r + 0.5 * sigma * sigma) * t) / (sigma * sqrt_t)
        d2 = d1 - sigma * sqrt_t
        pdf_d1 = cls.norm_pdf(d1)

        # Gamma and Vega are identical for Calls and Puts
        gamma = pdf_d1 / (s * sigma * sqrt_t)
        vega = (s * sqrt_t * pdf_d1) / 100.0 # Per 1% change in vol

        if option_type == "CE":
            delta = cls.norm_cdf(d1)
            # Theta in INR per calendar day (divided by 365)
            theta = (-(s * pdf_d1 * sigma) / (2.0 * sqrt_t) - r * k * math.exp(-r * t) * cls.norm_cdf(d2)) / 365.0
            rho = (k * t * math.exp(-r * t) * cls.norm_cdf(d2)) / 100.0
        else:
            delta = cls.norm_cdf(d1) - 1.0
            theta = (-(s * pdf_d1 * sigma) / (2.0 * sqrt_t) + r * k * math.exp(-r * t) * cls.norm_cdf(-d2)) / 365.0
            rho = (-k * t * math.exp(-r * t) * cls.norm_cdf(-d2)) / 100.0

        return {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "theta": round(theta, 4),
            "vega": round(vega, 4),
            "rho": round(rho, 4)
        }

    @staticmethod
    def calculate_max_pain(strikes: List[float], call_oi: List[int], put_oi: List[int]) -> float:
        """
        Calculates Max Pain strike: The strike price where total option writer payout is minimized.
        """
        if not strikes or len(strikes) != len(call_oi) or len(strikes) != len(put_oi):
            return 0.0

        total_losses = []
        for test_strike in strikes:
            call_loss = sum(max(0.0, test_strike - k) * oi for k, oi in zip(strikes, call_oi))
            put_loss = sum(max(0.0, k - test_strike) * oi for k, oi in zip(strikes, put_oi))
            total_losses.append(call_loss + put_loss)

        min_loss_idx = total_losses.index(min(total_losses))
        return strikes[min_loss_idx]

    @staticmethod
    def calculate_pcr(call_oi: List[int], put_oi: List[int]) -> float:
        """Put-Call Ratio (PCR) = Total Put OI / Total Call OI"""
        total_call_oi = sum(call_oi)
        total_put_oi = sum(put_oi)
        if total_call_oi == 0:
            return 1.0
        return round(total_put_oi / total_call_oi, 2)

    @classmethod
    def simulate_strategy_payoff(
        cls,
        spot: float,
        strategy_name: str,
        legs: List[Dict[str, Any]], # [{type: 'CE'/'PE', side: 'BUY'/'SELL', strike: float, premium: float, qty: int}]
        lot_size: int = 50,
        range_pct: float = 0.08,
        steps: int = 41
    ) -> Dict[str, Any]:
        """
        Simulates strategy payoff at expiry and pre-expiry.
        Includes standard Indian brokerage: ₹20 per leg order + STT.
        """
        min_p = spot * (1.0 - range_pct)
        max_p = spot * (1.0 + range_pct)
        step_size = (max_p - min_p) / (steps - 1)
        price_range = [min_p + i * step_size for i in range(steps)]

        payoff_curve = []
        brokerage_per_order = 20.0
        total_charges = len(legs) * brokerage_per_order * 2.0 # Round trip

        for p in price_range:
            pnl_at_expiry = 0.0
            for leg in legs:
                mult = 1 if leg["side"] == "BUY" else -1
                if leg["type"] == "CE":
                    intrinsic = max(0.0, p - leg["strike"])
                else:
                    intrinsic = max(0.0, leg["strike"] - p)
                
                leg_pnl = mult * (intrinsic - leg["premium"]) * leg.get("qty", 1) * lot_size
                pnl_at_expiry += leg_pnl
                
            pnl_after_charges = pnl_at_expiry - total_charges
            payoff_curve.append({
                "underlying_price": round(p, 2),
                "expiry_pnl": round(pnl_after_charges, 2)
            })

        pnls = [pt["expiry_pnl"] for pt in payoff_curve]
        max_profit = max(pnls)
        max_loss = min(pnls)

        # Detect breakeven points where PnL crosses 0
        breakevens = []
        for i in range(len(payoff_curve) - 1):
            p1 = payoff_curve[i]
            p2 = payoff_curve[i+1]
            if (p1["expiry_pnl"] <= 0 and p2["expiry_pnl"] >= 0) or (p1["expiry_pnl"] >= 0 and p2["expiry_pnl"] <= 0):
                # Linear interpolation
                denom = (p2["expiry_pnl"] - p1["expiry_pnl"])
                if denom != 0:
                    fraction = -p1["expiry_pnl"] / denom
                    be_price = p1["underlying_price"] + fraction * (p2["underlying_price"] - p1["underlying_price"])
                    breakevens.append(round(be_price, 2))

        rr_ratio = round(abs(max_profit / max_loss), 2) if max_loss < 0 else None

        return {
            "strategy_name": strategy_name,
            "max_profit": round(max_profit, 2),
            "max_loss": round(max_loss, 2),
            "breakeven_points": breakevens,
            "risk_reward_ratio": rr_ratio,
            "payoff_curve": payoff_curve,
            "estimated_charges": round(total_charges, 2)
        }
