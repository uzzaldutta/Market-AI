import pytest
from backend.app.providers.manager import get_market_data_provider
from backend.app.engine.paper_engine import paper_engine
from backend.app.schemas.market import PaperOrderRequest, OrderSide, OrderType

def test_nse_and_bse_option_chains():
    provider = get_market_data_provider()

    # 1. Test NSE NIFTY 50 Option Chain
    nifty_chain = provider.get_option_chain("NIFTY50")
    assert nifty_chain["underlying_symbol"] == "NIFTY50"
    assert nifty_chain["exchange"] == "NSE"
    assert nifty_chain["lot_size"] == 50
    assert len(nifty_chain["strikes"]) >= 10
    assert nifty_chain["pcr"] > 0
    assert nifty_chain["max_pain"] > 10000

    # 2. Test BSE SENSEX Option Chain
    sensex_chain = provider.get_option_chain("SENSEX")
    assert sensex_chain["underlying_symbol"] == "SENSEX"
    assert sensex_chain["exchange"] == "BSE"
    assert sensex_chain["lot_size"] == 10
    assert len(sensex_chain["strikes"]) >= 10
    assert sensex_chain["underlying_price"] > 70000

    # 3. Test BSE BANKEX Option Chain
    bankex_chain = provider.get_option_chain("BANKEX")
    assert bankex_chain["underlying_symbol"] == "BANKEX"
    assert bankex_chain["exchange"] == "BSE"
    assert bankex_chain["lot_size"] == 15

def test_direct_options_paper_order_execution():
    provider = get_market_data_provider()
    sensex_chain = provider.get_option_chain("SENSEX")
    atm_strike = sensex_chain["strikes"][len(sensex_chain["strikes"]) // 2]

    # Submit paper BUY order for ATM Call
    req = PaperOrderRequest(
        symbol="SENSEX",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=1, # 1 lot = 10 units
        price=atm_strike["call_ltp"],
        product_type="NRML",
        instrument_type="OPTIONS",
        strike_price=atm_strike["strike_price"],
        option_type="CE",
        expiry_date=sensex_chain["selected_expiry"],
        lot_size=10
    )

    res = paper_engine.place_order(req, current_market_price=sensex_chain["underlying_price"])
    assert res.status.value == "FILLED"
    assert res.symbol == "SENSEX"
    assert res.instrument_type == "OPTIONS"
    assert res.strike_price == atm_strike["strike_price"]
    assert res.option_type == "CE"

    # Verify positions in paper engine
    pos_key = f"SENSEX_OPT_{atm_strike['strike_price']}_CE_{sensex_chain['selected_expiry']}"
    assert pos_key in paper_engine.positions
    pos = paper_engine.positions[pos_key]
    assert pos["net_quantity"] >= 10
    assert pos["instrument_type"] == "OPTIONS"
    assert "SENSEX" in pos["contract_display"]
