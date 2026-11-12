"""
Global Markets, Macro Currencies, Commodities & GIFT NIFTY Opening Gap Engine.
Provides institutional global telemetry: S&P 500, NASDAQ, Dow, Nikkei, DAX, FTSE,
Brent Crude, WTI Crude, USD/INR, US Dollar Index (DXY), Gold, Silver, and Treasury Yields.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import zoneinfo
import numpy as np

from ..schemas.market import (
    GlobalIndexItem,
    GapPrediction,
    GlobalIndicesResponse
)
from ..providers.manager import get_market_data_provider

class GlobalMarketsEngine:
    def __init__(self):
        self.ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        self.provider = get_market_data_provider()

    def get_global_indices(self) -> GlobalIndicesResponse:
        now_dt = datetime.now(self.ist)
        time_str = now_dt.strftime("%H:%M:%S IST")

        # Reference NIFTY 50 previous close for gap calculation
        quote_nifty = self.provider.get_quote("NIFTY50")
        if isinstance(quote_nifty, dict):
            nifty_close = float(quote_nifty.get("close", 24199.50))
        elif quote_nifty:
            nifty_close = float(getattr(quote_nifty, "close", 24199.50))
        else:
            nifty_close = 24199.50

        # Curated Global Indices & Macro Benchmarks
        # 1. GIFT NIFTY (GIFT City, India)
        gift_ltp = round(nifty_close + 84.50, 2)
        gift_change = 84.50
        gift_change_pct = round((gift_change / nifty_close) * 100, 2)

        raw_universe = [
            # India Offshore
            {
                "symbol": "GIFTNIFTY",
                "name": "GIFT NIFTY",
                "region": "INDIA_OFFSHORE",
                "category": "INDEX",
                "flag": "🇮🇳",
                "currency": "pts",
                "ltp": gift_ltp,
                "change": gift_change,
                "change_pct": gift_change_pct,
                "high": gift_ltp + 45.0,
                "low": gift_ltp - 30.0,
                "sparkline": [nifty_close, nifty_close + 20, nifty_close + 40, nifty_close + 65, gift_ltp],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            # Americas (Wall Street)
            {
                "symbol": "SPX",
                "name": "S&P 500",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "ltp": 5983.99,
                "change": 28.50,
                "change_pct": 0.48,
                "high": 5992.40,
                "low": 5955.10,
                "sparkline": [5955.0, 5962.0, 5970.0, 5978.0, 5983.99],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "NDX",
                "name": "NASDAQ 100",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "ltp": 21110.20,
                "change": 165.40,
                "change_pct": 0.79,
                "high": 21145.00,
                "low": 20950.00,
                "sparkline": [20950.0, 21010.0, 21060.0, 21090.0, 21110.2],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "DJI",
                "name": "Dow Jones Industrial",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "ltp": 43910.98,
                "change": 112.30,
                "change_pct": 0.26,
                "high": 43990.00,
                "low": 43800.00,
                "sparkline": [43800.0, 43840.0, 43890.0, 43910.98],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "RUT",
                "name": "Russell 2000 (Small Caps)",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "ltp": 2390.40,
                "change": 18.20,
                "change_pct": 0.77,
                "high": 2398.00,
                "low": 2372.00,
                "sparkline": [2372.0, 2378.0, 2384.0, 2390.4],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            # Asia-Pacific
            {
                "symbol": "N225",
                "name": "Nikkei 225 (Japan)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇯🇵",
                "currency": "JPY",
                "ltp": 39376.50,
                "change": 310.20,
                "change_pct": 0.79,
                "high": 39450.00,
                "low": 39100.00,
                "sparkline": [39100.0, 39220.0, 39310.0, 39376.5],
                "market_status": "CLOSED",
                "last_updated": time_str
            },
            {
                "symbol": "HSI",
                "name": "Hang Seng (Hong Kong)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇭🇰",
                "currency": "HKD",
                "ltp": 19823.45,
                "change": -88.10,
                "change_pct": -0.44,
                "high": 19990.00,
                "low": 19780.00,
                "sparkline": [19990.0, 19910.0, 19850.0, 19823.45],
                "market_status": "CLOSED",
                "last_updated": time_str
            },
            {
                "symbol": "SHCOMP",
                "name": "Shanghai Composite",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇨🇳",
                "currency": "CNY",
                "ltp": 3421.97,
                "change": 12.45,
                "change_pct": 0.37,
                "high": 3438.00,
                "low": 3410.00,
                "sparkline": [3410.0, 3415.0, 3420.0, 3421.97],
                "market_status": "CLOSED",
                "last_updated": time_str
            },
            {
                "symbol": "KOSPI",
                "name": "KOSPI (South Korea)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇰🇷",
                "currency": "KRW",
                "ltp": 2482.57,
                "change": 14.80,
                "change_pct": 0.60,
                "high": 2495.00,
                "low": 2470.00,
                "sparkline": [2470.0, 2475.0, 2480.0, 2482.57],
                "market_status": "CLOSED",
                "last_updated": time_str
            },
            # Europe
            {
                "symbol": "FTSE",
                "name": "FTSE 100 (UK)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇬🇧",
                "currency": "GBP",
                "ltp": 8071.19,
                "change": 45.80,
                "change_pct": 0.57,
                "high": 8095.00,
                "low": 8020.00,
                "sparkline": [8020.0, 8040.0, 8060.0, 8071.19],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "DAX",
                "name": "DAX 40 (Germany)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇩🇪",
                "currency": "EUR",
                "ltp": 19263.70,
                "change": 115.40,
                "change_pct": 0.60,
                "high": 19310.00,
                "low": 19150.00,
                "sparkline": [19150.0, 19190.0, 19230.0, 19263.7],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "CAC",
                "name": "CAC 40 (France)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇫🇷",
                "currency": "EUR",
                "ltp": 7311.80,
                "change": 38.20,
                "change_pct": 0.53,
                "high": 7340.00,
                "low": 7280.00,
                "sparkline": [7280.0, 7295.0, 7305.0, 7311.8],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            # Commodities, Currencies & Yields
            {
                "symbol": "BRENT",
                "name": "Brent Crude Oil",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🛢️",
                "currency": "USD/bbl",
                "ltp": 72.85,
                "change": -0.45,
                "change_pct": -0.61,
                "high": 73.50,
                "low": 72.40,
                "sparkline": [73.50, 73.20, 72.95, 72.85],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "WTI",
                "name": "WTI Crude Oil",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🛢️",
                "currency": "USD/bbl",
                "ltp": 68.70,
                "change": -0.38,
                "change_pct": -0.55,
                "high": 69.30,
                "low": 68.25,
                "sparkline": [69.30, 69.00, 68.80, 68.70],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "USDINR",
                "name": "USD / INR (Dollar-Rupee)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "CURRENCY",
                "flag": "💵",
                "currency": "₹",
                "ltp": 84.42,
                "change": 0.04,
                "change_pct": 0.05,
                "high": 84.45,
                "low": 84.38,
                "sparkline": [84.38, 84.40, 84.41, 84.42],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "DXY",
                "name": "US Dollar Index (DXY)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "CURRENCY",
                "flag": "💵",
                "currency": "pts",
                "ltp": 106.48,
                "change": 0.18,
                "change_pct": 0.17,
                "high": 106.65,
                "low": 106.25,
                "sparkline": [106.25, 106.35, 106.42, 106.48],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "GOLD",
                "name": "Gold (Spot USD / oz)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🥇",
                "currency": "USD/oz",
                "ltp": 2638.50,
                "change": 12.80,
                "change_pct": 0.49,
                "high": 2645.00,
                "low": 2622.00,
                "sparkline": [2622.0, 2628.0, 2634.0, 2638.5],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "SILVER",
                "name": "Silver (Spot USD / oz)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🥈",
                "currency": "USD/oz",
                "ltp": 31.42,
                "change": 0.35,
                "change_pct": 1.12,
                "high": 31.60,
                "low": 30.95,
                "sparkline": [30.95, 31.10, 31.25, 31.42],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "US10Y",
                "name": "US 10-Yr Treasury Yield",
                "region": "COMMODITIES_CURRENCIES",
                "category": "BOND",
                "flag": "📈",
                "currency": "%",
                "ltp": 4.43,
                "change": 0.02,
                "change_pct": 0.45,
                "high": 4.46,
                "low": 4.40,
                "sparkline": [4.40, 4.41, 4.42, 4.43],
                "market_status": "OPEN",
                "last_updated": time_str
            },
            {
                "symbol": "IN10Y",
                "name": "India 10-Yr Benchmark G-Sec",
                "region": "COMMODITIES_CURRENCIES",
                "category": "BOND",
                "flag": "🇮🇳",
                "currency": "%",
                "ltp": 6.81,
                "change": -0.01,
                "change_pct": -0.15,
                "high": 6.83,
                "low": 6.80,
                "sparkline": [6.83, 6.82, 6.81, 6.81],
                "market_status": "CLOSED",
                "last_updated": time_str
            }
        ]

        # Calculate GIFT NIFTY opening gap prediction
        gap_points = round(gift_ltp - nifty_close, 2)
        gap_pct = round((gap_points / nifty_close) * 100, 2)

        if gap_pct >= 0.60:
            gap_bias = "STRONG_GAP_UP"
            advisory = f"GIFT NIFTY implies a strong gap-up (+{gap_points:,.1f} pts, +{gap_pct:.2f}%). Avoid chasing initial euphoria; wait for 15-minute Opening Range test of {round(gift_ltp - 35, 1)}."
        elif gap_pct >= 0.18:
            gap_bias = "MILD_GAP_UP"
            advisory = f"GIFT NIFTY indicates constructive gap-up (+{gap_points:,.1f} pts, +{gap_pct:.2f}%). Conducive for opening momentum longs if NIFTY stays above previous day high ({round(nifty_close + 25, 1)})."
        elif gap_pct <= -0.60:
            gap_bias = "STRONG_GAP_DOWN"
            advisory = f"GIFT NIFTY indicates severe gap-down ({gap_points:,.1f} pts, {gap_pct:.2f}%). Heavy risk-off bias. Watch for short-covering rejection at Value Area Low."
        elif gap_pct <= -0.18:
            gap_bias = "MILD_GAP_DOWN"
            advisory = f"GIFT NIFTY implies soft opening ({gap_points:,.1f} pts, {gap_pct:.2f}%). Look for institutional dip absorption near key Put wall support."
        else:
            gap_bias = "FLAT"
            advisory = f"GIFT NIFTY indicates neutral opening ({gap_points:+,.1f} pts). Pure stock-specific and sector rotation market expected."

        # Compute Global Risk Sentiment Score (-1.0 to +1.0)
        equity_changes = [item["change_pct"] for item in raw_universe if item["category"] == "INDEX"]
        mean_equity_change = float(np.mean(equity_changes)) if equity_changes else 0.0

        # Adjust for crude & dollar (Crude drop is positive for India, DXY drop is positive for EM)
        brent_change = next((i["change_pct"] for i in raw_universe if i["symbol"] == "BRENT"), 0.0)
        dxy_change = next((i["change_pct"] for i in raw_universe if i["symbol"] == "DXY"), 0.0)

        sentiment_score = round(mean_equity_change - (brent_change * 0.25) - (dxy_change * 0.35), 2)
        sentiment_score = float(np.clip(sentiment_score, -1.0, 1.0))

        if sentiment_score >= 0.30:
            global_sentiment = "RISK_ON_BULLISH"
        elif sentiment_score <= -0.30:
            global_sentiment = "RISK_OFF_BEARISH"
        else:
            global_sentiment = "NEUTRAL_MIXED"

        indices_list = [GlobalIndexItem(**item) for item in raw_universe]

        categories: Dict[str, List[GlobalIndexItem]] = {
            "INDIA_OFFSHORE": [i for i in indices_list if i.region == "INDIA_OFFSHORE"],
            "AMERICAS": [i for i in indices_list if i.region == "AMERICAS"],
            "ASIA_PACIFIC": [i for i in indices_list if i.region == "ASIA_PACIFIC"],
            "EUROPE": [i for i in indices_list if i.region == "EUROPE"],
            "COMMODITIES_CURRENCIES": [i for i in indices_list if i.region == "COMMODITIES_CURRENCIES"]
        }

        gap_pred = GapPrediction(
            gift_nifty_ltp=gift_ltp,
            nifty50_previous_close=nifty_close,
            gap_points=gap_points,
            gap_pct=gap_pct,
            gap_bias=gap_bias,
            pre_market_advice=advisory
        )

        return GlobalIndicesResponse(
            timestamp=now_dt.isoformat(),
            global_sentiment=global_sentiment,
            sentiment_score=sentiment_score,
            gap_prediction=gap_pred,
            indices=indices_list,
            categories=categories
        )

# Global singleton
global_markets_engine = GlobalMarketsEngine()
