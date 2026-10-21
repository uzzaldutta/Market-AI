import os
from typing import Dict, Any

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bharat Market Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./market_intelligence.db")
    
    # Market Trading Hours (Asia/Kolkata)
    TIMEZONE: str = "Asia/Kolkata"
    MARKET_OPEN_HOUR: int = 9
    MARKET_OPEN_MINUTE: int = 15
    MARKET_CLOSE_HOUR: int = 15
    MARKET_CLOSE_MINUTE: int = 30
    
    # Providers
    PRIMARY_DATA_PROVIDER: str = os.getenv("PRIMARY_DATA_PROVIDER", "yfinance_nse")
    ENABLE_SYNTHETIC_FALLBACK: bool = True
    CACHE_EXPIRATION_SECONDS: int = 30
    
    # Standard Index Multipliers & Lot Sizes for Indian Markets
    LOT_SIZES: Dict[str, int] = {
        "NIFTY50": 50,
        "BANKNIFTY": 15,
        "FINNIFTY": 40,
        "MIDCPNIFTY": 75,
        "RELIANCE": 250,
        "TCS": 175,
        "INFY": 400,
        "HDFCBANK": 550,
        "ICICIBANK": 700,
        "SBIN": 1500,
        "BHARTIARTL": 950,
        "ITC": 1600,
        "LT": 300,
        "TATAMOTORS": 1425,
    }
    
    # Risk Limits Defaults
    MAX_RISK_PER_TRADE_PCT: float = 0.005  # 0.5%
    MAX_PORTFOLIO_EXPOSURE_PCT: float = 0.02 # 2.0%
    MAX_DAILY_LOSS_PCT: float = 0.01        # 1.0%

settings = Settings()

