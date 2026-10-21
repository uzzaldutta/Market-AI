import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_api_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "market_session" in data

def test_api_overview(client):
    res = client.get("/api/v1/overview")
    assert res.status_code == 200
    data = res.json()
    assert "indices" in data
    assert len(data["indices"]) >= 2
    assert "top_gainers" in data

def test_api_quote(client):
    res = client.get("/api/v1/instruments/RELIANCE/quote")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "RELIANCE"
    assert data["ltp"] > 0

def test_api_candles(client):
    res = client.get("/api/v1/instruments/RELIANCE/candles?timeframe=1D&count=50")
    assert res.status_code == 200
    candles = res.json()
    assert len(candles) == 50
    assert "close" in candles[0]

def test_api_indicators(client):
    res = client.get("/api/v1/instruments/RELIANCE/indicators")
    assert res.status_code == 200
    data = res.json()
    assert "rsi_14" in data
    assert "trend_state" in data

def test_api_options_chain(client):
    res = client.get("/api/v1/options/NIFTY50/chain")
    assert res.status_code == 200
    data = res.json()
    assert data["underlying_symbol"] == "NIFTY50"
    assert len(data["strikes"]) > 0
    assert "max_pain" in data

def test_api_predictions(client):
    res = client.get("/api/v1/predictions/RELIANCE?horizon=1_SESSION")
    assert res.status_code == 200
    data = res.json()
    assert "bullish_prob" in data
    assert "supporting_factors" in data

def test_api_signals(client):
    res = client.get("/api/v1/signals/RELIANCE")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ELIGIBLE", "WATCH", "BLOCKED", "NO_TRADE"]

def test_api_screener(client):
    payload = {"preset": "STRONG_BULLISH"}
    res = client.post("/api/v1/screener", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert "total" in data

def test_api_paper_trading_flow(client):
    # 1. Get initial account
    acc_res = client.get("/api/v1/paper/account")
    assert acc_res.status_code == 200
    acc_data = acc_res.json()
    assert acc_data["initial_balance"] == 1000000.0

    # 2. Place paper buy order
    order_payload = {
        "symbol": "TCS",
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 10,
        "product_type": "CNC"
    }
    ord_res = client.post("/api/v1/paper/orders", json=order_payload)
    assert ord_res.status_code == 200
    ord_data = ord_res.json()
    assert ord_data["status"] == "FILLED"
