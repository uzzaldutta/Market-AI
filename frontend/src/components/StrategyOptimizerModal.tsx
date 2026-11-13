'use client';

import React, { useState } from 'react';
import { optimizeStrategy } from '../lib/api';
import { StrategyOptimizationResponse, OptimizationIterationResult } from '../types/market';
import {
  Sliders,
  Play,
  X,
  Trophy,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  BarChart2,
  Percent,
  Activity
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  onApplyParameters?: (params: { stopLossPct: number; riskReward: number }) => void;
}

export const StrategyOptimizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultSymbol = 'NIFTY50',
  onApplyParameters
}) => {
  const [strategyType, setStrategyType] = useState<string>('EMA_MOMENTUM');
  const [symbol, setSymbol] = useState<string>(defaultSymbol);
  const [candleLimit, setCandleLimit] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<StrategyOptimizationResponse | null>(null);

  if (!isOpen) return null;

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const data = await optimizeStrategy({
        strategy_type: strategyType,
        symbol: symbol.toUpperCase(),
        stop_loss_pct_range: [1.0, 1.5, 2.0, 2.5, 3.0],
        risk_reward_range: [1.5, 2.0, 2.5, 3.0],
        candle_limit: candleLimit
      });
      setResults(data);
    } catch (err) {
      console.error('Failed to run strategy optimization:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1120] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Autonomous Strategy Parameter Optimizer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  ML GRID SEARCH
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Backtest grid optimization finding maximum Sharpe Ratio &amp; Profit Factor envelopes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Form */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Strategy Template
              </label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="EMA_MOMENTUM">EMA Momentum Crossover</option>
                <option value="VWAP_REVERSION">VWAP Mean Reversion</option>
                <option value="ORB_BREAKOUT">Opening Range Breakout</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Underlying Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Candle Window
              </label>
              <select
                value={candleLimit}
                onChange={(e) => setCandleLimit(parseInt(e.target.value) || 100)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="50">50 Bars (Short-Term)</option>
                <option value="100">100 Bars (Medium-Term)</option>
                <option value="150">150 Bars (Deep Scan)</option>
              </select>
            </div>

            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Run Grid Optimization
            </button>
          </div>

          {/* Results Display */}
          {results && (
            <div className="space-y-4">
              {/* Champion Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Highest Sharpe Ratio Configuration
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      Optimal SL: {results.best_parameters.optimal_stop_loss_pct}% • R:R: {results.best_parameters.optimal_risk_reward}x
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      {results.recommendation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onApplyParameters && (
                    <button
                      onClick={() => {
                        onApplyParameters({
                          stopLossPct: results.best_parameters.optimal_stop_loss_pct,
                          riskReward: results.best_parameters.optimal_risk_reward
                        });
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Apply Optimal Parameters
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Combinations Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase font-mono">
                    Parameter Combinations Evaluated ({results.total_combinations_tested})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sorted by Sharpe Ratio &amp; Profit Factor
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="py-2 px-3">Stop-Loss %</th>
                        <th className="py-2 px-3 text-right">R:R Ratio</th>
                        <th className="py-2 px-3 text-right">Trades</th>
                        <th className="py-2 px-3 text-right">Win Rate</th>
                        <th className="py-2 px-3 text-right">Profit Factor</th>
                        <th className="py-2 px-3 text-right">Sharpe Ratio</th>
                        <th className="py-2 px-3 text-right">Net PnL %</th>
                        <th className="py-2 px-3 text-right">Max DD %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {results.results
                        .sort((a, b) => b.sharpe_ratio - a.sharpe_ratio)
                        .map((iter, idx) => {
                          const isBest =
                            iter.stop_loss_pct === results.best_parameters.optimal_stop_loss_pct &&
                            iter.risk_reward === results.best_parameters.optimal_risk_reward;

                          return (
                            <tr
                              key={idx}
                              className={isBest ? 'bg-cyan-500/15 font-bold text-cyan-300' : 'hover:bg-slate-800/30'}
                            >
                              <td className="py-2 px-3">{iter.stop_loss_pct}%</td>
                              <td className="py-2 px-3 text-right">{iter.risk_reward}x</td>
                              <td className="py-2 px-3 text-right">{iter.total_trades}</td>
                              <td className="py-2 px-3 text-right text-emerald-400">{iter.win_rate_pct}%</td>
                              <td className="py-2 px-3 text-right font-black text-amber-300">
                                {iter.profit_factor.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-black text-cyan-400">
                                {iter.sharpe_ratio.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-200">
                                {iter.net_pnl > 0 ? '+' : ''}{iter.net_pnl}%
                              </td>
                              <td className="py-2 px-3 text-right text-rose-400">{iter.max_drawdown_pct}%</td>
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
      </div>
    </div>
  );
};
