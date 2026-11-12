"""
Stock Duel Engine: Side-by-Side Peer Comparison & Winner Determination.
Pits two equities head-to-head across DCF Valuation, Moat Strength,
Return on Capital, Solvency, and Institutional Momentum to declare a mathematically superior pick.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import zoneinfo

from ..schemas.market import StockDuelResponse, StockDuelMetric
from .oracle_valuation import oracle_valuation_engine

class StockDuelEngine:
    def __init__(self):
        self.ist = zoneinfo.ZoneInfo("Asia/Kolkata")

    def duel(self, symbol_a: str, symbol_b: str) -> StockDuelResponse:
        now_dt = datetime.now(self.ist)
        res_a = oracle_valuation_engine.analyze_stock(symbol_a)
        res_b = oracle_valuation_engine.analyze_stock(symbol_b)

        # Build Comparative Metrics
        metrics: List[StockDuelMetric] = []

        # 1. DCF Margin of Safety
        mos_a = res_a.margin_of_safety_pct
        mos_b = res_b.margin_of_safety_pct
        metrics.append(StockDuelMetric(
            metric_name="Margin of Safety (DCF)",
            val_a=mos_a,
            val_b=mos_b,
            unit="%",
            winner="A" if mos_a > mos_b else "B" if mos_b > mos_a else "TIE",
            description="Percentage discount between intrinsic fair value and current market price"
        ))

        # 2. Economic Moat Score
        moat_a = res_a.pillar_buffett.moat_score
        moat_b = res_b.pillar_buffett.moat_score
        metrics.append(StockDuelMetric(
            metric_name="Economic Moat Score",
            val_a=moat_a,
            val_b=moat_b,
            unit="/100",
            winner="A" if moat_a > moat_b else "B" if moat_b > moat_a else "TIE",
            description="Durable pricing power, switching costs, and brand compounding advantage"
        ))

        # 3. ROIC (Return on Invested Capital)
        roic_a = res_a.pillar_buffett.roic_pct
        roic_b = res_b.pillar_buffett.roic_pct
        metrics.append(StockDuelMetric(
            metric_name="ROIC (Capital Efficiency)",
            val_a=roic_a,
            val_b=roic_b,
            unit="%",
            winner="A" if roic_a > roic_b else "B" if roic_b > roic_a else "TIE",
            description="Cash return generated for every rupee invested in operations"
        ))

        # 4. Piotroski F-Score (Accounting Quality)
        f_a = float(res_a.pillar_graham.piotroski_f_score)
        f_b = float(res_b.pillar_graham.piotroski_f_score)
        metrics.append(StockDuelMetric(
            metric_name="Piotroski F-Score",
            val_a=f_a,
            val_b=f_b,
            unit="/9",
            winner="A" if f_a > f_b else "B" if f_b > f_a else "TIE",
            description="Fundamental health checklist covering profitability, leverage, and efficiency"
        ))

        # 5. Debt to Equity (Lower is better)
        de_a = res_a.pillar_buffett.debt_to_equity
        de_b = res_b.pillar_buffett.debt_to_equity
        metrics.append(StockDuelMetric(
            metric_name="Debt / Equity (Lower is Better)",
            val_a=de_a,
            val_b=de_b,
            unit="x",
            winner="A" if de_a < de_b else "B" if de_b < de_a else "TIE",
            description="Solvency cushion and balance sheet leverage protection"
        ))

        # 6. PEG Ratio (Lower is better)
        peg_a = res_a.pillar_lynch.peg_ratio
        peg_b = res_b.pillar_lynch.peg_ratio
        metrics.append(StockDuelMetric(
            metric_name="Peter Lynch PEG Ratio",
            val_a=peg_a,
            val_b=peg_b,
            unit="x",
            winner="A" if peg_a < peg_b else "B" if peg_b < peg_a else "TIE",
            description="Price/Earnings relative to historical 3-year EPS growth rate"
        ))

        # 7. Smart Money FII Inflows
        fii_a = float(res_a.pillar_druckenmiller.smart_money_streak_days)
        fii_b = float(res_b.pillar_druckenmiller.smart_money_streak_days)
        metrics.append(StockDuelMetric(
            metric_name="Institutional Streak",
            val_a=fii_a,
            val_b=fii_b,
            unit="Days",
            winner="A" if fii_a > fii_b else "B" if fii_b > fii_a else "TIE",
            description="Consecutive days of net institutional cash and derivative accumulation"
        ))

        # Tally scores
        score_a_wins = sum(1 for m in metrics if m.winner == "A")
        score_b_wins = sum(1 for m in metrics if m.winner == "B")

        if res_a.composite_score > res_b.composite_score:
            winner_sym = res_a.symbol
            diff = res_a.composite_score - res_b.composite_score
            winner_reason = (
                f"{res_a.symbol} outperforms {res_b.symbol} across {score_a_wins} of {len(metrics)} primary institutional vectors. "
                f"Superior composite score ({res_a.composite_score:.1f} vs {res_b.composite_score:.1f}) driven by stronger "
                f"Margin of Safety ({res_a.margin_of_safety_pct:+.1f}%) and durable ROIC ({res_a.pillar_buffett.roic_pct:.1f}%)."
            )
        else:
            winner_sym = res_b.symbol
            diff = res_b.composite_score - res_a.composite_score
            winner_reason = (
                f"{res_b.symbol} outperforms {res_a.symbol} across {score_b_wins} of {len(metrics)} primary institutional vectors. "
                f"Superior composite score ({res_b.composite_score:.1f} vs {res_a.composite_score:.1f}) driven by stronger "
                f"Margin of Safety ({res_b.margin_of_safety_pct:+.1f}%) and capital efficiency ({res_b.pillar_buffett.roic_pct:.1f}%)."
            )

        return StockDuelResponse(
            symbol_a=res_a.symbol,
            name_a=res_a.name,
            ltp_a=res_a.ltp,
            composite_score_a=res_a.composite_score,
            verdict_badge_a=res_a.master_verdict_badge,
            symbol_b=res_b.symbol,
            name_b=res_b.name,
            ltp_b=res_b.ltp,
            composite_score_b=res_b.composite_score,
            verdict_badge_b=res_b.master_verdict_badge,
            winner_symbol=winner_sym,
            winner_reason=winner_reason,
            metrics=metrics,
            timestamp=now_dt.isoformat()
        )

# Global singleton
stock_duel_engine = StockDuelEngine()
