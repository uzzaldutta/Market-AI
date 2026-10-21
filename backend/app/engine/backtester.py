"""
Backtesting Laboratory Engine for Indian Equities.
Chronological event simulation with realistic Indian transaction costs
(Brokerage, STT, Exchange fees, Stamp Duty) and slippage modeling.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any
from .indicators import TechnicalIndicators

class BacktestEngine:
    def __init__(self, initial_capital: float = 1000000.0, slippage_pct: float = 0.0005):
        self.initial_capital = initial_capital
        self.slippage_pct = slippage_pct # 0.05% slippage

    def calculate_charges(self, turnover: float) -> float:
        """
        Calculates realistic Indian stock exchange transaction costs:
        - Flat brokerage: ₹20 per trade
        - STT (Securities Transaction Tax): ~0.1% on equity delivery
        - Exchange transaction charges: ~0.00345%
        - SEBI turnover charges: ~0.0001%
        - Stamp duty: ~0.015%
        - GST: 18% on (brokerage + transaction charges)
        """
        brokerage = 20.0
        stt = turnover * 0.001
        txn_charges = turnover * 0.0000345
        sebi_charges = turnover * 0.000001
        stamp_duty = turnover * 0.00015
        gst = (brokerage + txn_charges) * 0.18
        return round(brokerage + stt + txn_charges + sebi_charges + stamp_duty + gst, 2)

    def run_strategy(self, symbol: str, df: pd.DataFrame, strategy: str = "TREND_BREAKOUT") -> Dict[str, Any]:
        """
        Executes backtest over historical candles DataFrame.
        Columns required: ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        """
        if len(df) < 50:
            return {"error": "Insufficient data for backtesting (minimum 50 bars required)"}

        # Indicators computed in advance (strictly historical at each bar t)
        close = df['close']
        high = df['high']
        low = df['low']
        volume = df['volume']

        sma_20 = TechnicalIndicators.sma(close, 20)
        sma_50 = TechnicalIndicators.sma(close, 50)
        rsi = TechnicalIndicators.rsi(close, 14)
        atr = TechnicalIndicators.atr(high, low, close, 14)

        cash = self.initial_capital
        equity = self.initial_capital
        position = 0 # Quantity of shares held
        entry_price = 0.0
        entry_date = ""

        trades = []
        equity_curve = []
        total_fees = 0.0

        for i in range(50, len(df)):
            curr_bar = df.iloc[i]
            prev_bar = df.iloc[i - 1]
            t_date = str(curr_bar['timestamp'])
            c_price = float(curr_bar['close'])
            c_high = float(curr_bar['high'])
            c_low = float(curr_bar['low'])
            curr_atr = float(atr.iloc[i])

            # Current Equity mark-to-market
            equity = cash + (position * c_price)
            equity_curve.append({
                "date": t_date,
                "equity": round(equity, 2),
                "cash": round(cash, 2)
            })

            # Check Exit Conditions if Long
            if position > 0:
                stop_loss = entry_price - (2.0 * curr_atr)
                target = entry_price + (3.0 * curr_atr)
                
                exit_signal = False
                exit_reason = ""
                exit_p = c_price

                if c_low <= stop_loss:
                    exit_signal = True
                    exit_reason = "STOP_LOSS_HIT"
                    exit_p = stop_loss * (1.0 - self.slippage_pct)
                elif c_high >= target:
                    exit_signal = True
                    exit_reason = "TARGET_HIT"
                    exit_p = target * (1.0 - self.slippage_pct)
                elif close.iloc[i] < sma_20.iloc[i]:
                    exit_signal = True
                    exit_reason = "TREND_INVALIDATION"
                    exit_p = c_price * (1.0 - self.slippage_pct)

                if exit_signal:
                    turnover = position * exit_p
                    fees = self.calculate_charges(turnover)
                    total_fees += fees
                    gross_pnl = (exit_p - entry_price) * position
                    net_pnl = gross_pnl - fees
                    cash += turnover - fees
                    
                    trades.append({
                        "symbol": symbol,
                        "direction": "LONG",
                        "entry_date": entry_date,
                        "exit_date": t_date,
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(exit_p, 2),
                        "quantity": position,
                        "gross_pnl": round(gross_pnl, 2),
                        "fees": round(fees, 2),
                        "net_pnl": round(net_pnl, 2),
                        "return_pct": round((net_pnl / (entry_price * position)) * 100, 2),
                        "exit_reason": exit_reason
                    })
                    position = 0

            # Check Entry Conditions if Flat
            elif position == 0 and i < len(df) - 1:
                is_buy = False
                if strategy == "TREND_BREAKOUT":
                    # Close crossed above 20 SMA with RSI > 55
                    if close.iloc[i] > sma_20.iloc[i] and close.iloc[i - 1] <= sma_20.iloc[i - 1] and rsi.iloc[i] > 55:
                        is_buy = True
                elif strategy == "SMA_CROSS":
                    if sma_20.iloc[i] > sma_50.iloc[i] and sma_20.iloc[i - 1] <= sma_50.iloc[i - 1]:
                        is_buy = True
                elif strategy == "RSI_PULLBACK":
                    if close.iloc[i] > sma_50.iloc[i] and rsi.iloc[i] < 45 and rsi.iloc[i] > rsi.iloc[i - 1]:
                        is_buy = True

                if is_buy:
                    exec_price = c_price * (1.0 + self.slippage_pct)
                    # Position sizing: Risk 1% of equity per trade
                    risk_per_share = max(1.0, 2.0 * curr_atr)
                    capital_to_risk = equity * 0.01
                    target_qty = int(capital_to_risk / risk_per_share)
                    # Max 25% portfolio capital per single equity position
                    max_alloc_qty = int((equity * 0.25) / exec_price)
                    qty = min(target_qty, max_alloc_qty)

                    if qty > 0 and (qty * exec_price) < cash:
                        turnover = qty * exec_price
                        fees = self.calculate_charges(turnover)
                        total_fees += fees
                        cash -= (turnover + fees)
                        position = qty
                        entry_price = exec_price
                        entry_date = t_date

        # Close any lingering open position at last bar price
        if position > 0:
            last_c = float(df['close'].iloc[-1])
            turnover = position * last_c
            fees = self.calculate_charges(turnover)
            total_fees += fees
            gross_pnl = (last_c - entry_price) * position
            net_pnl = gross_pnl - fees
            cash += turnover - fees
            trades.append({
                "symbol": symbol,
                "direction": "LONG",
                "entry_date": entry_date,
                "exit_date": str(df.iloc[-1]['timestamp']),
                "entry_price": round(entry_price, 2),
                "exit_price": round(last_c, 2),
                "quantity": position,
                "gross_pnl": round(gross_pnl, 2),
                "fees": round(fees, 2),
                "net_pnl": round(net_pnl, 2),
                "return_pct": round((net_pnl / (entry_price * position)) * 100, 2),
                "exit_reason": "BACKTEST_END_SETTLEMENT"
            })

        final_equity = cash
        net_profit = final_equity - self.initial_capital
        net_return_pct = (net_profit / self.initial_capital) * 100.0

        # Calculate metrics
        wins = [t for t in trades if t["net_pnl"] > 0]
        losses = [t for t in trades if t["net_pnl"] <= 0]
        win_rate = len(wins) / len(trades) if trades else 0.0

        gross_wins = sum(t["net_pnl"] for t in wins)
        gross_losses = abs(sum(t["net_pnl"] for t in losses))
        profit_factor = round(gross_wins / gross_losses, 2) if gross_losses > 0 else (99.0 if gross_wins > 0 else 0.0)

        # Max Drawdown
        eq_series = pd.Series([pt["equity"] for pt in equity_curve])
        peak = eq_series.cummax()
        drawdown = (eq_series - peak) / peak
        max_dd_pct = round(abs(float(drawdown.min())) * 100.0, 2) if not drawdown.empty else 0.0

        # Sharpe ratio
        daily_returns = eq_series.pct_change().dropna()
        if len(daily_returns) > 1 and daily_returns.std() > 0:
            sharpe = round(float(daily_returns.mean() / daily_returns.std() * np.sqrt(252)), 2)
            neg_returns = daily_returns[daily_returns < 0]
            sortino = round(float(daily_returns.mean() / neg_returns.std() * np.sqrt(252)), 2) if (len(neg_returns) > 0 and neg_returns.std() > 0) else sharpe
        else:
            sharpe = 0.0
            sortino = 0.0

        return {
            "id": f"BT-{symbol}-{strategy}",
            "strategy_name": strategy,
            "initial_capital": self.initial_capital,
            "final_equity": round(final_equity, 2),
            "total_net_profit": round(net_profit, 2),
            "net_return_pct": round(net_return_pct, 2),
            "cagr": round(net_return_pct * (252 / max(1, len(df))), 2),
            "max_drawdown_pct": max_dd_pct,
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "profit_factor": profit_factor,
            "win_rate": round(win_rate * 100, 2),
            "total_trades": len(trades),
            "winning_trades": len(wins),
            "losing_trades": len(losses),
            "expectancy": round(sum(t["net_pnl"] for t in trades) / len(trades), 2) if trades else 0.0,
            "total_fees_paid": round(total_fees, 2),
            "equity_curve": equity_curve[::max(1, len(equity_curve) // 40)], # sample 40 points
            "trades": trades
        }
