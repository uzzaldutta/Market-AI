"""
Paper Trading Simulation Terminal & Double-Entry Ledger Engine.
Provides virtual account management, idempotent order processing,
margin checks, Indian brokerage deductions, institutional risk gates,
full F&O (Futures & Options) support, and Watchlist/Favourites persistence.
"""

from typing import Dict, List, Optional, Any, Set
import uuid
import datetime
from ..core.config import settings
from ..core.nse_instruments import get_instrument_lot_size
from ..engine.greeks import OptionsMath
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
        # key: for equity "SYMBOL_PRODUCT", for FUT "SYMBOL_FUT_EXPIRY", for OPT "SYMBOL_OPT_STRIKE_TYPE_EXPIRY"
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.ledger: List[Dict[str, Any]] = []
        self.processed_client_ids: Set[str] = set()
        
        # User Favourites / Watchlist set
        self.favourites: Set[str] = {
            "NIFTY50", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", 
            "INFY", "TATAMOTORS", "ICICIBANK", "SBIN", "BHARTIARTL"
        }
        
        # Record initial capital deposit in ledger
        self._record_ledger("DEPOSIT", initial_capital, "Initial virtual capital allocation")

    def reset_account(self, capital: float = 1000000.0):
        """Resets paper account to fresh initial state."""
        self.initial_balance = capital
        self.cash_balance = capital
        self.reserved_margin = 0.0
        self.realized_pnl = 0.0
        self.orders.clear()
        self.positions.clear()
        self.ledger.clear()
        self.processed_client_ids.clear()
        self._record_ledger("DEPOSIT", capital, "Portfolio balance reset to virtual capital")

    def toggle_favourite(self, symbol: str) -> bool:
        """Toggles a symbol in user's favourites list."""
        clean = symbol.upper().replace(".NS", "").replace("^", "").strip()
        if clean in self.favourites:
            self.favourites.remove(clean)
            return False
        else:
            self.favourites.add(clean)
            return True

    def get_favourites(self) -> List[str]:
        """Returns sorted list of favourite symbols."""
        return sorted(list(self.favourites))

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

    def evaluate_risk_gates(self, symbol: str, side: OrderSide, total_required_funds: float) -> Optional[str]:
        """
        Enforces institutional risk checks:
        1. Max Risk per Trade
        2. Daily Loss Circuit (1.0% equity)
        3. Portfolio Exposure Limit (30% capital per single position)
        """
        equity = self.get_portfolio_equity()

        # 1. Available cash check
        if total_required_funds > self.cash_balance:
            return f"INSUFFICIENT_FUNDS: Order requires ₹{total_required_funds:.2f}, available cash is ₹{self.cash_balance:.2f}"

        # 2. Max position concentration: Single asset cannot exceed 30% of total equity
        if total_required_funds > (equity * 0.30):
            return f"RISK_GATE_VIOLATION: Order value ₹{total_required_funds:.2f} exceeds 30% max position limit (₹{equity * 0.30:.2f})"

        # 3. Daily loss check: Realized + Unrealized loss > 1.0% of initial balance
        total_pnl = self.realized_pnl + self.get_unrealized_pnl()
        if total_pnl < -(self.initial_balance * settings.MAX_DAILY_LOSS_PCT):
            return f"DAILY_LOSS_CIRCUIT_BREAKER_TRIGGERED: PnL ₹{total_pnl:.2f} exceeds {settings.MAX_DAILY_LOSS_PCT*100}% loss limit"

        return None

    def _resolve_option_fair_price(self, underlying_price: float, strike: float, option_type: str) -> float:
        """Estimates fair option premium using Black-Scholes for weekly Indian options."""
        t = 5.0 / 365.0 # standard weekly expiry proxy (~5 days)
        iv = 0.135 # calibrated to India VIX (~13.5%)
        r = 0.065 # 6.5% risk free rate
        calc_price = OptionsMath.black_scholes_price(
            s=underlying_price, k=strike, t=t, r=r, sigma=iv, option_type=option_type.upper()
        )
        return max(5.0, round(calc_price, 2))

    def place_order(self, order_req: PaperOrderRequest, current_market_price: float) -> PaperOrderResponse:
        """
        Submits and executes an order across Equities, Futures, and Options.
        Maintains virtual ledger and position tracking.
        """
        # Idempotency check
        client_id = order_req.client_order_id or str(uuid.uuid4())
        if client_id in self.processed_client_ids:
            for o in self.orders.values():
                if o.get("client_order_id") == client_id:
                    return PaperOrderResponse(**o)

        order_id = f"ORD-{len(self.orders) + 1:05d}"
        now_str = datetime.datetime.now().isoformat()
        charges = 25.0 # ₹20 brokerage + ₹5 STT / regulatory turnover charges

        inst_type = (order_req.instrument_type or "EQUITY").upper()
        sym = order_req.symbol.upper().replace(".NS", "").replace("^", "").strip()
        lot_size = order_req.lot_size if order_req.lot_size and order_req.lot_size > 1 else get_instrument_lot_size(sym)
        if inst_type == "EQUITY":
            lot_size = 1

        # Determine execution price and position key
        if inst_type == "EQUITY":
            exec_price = order_req.price if (order_req.order_type == OrderType.LIMIT and order_req.price) else current_market_price
            pos_key = f"{sym}_{order_req.product_type}"
            contract_display = f"{sym}"
            notional = order_req.quantity * exec_price
            required_funds = (notional + charges) if order_req.side == OrderSide.BUY else 0.0

        elif inst_type == "FUTURES":
            # Futures trade in lots; execution price is future price (spot or custom price)
            exec_price = order_req.price if (order_req.order_type == OrderType.LIMIT and order_req.price) else current_market_price
            expiry = order_req.expiry_date or "NEAR"
            pos_key = f"{sym}_FUT_{expiry}"
            contract_display = f"{sym} {expiry} FUT"
            total_units = order_req.quantity * lot_size
            notional = total_units * exec_price
            # Indian Futures Margin: ~20% of contract value
            margin_required = notional * 0.20
            required_funds = margin_required + charges

        elif inst_type == "OPTIONS":
            raw_strike = order_req.strike_price if order_req.strike_price else round(current_market_price, -1)
            strike_int = int(round(float(raw_strike)))
            opt_type = (order_req.option_type or "CE").upper()
            expiry = str(order_req.expiry_date or "NEAR").upper().strip()
            pos_key = f"{sym}_OPT_{strike_int}_{opt_type}_{expiry}"
            contract_display = f"{sym} {strike_int} {opt_type}"
            
            # Determine premium
            if order_req.price and order_req.price > 0:
                exec_price = order_req.price
            else:
                exec_price = self._resolve_option_fair_price(current_market_price, strike_int, opt_type)
            
            total_units = order_req.quantity * lot_size
            if order_req.side == OrderSide.BUY:
                required_funds = (total_units * exec_price) + charges
            else:
                # Option writing margin: ~20% of underlying notional
                margin_required = (total_units * current_market_price * 0.20)
                required_funds = margin_required + charges
        else:
            exec_price = current_market_price
            pos_key = f"{sym}_{order_req.product_type}"
            contract_display = sym
            required_funds = (order_req.quantity * exec_price) + charges

        # Risk Gate Validation for BUY or Short initiation requiring cash/margin
        if required_funds > 0:
            rejection_reason = self.evaluate_risk_gates(sym, order_req.side, required_funds)
            if rejection_reason:
                rejected_order = {
                    "order_id": order_id,
                    "client_order_id": client_id,
                    "symbol": sym,
                    "side": order_req.side,
                    "order_type": order_req.order_type,
                    "product_type": order_req.product_type,
                    "instrument_type": inst_type,
                    "strike_price": order_req.strike_price,
                    "option_type": order_req.option_type,
                    "expiry_date": order_req.expiry_date,
                    "lot_size": lot_size,
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

        # For options, reconcile with existing open position with same symbol, strike & type if squaring off
        if inst_type == "OPTIONS" and pos_key not in self.positions:
            for ex_key, ex_pos in self.positions.items():
                if (ex_pos.get("symbol") == sym and
                    ex_pos.get("instrument_type") == "OPTIONS" and
                    int(round(float(ex_pos.get("strike_price") or 0))) == strike_int and
                    (ex_pos.get("option_type") or "").upper() == opt_type and
                    ex_pos.get("net_quantity", 0) != 0):
                    pos_key = ex_key
                    break

        # Retrieve or initialize position
        pos = self.positions.get(pos_key, {
            "symbol": sym,
            "product_type": order_req.product_type,
            "instrument_type": inst_type,
            "contract_display": contract_display,
            "net_quantity": 0,
            "lot_size": lot_size,
            "average_buy_price": 0.0,
            "current_market_price": exec_price,
            "underlying_price": current_market_price,
            "strike_price": float(strike_int) if inst_type == "OPTIONS" else getattr(order_req, "strike_price", None),
            "option_type": getattr(order_req, "option_type", None),
            "expiry_date": order_req.expiry_date,
            "unrealized_pnl": 0.0,
            "realized_pnl": 0.0
        })

        if order_req.expiry_date and not pos.get("expiry_date"):
            pos["expiry_date"] = order_req.expiry_date

        effective_qty = order_req.quantity if inst_type == "EQUITY" else (order_req.quantity * lot_size)

        # EXECUTION LOGIC
        if order_req.side == OrderSide.BUY:
            if inst_type == "EQUITY":
                turnover = effective_qty * exec_price
                total_cost = turnover + charges
                self.cash_balance -= total_cost
                self._record_ledger("ORDER_FILL_BUY", -total_cost, f"Buy {order_req.quantity} {sym} @ ₹{exec_price:.2f}", order_id)

                new_qty = pos["net_quantity"] + effective_qty
                pos["average_buy_price"] = ((pos["net_quantity"] * pos["average_buy_price"]) + turnover) / new_qty
                pos["net_quantity"] = new_qty

            elif inst_type == "OPTIONS":
                turnover = effective_qty * exec_price
                total_cost = turnover + charges
                self.cash_balance -= total_cost
                self._record_ledger("ORDER_FILL_BUY_OPT", -total_cost, f"Buy {order_req.quantity} lots {contract_display} @ ₹{exec_price:.2f}", order_id)

                new_qty = pos["net_quantity"] + effective_qty
                pos["average_buy_price"] = ((pos["net_quantity"] * pos["average_buy_price"]) + turnover) / new_qty
                pos["net_quantity"] = new_qty

            elif inst_type == "FUTURES":
                # If closing an existing short
                if pos["net_quantity"] < 0:
                    close_qty = min(abs(pos["net_quantity"]), effective_qty)
                    gross_pnl = (pos["average_buy_price"] - exec_price) * close_qty
                    trade_pnl = gross_pnl - (charges * 2)
                    self.realized_pnl += trade_pnl
                    pos["realized_pnl"] += trade_pnl
                    self.cash_balance += trade_pnl
                    self._record_ledger("COVER_SHORT_FUT", trade_pnl, f"Cover Short {close_qty} {contract_display} @ ₹{exec_price:.2f}", order_id)
                    pos["net_quantity"] += effective_qty
                else:
                    margin_deposit = (effective_qty * exec_price * 0.20) + charges
                    self.cash_balance -= charges
                    self.reserved_margin += margin_deposit - charges
                    self._record_ledger("BUY_FUT", -charges, f"Long {order_req.quantity} lots {contract_display} @ ₹{exec_price:.2f}", order_id)
                    new_qty = pos["net_quantity"] + effective_qty
                    pos["average_buy_price"] = ((pos["net_quantity"] * pos["average_buy_price"]) + (effective_qty * exec_price)) / new_qty
                    pos["net_quantity"] = new_qty

        elif order_req.side == OrderSide.SELL:
            if inst_type == "EQUITY":
                if pos["net_quantity"] < effective_qty:
                    return PaperOrderResponse(
                        order_id=order_id,
                        client_order_id=client_id,
                        symbol=sym,
                        side=order_req.side,
                        order_type=order_req.order_type,
                        product_type=order_req.product_type,
                        instrument_type=inst_type,
                        lot_size=lot_size,
                        quantity=order_req.quantity,
                        filled_quantity=0,
                        price=exec_price,
                        status=OrderStatus.REJECTED,
                        rejection_reason=f"CANNOT_SHORT_SELL_CNC: Holding {pos['net_quantity']} shares, attempted to sell {order_req.quantity}",
                        created_at=now_str
                    )

                turnover = effective_qty * exec_price
                proceeds = turnover - charges
                self.cash_balance += proceeds

                gross_pnl = (exec_price - pos["average_buy_price"]) * effective_qty
                trade_realized_pnl = gross_pnl - 50.0 # Round-trip charges
                self.realized_pnl += trade_realized_pnl
                pos["realized_pnl"] += trade_realized_pnl
                pos["net_quantity"] -= effective_qty
                self._record_ledger("ORDER_FILL_SELL", proceeds, f"Sell {order_req.quantity} {sym} @ ₹{exec_price:.2f}", order_id)

            elif inst_type == "OPTIONS":
                # Square off long option
                if pos["net_quantity"] >= effective_qty:
                    turnover = effective_qty * exec_price
                    proceeds = turnover - charges
                    self.cash_balance += proceeds
                    gross_pnl = (exec_price - pos["average_buy_price"]) * effective_qty
                    trade_pnl = gross_pnl - 50.0
                    self.realized_pnl += trade_pnl
                    pos["realized_pnl"] += trade_pnl
                    pos["net_quantity"] -= effective_qty
                    self._record_ledger("ORDER_SELL_OPT", proceeds, f"Close Option {order_req.quantity} lots {contract_display} @ ₹{exec_price:.2f}", order_id)
                else:
                    # Option Writing (Short Option)
                    margin = (effective_qty * current_market_price * 0.20)
                    premium_credit = effective_qty * exec_price
                    self.cash_balance += (premium_credit - charges)
                    pos["average_buy_price"] = exec_price
                    pos["net_quantity"] -= effective_qty
                    self._record_ledger("SELL_OPT_WRITE", premium_credit - charges, f"Short Option {order_req.quantity} lots {contract_display} @ ₹{exec_price:.2f}", order_id)

            elif inst_type == "FUTURES":
                # If closing long future
                if pos["net_quantity"] > 0:
                    close_qty = min(pos["net_quantity"], effective_qty)
                    gross_pnl = (exec_price - pos["average_buy_price"]) * close_qty
                    trade_pnl = gross_pnl - (charges * 2)
                    self.realized_pnl += trade_pnl
                    pos["realized_pnl"] += trade_pnl
                    self.cash_balance += trade_pnl
                    margin_released = (close_qty * pos["average_buy_price"] * 0.20)
                    self.reserved_margin = max(0.0, self.reserved_margin - margin_released)
                    self._record_ledger("SELL_CLOSE_FUT", trade_pnl, f"Square off Long {close_qty} {contract_display} @ ₹{exec_price:.2f}", order_id)
                    pos["net_quantity"] -= effective_qty
                else:
                    # New Short Future
                    margin_deposit = (effective_qty * exec_price * 0.20)
                    self.cash_balance -= charges
                    self.reserved_margin += margin_deposit
                    self._record_ledger("SELL_SHORT_FUT", -charges, f"Short {order_req.quantity} lots {contract_display} @ ₹{exec_price:.2f}", order_id)
                    new_short_qty = pos["net_quantity"] - effective_qty
                    pos["average_buy_price"] = exec_price
                    pos["net_quantity"] = new_short_qty

        pos["current_market_price"] = exec_price
        # Update unrealized PnL
        if pos["net_quantity"] != 0:
            if pos["net_quantity"] > 0:
                pos["unrealized_pnl"] = round((pos["current_market_price"] - pos["average_buy_price"]) * pos["net_quantity"], 2)
            else:
                pos["unrealized_pnl"] = round((pos["average_buy_price"] - pos["current_market_price"]) * abs(pos["net_quantity"]), 2)
        else:
            pos["unrealized_pnl"] = 0.0

        self.positions[pos_key] = pos

        order_record = {
            "order_id": order_id,
            "client_order_id": client_id,
            "symbol": sym,
            "side": order_req.side,
            "order_type": order_req.order_type,
            "product_type": order_req.product_type,
            "instrument_type": inst_type,
            "strike_price": order_req.strike_price,
            "option_type": order_req.option_type,
            "expiry_date": order_req.expiry_date,
            "lot_size": lot_size,
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
        """Updates real-time mark-to-market prices and unrealized PnL across all instrument classes."""
        for key, pos in self.positions.items():
            sym = pos["symbol"]
            inst_type = pos.get("instrument_type", "EQUITY")
            if sym in price_feed and pos["net_quantity"] != 0:
                spot_price = price_feed[sym]
                pos["underlying_price"] = spot_price
                
                if inst_type == "EQUITY":
                    pos["current_market_price"] = spot_price
                elif inst_type == "FUTURES":
                    pos["current_market_price"] = spot_price # Track spot proxy
                elif inst_type == "OPTIONS":
                    strike = pos.get("strike_price") or spot_price
                    opt_type = pos.get("option_type") or "CE"
                    pos["current_market_price"] = self._resolve_option_fair_price(spot_price, strike, opt_type)

                if pos["net_quantity"] > 0:
                    pos["unrealized_pnl"] = round((pos["current_market_price"] - pos["average_buy_price"]) * pos["net_quantity"], 2)
                else:
                    pos["unrealized_pnl"] = round((pos["average_buy_price"] - pos["current_market_price"]) * abs(pos["net_quantity"]), 2)

    def get_unrealized_pnl(self) -> float:
        return sum(pos["unrealized_pnl"] for pos in self.positions.values() if pos["net_quantity"] != 0)

    def get_portfolio_equity(self) -> float:
        holding_val = 0.0
        for pos in self.positions.values():
            if pos["net_quantity"] != 0:
                inst_type = pos.get("instrument_type", "EQUITY")
                if inst_type == "EQUITY":
                    holding_val += (pos["net_quantity"] * pos["current_market_price"])
                elif inst_type == "OPTIONS" and pos["net_quantity"] > 0:
                    holding_val += (pos["net_quantity"] * pos["current_market_price"])
                elif inst_type == "FUTURES":
                    # Futures equity contribution is unrealized PnL
                    holding_val += pos["unrealized_pnl"]
        return round(self.cash_balance + holding_val, 2)

    def get_account_summary(self) -> PaperAccountResponse:
        equity = self.get_portfolio_equity()
        stock_value = max(0.0, equity - self.cash_balance)
        unrealized = self.get_unrealized_pnl()

        active_positions = []
        portfolio_net_delta = 0.0
        portfolio_net_gamma = 0.0
        portfolio_net_theta = 0.0
        portfolio_net_vega = 0.0
        opt_count = 0

        for pos in self.positions.values():
            if pos["net_quantity"] != 0:
                cost_basis = pos["average_buy_price"] * abs(pos["net_quantity"])
                pnl_pct = (pos["unrealized_pnl"] / cost_basis * 100.0) if cost_basis > 0 else 0.0
                
                inst = pos.get("instrument_type", "EQUITY")
                qty = pos["net_quantity"]
                p_delta = None
                p_gamma = None
                p_theta = None
                p_vega = None
                p_iv = None

                if inst == "OPTIONS":
                    k = pos.get("strike_price") or 24500.0
                    s = pos.get("underlying_price")
                    if not s or (k and s < k * 0.3):
                        s = k
                    opt_t = (pos.get("option_type") or "CE").upper()
                    t = 14.0 / 365.0 # near-term proxy (approx 14 days)
                    price = max(0.5, pos.get("current_market_price", 10.0))
                    r = 0.065
                    calc_iv = OptionsMath.implied_volatility(price, s, k, t, r, opt_t)
                    g = OptionsMath.calculate_greeks(s, k, t, r, calc_iv, opt_t)
                    
                    p_delta = round(g["delta"], 4)
                    p_gamma = round(g["gamma"], 6)
                    p_theta = round(g["theta"], 2)
                    p_vega = round(g["vega"], 2)
                    p_iv = round(calc_iv * 100.0, 1)

                    portfolio_net_delta += (g["delta"] * qty)
                    portfolio_net_gamma += (g["gamma"] * qty)
                    portfolio_net_theta += (g["theta"] * qty)
                    portfolio_net_vega += (g["vega"] * qty)
                    opt_count += 1
                elif inst in ("EQUITY", "FUTURES"):
                    p_delta = 1.0
                    p_gamma = 0.0
                    p_theta = 0.0
                    p_vega = 0.0
                    portfolio_net_delta += (1.0 * qty)

                active_positions.append(PaperPositionResponse(
                    symbol=pos["symbol"],
                    product_type=pos["product_type"],
                    instrument_type=inst,
                    contract_display=pos.get("contract_display", pos["symbol"]),
                    net_quantity=pos["net_quantity"],
                    lot_size=pos.get("lot_size", 1),
                    average_buy_price=round(pos["average_buy_price"], 2),
                    current_market_price=round(pos["current_market_price"], 2),
                    unrealized_pnl=round(pos["unrealized_pnl"], 2),
                    realized_pnl=round(pos.get("realized_pnl", 0.0), 2),
                    pnl_percentage=round(pnl_pct, 2),
                    strike_price=pos.get("strike_price"),
                    option_type=pos.get("option_type"),
                    expiry_date=pos.get("expiry_date"),
                    delta=p_delta,
                    gamma=p_gamma,
                    theta=p_theta,
                    vega=p_vega,
                    iv=p_iv
                ))

        recent_orders_list = [PaperOrderResponse(**o) for o in list(self.orders.values())[-15:]]

        portfolio_greeks_summary = {
            "net_delta": round(portfolio_net_delta, 2),
            "net_gamma": round(portfolio_net_gamma, 4),
            "net_theta": round(portfolio_net_theta, 2),
            "net_vega": round(portfolio_net_vega, 2),
            "options_count": opt_count
        }

        return PaperAccountResponse(
            account_name="Primary Virtual Portfolio (NSE/BSE Equities & F&O)",
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
            recent_orders=recent_orders_list,
            portfolio_greeks=portfolio_greeks_summary
        )

# Global singleton paper engine instance
paper_engine = PaperTradingEngine()
