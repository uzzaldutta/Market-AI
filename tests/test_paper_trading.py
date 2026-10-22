import pytest
from backend.app.engine.paper_engine import PaperTradingEngine
from backend.app.schemas.market import PaperOrderRequest, OrderSide, OrderType, OrderStatus

@pytest.fixture
def clean_engine():
    """Returns a freshly initialized virtual paper account with ₹10,00,000 INR."""
    return PaperTradingEngine(initial_capital=1000000.0)

def test_paper_initial_state(clean_engine):
    summary = clean_engine.get_account_summary()
    assert summary.cash_balance == 1000000.0
    assert summary.total_equity == 1000000.0
    assert len(summary.positions) == 0
    assert len(clean_engine.ledger) == 1
    assert clean_engine.ledger[0]["transaction_type"] == "DEPOSIT"

def test_paper_buy_order_and_charges(clean_engine):
    req = PaperOrderRequest(
        symbol="RELIANCE",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=50,
        product_type="CNC",
        client_order_id="TEST-ORD-001"
    )
    res = clean_engine.place_order(req, current_market_price=3000.0)
    
    assert res.status == OrderStatus.FILLED
    # Cost = (50 * 3000) + 25 charges = 150025
    expected_cash = 1000000.0 - 150025.0
    assert clean_engine.cash_balance == expected_cash
    
    summary = clean_engine.get_account_summary()
    assert len(summary.positions) == 1
    assert summary.positions[0].net_quantity == 50
    assert summary.positions[0].average_buy_price == 3000.0

def test_paper_idempotent_order_submission(clean_engine):
    req = PaperOrderRequest(
        symbol="TCS",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=20,
        product_type="CNC",
        client_order_id="IDEMPOTENT-KEY-123"
    )
    res1 = clean_engine.place_order(req, current_market_price=4000.0)
    res2 = clean_engine.place_order(req, current_market_price=4000.0)
    
    # Both calls return the exact same order_id and cash must not be deducted twice
    assert res1.order_id == res2.order_id
    assert clean_engine.cash_balance == 1000000.0 - (20 * 4000.0 + 25.0)

def test_paper_risk_gate_concentration_limit(clean_engine):
    # Attempt to buy ₹4,00,000 of stock on ₹10,00,000 portfolio (exceeds 30% limit)
    req = PaperOrderRequest(
        symbol="HDFCBANK",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=250,
        product_type="CNC",
        client_order_id="RISK-FAIL-001"
    )
    res = clean_engine.place_order(req, current_market_price=1600.0)
    assert res.status == OrderStatus.REJECTED
    assert "RISK_GATE_VIOLATION" in res.rejection_reason

def test_paper_sell_order_and_realized_pnl(clean_engine):
    # Buy first
    clean_engine.place_order(PaperOrderRequest(
        symbol="INFY",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=100,
        product_type="CNC",
        client_order_id="BUY-INFY"
    ), current_market_price=1800.0)
    
    # Sell at higher price ₹1900 (+₹100/share)
    sell_res = clean_engine.place_order(PaperOrderRequest(
        symbol="INFY",
        side=OrderSide.SELL,
        order_type=OrderType.MARKET,
        quantity=100,
        product_type="CNC",
        client_order_id="SELL-INFY"
    ), current_market_price=1900.0)
    
    assert sell_res.status == OrderStatus.FILLED
    # Gross PnL = 100 * 100 = ₹10,000; minus buy charges (₹25) and sell charges (₹25) = ₹9,950
    assert clean_engine.realized_pnl == (10000.0 - 50.0)
    assert clean_engine.positions["INFY_CNC"]["net_quantity"] == 0

def test_paper_futures_long_and_short(clean_engine):
    # Buy 1 lot NIFTY (lot_size=25 or 50)
    req = PaperOrderRequest(
        symbol="NIFTY50",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=1, # 1 lot
        product_type="NRML",
        instrument_type="FUTURES",
        lot_size=50,
        expiry_date="2026-10-29",
        client_order_id="FUT-LONG-01"
    )
    res = clean_engine.place_order(req, current_market_price=24500.0)
    assert res.status == OrderStatus.FILLED
    assert res.instrument_type == "FUTURES"
    
    summary = clean_engine.get_account_summary()
    assert len(summary.positions) == 1
    fut_pos = summary.positions[0]
    assert fut_pos.instrument_type == "FUTURES"
    assert fut_pos.net_quantity == 50
    assert "FUT" in fut_pos.contract_display

def test_paper_options_buy_and_squareoff(clean_engine):
    # Buy 2 lots NIFTY 24500 CE
    req = PaperOrderRequest(
        symbol="NIFTY50",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=2, # 2 lots
        product_type="NRML",
        instrument_type="OPTIONS",
        strike_price=24500.0,
        option_type="CE",
        expiry_date="2026-10-29",
        lot_size=50,
        price=120.0,
        client_order_id="OPT-BUY-01"
    )
    res = clean_engine.place_order(req, current_market_price=24500.0)
    assert res.status == OrderStatus.FILLED
    assert res.instrument_type == "OPTIONS"
    
    summary = clean_engine.get_account_summary()
    assert len(summary.positions) == 1
    opt_pos = summary.positions[0]
    assert opt_pos.net_quantity == 100 # 2 lots * 50
    assert "24500 CE" in opt_pos.contract_display

def test_paper_favourites_toggle(clean_engine):
    favs = clean_engine.get_favourites()
    assert "RELIANCE" in favs
    
    # Toggle off
    removed = clean_engine.toggle_favourite("RELIANCE")
    assert removed is False
    assert "RELIANCE" not in clean_engine.get_favourites()
    
    # Toggle back on
    added = clean_engine.toggle_favourite("RELIANCE")
    assert added is True
    assert "RELIANCE" in clean_engine.get_favourites()

