"""
Global Markets, Macro Currencies, Commodities & GIFT NIFTY Real-Time Telemetry Engine.
Provides institutional multi-asset telemetry: S&P 500, NASDAQ, Dow, Russell 2000,
Nikkei 225, Hang Seng, Shanghai, KOSPI, FTSE 100, DAX 40, CAC 40,
Brent Crude, WTI Crude, USD/INR, US Dollar Index (DXY), Gold, Silver, and Treasury Yields.
Features live stochastic micro-tick price diffusion, multi-timeframe candlestick generation,
Dalal Street macro-correlation matrices, and institutional AI copilot chat.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import zoneinfo
import numpy as np
import random
import math

from ..schemas.market import (
    GlobalIndexItem,
    GapPrediction,
    GlobalIndicesResponse,
    GlobalIndexDetailResponse,
    GlobalIndexChatResponse,
    CandleItem
)
from ..providers.manager import get_market_data_provider

class GlobalMarketsEngine:
    def __init__(self):
        self.ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        self.provider = get_market_data_provider()

        # Master static reference definitions & metadata
        self.meta_specs: Dict[str, Dict[str, Any]] = {
            "GIFTNIFTY": {
                "name": "GIFT NIFTY",
                "region": "INDIA_OFFSHORE",
                "category": "INDEX",
                "flag": "🇮🇳",
                "currency": "pts",
                "exchange_name": "NSE IX (GIFT City, Gujarat)",
                "trading_hours_ist": "06:30 AM – 03:40 AM IST (21 hrs continuous)",
                "base_price": 25380.0,
                "prev_close": 25295.5,
                "tick_size": 1.0,
                "week_52_high": 26277.0,
                "week_52_low": 21281.0,
                "nifty_correlation": 0.96,
                "banknifty_correlation": 0.88,
                "impact_on_india": "Direct 1:1 forward pricing benchmark for NIFTY 50 cash open. Predicts opening gaps, institutional liquidity flows, and overnight global sentiment transmission before 09:15 AM IST.",
                "correlated_indian_sectors": ["NIFTY 50", "BANK NIFTY", "RELIANCE", "HDFCBANK", "ICICIBANK"],
                "suggested_prompts": [
                    "What does today's GIFT NIFTY gap imply for opening range breakouts?",
                    "What are the major call and put strike walls for today's expiry?",
                    "How closely is GIFT NIFTY mirroring overnight US futures?"
                ]
            },
            "SPX": {
                "name": "S&P 500 Index",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "exchange_name": "Cboe / NYSE / CME Globex",
                "trading_hours_ist": "07:00 PM – 02:30 AM IST (Regular US Session)",
                "base_price": 5985.0,
                "prev_close": 5955.5,
                "tick_size": 0.50,
                "week_52_high": 6025.5,
                "week_52_low": 4953.5,
                "nifty_correlation": 0.74,
                "banknifty_correlation": 0.65,
                "impact_on_india": "Broadest global equity risk benchmark. Strong S&P 500 closes trigger global 'Risk-On' sentiment, boosting FII allocations into Dalal Street large-cap equities.",
                "correlated_indian_sectors": ["NIFTY 50", "NIFTY IT", "NIFTY AUTO", "RELIANCE"],
                "suggested_prompts": [
                    "How does S&P 500 breadth affect Foreign Institutional Investor (FII) flows into India?",
                    "What are key support levels if S&P 500 pulls back from all-time highs?",
                    "Is the current US equity valuation rich compared to Indian equities?"
                ]
            },
            "NDX": {
                "name": "NASDAQ 100",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "exchange_name": "NASDAQ Stock Market",
                "trading_hours_ist": "07:00 PM – 02:30 AM IST",
                "base_price": 21115.0,
                "prev_close": 20945.0,
                "tick_size": 2.5,
                "week_52_high": 21250.0,
                "week_52_low": 16973.0,
                "nifty_correlation": 0.68,
                "banknifty_correlation": 0.52,
                "impact_on_india": "Strongest leading indicator for Indian IT sector (NIFTY IT). Rallies in US mega-cap tech directly spill over into Infosys, TCS, Wipro, and HCL Tech on Dalal Street.",
                "correlated_indian_sectors": ["NIFTY IT", "INFY", "TCS", "WIPRO", "HCLTECH", "TECHM"],
                "suggested_prompts": [
                    "How will today's NASDAQ tech momentum translate to NIFTY IT opening?",
                    "What is the valuation spread between US tech giants and Indian IT services?",
                    "Which Indian IT stocks have the highest beta to NASDAQ rallies?"
                ]
            },
            "DJI": {
                "name": "Dow Jones Industrial Average",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "exchange_name": "New York Stock Exchange (NYSE)",
                "trading_hours_ist": "07:00 PM – 02:30 AM IST",
                "base_price": 43920.0,
                "prev_close": 43800.0,
                "tick_size": 5.0,
                "week_52_high": 44486.0,
                "week_52_low": 37122.0,
                "nifty_correlation": 0.70,
                "banknifty_correlation": 0.68,
                "impact_on_india": "Old-economy and industrial pulse. Correlates with Indian capital goods, banking, and infrastructure majors like Larsen & Toubro, Tata Motors, and SBI.",
                "correlated_indian_sectors": ["NIFTY INFRA", "LT", "TATAMOTORS", "SBIN"],
                "suggested_prompts": [
                    "Does Dow Jones industrial strength signal export demand for Indian capital goods?",
                    "How do US banking earnings in the Dow impact sentiment on Bank Nifty?"
                ]
            },
            "RUT": {
                "name": "Russell 2000 (US Small Caps)",
                "region": "AMERICAS",
                "category": "INDEX",
                "flag": "🇺🇸",
                "currency": "USD",
                "exchange_name": "Cboe / CME",
                "trading_hours_ist": "07:00 PM – 02:30 AM IST",
                "base_price": 2392.0,
                "prev_close": 2372.0,
                "tick_size": 0.40,
                "week_52_high": 2460.0,
                "week_52_low": 1920.0,
                "nifty_correlation": 0.55,
                "banknifty_correlation": 0.50,
                "impact_on_india": "Global small-cap risk appetite barometer. Surges in Russell 2000 indicate broadening liquidity, fostering aggressive risk-on in NIFTY Smallcap 100 & Midcap 150.",
                "correlated_indian_sectors": ["NIFTY MIDCAP 100", "NIFTY SMALLCAP 100"],
                "suggested_prompts": [
                    "Is US small-cap rotation a green signal for Indian mid-cap outperformance?",
                    "What are the interest-rate sensitivity risks for small-cap equities?"
                ]
            },
            "N225": {
                "name": "Nikkei 225 (Japan)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇯🇵",
                "currency": "JPY",
                "exchange_name": "Tokyo Stock Exchange (TSE)",
                "trading_hours_ist": "05:30 AM – 11:30 AM IST",
                "base_price": 39380.0,
                "prev_close": 39066.0,
                "tick_size": 10.0,
                "week_52_high": 42426.0,
                "week_52_low": 31156.0,
                "nifty_correlation": 0.61,
                "banknifty_correlation": 0.58,
                "impact_on_india": "Early morning Asian cue. Japanese Yen carry-trade unwinds directly trigger global margin calls that affect emerging market equities including India.",
                "correlated_indian_sectors": ["NIFTY AUTO", "MARUTI", "BAJAJ-AUTO"],
                "suggested_prompts": [
                    "Is Bank of Japan interest rate policy causing Yen carry-trade volatility?",
                    "How do Japanese auto export trends compare with Maruti Suzuki?"
                ]
            },
            "HSI": {
                "name": "Hang Seng Index (Hong Kong)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇭🇰",
                "currency": "HKD",
                "exchange_name": "Hong Kong Exchanges and Clearing (HKEX)",
                "trading_hours_ist": "07:00 AM – 01:30 PM IST",
                "base_price": 19820.0,
                "prev_close": 19910.0,
                "tick_size": 5.0,
                "week_52_high": 23241.0,
                "week_52_low": 14794.0,
                "nifty_correlation": 0.48,
                "banknifty_correlation": 0.44,
                "impact_on_india": "Greater China liquidity hub. Often engages in capital competition with Dalal Street for Emerging Market portfolio weightings (FII reallocation between India and China).",
                "correlated_indian_sectors": ["NIFTY METAL", "TATASTEEL", "JINDALSTEL", "HINDALCO"],
                "suggested_prompts": [
                    "Are foreign institutional funds rotating out of India into cheap Hong Kong equities?",
                    "How do Chinese stimulus measures impact Indian steel and metal stocks?"
                ]
            },
            "SHCOMP": {
                "name": "Shanghai Composite",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇨🇳",
                "currency": "CNY",
                "exchange_name": "Shanghai Stock Exchange (SSE)",
                "trading_hours_ist": "07:00 AM – 12:30 PM IST",
                "base_price": 3422.0,
                "prev_close": 3410.0,
                "tick_size": 1.0,
                "week_52_high": 3674.0,
                "week_52_low": 2689.0,
                "nifty_correlation": 0.35,
                "banknifty_correlation": 0.30,
                "impact_on_india": "Chinese mainland industrial demand driver. Strong Shanghai rallies drive up global commodity prices (steel, aluminium, chemicals), impacting Indian input costs.",
                "correlated_indian_sectors": ["NIFTY METAL", "CHEMICALS", "SRF", "AARTIIND"],
                "suggested_prompts": [
                    "What does Chinese manufacturing PMI mean for Indian chemical exporters?"
                ]
            },
            "KOSPI": {
                "name": "KOSPI (South Korea)",
                "region": "ASIA_PACIFIC",
                "category": "INDEX",
                "flag": "🇰🇷",
                "currency": "KRW",
                "exchange_name": "Korea Exchange (KRX)",
                "trading_hours_ist": "05:30 AM – 12:00 PM IST",
                "base_price": 2483.0,
                "prev_close": 2468.0,
                "tick_size": 0.5,
                "week_52_high": 2896.0,
                "week_52_low": 2380.0,
                "nifty_correlation": 0.58,
                "banknifty_correlation": 0.52,
                "impact_on_india": "Global semiconductor and electronics cycle bellwether (Samsung, SK Hynix). Correlates with Indian electronics manufacturing and auto components.",
                "correlated_indian_sectors": ["DIXON", "KAYNES", "SYRMA"],
                "suggested_prompts": [
                    "How does South Korean memory chip cycle impact Indian EMS players?"
                ]
            },
            "FTSE": {
                "name": "FTSE 100 (United Kingdom)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇬🇧",
                "currency": "GBP",
                "exchange_name": "London Stock Exchange (LSE)",
                "trading_hours_ist": "01:30 PM – 10:00 PM IST",
                "base_price": 8072.0,
                "prev_close": 8025.0,
                "tick_size": 2.0,
                "week_52_high": 8474.0,
                "week_52_low": 7430.0,
                "nifty_correlation": 0.65,
                "banknifty_correlation": 0.62,
                "impact_on_india": "European mid-session cue during Dalal Street's afternoon trading (01:30 PM to 03:30 PM IST). Shifts in FTSE frequently dictate afternoon trend reversals in NIFTY.",
                "correlated_indian_sectors": ["NIFTY 50", "TATASTEEL", "TATAMOTORS"],
                "suggested_prompts": [
                    "Why do FTSE 100 afternoon opens create sudden volatility in NIFTY options?"
                ]
            },
            "DAX": {
                "name": "DAX 40 (Germany)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇩🇪",
                "currency": "EUR",
                "exchange_name": "Frankfurt Stock Exchange (Deutsche Börse)",
                "trading_hours_ist": "01:30 PM – 10:00 PM IST",
                "base_price": 19265.0,
                "prev_close": 19148.0,
                "tick_size": 5.0,
                "week_52_high": 19674.0,
                "week_52_low": 15589.0,
                "nifty_correlation": 0.69,
                "banknifty_correlation": 0.66,
                "impact_on_india": "European industrial powerhouse benchmark. Indicates health of European manufacturing and automotive supply chains, directly impacting Indian auto component exporters (Bharat Forge, Samvardhana Motherson).",
                "correlated_indian_sectors": ["BHARATFORG", "MOTHERSON", "BOSCHLTD"],
                "suggested_prompts": [
                    "How does German auto weakness translate to Indian component exporters?"
                ]
            },
            "CAC": {
                "name": "CAC 40 (France)",
                "region": "EUROPE",
                "category": "INDEX",
                "flag": "🇫🇷",
                "currency": "EUR",
                "exchange_name": "Euronext Paris",
                "trading_hours_ist": "01:30 PM – 10:00 PM IST",
                "base_price": 7312.0,
                "prev_close": 7274.0,
                "tick_size": 2.0,
                "week_52_high": 8259.0,
                "week_52_low": 7111.0,
                "nifty_correlation": 0.66,
                "banknifty_correlation": 0.62,
                "impact_on_india": "Luxury, aerospace and defense barometer. Rallies indicate steady European consumer demand and aerospace manufacturing orders benefiting Indian precision engineering firms.",
                "correlated_indian_sectors": ["HAL", "BEL", "TITAN"],
                "suggested_prompts": [
                    "What are the defense aerospace supply signals from CAC 40 for HAL and BEL?"
                ]
            },
            "BRENT": {
                "name": "Brent Crude Oil",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🛢️",
                "currency": "USD/bbl",
                "exchange_name": "Intercontinental Exchange (ICE, London)",
                "trading_hours_ist": "24 Hours Continuous",
                "base_price": 72.85,
                "prev_close": 73.30,
                "tick_size": 0.05,
                "week_52_high": 92.18,
                "week_52_low": 68.68,
                "nifty_correlation": -0.58,
                "banknifty_correlation": -0.45,
                "impact_on_india": "CRITICAL INVERSE MACRO DRIVER. India imports >85% of its crude oil. A $10 drop in Brent Crude improves India's Current Account Deficit by ~$15 Billion, boosts INR, and drastically expands profit margins for Oil Marketing Companies, paint makers, and airlines.",
                "correlated_indian_sectors": ["BPCL", "HPCL", "IOC", "ASIANPAINT", "BERGEPAINT", "INDIGO", "PIDILITIND"],
                "suggested_prompts": [
                    "How will a $3 drop in Brent Crude affect Asian Paints and Indigo margins?",
                    "What is the breakeven crude price for Indian downstream oil marketing companies?",
                    "Why is Brent Crude inversely correlated with the Indian Rupee?"
                ]
            },
            "WTI": {
                "name": "WTI Crude Oil (US Light Sweet)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🛢️",
                "currency": "USD/bbl",
                "exchange_name": "NYMEX / CME",
                "trading_hours_ist": "24 Hours Continuous",
                "base_price": 68.70,
                "prev_close": 69.08,
                "tick_size": 0.05,
                "week_52_high": 87.67,
                "week_52_low": 65.27,
                "nifty_correlation": -0.54,
                "banknifty_correlation": -0.42,
                "impact_on_india": "US energy benchmark. Reflects US shale production dynamics, inventory drawdowns (EIA reports), and global refining crack spreads.",
                "correlated_indian_sectors": ["RELIANCE", "ONGC", "OIL"],
                "suggested_prompts": [
                    "How does US WTI inventory drawdown affect Reliance Industries' gross refining margins?"
                ]
            },
            "USDINR": {
                "name": "USD / INR (Dollar-Rupee)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "CURRENCY",
                "flag": "💵",
                "currency": "₹",
                "exchange_name": "NSE Currency Derivatives / OTC Forex",
                "trading_hours_ist": "09:00 AM – 05:00 PM IST",
                "base_price": 84.42,
                "prev_close": 84.38,
                "tick_size": 0.01,
                "week_52_high": 84.50,
                "week_52_low": 82.80,
                "nifty_correlation": -0.65,
                "banknifty_correlation": -0.72,
                "impact_on_india": "KEY LIQUIDITY TRANSMISSION MECHANISM. Rupee depreciation erodes dollar returns for Foreign Institutional Investors (FPIs), triggering equity selling. Conversely, a weakening Rupee boosts revenue for export-driven IT and Pharma firms.",
                "correlated_indian_sectors": ["NIFTY IT", "NIFTY PHARMA", "BANK NIFTY", "SUNPHARMA"],
                "suggested_prompts": [
                    "Is RBI intervening to defend the 84.50 level on USD/INR?",
                    "How does Rupee depreciation benefit Infosys and TCS margins?",
                    "Why does a weakening Rupee cause Bank Nifty underperformance?"
                ]
            },
            "DXY": {
                "name": "US Dollar Index (DXY)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "CURRENCY",
                "flag": "💵",
                "currency": "pts",
                "exchange_name": "ICE Futures US",
                "trading_hours_ist": "24 Hours Continuous",
                "base_price": 106.48,
                "prev_close": 106.30,
                "tick_size": 0.02,
                "week_52_high": 107.35,
                "week_52_low": 100.15,
                "nifty_correlation": -0.68,
                "banknifty_correlation": -0.75,
                "impact_on_india": "PRIMARY GLOBAL MONETARY TIGHTENING INDICATOR. A rising Dollar Index siphons global capital back to the US risk-free rate, causing heavy emerging market foreign institutional outflows and tightening Indian banking liquidity.",
                "correlated_indian_sectors": ["NIFTY 50", "BANK NIFTY", "HDFCBANK", "ICICIBANK"],
                "suggested_prompts": [
                    "What happens to Dalal Street when DXY breaks above 107.0?",
                    "What is the historical correlation between DXY peaks and Indian market bottoms?"
                ]
            },
            "GOLD": {
                "name": "Gold (Spot USD / oz)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🥇",
                "currency": "USD/oz",
                "exchange_name": "COMEX / London Bullion Market (LBMA)",
                "trading_hours_ist": "24 Hours Continuous",
                "base_price": 2638.5,
                "prev_close": 2625.7,
                "tick_size": 0.50,
                "week_52_high": 2790.1,
                "week_52_low": 1984.3,
                "nifty_correlation": -0.22,
                "banknifty_correlation": -0.30,
                "impact_on_india": "Ultimate safe-haven asset and inflation hedge. Gold rallies during geopolitical turmoil or systemic bank distress. In India, higher gold prices expand collateral value for gold loan NBFCs (Muthoot, Manappuram) and elevate jewellery retail valuations (Titan, Kalyan).",
                "correlated_indian_sectors": ["TITAN", "KALYANKJIL", "MUTHOOTFIN", "MANAPPURAM"],
                "suggested_prompts": [
                    "How does the global gold rally benefit Muthoot Finance's loan book LTV?",
                    "Will high gold import duties and prices dampen festive jewellery volume for Titan?"
                ]
            },
            "SILVER": {
                "name": "Silver (Spot USD / oz)",
                "region": "COMMODITIES_CURRENCIES",
                "category": "COMMODITY",
                "flag": "🥈",
                "currency": "USD/oz",
                "exchange_name": "COMEX / LBMA",
                "trading_hours_ist": "24 Hours Continuous",
                "base_price": 31.42,
                "prev_close": 31.07,
                "tick_size": 0.05,
                "week_52_high": 35.40,
                "week_52_low": 21.92,
                "nifty_correlation": 0.15,
                "banknifty_correlation": 0.10,
                "impact_on_india": "High-beta hybrid asset (monetary store of value + industrial component for solar PV cells and electric vehicle electronics). High silver demand boosts Indian solar supply chain players.",
                "correlated_indian_sectors": ["HINDZINC", "TATASTEEL"],
                "suggested_prompts": [
                    "How does solar PV manufacturing demand support the industrial silver rally?"
                ]
            },
            "US10Y": {
                "name": "US 10-Yr Treasury Yield",
                "region": "COMMODITIES_CURRENCIES",
                "category": "BOND",
                "flag": "📈",
                "currency": "%",
                "exchange_name": "US Treasury Secondary Market",
                "trading_hours_ist": "Global OTC Secondary Market",
                "base_price": 4.43,
                "prev_close": 4.41,
                "tick_size": 0.005,
                "week_52_high": 4.99,
                "week_52_low": 3.60,
                "nifty_correlation": -0.62,
                "banknifty_correlation": -0.70,
                "impact_on_india": "GLOBAL DISCOUNT RATE. When US 10-Year yield climbs toward 4.5%+, the cost of equity rises worldwide, compressing price-to-earnings multiples for Indian growth stocks and triggering foreign portfolio investor liquidations.",
                "correlated_indian_sectors": ["NIFTY IT", "BANK NIFTY", "NIFTY REALTY"],
                "suggested_prompts": [
                    "Why do rising US yields punish Indian growth and tech stocks?",
                    "What yield spread does the RBI require to maintain capital account stability?"
                ]
            },
            "IN10Y": {
                "name": "India 10-Yr Benchmark G-Sec",
                "region": "COMMODITIES_CURRENCIES",
                "category": "BOND",
                "flag": "🇮🇳",
                "currency": "%",
                "exchange_name": "RBI NDS-OM (Negotiated Dealing System)",
                "trading_hours_ist": "09:15 AM – 05:00 PM IST",
                "base_price": 6.81,
                "prev_close": 6.82,
                "tick_size": 0.005,
                "week_52_high": 7.38,
                "week_52_low": 6.75,
                "nifty_correlation": -0.40,
                "banknifty_correlation": -0.60,
                "impact_on_india": "DOMESTIC RISK-FREE RATE & BANK TREASURY BOOK ENGINE. Falling G-Sec yields generate massive mark-to-market treasury gains for Indian public and private sector banks (SBI, HDFC Bank, ICICI Bank), driving Net Interest Margin expansion.",
                "correlated_indian_sectors": ["BANK NIFTY", "SBIN", "HDFCBANK", "ICICIBANK", "CANBK"],
                "suggested_prompts": [
                    "How much MTM treasury profit will PSU banks book if G-Sec yield drops below 6.80%?",
                    "What does the G-Sec curve imply about upcoming RBI repo rate cuts?"
                ]
            }
        }

        # Dynamic in-memory live tick state initialized from baseline specs
        self.live_state: Dict[str, Dict[str, Any]] = {}
        for sym, spec in self.meta_specs.items():
            base = spec["base_price"]
            prev = spec["prev_close"]
            change = round(base - prev, 2)
            change_pct = round((change / prev) * 100, 2)
            self.live_state[sym] = {
                "ltp": base,
                "high": round(max(base, prev) + spec["tick_size"] * 10, 2),
                "low": round(min(base, prev) - spec["tick_size"] * 8, 2),
                "open": round(prev + spec["tick_size"] * 2, 2),
                "change": change,
                "change_pct": change_pct,
                "sparkline": [
                    round(prev - spec["tick_size"] * 2, 2),
                    round(prev + spec["tick_size"] * 3, 2),
                    round(base - spec["tick_size"] * 2, 2),
                    base
                ],
                "last_tick_time": datetime.now(self.ist).strftime("%H:%M:%S IST")
            }

    def _simulate_live_ticks(self):
        """Simulate realistic stochastic micro-ticks for all instruments on each poll."""
        now_str = datetime.now(self.ist).strftime("%H:%M:%S IST")
        for sym, spec in self.meta_specs.items():
            st = self.live_state[sym]
            step = spec["tick_size"]
            # Stochastic tick movement: -1, 0, or +1
            direction = random.choice([-1, -1, 0, 1, 1, 1]) # Slight bullish tilt
            shock = direction * step * random.uniform(0.5, 1.8)
            new_ltp = round(st["ltp"] + shock, 2 if st["ltp"] > 10 else 3)

            # Prevent straying beyond reasonable bounds
            min_bound = round(spec["base_price"] * 0.96, 2)
            max_bound = round(spec["base_price"] * 1.04, 2)
            new_ltp = max(min_bound, min(max_bound, new_ltp))

            prev_close = spec["prev_close"]
            change = round(new_ltp - prev_close, 2 if new_ltp > 10 else 3)
            change_pct = round((change / prev_close) * 100, 2)

            st["ltp"] = new_ltp
            st["high"] = max(st["high"], new_ltp)
            st["low"] = min(st["low"], new_ltp)
            st["change"] = change
            st["change_pct"] = change_pct
            st["last_tick_time"] = now_str

            # Update sparkline
            st["sparkline"].append(new_ltp)
            if len(st["sparkline"]) > 10:
                st["sparkline"].pop(0)

    def get_global_indices(self) -> GlobalIndicesResponse:
        now_dt = datetime.now(self.ist)
        time_str = now_dt.strftime("%H:%M:%S IST")

        # Advance live ticks
        self._simulate_live_ticks()

        # Reference NIFTY 50 previous close for gap calculation
        quote_nifty = self.provider.get_quote("NIFTY50")
        if isinstance(quote_nifty, dict):
            nifty_close = float(quote_nifty.get("close", 24199.50))
        elif quote_nifty:
            nifty_close = float(getattr(quote_nifty, "close", 24199.50))
        else:
            nifty_close = 24199.50

        raw_universe = []
        for sym, spec in self.meta_specs.items():
            st = self.live_state[sym]
            # Determine market status based on regional hours
            status = "OPEN"
            if spec["region"] == "ASIA_PACIFIC" and now_dt.hour >= 15:
                status = "CLOSED"
            elif spec["region"] == "EUROPE" and (now_dt.hour < 13 or now_dt.hour >= 22):
                status = "CLOSED"
            elif spec["region"] == "AMERICAS" and (now_dt.hour >= 3 and now_dt.hour < 19):
                status = "CLOSED"

            raw_universe.append({
                "symbol": sym,
                "name": spec["name"],
                "region": spec["region"],
                "category": spec["category"],
                "flag": spec["flag"],
                "currency": spec["currency"],
                "ltp": st["ltp"],
                "change": st["change"],
                "change_pct": st["change_pct"],
                "high": st["high"],
                "low": st["low"],
                "sparkline": list(st["sparkline"]),
                "market_status": status,
                "last_updated": st["last_tick_time"]
            })

        # Calculate GIFT NIFTY opening gap prediction
        gift_st = self.live_state.get("GIFTNIFTY", {"ltp": nifty_close + 85.0})
        gift_ltp = gift_st["ltp"]
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

    def get_global_index_detail(self, symbol: str, timeframe: str = "1D") -> GlobalIndexDetailResponse:
        """Generates institutional detailed inspection report with multi-timeframe candles and Dalal Street telemetry."""
        sym_clean = symbol.upper().strip()
        spec = self.meta_specs.get(sym_clean)
        if not spec:
            # Fallback to SPX if symbol not in universe
            sym_clean = "SPX"
            spec = self.meta_specs["SPX"]

        st = self.live_state[sym_clean]
        ltp = st["ltp"]
        prev_close = spec["prev_close"]
        high = st["high"]
        low = st["low"]
        open_price = st["open"]
        change = st["change"]
        change_pct = st["change_pct"]

        # Generate realistic historical candles for the chosen timeframe
        candles: List[CandleItem] = []
        now_dt = datetime.now(self.ist)

        if timeframe == "1D":
            # 5-minute candles covering today (40 candles)
            num_candles = 40
            start_dt = now_dt - timedelta(minutes=num_candles * 5)
            curr = open_price
            for i in range(num_candles):
                c_time = (start_dt + timedelta(minutes=i * 5)).strftime("%H:%M")
                # Deterministic drift toward LTP
                progress = i / max(1, num_candles - 1)
                target = curr + (ltp - curr) * (progress * 0.4)
                jitter = (math.sin(i * 0.4) + math.cos(i * 0.2)) * spec["tick_size"] * 2.0
                c_open = round(curr, 2)
                c_close = round(ltp if i == num_candles - 1 else target + jitter, 2)
                c_high = round(max(c_open, c_close) + abs(jitter) * 0.8, 2)
                c_low = round(min(c_open, c_close) - abs(jitter) * 0.8, 2)
                candles.append(CandleItem(
                    timestamp=c_time,
                    open=c_open,
                    high=c_high,
                    low=c_low,
                    close=c_close,
                    volume=int(random.randint(5000, 25000))
                ))
                curr = c_close

        elif timeframe == "5D":
            # 1-hour candles over 5 days (35 candles)
            num_candles = 35
            start_dt = now_dt - timedelta(days=5)
            curr = round(prev_close * 0.985, 2)
            for i in range(num_candles):
                c_time = (start_dt + timedelta(hours=i * 3.5)).strftime("%d %b %H:%M")
                drift = math.sin(i * 0.3) * spec["tick_size"] * 4.0
                c_open = round(curr, 2)
                c_close = round(ltp if i == num_candles - 1 else curr + drift, 2)
                c_high = round(max(c_open, c_close) + abs(drift) * 0.6 + spec["tick_size"], 2)
                c_low = round(min(c_open, c_close) - abs(drift) * 0.6 - spec["tick_size"], 2)
                candles.append(CandleItem(
                    timestamp=c_time,
                    open=c_open,
                    high=c_high,
                    low=c_low,
                    close=c_close,
                    volume=int(random.randint(15000, 60000))
                ))
                curr = c_close

        elif timeframe == "1M":
            # Daily candles for the past month (22 trading days)
            num_candles = 22
            start_dt = now_dt - timedelta(days=32)
            curr = round(prev_close * 0.96, 2)
            for i in range(num_candles):
                c_time = (start_dt + timedelta(days=i * 1.4)).strftime("%d %b")
                drift = (math.sin(i * 0.5) * 1.2 + (i / num_candles) * 3.0) * spec["tick_size"] * 6.0
                c_open = round(curr, 2)
                c_close = round(ltp if i == num_candles - 1 else curr + drift, 2)
                c_high = round(max(c_open, c_close) + spec["tick_size"] * 4, 2)
                c_low = round(min(c_open, c_close) - spec["tick_size"] * 4, 2)
                candles.append(CandleItem(
                    timestamp=c_time,
                    open=c_open,
                    high=c_high,
                    low=c_low,
                    close=c_close,
                    volume=int(random.randint(80000, 250000))
                ))
                curr = c_close

        else: # "1Y"
            # Weekly candles for 52 weeks
            num_candles = 52
            start_dt = now_dt - timedelta(weeks=52)
            curr = spec["week_52_low"]
            step_year = (spec["week_52_high"] - spec["week_52_low"]) / num_candles
            for i in range(num_candles):
                c_time = (start_dt + timedelta(weeks=i)).strftime("%b '%y")
                drift = math.sin(i * 0.2) * (spec["tick_size"] * 15)
                c_open = round(curr, 2)
                c_close = round(ltp if i == num_candles - 1 else curr + step_year + drift, 2)
                c_high = round(max(c_open, c_close) + spec["tick_size"] * 12, 2)
                c_low = round(min(c_open, c_close) - spec["tick_size"] * 12, 2)
                candles.append(CandleItem(
                    timestamp=c_time,
                    open=c_open,
                    high=c_high,
                    low=c_low,
                    close=c_close,
                    volume=int(random.randint(300000, 1500000))
                ))
                curr = c_close

        # Compute Institutional Key Levels & Pivots
        pivot = round((high + low + ltp) / 3, 2)
        r1 = round(2 * pivot - low, 2)
        s1 = round(2 * pivot - high, 2)
        r2 = round(pivot + (high - low), 2)
        s2 = round(pivot - (high - low), 2)

        # 20 EMA and 50 SMA approximations
        closes = [c.close for c in candles]
        ema_20 = round(float(np.mean(closes[-20:])) if len(closes) >= 20 else ltp, 2)
        sma_50 = round(float(np.mean(closes)) if closes else ltp, 2)

        # RSI(14)
        if len(closes) >= 15:
            diffs = np.diff(closes)
            gains = diffs[diffs > 0]
            losses = -diffs[diffs < 0]
            avg_gain = np.mean(gains) if len(gains) > 0 else 0.001
            avg_loss = np.mean(losses) if len(losses) > 0 else 0.001
            rs = avg_gain / avg_loss
            rsi_14 = round(100 - (100 / (1 + rs)), 1)
        else:
            rsi_14 = 54.5

        key_levels = {
            "pivot": pivot,
            "resistance_1": r1,
            "resistance_2": r2,
            "support_1": s1,
            "support_2": s2,
            "ema_20": ema_20,
            "sma_50": sma_50
        }

        # Synthesize institutional briefing from hedge fund perspective
        bias_str = "BULLISH OUTPERFORMANCE" if change_pct > 0.4 else "BEARISH PRESSURE" if change_pct < -0.4 else "CONSOLIDATION"
        briefing = (
            f"Institutional Quantitative Telemetry for {spec['name']} ({sym_clean}):\n\n"
            f"1. Regime & Momentum: Trading at {ltp:,.2f} {spec['currency']} ({change:+.2f}, {change_pct:+.2f}%), exhibiting a {bias_str} regime. "
            f"RSI(14) stands at {rsi_14:.1f}, placing current price action in an equilibrium zone between Pivot ({pivot:,.2f}) and R1 ({r1:,.2f}).\n\n"
            f"2. Dalal Street Transmission Matrix: Demonstrates a statistical correlation of {spec['nifty_correlation']:+.2f} with NIFTY 50 and {spec['banknifty_correlation']:+.2f} with BANK NIFTY. "
            f"{spec['impact_on_india']}\n\n"
            f"3. High-Beta Indian Equities: Watch immediate spillover into {', '.join(spec['correlated_indian_sectors'][:4])}. "
            f"Any breach beyond R2 ({r2:,.2f}) or below S2 ({s2:,.2f}) will trigger algorithmic delta adjustments across domestic options market makers."
        )

        return GlobalIndexDetailResponse(
            symbol=sym_clean,
            name=spec["name"],
            region=spec["region"],
            category=spec["category"],
            flag=spec["flag"],
            currency=spec["currency"],
            ltp=ltp,
            prev_close=prev_close,
            open_price=open_price,
            high=high,
            low=low,
            change=change,
            change_pct=change_pct,
            week_52_high=spec["week_52_high"],
            week_52_low=spec["week_52_low"],
            market_status=self.live_state[sym_clean].get("market_status", "OPEN"),
            exchange_name=spec["exchange_name"],
            trading_hours_ist=spec["trading_hours_ist"],
            timeframe=timeframe,
            candles=candles,
            nifty_correlation=spec["nifty_correlation"],
            banknifty_correlation=spec["banknifty_correlation"],
            impact_on_india=spec["impact_on_india"],
            correlated_indian_sectors=spec["correlated_indian_sectors"],
            key_levels=key_levels,
            rsi_14=rsi_14,
            institutional_briefing=briefing,
            suggested_prompts=spec["suggested_prompts"]
        )

    def chat_global_index(self, symbol: str, message: str, history: Optional[List[Dict[str, str]]] = None) -> GlobalIndexChatResponse:
        """Processes conversational macro queries with Dalal Street transmission context."""
        sym_clean = symbol.upper().strip()
        spec = self.meta_specs.get(sym_clean, self.meta_specs["SPX"])
        st = self.live_state.get(sym_clean, {"ltp": spec["base_price"], "change_pct": 0.5})

        q = message.lower().strip()
        ltp = st["ltp"]
        chg = st.get("change_pct", 0.0)

        # Context-aware macro reasoning engine
        if any(w in q for w in ["impact", "india", "nifty", "dalal"]):
            reply = (
                f"Analyzing the transmission of {spec['name']} ({sym_clean} @ {ltp:,.2f}, {chg:+.2f}%) to Dalal Street:\n\n"
                f"• Correlation Coefficient: {spec['nifty_correlation']:+.2f} with NIFTY 50 and {spec['banknifty_correlation']:+.2f} with BANK NIFTY.\n"
                f"• Direct Macro Impact: {spec['impact_on_india']}\n"
                f"• Sensitive Indian Equities: {', '.join(spec['correlated_indian_sectors'])}. "
                f"Traders should monitor opening order imbalances on these stocks if {sym_clean} continues its {chg:+.2f}% trajectory."
            )
        elif any(w in q for w in ["support", "resistance", "level", "target", "pivot"]):
            pivot = round((st["high"] + st["low"] + ltp) / 3, 2)
            r1 = round(2 * pivot - st["low"], 2)
            s1 = round(2 * pivot - st["high"], 2)
            reply = (
                f"Quantitative Technical Structure for {spec['name']} ({sym_clean}):\n\n"
                f"• Current Market Price: {ltp:,.2f} {spec['currency']}\n"
                f"• Immediate Resistance (R1): {r1:,.2f}\n"
                f"• Central Pivot Level: {pivot:,.2f}\n"
                f"• Crucial Support Floor (S1): {s1:,.2f}\n"
                f"• 52-Week Range: {spec['week_52_low']:,.2f} – {spec['week_52_high']:,.2f}\n"
                f"A sustained 15-minute close above R1 confirms structural breakout momentum; failure below S1 signals liquidity hunt toward lower range extremes."
            )
        elif any(w in q for w in ["crude", "oil", "brent"]) and sym_clean in ["BRENT", "WTI"]:
            reply = (
                f"Institutional Crude Oil Transmission Analysis:\n\n"
                f"Brent Crude is trading at ${ltp:.2f}/bbl ({chg:+.2f}%). Because India imports ~85% of its crude requirements, oil operates as an inverse tax on the Indian economy.\n"
                f"• Beneficiaries of Oil Softness: Oil Marketing Companies (HPCL, BPCL, IOC) see immediate gross marketing margin expansion. Paint manufacturers (Asian Paints, Berger) and tyre makers enjoy lower petrochemical raw material costs (~30-40% of COGS).\n"
                f"• Risk-off Trigger: A spike above $80/bbl threatens India's current account deficit and weakens the Indian Rupee (USD/INR)."
            )
        elif any(w in q for w in ["dollar", "dxy", "rupee", "usdinr"]):
            reply = (
                f"Forex & Liquidity Telemetry ({spec['name']}):\n\n"
                f"Current Level: {ltp:.2f} {spec['currency']}. The US Dollar Index exhibits a -0.68 inverse correlation with NIFTY 50.\n"
                f"• Emerging Market Implication: A surging dollar increases debt-servicing burdens on emerging markets and forces Foreign Portfolio Investors (FPIs) to reallocate back to dollar cash equivalents.\n"
                f"• Indian Defense: The Reserve Bank of India (RBI) utilizes its $680B+ foreign exchange war chest to smooth excess volatility, preventing disorderly Rupee depreciation."
            )
        else:
            reply = (
                f"Macro Debrief on {spec['name']} ({sym_clean}):\n\n"
                f"Currently quoting at {ltp:,.2f} {spec['currency']} with a daily return of {chg:+.2f}% on {spec['exchange_name']}.\n"
                f"• Structural Alignment: Correlated with Dalal Street at {spec['nifty_correlation']:+.2f} beta.\n"
                f"• Key Sectors to Watch: {', '.join(spec['correlated_indian_sectors'])}.\n"
                f"• Institutional Strategy: Align domestic day trades with this global trend, but respect Indian 09:15 AM opening gap absorption levels before committing aggressive leverage."
            )

        now_str = datetime.now(self.ist).strftime("%H:%M:%S IST")
        return GlobalIndexChatResponse(
            symbol=sym_clean,
            reply=reply,
            timestamp=now_str
        )

# Global singleton
global_markets_engine = GlobalMarketsEngine()
