import math
from datetime import datetime
from typing import List, Dict, Any
from ..schemas.market import (
    PreTradeCheckRequest,
    PreTradeCheckResponse,
    PreTradeCheckItem,
    FrictionTaxBreakdown,
    OrderSide
)
from .global_markets import global_markets_engine

class InstitutionalPreTradeEngine:
    """
    Evaluates pre-flight risk checks, position sizing, risk-to-reward viability,
    and statutory Indian exchange friction before authorizing paper trade execution.
    """

    def validate_trade(self, req: PreTradeCheckRequest) -> PreTradeCheckResponse:
        qty = max(1, req.quantity)
        entry = req.entry_price
        sl = req.stop_loss
        tp = req.target_price
        equity = max(10000.0, req.account_equity)

        order_val = round(qty * entry, 2)
        risk_per_share = abs(entry - sl)
        reward_per_share = abs(tp - entry)

        risk_inr = round(risk_per_share * qty, 2)
        reward_inr = round(reward_per_share * qty, 2)

        risk_pct = round((risk_inr / equity) * 100.0, 2)
        rr_ratio = round(reward_per_share / max(0.01, risk_per_share), 2)

        # 1% and 2% Sizing calculations
        recommended_1pct_qty = max(1, int((equity * 0.01) / max(0.01, risk_per_share)))
        recommended_2pct_qty = max(1, int((equity * 0.02) / max(0.01, risk_per_share)))

        concentration_pct = round((order_val / equity) * 100.0, 2)

        # Statutory Indian Exchange Friction Taxes
        # STT Calculation
        if req.instrument_type == "EQUITY":
            if req.product_type == "MIS":
                stt = round(order_val * 0.00025, 2) # Intraday: 0.025% on sell
            else:
                stt = round(order_val * 0.001, 2) # Delivery: 0.1% on buy & sell
        elif req.instrument_type == "FUTURES":
            stt = round(order_val * 0.000125, 2) # Futures: 0.0125% on sell
        else:
            stt = round(order_val * 0.000625, 2) # Options: 0.0625% on premium

        exch_turnover = round(order_val * 0.0000345, 2)
        sebi_charges = round(order_val * 0.000001, 2)
        stamp_duty = round(order_val * 0.00015, 2) if req.side == OrderSide.BUY else 0.0
        brokerage = 20.0
        gst = round((brokerage + exch_turnover + sebi_charges) * 0.18, 2)

        total_taxes = round(stt + exch_turnover + sebi_charges + stamp_duty + gst + brokerage, 2)
        breakeven_pts = round(total_taxes / qty, 2)

        friction = FrictionTaxBreakdown(
            stt=stt,
            exchange_turnover_fee=exch_turnover,
            sebi_charges=sebi_charges,
            stamp_duty=stamp_duty,
            gst=gst,
            total_taxes_and_charges=total_taxes,
            breakeven_points_needed=breakeven_pts
        )

        # Macro Confluence Check
        macro = global_markets_engine.get_global_indices()
        sentiment = macro.global_sentiment

        if req.side == OrderSide.BUY:
            if sentiment == "RISK_ON_BULLISH":
                confluence = "BULLISH_CONFLUENCE"
            elif sentiment == "RISK_OFF_BEARISH":
                confluence = "COUNTER_TREND_HEADWIND"
            else:
                confluence = "NEUTRAL"
        else:
            if sentiment == "RISK_OFF_BEARISH":
                confluence = "BEARISH_CONFLUENCE"
            elif sentiment == "RISK_ON_BULLISH":
                confluence = "COUNTER_TREND_HEADWIND"
            else:
                confluence = "NEUTRAL"

        # The 6 Institutional Checks
        checks: List[PreTradeCheckItem] = []

        # Check 1: 1% Capital at Risk
        if risk_pct <= 1.5:
            checks.append(PreTradeCheckItem(
                name="Capital-at-Risk Sizing (1% Rule)",
                status="PASS",
                value_str=f"{risk_pct}% of equity (₹{risk_inr:,.0f})",
                description="Risk is strictly calibrated within professional institutional limits."
            ))
        elif risk_pct <= 2.5:
            checks.append(PreTradeCheckItem(
                name="Capital-at-Risk Sizing (1% Rule)",
                status="WARN",
                value_str=f"{risk_pct}% of equity (₹{risk_inr:,.0f})",
                description="Risk is elevated above the standard 1% baseline. Recommend downsizing."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Capital-at-Risk Sizing (1% Rule)",
                status="FAIL",
                value_str=f"{risk_pct}% of equity (₹{risk_inr:,.0f})",
                description="Excessive capital exposure! Violates drawdown survival rule."
            ))

        # Check 2: Risk-to-Reward Ratio
        if rr_ratio >= 2.0:
            checks.append(PreTradeCheckItem(
                name="Risk-to-Reward Ratio",
                status="PASS",
                value_str=f"1 : {rr_ratio:.2f}",
                description="Favorable mathematical expectancy exceeding the minimum 1:2.0 target."
            ))
        elif rr_ratio >= 1.5:
            checks.append(PreTradeCheckItem(
                name="Risk-to-Reward Ratio",
                status="WARN",
                value_str=f"1 : {rr_ratio:.2f}",
                description="Marginal reward. Setup provides less than 2x reward for risk undertaken."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Risk-to-Reward Ratio",
                status="FAIL",
                value_str=f"1 : {rr_ratio:.2f}",
                description="Unfavorable risk-reward profile. Inadequate upside potential."
            ))

        # Check 3: Portfolio Concentration
        if concentration_pct <= 20.0:
            checks.append(PreTradeCheckItem(
                name="Portfolio Concentration Limit",
                status="PASS",
                value_str=f"{concentration_pct}% of portfolio",
                description="Position size is well within the 20% single-stock diversification ceiling."
            ))
        elif concentration_pct <= 35.0:
            checks.append(PreTradeCheckItem(
                name="Portfolio Concentration Limit",
                status="WARN",
                value_str=f"{concentration_pct}% of portfolio",
                description="High asset concentration. Over 20% of account equity committed to one ticker."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Portfolio Concentration Limit",
                status="FAIL",
                value_str=f"{concentration_pct}% of portfolio",
                description="Severe over-concentration (>35% of total account)! High single-asset risk."
            ))

        # Check 4: Macro & Market Confluence
        if confluence in ["BULLISH_CONFLUENCE", "BEARISH_CONFLUENCE"]:
            checks.append(PreTradeCheckItem(
                name="Market Regime Confluence",
                status="PASS",
                value_str=f"{confluence} ({sentiment})",
                description="Trade direction aligns directly with global macro indices and GIFT NIFTY gap bias."
            ))
        elif confluence == "NEUTRAL":
            checks.append(PreTradeCheckItem(
                name="Market Regime Confluence",
                status="WARN",
                value_str="NEUTRAL MARKET",
                description="Market sentiment is balanced. Stock-specific alpha required."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Market Regime Confluence",
                status="WARN",
                value_str="COUNTER-TREND HEADWIND",
                description="Entering counter to broader global market momentum. Tighten trailing stops."
            ))

        # Check 5: Exchange Friction & Breakeven Ticks
        if breakeven_pts <= (risk_per_share * 0.12):
            checks.append(PreTradeCheckItem(
                name="Statutory Taxes & Exchange Friction",
                status="PASS",
                value_str=f"₹{total_taxes:.2f} (Breakeven +₹{breakeven_pts:.2f})",
                description="Exchange friction and STT represent under 12% of total risk distance."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Statutory Taxes & Exchange Friction",
                status="WARN",
                value_str=f"₹{total_taxes:.2f} (Breakeven +₹{breakeven_pts:.2f})",
                description="Exchange friction consumes a noticeable portion of stop-loss buffer."
            ))

        # Check 6: Stop-Loss Invalidation Discipline
        is_sl_valid = (req.side == OrderSide.BUY and sl < entry) or (req.side == OrderSide.SELL and sl > entry)
        if is_sl_valid and sl > 0:
            checks.append(PreTradeCheckItem(
                name="Pre-Committed Stop Loss Discipline",
                status="PASS",
                value_str=f"₹{sl:.2f} ({risk_per_share:.2f} pts invalidation)",
                description="Clear objective invalidation level defined before trade execution."
            ))
        else:
            checks.append(PreTradeCheckItem(
                name="Pre-Committed Stop Loss Discipline",
                status="FAIL",
                value_str="INVALID STOP LOSS",
                description="Stop loss must be placed below entry price for Buy orders and above for Sell orders."
            ))

        pass_count = sum(1 for c in checks if c.status == "PASS")
        fail_count = sum(1 for c in checks if c.status == "FAIL")

        if fail_count == 0 and pass_count >= 5:
            overall = "INSTITUTIONAL_READY"
            advisory = "Setup satisfies all institutional risk, sizing, and expectancy standards. Fully cleared for execution."
        elif fail_count > 0:
            overall = "BLOCKED_HIGH_RISK"
            advisory = "Trade flagged with high risk violations (sizing, stop-loss or R:R). Adjustment strongly recommended."
        else:
            overall = "ACCEPTABLE_WITH_CAUTION"
            advisory = "Setup is acceptable but contains minor warning flags (sizing or market confluence). Proceed with awareness."

        return PreTradeCheckResponse(
            symbol=req.symbol,
            side=req.side.value if hasattr(req.side, 'value') else str(req.side),
            order_value=order_val,
            risk_amount_inr=risk_inr,
            risk_pct_of_equity=risk_pct,
            reward_amount_inr=reward_inr,
            risk_reward_ratio=rr_ratio,
            recommended_1pct_quantity=recommended_1pct_qty,
            recommended_2pct_quantity=recommended_2pct_qty,
            portfolio_concentration_pct=concentration_pct,
            confluence_bias=confluence,
            friction=friction,
            checks=checks,
            readiness_score=pass_count,
            overall_status=overall,
            advisory_message=advisory,
            timestamp=datetime.now().isoformat()
        )

pretrade_engine = InstitutionalPreTradeEngine()
