"""
Institutional Stock Screener Engine for Indian Equities.
Provides multi-criteria filtering and predefined high-conviction screening strategies.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
from ..schemas.market import ScreenerFilterRequest, ScreenerRow, ScreenerResponse, SignalStatus
from ..providers.manager import get_market_data_provider
from .indicators import TechnicalIndicators
from .ml_models import MarketPredictor
from .signals import SignalEngine

class ScreenerEngine:
    def __init__(self):
        self.provider = get_market_data_provider()
        self.predictor = MarketPredictor()
        self.signal_engine = SignalEngine()

    def run_screen(self, filters: ScreenerFilterRequest) -> ScreenerResponse:
        # Expanded universe of high-liquidity NSE stocks across all sectors
        symbols = [
            ("RELIANCE", "Reliance Industries Ltd", "Energy"),
            ("TCS", "Tata Consultancy Services Ltd", "IT"),
            ("HDFCBANK", "HDFC Bank Ltd", "Banking"),
            ("INFY", "Infosys Ltd", "IT"),
            ("ICICIBANK", "ICICI Bank Ltd", "Banking"),
            ("SBIN", "State Bank of India", "Banking"),
            ("BHARTIARTL", "Bharti Airtel Ltd", "Telecom"),
            ("ITC", "ITC Ltd", "FMCG"),
            ("LT", "Larsen & Toubro Ltd", "Infrastructure"),
            ("TATAMOTORS", "Tata Motors Ltd", "Automobile"),
            ("MARUTI", "Maruti Suzuki India Ltd", "Automobile"),
            ("SUNPHARMA", "Sun Pharmaceutical Industries", "Pharma"),
            ("BAJFINANCE", "Bajaj Finance Ltd", "Financial"),
            ("KOTAKBANK", "Kotak Mahindra Bank Ltd", "Banking"),
            ("AXISBANK", "Axis Bank Ltd", "Banking"),
            ("TITAN", "Titan Company Ltd", "Consumer"),
            ("HCLTECH", "HCL Technologies Ltd", "IT"),
            ("WIPRO", "Wipro Ltd", "IT"),
            ("NTPC", "NTPC Ltd", "Power"),
            ("TATASTEEL", "Tata Steel Ltd", "Metals"),
            ("JSWSTEEL", "JSW Steel Ltd", "Metals"),
            ("ADANIENT", "Adani Enterprises Ltd", "Conglomerate"),
            ("ADANIPORTS", "Adani Ports and SEZ Ltd", "Infrastructure"),
            ("BEL", "Bharat Electronics Ltd", "Defense"),
            ("HAL", "Hindustan Aeronautics Ltd", "Defense"),
            ("ZOMATO", "Zomato Ltd", "Internet"),
            ("JIOFIN", "Jio Financial Services Ltd", "Financial"),
            ("TATAPOWER", "Tata Power Company Ltd", "Power"),
            ("VEDL", "Vedanta Ltd", "Metals"),
            ("IRFC", "Indian Railway Finance Corporation", "Railways"),
            ("RVNL", "Rail Vikas Nigam Ltd", "Railways"),
            ("SUZLON", "Suzlon Energy Ltd", "Green Energy"),
            ("BSE", "BSE Ltd (Exchange)", "Financial"),
            ("CDSL", "Central Depository Services Ltd", "Financial"),
            ("POLYCAB", "Polycab India Ltd", "Capital Goods"),
            ("DIXON", "Dixon Technologies Ltd", "Electronics"),
        ]

        rows: List[ScreenerRow] = []

        for sym, name, sector in symbols:
            candles = self.provider.get_candles(sym, timeframe="1D", count=60)
            df = pd.DataFrame(candles)
            if df.empty or len(df) < 20:
                continue

            quote = self.provider.get_quote(sym)
            ind = TechnicalIndicators.compute_all_indicators(df)
            pred = self.predictor.predict(df, horizon="1_SESSION")
            sig = self.signal_engine.generate_signal(sym, df)

            ltp = quote["ltp"]
            change_pct = quote["change_pct"]
            volume = quote["volume"]
            rvol = ind["rvol"]
            rsi = ind["rsi_14"]
            trend = ind["trend_state"]
            sma_50 = ind["sma"]["50"] or ltp
            sma_200 = ind["sma"]["200"] or (sma_50 * 0.95)

            # Apply Preset Filters
            matches = True
            preset = (filters.preset or "").upper()

            if preset == "STRONG_BULLISH":
                if trend not in ["STRONG_BULLISH", "BULLISH"] or rsi < 55 or ltp < sma_50:
                    matches = False
            elif preset == "STRONG_BEARISH":
                if trend not in ["STRONG_BEARISH", "BEARISH"] or rsi > 45 or ltp > sma_50:
                    matches = False
            elif preset == "MOMENTUM_BREAKOUT":
                if rvol < 1.3 or change_pct < 0.8:
                    matches = False
            elif preset == "PULLBACK_TREND":
                if trend != "BULLISH" or not (40 <= rsi <= 50):
                    matches = False
            elif preset == "UNUSUAL_VOLUME":
                if rvol < 1.8:
                    matches = False
            elif preset == "OVERSOLD":
                if rsi > 35:
                    matches = False
            elif preset == "OVERBOUGHT":
                if rsi < 68:
                    matches = False

            # Custom Parameter Filters
            if filters.min_rvol and rvol < filters.min_rvol:
                matches = False
            if filters.min_rsi and rsi < filters.min_rsi:
                matches = False
            if filters.max_rsi and rsi > filters.max_rsi:
                matches = False
            if filters.above_sma_50 is True and ltp <= sma_50:
                matches = False
            if filters.above_sma_200 is True and ltp <= sma_200:
                matches = False

            if matches:
                rows.append(ScreenerRow(
                    symbol=sym,
                    name=name,
                    sector=sector,
                    ltp=ltp,
                    change_pct=change_pct,
                    volume=volume,
                    rvol=rvol,
                    rsi_14=rsi,
                    trend=trend,
                    sma_50=sma_50,
                    sma_200=sma_200,
                    signal_status=SignalStatus(sig["status"]),
                    ai_bullish_prob=round(pred["bullish_prob"] * 100, 1)
                ))

        return ScreenerResponse(total=len(rows), data=rows)
