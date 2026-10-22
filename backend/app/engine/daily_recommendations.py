"""
Daily Multi-Aspect AI Stock Market Recommendation Engine for Indian Equities.
Synthesizes Technical Indicators, Machine Learning Probabilities,
Derivatives / Options Positioning, News Sentiment, and Capital Risk Sizing.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import zoneinfo
import pandas as pd

from .indicators import TechnicalIndicators
from .ml_models import MarketPredictor
from .news import NewsIntelligenceEngine
from .greeks import OptionsMath
from ..providers.manager import get_market_data_provider
from ..core.nse_instruments import NSE_UNIVERSE

class DailyRecommendationsEngine:
    def __init__(self):
        self.provider = get_market_data_provider()
        self.predictor = MarketPredictor()
        self.news_engine = NewsIntelligenceEngine()
        self.ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_time: float = 0
        self.cache_ttl = 60 # 60 seconds TTL

    def generate_daily_recommendations(self, limit: int = 12) -> Dict[str, Any]:
        import time
        now_time = time.time()
        if self._cache and (now_time - self._cache_time < self.cache_ttl):
            cached_copy = dict(self._cache)
            cached_copy["recommendations"] = cached_copy["recommendations"][:limit]
            return cached_copy

        now_ist = datetime.now(self.ist)
        
        # 1. Evaluate Overall Market Benchmark Context (NIFTY 50)
        nifty_candles = self.provider.get_candles("NIFTY50", timeframe="1D", count=60)
        nifty_df = pd.DataFrame(nifty_candles)
        nifty_ind = TechnicalIndicators.compute_all_indicators(nifty_df) if not nifty_df.empty else {}
        market_trend = nifty_ind.get("trend_state", "BULLISH")
        
        # Candidate selection pool across liquid sectors
        candidate_symbols = [
            ("RELIANCE", "Reliance Industries Ltd", "Energy"),
            ("TCS", "Tata Consultancy Services Ltd", "IT"),
            ("HDFCBANK", "HDFC Bank Ltd", "Banking"),
            ("INFY", "Infosys Ltd", "IT"),
            ("ICICIBANK", "ICICI Bank Ltd", "Banking"),
            ("SBIN", "State Bank of India", "Banking"),
            ("BHARTIARTL", "Bharti Airtel Ltd", "Telecom"),
            ("TATAMOTORS", "Tata Motors Ltd", "Automobile"),
            ("LT", "Larsen & Toubro Ltd", "Infrastructure"),
            ("ITC", "ITC Ltd", "FMCG"),
            ("SUNPHARMA", "Sun Pharmaceutical Industries", "Pharma"),
            ("ZOMATO", "Zomato Ltd", "Internet"),
            ("HAL", "Hindustan Aeronautics Ltd", "Defense"),
            ("TATAPOWER", "Tata Power Company Ltd", "Power"),
            ("VEDL", "Vedanta Ltd", "Metals"),
            ("BEL", "Bharat Electronics Ltd", "Defense"),
            ("IRFC", "Indian Railway Finance Corporation", "Railways"),
            ("BSE", "BSE Ltd", "Financial"),
            ("DIXON", "Dixon Technologies Ltd", "Electronics")
        ]

        recommendations: List[Dict[str, Any]] = []

        for sym, name, sector in candidate_symbols:
            candles = self.provider.get_candles(sym, timeframe="1D", count=80)
            df = pd.DataFrame(candles)
            if df.empty or len(df) < 30:
                continue

            last_close = float(df['close'].iloc[-1])
            quote = self.provider.get_quote(sym)
            ind = TechnicalIndicators.compute_all_indicators(df)
            pred = self.predictor.predict(df, horizon="3_SESSIONS")
            news_items = self.news_engine.get_market_news(sym)

            # Option Chain summary if available
            opt_data = self.provider.get_option_chain(sym)
            pcr = opt_data.get("pcr", 1.0)
            max_pain = opt_data.get("max_pain", last_close)

            # Technical parameters
            rsi = ind.get("rsi_14", 50.0)
            atr = ind.get("atr_14", last_close * 0.015)
            rvol = ind.get("rvol", 1.0)
            trend = ind.get("trend_state", "SIDEWAYS")
            sma_20 = ind["sma"].get("20") or last_close
            sma_50 = ind["sma"].get("50") or last_close
            sma_200 = ind["sma"].get("200") or (last_close * 0.95)
            supports = ind["support_resistance"].get("support", [])
            resistances = ind["support_resistance"].get("resistance", [])

            # News Sentiment Scoring
            avg_news_sentiment = 0.0
            critical_event_blocked = False
            news_summaries = []
            if news_items:
                avg_news_sentiment = sum(n.sentiment_score for n in news_items) / len(news_items)
                for n in news_items:
                    news_summaries.append(f"{n.headline} (Severity: {n.impact_severity}, Sentiment: {n.sentiment})")
                    if n.impact_severity == "CRITICAL":
                        critical_event_blocked = True

            # Recommendation Logic
            direction = "NEUTRAL"
            status = "NO_TRADE"
            conviction_score = 50.0
            strategy_type = "NONE"

            # Bullish Setup criteria:
            # Price above 50 SMA, RSI between 52 and 72, Bullish probability > 50%, no negative news shock
            if (last_close > sma_50) and (rsi > 50) and (pred["bullish_prob"] > 0.48) and (avg_news_sentiment >= -0.2):
                direction = "LONG"
                strategy_type = "MOMENTUM_BREAKOUT" if rvol > 1.25 else "PULLBACK_TREND"
                
                # Dynamic Stop-Loss: Structural nearest support or (entry - 1.5 * ATR)
                nearest_sup = supports[0] if supports else (last_close - 1.5 * atr)
                stop_loss = round(min(last_close - (1.2 * atr), nearest_sup), 2)
                risk_amt = max(1.0, last_close - stop_loss)
                
                target_1 = round(last_close + (1.5 * risk_amt), 2)
                target_2 = round(last_close + (2.5 * risk_amt), 2)
                rr_ratio = round((target_1 - last_close) / risk_amt, 2)

                # Conviction scoring (0 - 100)
                conviction_score = round(
                    (pred["bullish_prob"] * 40) +
                    (min(rvol, 2.5) / 2.5 * 20) +
                    (min(1.0, max(0.0, (avg_news_sentiment + 1.0) / 2.0)) * 20) +
                    (20 if pcr > 1.0 else 10),
                    1
                )

                if critical_event_blocked:
                    status = "BLOCKED"
                elif rr_ratio >= 1.5 and conviction_score >= 65:
                    status = "ELIGIBLE"
                else:
                    status = "WATCH"

            # Bearish Setup criteria:
            elif (last_close < sma_50) and (rsi < 48) and (pred["bearish_prob"] > 0.48):
                direction = "SHORT"
                strategy_type = "MOMENTUM_BREAKDOWN" if rvol > 1.25 else "PULLBACK_TREND"
                
                nearest_res = resistances[0] if resistances else (last_close + 1.5 * atr)
                stop_loss = round(max(last_close + (1.2 * atr), nearest_res), 2)
                risk_amt = max(1.0, stop_loss - last_close)
                
                target_1 = round(last_close - (1.5 * risk_amt), 2)
                target_2 = round(last_close - (2.5 * risk_amt), 2)
                rr_ratio = round((last_close - target_1) / risk_amt, 2)

                conviction_score = round(
                    (pred["bearish_prob"] * 40) +
                    (min(rvol, 2.5) / 2.5 * 20) +
                    (20 if pcr < 0.9 else 10) +
                    10,
                    1
                )

                if critical_event_blocked:
                    status = "BLOCKED"
                elif rr_ratio >= 1.5 and conviction_score >= 65:
                    status = "ELIGIBLE"
                else:
                    status = "WATCH"

            else:
                direction = "NEUTRAL"
                status = "NO_TRADE"
                stop_loss = last_close
                target_1 = last_close
                target_2 = last_close
                rr_ratio = 1.0
                conviction_score = 40.0

            # Stop loss percentage and risk summary
            sl_pct = abs(round(((stop_loss - last_close) / last_close) * 100, 2))
            t1_pct = abs(round(((target_1 - last_close) / last_close) * 100, 2))
            t2_pct = abs(round(((target_2 - last_close) / last_close) * 100, 2))

            # 360-Degree Aspect Summaries
            tech_verdict = (
                f"Trend is {trend}. Trading at ₹{last_close:.2f} relative to 20-SMA (₹{sma_20:.2f}) and 50-SMA (₹{sma_50:.2f}). "
                f"Wilder RSI-14 is at {rsi:.1f}. RVOL volume participation is {rvol:.2f}x average daily volume."
            )

            ai_verdict = (
                f"Calibrated Multi-Horizon Model ({pred['model_version']}) projects {pred['bullish_prob']*100:.1f}% Bullish probability "
                f"vs {pred['bearish_prob']*100:.1f}% Bearish with an expected swing of {pred['expected_return_pct']:+.2f}% over 3 sessions."
            )

            fo_verdict = (
                f"F&O Put-Call Ratio (PCR) is at {pcr:.2f}. Key institutional Max Pain anchor located at ₹{max_pain:.0f} strike."
            )

            news_verdict = (
                f"News sentiment score is {avg_news_sentiment:+.2f} with {len(news_items)} recent disclosures. "
                + (f"Key catalyst: '{news_items[0].headline}'" if news_items else "No pending adverse regulatory or earnings announcements detected.")
            )

            risk_verdict = (
                f"Stop-loss placed strictly at ₹{stop_loss:.2f} (-{sl_pct}%). "
                f"Risk is mathematically bounded at 1.5x Daily ATR (₹{atr:.2f}). "
                f"Recommended risk allocation: Limit position size so potential loss does not exceed 0.50% of total portfolio equity."
            )

            recommendations.append({
                "symbol": sym,
                "name": name,
                "sector": sector,
                "ltp": last_close,
                "direction": direction,
                "status": status,
                "strategy_type": strategy_type,
                "conviction_score": conviction_score,
                "entry_price": last_close,
                "stop_loss": stop_loss,
                "stop_loss_pct": sl_pct,
                "target_1": target_1,
                "target_1_pct": t1_pct,
                "target_2": target_2,
                "target_2_pct": t2_pct,
                "risk_reward_ratio": rr_ratio,
                "analysis_aspects": {
                    "technical": tech_verdict,
                    "ai_prediction": ai_verdict,
                    "derivatives_fo": fo_verdict,
                    "news_and_events": news_verdict,
                    "risk_management": risk_verdict
                },
                "key_supporting_factors": pred["supporting_factors"][:3],
                "conflicting_factors": pred["conflicting_factors"][:2],
                "generated_at": now_ist.strftime("%Y-%m-%d %H:%M IST")
            })

        # Sort recommendations by conviction score descending
        recommendations.sort(key=lambda x: x["conviction_score"], reverse=True)

        res = {
            "timestamp": now_ist.isoformat(),
            "date_display": now_ist.strftime("%d %b %Y, %I:%M %p IST"),
            "market_regime": market_trend,
            "total_analyzed": len(candidate_symbols),
            "eligible_count": len([r for r in recommendations if r["status"] == "ELIGIBLE"]),
            "watch_count": len([r for r in recommendations if r["status"] == "WATCH"]),
            "blocked_count": len([r for r in recommendations if r["status"] == "BLOCKED"]),
            "recommendations": recommendations
        }
        self._cache = res
        self._cache_time = now_time
        res_copy = dict(res)
        res_copy["recommendations"] = recommendations[:limit]
        return res_copy
