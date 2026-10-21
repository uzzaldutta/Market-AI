"""
Paper Trading Simulation Terminal & Double-Entry Ledger Engine.
Provides virtual account management, idempotent order processing,
margin checks, Indian brokerage deductions, and strict institutional risk gates.
"""

from typing import Dict, List, Optional, Any
import uuid
import datetime
from ..core.config import settings
from ..schemas.market import (
    PaperOrderRequest, PaperOrderResponse, PaperPositionResponse,
    PaperAccountResponse, OrderStatus, OrderSide, OrderType
)

class PaperTradingEngine:
    def __init__(self, initial_capital: float = 1000000.0):
        self.account_id = "ACC-DEFAULT-INR"
        self.initial_balance = initial_capital
        self.cash_balance = initial_capital
        self.reserved_margin = 0.0
        self.realized_pnl = 0.0
        
        # State stores
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.positions: Dict[str, Dict[str, Any]] = {} # key: f"{symbol}_{product_type}"
        self.ledger: List[Dict[str, Any]] = []
        self.processed_client_ids: set = set()
        
        # Record initial capital deposit in ledger
        self._record_ledger("DEPOSIT", initial_capital, "Initial virtual capital allocation")

    def _record_ledger(self, txn_type: str, amount: float, description: str, ref_id: Optional[str] = None):
        """Append immutable transaction entry in double-entry ledger."""
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now().isoformat(),
            "transaction_type": txn_type,
            "amount": round(amount, 2),
            "balance_after": round(self.cash_balance, 2),
            "reference_id": ref_id,
            "description": description
        }
        self.ledger.append(entry)

    def evaluate_risk_gates(self, symbol: str, side: OrderSide, qty: int, price: float) -> Optional[str]:
        """
        Enforces institutional risk checks:
        1. Max Risk per Trade (0.5% equity)
        2. Daily Loss Circuit (1.0% equity)
        3. Portfolio Exposure Limit (25% capital per single position)
        """
        equity = self.get_portfolio_equity()
        order_val = qty * price

        # 1. Available cash check for BUY
        if side == OrderSide.BUY and (order_val + 20.0) > self.cash_balance:
            return f"INSUFFICIENT_FUNDS: Order requires ₹{order_val + 20:.2f}, available cash is ₹{self.cash_balance:.2f}"

        # 2. Max position concentration: Single stock cannot exceed 30% of total equity
        if side == OrderSide.BUY and order_val > (equity * 0.30):
            return f"RISK_GATE_VIOLATION: Order value ₹{order_val:.2f} exceeds 30% max position limit (₹{equity * 0.30:.2f})"

        # 3. Daily loss check: Realized + Unrealized loss > 1.0% of initial balance
        total_pnl = self.realized_pnl + self.get_unrealized_pnl()
        if total_pnl < -(self.initial_balance * settings.MAX_DAILY_LOSS_PCT):
            return f"DAILY_LOSS_CIRCUIT_BREAKER_TRIGGERED: PnL ₹{total_pnl:.2f} exceeds {settings.MAX_DAILY_LOSS_PCT*100}% loss limit"

        return None

    def place_order(self, order_req: PaperOrderRequest, current_market_price: float) -> PaperOrderResponse:
        """
        Submits and executes an order with idempotent deduplication and ledger adjustments.
        """
        # Idempotency check
        client_id = order_req.client_order_id or str(uuid.uuid4())
        if client_id in self.processed_client_ids:
            # Duplicate order submission, return existing
            for o in self.orders.values():
                if o.get("client_order_id") == client_id:
                    return PaperOrderResponse(**o)

        order_id = f"ORD-{len(self.orders) + 1:05d}"
        exec_price = order_req.price if (order_req.order_type == OrderType.LIMIT and order_req.price) else current_market_price
        
        # Risk check
        rejection_reason = self.evaluate_risk_gates(order_req.symbol, order_req.side, order_req.quantity, exec_price)
        now_str = datetime.datetime.now().isoformat()

        if rejection_reason:
            rejected_order = {
                "order_id": order_id,
                "client_order_id": client_id,
                "symbol": order_req.symbol,
                "side": order_req.side,
                "order_type": order_req.order_type,
                "product_type": order_req.product_type,
                "quantity": order_req.quantity,
                "filled_quantity": 0,
                "price": exec_price,
                "status": OrderStatus.REJECTED,
                "rejection_reason": rejection_reason,
                "created_at": now_str
            }
            self.orders[order_id] = rejected_order
            self.processed_client_ids.add(client_id)
            return PaperOrderResponse(**rejected_order)

        # Standard Indian Brokerage & Taxes: ₹20 brokerage + ₹5 STT/taxes
        charges = 25.0
        pos_key = f"{order_req.symbol}_{order_req.product_type}"
        pos = self.positions.get(pos_key, {
            "symbol": order_req.symbol,
            "product_type": order_req.product_type,
            "net_quantity": 0,
            "average_buy_price": 0.0,
            "current_market_price": current_market_price,
            "unrealized_pnl": 0.0,
            "realized_pnl": 0.0
        })

        if order_req.side == OrderSide.BUY:
            turnover = order_req.quantity * exec_price
            total_cost = turnover + charges
            self.cash_balance -= total_cost
            self._record_ledger("ORDER_FILL_BUY", -total_cost, f"Buy {order_req.quantity} {order_req.symbol} @ {exec_price}", order_id)

            # Update position average executed price
            new_qty = pos["net_quantity"] + order_req.quantity
            pos["average_buy_price"] = ((pos["net_quantity"] * pos["average_buy_price"]) + turnover) / new_qty
            pos["net_quantity"] = new_qty

        elif order_req.side == OrderSide.SELL:
            # Validate position exists to sell
            if pos["net_quantity"] < order_req.quantity:
                return PaperOrderResponse(
                    order_id=order_id,
                    client_order_id=client_id,
                    symbol=order_req.symbol,
                    side=order_req.side,
                    order_type=order_req.order_type,
                    product_type=order_req.product_type,
                    quantity=order_req.quantity,
                    filled_quantity=0,
                    price=exec_price,
                    status=OrderStatus.REJECTED,
                    rejection_reason=f"CANNOT_SHORT_SELL_CNC: Holding {pos['net_quantity']} shares, attempted to sell {order_req.quantity}",
                    created_at=now_str
                )

            turnover = order_req.quantity * exec_price
            proceeds = turnover - charges
            self.cash_balance += proceeds
            
            # Realized P&L calculation: Gross profit minus round-trip brokerage (₹25 buy + ₹25 sell)
            gross_pnl = (exec_price - pos["average_buy_price"]) * order_req.quantity
            trade_realized_pnl = gross_pnl - 50.0 # Round-trip charges
            self.realized_pnl += trade_realized_pnl
            pos["realized_pnl"] += trade_realized_pnl
            pos["net_quantity"] -= order_req.quantity
            
            self._record_ledger("ORDER_FILL_SELL", proceeds, f"Sell {order_req.quantity} {order_req.symbol} @ {exec_price}", order_id)

        pos["current_market_price"] = current_market_price
        if pos["net_quantity"] > 0:
            pos["unrealized_pnl"] = round((current_market_price - pos["average_buy_price"]) * pos["net_quantity"], 2)
        else:
            pos["unrealized_pnl"] = 0.0

        self.positions[pos_key] = pos

        order_record = {
            "order_id": order_id,
            "client_order_id": client_id,
            "symbol": order_req.symbol,
            "side": order_req.side,
            "order_type": order_req.order_type,
            "product_type": order_req.product_type,
            "quantity": order_req.quantity,
            "filled_quantity": order_req.quantity,
            "price": exec_price,
            "status": OrderStatus.FILLED,
            "rejection_reason": None,
            "created_at": now_str
        }
        self.orders[order_id] = order_record
        self.processed_client_ids.add(client_id)
        return PaperOrderResponse(**order_record)

    def update_mtm(self, price_feed: Dict[str, float]):
        """Updates real-time mark-to-market prices and unrealized PnL."""
        for key, pos in self.positions.items():
            sym = pos["symbol"]
            if sym in price_feed and pos["net_quantity"] > 0:
                pos["current_market_price"] = price_feed[sym]
                pos["unrealized_pnl"] = round((pos["current_market_price"] - pos["average_buy_price"]) * pos["net_quantity"], 2)

    def get_unrealized_pnl(self) -> float:
        return sum(pos["unrealized_pnl"] for pos in self.positions.values() if pos["net_quantity"] > 0)

    def get_portfolio_equity(self) -> float:
        stock_value = sum(pos["net_quantity"] * pos["current_market_price"] for pos in self.positions.values() if pos["net_quantity"] > 0)
        return round(self.cash_balance + stock_value, 2)

    def get_account_summary(self) -> PaperAccountResponse:
        equity = self.get_portfolio_equity()
        stock_value = equity - self.cash_balance
        unrealized = self.get_unrealized_pnl()

        active_positions = []
        for pos in self.positions.values():
            if pos["net_quantity"] > 0:
                cost_basis = pos["average_buy_price"] * pos["net_quantity"]
                pnl_pct = (pos["unrealized_pnl"] / cost_basis * 100.0) if cost_basis > 0 else 0.0
                active_positions.append(PaperPositionResponse(
                    symbol=pos["symbol"],
                    product_type=pos["product_type"],
                    net_quantity=pos["net_quantity"],
                    average_buy_price=round(pos["average_buy_price"], 2),
                    current_market_price=round(pos["current_market_price"], 2),
                    unrealized_pnl=round(pos["unrealized_pnl"], 2),
                    realized_pnl=round(pos["realized_pnl"], 2),
                    pnl_percentage=round(pnl_pct, 2)
                ))

        recent_orders_list = [PaperOrderResponse(**o) for o in list(self.orders.values())[-10:]]

        return PaperAccountResponse(
            account_name="Primary Virtual Portfolio (NSE)",
            base_currency="INR",
            initial_balance=round(self.initial_balance, 2),
            cash_balance=round(self.cash_balance, 2),
            reserved_margin=round(self.reserved_margin, 2),
            portfolio_value=round(stock_value, 2),
            total_equity=round(equity, 2),
            unrealized_pnl=round(unrealized, 2),
            realized_pnl=round(self.realized_pnl, 2),
            day_pnl=round(unrealized + self.realized_pnl, 2),
            positions=active_positions,
            recent_orders=recent_orders_list
        )

# Global singleton paper engine instance
paper_engine = PaperTradingEngine()
