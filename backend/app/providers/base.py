"""
Base Abstract Interface for Indian Market Data Providers.
Provides unified interface for Quotes, Candles, Option Chains, and Overview.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
import zoneinfo

class BaseMarketDataProvider(ABC):
    def __init__(self, name: str):
        self.name = name
        self.ist_tz = zoneinfo.ZoneInfo("Asia/Kolkata")

    def get_market_session_info(self) -> Dict[str, Any]:
        """
        Determines current Indian market session status according to IST trading hours.
        Normal: 09:15 - 15:30 IST (Monday - Friday).
        """
        now_ist = datetime.now(self.ist_tz)
        weekday = now_ist.weekday() # 0 = Monday, 6 = Sunday
        current_time = now_ist.time()
        
        is_weekday = weekday < 5
        market_open_time = datetime.strptime("09:15:00", "%H:%M:%S").time()
        market_close_time = datetime.strptime("15:30:00", "%H:%M:%S").time()
        pre_open_time = datetime.strptime("09:00:00", "%H:%M:%S").time()
        
        if not is_weekday:
            status = "CLOSED"
            is_open = False
        elif pre_open_time <= current_time < market_open_time:
            status = "PRE_OPEN"
            is_open = False
        elif market_open_time <= current_time <= market_close_time:
            status = "OPEN"
            is_open = True
        else:
            status = "CLOSED"
            is_open = False
            
        return {
            "timestamp": now_ist.isoformat(),
            "status": status,
            "is_market_open": is_open,
            "exchange": "NSE/BSE",
            "timezone": "Asia/Kolkata"
        }

    @abstractmethod
    def get_market_overview(self) -> Dict[str, Any]:
        """Returns overview with benchmark indices, market breadth, and sector performance."""
        pass

    @abstractmethod
    def get_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetches latest quote with LTP, changes, high/low, and quality tag."""
        pass

    @abstractmethod
    def get_candles(self, symbol: str, timeframe: str = "1D", count: int = 100) -> List[Dict[str, Any]]:
        """Returns historical OHLCV candle bars."""
        pass

    @abstractmethod
    def get_option_chain(self, symbol: str, expiry: Optional[str] = None) -> Dict[str, Any]:
        """Returns option chain with open interest, LTP, strikes, and Greeks."""
        pass

    @abstractmethod
    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        """Searches available equity and index instruments."""
        pass
