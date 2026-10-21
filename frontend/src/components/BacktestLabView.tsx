'use client';

import React, { useState } from 'react';
import { runBacktest } from '../lib/api';
import { History, Play, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

export const BacktestLabView: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('RELIANCE');
  const [strategy, setStrategy] = useState<string>('TREND_BREAKOUT');
  const [initialCapital, setInitialCapital] = useState<number>(1000000);
  const [slippagePct, setSlippagePct] = useState<number>(0.0005);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const res = await runBacktest({
        strategy_name: strategy,
        symbols: [symbol],
        start_date: '2025-01-01',
        end_date: '2026-10-21',
        initial_capital: initialCapital,
        slippage_pct: slippagePct,
        timeframe: '1D'
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Configuration Panel */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
          <History className="w-4 h-4 text-blue-400" />
          <span>WALK-FORWARD STRATEGY BACKTESTING SIMULATOR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-mono text-gray-400 block mb-1">STRATEGY</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              <option value="TREND_BREAKOUT">Trend Breakout (20 SMA + RSI &gt; 55)</option>
              <option value="SMA_CROSS">Golden Cross (20 SMA x 50 SMA)</option>
              <option value="RSI_PULLBACK">RSI Pullback in Bull Trend</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-gray-400 block mb-1">INSTRUMENT</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              <option value="RELIANCE">RELIANCE (Reliance Ind)</option>
              <option value="TCS">TCS (Tata Consultancy)</option>
              <option value="HDFCBANK">HDFCBANK (HDFC Bank)</option>
              <option value="INFY">INFY (Infosys)</option>
              <option value="NIFTY50">NIFTY 50 (Index)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-gray-400 block mb-1">STARTING VIRTUAL CAPITAL (₹)</label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs font-mono transition-colors shadow-lg shadow-blue-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Simulating...' : 'Run Walk-Forward Backtest'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Results Dashboard */}
      {result && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">NET PROFIT</span>
              <div className={`text-base font-bold mt-1 ${result.total_net_profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {result.total_net_profit >= 0 ? '+' : ''}₹{result.total_net_profit.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">RETURN %</span>
              <div className={`text-base font-bold mt-1 ${result.net_return_pct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {result.net_return_pct >= 0 ? '+' : ''}{result.net_return_pct.toFixed(2)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">MAX DRAWDOWN</span>
              <div className="text-base font-bold text-terminal-red mt-1">
                -{result.max_drawdown_pct.toFixed(2)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">SHARPE RATIO</span>
              <div className="text-base font-bold text-blue-400 mt-1">
                {result.sharpe_ratio.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">WIN RATE</span>
              <div className="text-base font-bold text-terminal-green mt-1">
                {result.win_rate.toFixed(1)}% ({result.winning_trades}/{result.total_trades})
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono">
              <span className="text-gray-500 text-[10px]">TOTAL INDIAN CHARGES</span>
              <div className="text-base font-bold text-amber-400 mt-1">
                ₹{result.total_fees_paid.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Trade History Table */}
          <div className="rounded-xl bg-terminal-surface border border-terminal-border overflow-hidden">
            <div className="p-4 border-b border-terminal-border text-xs font-mono text-gray-400">
              Executed Strategy Trades ({result.trades.length})
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-terminal-dark border-b border-terminal-border text-gray-500">
                  <tr>
                    <th className="py-2.5 px-4">Direction</th>
                    <th className="py-2.5 px-4">Entry Date</th>
                    <th className="py-2.5 px-4">Exit Date</th>
                    <th className="py-2.5 px-4 text-right">Entry (₹)</th>
                    <th className="py-2.5 px-4 text-right">Exit (₹)</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Taxes & Fees (₹)</th>
                    <th className="py-2.5 px-4 text-right">Net PnL (₹)</th>
                    <th className="py-2.5 px-4">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/40">
                  {result.trades.map((t: any, i: number) => {
                    const isWin = t.net_pnl >= 0;
                    return (
                      <tr key={i} className="hover:bg-terminal-hover">
                        <td className="py-2.5 px-4 text-terminal-green font-bold">{t.direction}</td>
                        <td className="py-2.5 px-4 text-gray-400">{t.entry_date}</td>
                        <td className="py-2.5 px-4 text-gray-400">{t.exit_date}</td>
                        <td className="py-2.5 px-4 text-right">₹{t.entry_price.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right">₹{t.exit_price.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-300">{t.quantity}</td>
                        <td className="py-2.5 px-4 text-right text-amber-400">₹{t.fees.toFixed(2)}</td>
                        <td className={`py-2.5 px-4 text-right font-bold ${isWin ? 'text-terminal-green' : 'text-terminal-red'}`}>
                          {isWin ? '+' : ''}₹{t.net_pnl.toFixed(2)} ({isWin ? '+' : ''}{t.return_pct}%)
                        </td>
                        <td className="py-2.5 px-4 text-[10px] text-gray-400">{t.exit_reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
