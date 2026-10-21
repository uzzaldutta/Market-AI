"""
Deterministic Synthetic Market Data Provider for Indian Equities & Indices.
Simulates realistic NSE/BSE price distributions, gaps, volume clusters,
and option chains with Black-Scholes Greeks for offline use and testing.
"""

import math
from datetime import datetime, timedelta
import zoneinfo
from typing import List, Dict, Optional, Any
from .base import BaseMarketDataProvider
from ..engine.greeks import OptionsMath

class SyntheticFixtureProvider(BaseMarketDataProvider):
    # Benchmark base prices
    BASE_INSTRUMENTS = {
        "NIFTY50": {"name": "NIFTY 50", "price": 24850.0, "type": "INDEX", "sector": "Benchmark"},
        "BANKNIFTY": {"name": "NIFTY BANK", "price": 51200.0, "type": "INDEX", "sector": "Banking"},
        "RELIANCE": {"name": "Reliance Industries Ltd", "price": 2980.0, "type": "EQUITY", "sector": "Energy"},
        "TCS": {"name": "Tata Consultancy Services", "price": 4120.0, "type": "EQUITY", "sector": "IT"},
        "HDFCBANK": {"name": "HDFC Bank Ltd", "price": 1640.0, "type": "EQUITY", "sector": "Banking"},
        "INFY": {"name": "Infosys Ltd", "price": 1890.0, "type": "EQUITY", "sector": "IT"},
        "ICICIBANK": {"name": "ICICI Bank Ltd", "price": 1245.0, "type": "EQUITY", "sector": "Banking"},
        "SBIN": {"name": "State Bank of India", "price": 820.0, "type": "EQUITY", "sector": "Banking"},
        "BHARTIARTL": {"name": "Bharti Airtel Ltd", "price": 1680.0, "type": "EQUITY", "sector": "Telecom"},
        "ITC": {"name": "ITC Ltd", "price": 490.0, "type": "EQUITY", "sector": "FMCG"},
        "LT": {"name": "Larsen & Toubro Ltd", "price": 3550.0, "type": "EQUITY", "sector": "Infrastructure"},
        "TATAMOTORS": {"name": "Tata Motors Ltd", "price": 930.0, "type": "EQUITY", "sector": "Automobile"}
    }

    def __init__(self):
        super().__init__(name="synthetic_fixtures")

    def _pseudo_drift(self, symbol: str, offset: int = 0) -> float:
        """Deterministic pseudo-random price variation based on symbol hash."""
        seed = sum(ord(c) for c in symbol) + offset
        # Deterministic wave between -1.5% and +1.8%
        drift = math.sin(seed * 0.13) * 0.015 + math.cos(seed * 0.07) * 0.008
        return drift

    def get_market_overview(self) -> Dict[str, Any]:
        session_info = self.get_market_session_info()
        now_ist = datetime.now(self.ist_tz)
        
        indices_list = []
        for sym in ["NIFTY50", "BANKNIFTY"]:
            data = self.BASE_INSTRUMENTS[sym]
            drift = self._pseudo_drift(sym, now_ist.day)
            ltp = round(data["price"] * (1.0 + drift), 2)
            prev_close = data["price"]
            change = round(ltp - prev_close, 2)
            change_pct = round((change / prev_close) * 100, 2)
            
            indices_list.append({
                "symbol": sym,
                "name": data["name"],
                "ltp": ltp,
                "change": change,
                "change_pct": change_pct,
                "high": round(max(ltp, prev_close) * 1.004, 2),
                "low": round(min(ltp, prev_close) * 0.995, 2),
                "trend": "BULLISH" if change >= 0 else "BEARISH"
            })

        # Stocks quotes
        gainers = []
        losers = []
        for sym, meta in self.BASE_INSTRUMENTS.items():
            if meta["type"] == "INDEX":
                continue
            quote = self.get_quote(sym)
            if quote["change_pct"] >= 0:
                gainers.append(quote)
            else:
                losers.append(quote)

        gainers.sort(key=lambda x: x["change_pct"], reverse=True)
        losers.sort(key=lambda x: x["change_pct"])

        sector_perf = [
            {"sector": "IT", "change_pct": 1.45, "trend": "BULLISH"},
            {"sector": "Banking", "change_pct": -0.32, "trend": "BEARISH"},
            {"sector": "Energy", "change_pct": 0.85, "trend": "BULLISH"},
            {"sector": "Automobile", "change_pct": 0.62, "trend": "BULLISH"},
            {"sector": "FMCG", "change_pct": -0.15, "trend": "SIDEWAYS"},
            {"sector": "Telecom", "change_pct": 1.10, "trend": "BULLISH"}
        ]

        return {
            "timestamp": now_ist.isoformat(),
            "is_market_open": session_info["is_market_open"],
            "market_status": session_info["status"],
            "indices": indices_list,
            "market_breadth": {
                "advances": len(gainers) * 125,
                "declines": len(losers) * 95,
                "unchanged": 48
            },
            "top_gainers": gainers[:5],
            "top_losers": losers[:5],
            "sector_performance": sector_perf,
            "fii_dii_activity": {
                "fii_net_crores": -420.50,
                "dii_net_crores": 1280.20,
                "date": now_ist.strftime("%Y-%m-%d")
            }
        }

    def get_quote(self, symbol: str) -> Dict[str, Any]:
        clean_sym = symbol.upper().replace(".NS", "").replace("^", "")
        base_info = self.BASE_INSTRUMENTS.get(clean_sym, {
            "name": f"{clean_sym} Ltd",
            "price": 1000.0,
            "type": "EQUITY",
            "sector": "Diversified"
        })
        
        now_ist = datetime.now(self.ist_tz)
        drift = self._pseudo_drift(clean_sym, now_ist.hour * 60 + now_ist.minute)
        ltp = round(base_info["price"] * (1.0 + drift), 2)
        prev_close = base_info["price"]
        change = round(ltp - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2)
        
        high = round(max(ltp, prev_close) * 1.008, 2)
        low = round(min(ltp, prev_close) * 0.992, 2)
        open_p = round((prev_close + ltp) / 2.0, 2)
        
        session = self.get_market_session_info()

        return {
            "symbol": clean_sym,
            "ltp": ltp,
            "open": open_p,
            "high": high,
            "low": low,
            "close": prev_close,
            "change": change,
            "change_pct": change_pct,
            "volume": int(abs(math.sin(sum(ord(c) for c in clean_sym))) * 3500000 + 500000),
            "day_52w_high": round(base_info["price"] * 1.25, 2),
            "day_52w_low": round(base_info["price"] * 0.82, 2),
            "market_cap": round(base_info["price"] * 50000000, 2),
            "data_quality": "SYNTHETIC",
            "timestamp": now_ist.isoformat(),
            "is_market_open": session["is_market_open"]
        }

    def get_candles(self, symbol: str, timeframe: str = "1D", count: int = 100) -> List[Dict[str, Any]]:
        clean_sym = symbol.upper().replace(".NS", "").replace("^", "")
        base_price = self.BASE_INSTRUMENTS.get(clean_sym, {}).get("price", 1000.0)
        
        now = datetime.now(self.ist_tz)
        candles = []
        
        curr_price = base_price * 0.90 # Start 10% lower and build history
        
        # Step intervals
        delta = timedelta(days=1) if timeframe == "1D" else timedelta(minutes=15)
        
        for i in range(count):
            bar_time = now - delta * (count - i)
            # deterministic oscillation
            rnd = math.sin((i + sum(ord(c) for c in clean_sym)) * 0.35)
            chg = rnd * (base_price * 0.015)
            
            open_p = curr_price
            close_p = curr_price + chg
            high_p = max(open_p, close_p) + abs(rnd) * (base_price * 0.007)
            low_p = min(open_p, close_p) - abs(rnd) * (base_price * 0.007)
            vol = int(abs(rnd) * 1200000 + 100000)
            
            candles.append({
                "timestamp": bar_time.strftime("%Y-%m-%d %H:%M" if timeframe != "1D" else "%Y-%m-%d"),
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
                "volume": vol,
                "vwap": round((open_p + high_p + low_p + close_p) / 4.0, 2)
            })
            curr_price = close_p
            
        return candles

    def get_option_chain(self, symbol: str, expiry: Optional[str] = None) -> Dict[str, Any]:
        clean_sym = symbol.upper().replace(".NS", "").replace("^", "")
        quote = self.get_quote(clean_sym)
        spot = quote["ltp"]
        
        # Expiry schedule (upcoming Thursdays in IST)
        now = datetime.now(self.ist_tz)
        days_ahead = (3 - now.weekday()) % 7 # 3 = Thursday
        if days_ahead <= 0:
            days_ahead += 7
        next_thursday = now + timedelta(days=days_ahead)
        second_thursday = next_thursday + timedelta(days=7)
        
        expiries = [next_thursday.strftime("%Y-%m-%d"), second_thursday.strftime("%Y-%m-%d")]
        selected_exp = expiry if (expiry and expiry in expiries) else expiries[0]
        
        # Determine strike interval (NIFTY: 50, BANKNIFTY: 100, Stocks: ~20-50)
        step = 50.0 if "NIFTY" in clean_sym else (100.0 if "BANK" in clean_sym else 20.0)
        atm_strike = round(spot / step) * step
        
        # 7 strikes below, ATM, 7 strikes above
        strikes = [atm_strike + i * step for i in range(-7, 8)]
        
        t_years = max(1.0, (datetime.strptime(selected_exp, "%Y-%m-%d") - now.replace(tzinfo=None)).days) / 365.0
        r_rate = 0.065 # 6.5% RBI T-bill rate
        iv_base = 0.14 # 14% base volatility
        
        strike_rows = []
        call_ois = []
        put_ois = []
        
        for k in strikes:
            moneyness = (k - spot) / spot
            call_iv = iv_base + moneyness * 0.05
            put_iv = iv_base - moneyness * 0.05
            
            call_ltp = OptionsMath.black_scholes_price(spot, k, t_years, r_rate, call_iv, "CE")
            put_ltp = OptionsMath.black_scholes_price(spot, k, t_years, r_rate, put_iv, "PE")
            
            c_greeks = OptionsMath.calculate_greeks(spot, k, t_years, r_rate, call_iv, "CE")
            p_greeks = OptionsMath.calculate_greeks(spot, k, t_years, r_rate, put_iv, "PE")
            
            # OI distribution: Puts high at support below, Calls high at resistance above
            c_oi = int(max(5000, 120000 * math.exp(-((k - (spot * 1.02)) ** 2) / (2 * (step * 3) ** 2))))
            p_oi = int(max(5000, 135000 * math.exp(-((k - (spot * 0.98)) ** 2) / (2 * (step * 3) ** 2))))
            
            call_ois.append(c_oi)
            put_ois.append(p_oi)
            
            strike_rows.append({
                "strike_price": k,
                "call_oi": c_oi,
                "call_oi_change": int(c_oi * 0.05),
                "call_ltp": round(call_ltp, 2),
                "call_iv": round(call_iv * 100, 2),
                "call_delta": c_greeks["delta"],
                "call_gamma": c_greeks["gamma"],
                "call_theta": c_greeks["theta"],
                "call_vega": c_greeks["vega"],
                "put_oi": p_oi,
                "put_oi_change": int(p_oi * 0.04),
                "put_ltp": round(put_ltp, 2),
                "put_iv": round(put_iv * 100, 2),
                "put_delta": p_greeks["delta"],
                "put_gamma": p_greeks["gamma"],
                "put_theta": p_greeks["theta"],
                "put_vega": p_greeks["vega"],
            })
            
        pcr = OptionsMath.calculate_pcr(call_ois, put_ois)
        max_pain = OptionsMath.calculate_max_pain(strikes, call_ois, put_ois)
        lot_size = 50 if clean_sym == "NIFTY50" else (15 if clean_sym == "BANKNIFTY" else 250)
        
        return {
            "underlying_symbol": clean_sym,
            "underlying_price": spot,
            "expiry_dates": expiries,
            "selected_expiry": selected_exp,
            "pcr": pcr,
            "max_pain": max_pain,
            "lot_size": lot_size,
            "strikes": strike_rows
        }

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        q = query.upper().strip()
        matches = []
        for sym, meta in self.BASE_INSTRUMENTS.items():
            if q in sym or q in meta["name"].upper():
                matches.append({
                    "symbol": sym,
                    "name": meta["name"],
                    "exchange": "NSE",
                    "type": meta["type"],
                    "sector": meta.get("sector")
                })
        return matches
