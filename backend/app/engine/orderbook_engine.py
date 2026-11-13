import random
from datetime import datetime
from typing import List, Dict, Any
from backend.app.schemas.market import (
    MarketDepthLevel,
    OrderBookDepthResponse
)
from backend.app.providers.manager import get_market_data_provider

class OrderBookDepthEngine:
    """
    Simulates institutional Level-3 order book market microstructure for Indian equities.
    Calculates bid-ask ladder, cumulative depth curves, order flow imbalance,
    and institutional iceberg order footprints.
    """

    def get_order_book_depth(self, symbol: str) -> OrderBookDepthResponse:
        sym = symbol.upper().strip()
        provider = get_market_data_provider()
        quote = provider.get_quote(sym)
        
        ltp = float(quote.ltp if hasattr(quote, 'ltp') else (quote.get('ltp', 2500.0) if isinstance(quote, dict) else 2500.0))
        tick_size = 0.05 if ltp < 1000 else (0.10 if ltp < 5000 else 0.50)
        
        spread = tick_size * random.choice([1, 2])
        best_bid = round(ltp - (spread / 2.0), 2)
        best_ask = round(ltp + (spread / 2.0), 2)

        # Generate 10 levels for bids and asks
        bids: List[MarketDepthLevel] = []
        cum_bid = 0
        for i in range(10):
            p = round(best_bid - (i * tick_size), 2)
            base_qty = int(random.randint(400, 3200) * (1.0 + (i * 0.15)))
            orders_cnt = random.randint(3, 28)
            # Simulated iceberg order injection on levels 3 or 7
            is_iceberg = (i == 3 or i == 6) and (hash(sym + str(i)) % 3 == 0)
            if is_iceberg:
                base_qty *= random.randint(4, 7)
                orders_cnt = random.randint(45, 95)
                
            cum_bid += base_qty
            bids.append(MarketDepthLevel(
                price=p,
                quantity=base_qty,
                orders=orders_cnt,
                cumulative_qty=cum_bid,
                is_iceberg=is_iceberg
            ))

        asks: List[MarketDepthLevel] = []
        cum_ask = 0
        for i in range(10):
            p = round(best_ask + (i * tick_size), 2)
            base_qty = int(random.randint(400, 3200) * (1.0 + (i * 0.15)))
            orders_cnt = random.randint(3, 28)
            is_iceberg = (i == 2 or i == 7) and (hash(sym + str(i + 5)) % 3 == 0)
            if is_iceberg:
                base_qty *= random.randint(4, 7)
                orders_cnt = random.randint(45, 95)
                
            cum_ask += base_qty
            asks.append(MarketDepthLevel(
                price=p,
                quantity=base_qty,
                orders=orders_cnt,
                cumulative_qty=cum_ask,
                is_iceberg=is_iceberg
            ))

        # Order Flow Imbalance: (TotalBid - TotalAsk) / (TotalBid + TotalAsk)
        total_bid = bids[-1].cumulative_qty
        total_ask = asks[-1].cumulative_qty
        ofi = round((total_bid - total_ask) / float(total_bid + total_ask), 3)

        # Icebergs detected summary
        icebergs = []
        for b in bids:
            if b.is_iceberg:
                icebergs.append({
                    "side": "BUY",
                    "price": b.price,
                    "quantity": b.quantity,
                    "orders": b.orders,
                    "type": "INSTITUTIONAL_BID_ABSORPTION"
                })
        for a in asks:
            if a.is_iceberg:
                icebergs.append({
                    "side": "SELL",
                    "price": a.price,
                    "quantity": a.quantity,
                    "orders": a.orders,
                    "type": "INSTITUTIONAL_SUPPLY_BLOCK"
                })

        return OrderBookDepthResponse(
            symbol=sym,
            ltp=ltp,
            spread=round(spread, 2),
            spread_pct=round((spread / ltp) * 100.0, 4),
            total_bid_qty=total_bid,
            total_ask_qty=total_ask,
            order_flow_imbalance=ofi,
            bids=bids,
            asks=asks,
            iceberg_detected=icebergs,
            timestamp=datetime.now().isoformat()
        )

orderbook_depth_engine = OrderBookDepthEngine()
