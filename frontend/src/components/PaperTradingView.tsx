'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaperAccount, placePaperOrder, fetchQuote } from '../lib/api';
import { PaperAccount } from '../types/market';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, AlertTriangle, Send } from 'lucide-react';

export const PaperTradingView: React.FC = () => {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [symbol, setSymbol] = useState<string>('RELIANCE');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<string>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [productType, setProductType] = useState<string>('CNC');
  const [livePrice, setLivePrice] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const loadAccount = async () => {
    try {
      const acc = await fetchPaperAccount();
      setAccount(acc);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAccount();
    const interval = setInterval(loadAccount, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchQuote(symbol).then(q => setLivePrice(q.ltp)).catch(() => {});
  }, [symbol]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await placePaperOrder({
        symbol,
        side,
        order_type: orderType,
        quantity,
        product_type: productType,
        client_order_id: `WEB-${Date.now()}`
      });

      if (res.status === 'REJECTED') {
        setMessage({ text: `Order Rejected: ${res.rejection_reason}`, error: true });
      } else {
        setMessage({ text: `Simulated order ${res.order_id} filled successfully at ₹${res.price.toFixed(2)}!` });
        loadAccount();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Order placement failed', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSquareOff = async (posSymbol: string, netQty: number) => {
    setLoading(true);
    try {
      await placePaperOrder({
        symbol: posSymbol,
        side: 'SELL',
        order_type: 'MARKET',
        quantity: netQty,
        product_type: 'CNC',
        client_order_id: `SQ-OFF-${Date.now()}`
      });
      loadAccount();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Synchronizing Paper Trading Ledger & Virtual Positions...
      </div>
    );
  }

  const estOrderVal = quantity * livePrice;
  const isPnlPositive = account.unrealized_pnl >= 0;

  return (
    <div className="space-y-6">
      {/* 1. Account Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
          <span className="text-gray-500 text-[10px]">TOTAL PORTFOLIO EQUITY</span>
          <div className="text-xl font-bold text-white mt-1">₹{account.total_equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
          <span className="text-gray-500 text-[10px]">AVAILABLE CASH BALANCE</span>
          <div className="text-xl font-bold text-terminal-green mt-1">₹{account.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
          <span className="text-gray-500 text-[10px]">UNREALIZED MTM P&amp;L</span>
          <div className={`text-xl font-bold mt-1 ${isPnlPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {isPnlPositive ? '+' : ''}₹{account.unrealized_pnl.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
          <span className="text-gray-500 text-[10px]">REALIZED P&amp;L (NET OF FEES)</span>
          <div className={`text-xl font-bold mt-1 ${account.realized_pnl >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {account.realized_pnl >= 0 ? '+' : ''}₹{account.realized_pnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 2. Order Entry & Risk Limits Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border font-mono text-xs">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-gray-300 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" /> Place Simulated Order (NSE)
          </h2>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="text-gray-400 block mb-1">INSTRUMENT</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="RELIANCE">RELIANCE</option>
                <option value="TCS">TCS</option>
                <option value="HDFCBANK">HDFCBANK</option>
                <option value="INFY">INFY</option>
                <option value="ICICIBANK">ICICIBANK</option>
                <option value="SBIN">SBIN</option>
                <option value="BHARTIARTL">BHARTIARTL</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded font-bold transition-colors ${
                  side === 'BUY' ? 'bg-terminal-green text-black' : 'bg-terminal-dark border border-terminal-border text-gray-400'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded font-bold transition-colors ${
                  side === 'SELL' ? 'bg-terminal-red text-white' : 'bg-terminal-dark border border-terminal-border text-gray-400'
                }`}
              >
                SELL
              </button>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">QUANTITY</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div className="p-3 bg-terminal-dark rounded-lg border border-terminal-border space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-400">
                <span>ESTIMATED VALUE:</span>
                <span className="text-white font-bold">₹{estOrderVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>BROKERAGE &amp; TAXES:</span>
                <span className="text-amber-400 font-bold">₹25.00</span>
              </div>
            </div>

            {message && (
              <div className={`p-2.5 rounded text-[11px] font-mono ${message.error ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-md shadow-blue-600/20"
            >
              {loading ? 'Processing...' : `Submit Simulated ${side} Order`}
            </button>
          </form>
        </div>

        {/* Positions Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300 mb-4 flex items-center justify-between">
            <span>Active Open Positions ({account.positions.length})</span>
            <span className="text-[10px] text-gray-500 font-mono">Live Mark-to-Market Valuation</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-terminal-border text-gray-400">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Avg Price</th>
                  <th className="pb-2 text-right">LTP (₹)</th>
                  <th className="pb-2 text-right">Unrealized P&amp;L</th>
                  <th className="pb-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/50">
                {account.positions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No open positions currently held in virtual ledger.
                    </td>
                  </tr>
                ) : (
                  account.positions.map((pos) => {
                    const isWin = pos.unrealized_pnl >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-terminal-hover">
                        <td className="py-2.5 font-bold text-white">{pos.symbol}</td>
                        <td className="py-2.5 text-right">{pos.net_quantity}</td>
                        <td className="py-2.5 text-right text-gray-400">₹{pos.average_buy_price.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-semibold">₹{pos.current_market_price.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-bold ${isWin ? 'text-terminal-green' : 'text-terminal-red'}`}>
                          {isWin ? '+' : ''}₹{pos.unrealized_pnl.toFixed(2)} ({isWin ? '+' : ''}{pos.pnl_percentage.toFixed(2)}%)
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleSquareOff(pos.symbol, pos.net_quantity)}
                            className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          >
                            Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
