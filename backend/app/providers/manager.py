from .base import BaseMarketDataProvider
from .synthetic import SyntheticFixtureProvider
from .yfinance_provider import YFinanceNSEProvider
from ..core.config import settings

def get_market_data_provider() -> BaseMarketDataProvider:
    """Returns the configured data provider instance."""
    if settings.PRIMARY_DATA_PROVIDER == "yfinance_nse":
        return YFinanceNSEProvider()
    return SyntheticFixtureProvider()
