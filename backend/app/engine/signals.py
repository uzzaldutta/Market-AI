"""
Explainable Recommendation and Trade Signal Generation Engine.
Evaluates multi-factor setup rules, risk-reward ratios, and market constraints
to generate ELIGIBLE, WATCH, BLOCKED, or NO_TRADE statuses with transparent reason codes.
"""

from typing import Dict, List, Any
import pandas as pd
from .indicators import TechnicalIndicators
from .ml_models import MarketPredictor

class SignalEngine:
    def __init__(self):
        self.predictor = MarketPredictor()

    def generate_signal(self, symbol: str, df: pd.DataFrame, news_risk: bool = False) -> Dict[str, Any]:
        """Generates signal with explicit state machine and risk targets."""
        if len(df) < 30:
            return {
                "id": f"SIG-{symbol}-INSUFFICIENT",
                "symbol": symbol,
                "direction": "NEUTRAL",
                "status": "NO_TRADE",
                "strategy_type": "NONE",
                "timeframe": "SWING",
                "entry_price": 0.0,
                "stop_loss": 0.0,
                "target_1": 0.0,
                "target_2": 0.0,
                "risk_reward_ratio": 0.0,
                "reason_codes": [],
                "block_reasons": ["INSUFFICIENT_HISTORICAL_DATA"],
                "generated_at": pd.Timestamp.now().isoformat()
            }

        last_close = float(df['close'].iloc[-1])
        indicators = TechnicalIndicators.compute_all_indicators(df)
        prediction = self.predictor.predict(df, horizon="3_SESSIONS")

        rsi = indicators["rsi_14"]
        trend = indicators["trend_state"]
        rvol = indicators["rvol"]
        atr = indicators["atr_14"]
        sr = indicators["support_resistance"]

        reason_codes = []
        block_reasons = []

        # Check for event risk blocks
        if news_risk:
            block_reasons.append("HIGH_EVENT_RISK_ANNOUNCEMENT_PENDING")

        # Check for low liquidity / RVOL blocks
        if rvol < 0.6:
            block_reasons.append("LOW_RELATIVE_VOLUME_BELOW_0.6X")

        direction = "NEUTRAL"
        strategy_type = "NONE"
        status = "NO_TRADE"
        entry_price = last_close
        stop_loss = last_close
        target_1 = last_close
        target_2 = last_close
        rr_ratio = 1.0

        # Bullish Setups
        if trend in ["STRONG_BULLISH", "BULLISH"] and prediction["bullish_prob"] > 0.52:
            direction = "LONG"
            strategy_type = "MOMENTUM_BREAKOUT" if rvol > 1.2 else "PULLBACK_TREND"
            
            # Risk/Reward structure using ATR and S/R
            nearest_support = sr["support"][0] if sr["support"] else (last_close - 1.5 * atr)
            stop_loss = round(min(last_close - atr, nearest_support), 2)
            risk = max(1.0, last_close - stop_loss)
            
            target_1 = round(last_close + (1.5 * risk), 2)
            target_2 = round(last_close + (2.5 * risk), 2)
            rr_ratio = round((target_1 - last_close) / risk, 2)
            
            reason_codes.append(f"TREND_CONFIRMED_{trend}")
            reason_codes.append(f"AI_BULLISH_PROBABILITY_{prediction['bullish_prob']*100:.1f}%")
            if rvol > 1.2:
                reason_codes.append(f"VOLUME_EXPANSION_{rvol:.1f}X")
            if rsi > 50 and rsi < 70:
                reason_codes.append(f"RSI_HEALTHY_ACCELERATION_{rsi:.1f}")

        # Bearish Setups
        elif trend in ["STRONG_BEARISH", "BEARISH"] and prediction["bearish_prob"] > 0.52:
            direction = "SHORT"
            strategy_type = "MOMENTUM_BREAKDOWN" if rvol > 1.2 else "PULLBACK_TREND"
            
            nearest_res = sr["resistance"][0] if sr["resistance"] else (last_close + 1.5 * atr)
            stop_loss = round(max(last_close + atr, nearest_res), 2)
            risk = max(1.0, stop_loss - last_close)
            
            target_1 = round(last_close - (1.5 * risk), 2)
            target_2 = round(last_close - (2.5 * risk), 2)
            rr_ratio = round((last_close - target_1) / risk, 2)
            
            reason_codes.append(f"TREND_CONFIRMED_{trend}")
            reason_codes.append(f"AI_BEARISH_PROBABILITY_{prediction['bearish_prob']*100:.1f}%")
            if rvol > 1.2:
                reason_codes.append(f"VOLUME_EXPANSION_{rvol:.1f}X")

        # Determine Final State
        if direction == "NEUTRAL":
            status = "NO_TRADE"
            block_reasons.append("MARKET_IN_SIDEWAYS_CHOP_NO_EDGE")
        elif len(block_reasons) > 0:
            status = "BLOCKED"
        elif rr_ratio < 1.4:
            status = "WATCH"
            reason_codes.append("FAVORABLE_SETUP_PENDING_BETTER_RISK_REWARD_ENTRY")
        else:
            status = "ELIGIBLE"

        return {
            "id": f"SIG-{symbol}-{int(pd.Timestamp.now().timestamp())}",
            "symbol": symbol,
            "direction": direction,
            "status": status,
            "strategy_type": strategy_type,
            "timeframe": "SWING",
            "entry_price": round(entry_price, 2),
            "stop_loss": round(stop_loss, 2),
            "target_1": round(target_1, 2),
            "target_2": round(target_2, 2),
            "risk_reward_ratio": rr_ratio,
            "reason_codes": reason_codes,
            "block_reasons": block_reasons,
            "generated_at": pd.Timestamp.now().isoformat()
        }
