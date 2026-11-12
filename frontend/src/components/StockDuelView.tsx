'use client';

import React, { useState, useEffect } from 'react';
import { fetchStockDuel } from '../lib/api';
import { StockDuelResponse, StockDuelMetric } from '../types/market';
import {
  Swords,
  Trophy,
  Crown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart2,
  RefreshCw,
  Search,
  ExternalLink,
  Percent,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onSelectSymbol?: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const PRESET_MATCHUPS = [
  { label: 'Private Banking Giants', a: 'HDFCBANK', b: 'ICICIBANK' },
  { label: 'IT Bluechips', a: 'TCS', b: 'INFY' },
  { label: 'Conglomerates', a: 'RELIANCE', b: 'ADANIENT' },
  { label: 'Steel Supremacy', a: 'TATASTEEL', b: 'JSWSTEEL' },
  { label: 'Auto Leaders', a: 'MARUTI', b: 'TATAMOTORS' },
  { label: 'FinTech & NBFCs', a: 'BAJFINANCE', b: 'CHOLAFIN' }
];

export const StockDuelView: React.FC<Props> = ({ onSelectSymbol, onNavigateTab }) => {
  const [symbolA, setSymbolA] = useState<string>('HDFCBANK');
  const [symbolB, setSymbolB] = useState<string>('ICICIBANK');
  const [duelData, setDuelData] = useState<StockDuelResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runDuel = async (a: string, b: string) => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockDuel(a.trim().toUpperCase(), b.trim().toUpperCase());
      setDuelData(data);
    } catch (err: any) {
      console.error('Error running stock duel:', err);
      setError(err?.message || 'Failed to execute duel comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDuel(symbolA, symbolB);
  }, []);

  const handlePresetClick = (a: string, b: string) => {
    setSymbolA(a);
    setSymbolB(b);
    runDuel(a, b);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1222] via-[#101830] to-[#0c1222] border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
                <Swords className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Institutional Stock Duel
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                    HEAD-TO-HEAD BATTLE
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Algorithmic peer evaluation across Margin of Safety, ROIC capital efficiency, PEG growth, Simons quant momentum, and balance sheet safety.
                </p>
              </div>
            </div>

            {/* Quick Matchup Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Classic Duels:
              </span>
              {PRESET_MATCHUPS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.a, preset.b)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    (symbolA === preset.a && symbolB === preset.b) || (symbolA === preset.b && symbolB === preset.a)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {preset.a} <span className="text-cyan-400 font-bold">vs</span> {preset.b}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Duel Selector Form */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/70 p-3 rounded-xl shadow-inner w-full lg:w-auto">
            <div className="flex-1 lg:w-36">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Fighter Alpha
              </label>
              <input
                type="text"
                value={symbolA}
                onChange={(e) => setSymbolA(e.target.value.toUpperCase())}
                placeholder="e.g. HDFCBANK"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div className="text-center px-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-amber-400 shadow-md">
                VS
              </div>
            </div>

            <div className="flex-1 lg:w-36">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Fighter Beta
              </label>
              <input
                type="text"
                value={symbolB}
                onChange={(e) => setSymbolB(e.target.value.toUpperCase())}
                placeholder="e.g. ICICIBANK"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <button
              onClick={() => runDuel(symbolA, symbolB)}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Fight
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && !duelData && (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Crunching institutional balance sheets and price momentum...</p>
        </div>
      )}

      {duelData && (
        <>
          {/* Winner Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-emerald-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg">
                  <Trophy className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Algorithmic Champion
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Timestamp: {new Date(duelData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white mt-1">
                    {duelData.winner_symbol}
                    <span className="text-lg font-semibold text-slate-300 ml-2">
                      Outperforms {duelData.winner_symbol === duelData.symbol_a ? duelData.symbol_b : duelData.symbol_a}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
                    {duelData.winner_reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab?.('oracle')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-cyan-400 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Search className="w-3.5 h-3.5" />
                  View DCF in Oracle Lab
                </button>
              </div>
            </div>
          </div>

          {/* Side-by-Side Contenders Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contender A Card */}
            <div
              className={`rounded-2xl p-6 border transition-all ${
                duelData.winner_symbol === duelData.symbol_a
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white font-mono">{duelData.symbol_a}</h3>
                    {duelData.winner_symbol === duelData.symbol_a && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Crown className="w-3 h-3" /> VICTOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{duelData.name_a}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">LTP</span>
                  <p className="text-xl font-bold font-mono text-cyan-400">
                    ₹{duelData.ltp_a.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Composite Score Gauge */}
              <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Composite Battle Score
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {duelData.composite_score_a.toFixed(1)}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Verdict Badge
                  </span>
                  <span className="text-xs font-bold text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                    {duelData.verdict_badge_a}
                  </span>
                </div>
              </div>
            </div>

            {/* Contender B Card */}
            <div
              className={`rounded-2xl p-6 border transition-all ${
                duelData.winner_symbol === duelData.symbol_b
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white font-mono">{duelData.symbol_b}</h3>
                    {duelData.winner_symbol === duelData.symbol_b && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Crown className="w-3 h-3" /> VICTOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{duelData.name_b}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">LTP</span>
                  <p className="text-xl font-bold font-mono text-amber-400">
                    ₹{duelData.ltp_b.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Composite Score Gauge */}
              <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Composite Battle Score
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {duelData.composite_score_b.toFixed(1)}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Verdict Badge
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {duelData.verdict_badge_b}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric-by-Metric Breakdown Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">7-Factor Head-to-Head Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400">
                Green indicator represents winning parameter
              </span>
            </div>

            <div className="space-y-4">
              {duelData.metrics.map((metric: StockDuelMetric, idx: number) => {
                const isAWinner = metric.winner === 'A';
                const isBWinner = metric.winner === 'B';
                const isTie = metric.winner === 'TIE';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-white">{metric.metric_name}</span>
                        <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                          ({metric.description})
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                        {isTie ? 'Tie' : isAWinner ? `${duelData.symbol_a} wins` : `${duelData.symbol_b} wins`}
                      </span>
                    </div>

                    {/* Side-by-side comparison bar */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Value A */}
                      <div className="col-span-3 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isAWinner ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {metric.val_a} {metric.unit}
                        </span>
                        {isAWinner && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline-block ml-1.5" />
                        )}
                      </div>

                      {/* Visual Comparison Split Bar */}
                      <div className="col-span-6 flex items-center gap-1.5 h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        {/* Bar A */}
                        <div
                          className={`h-full rounded-l-full transition-all duration-500 ${
                            isAWinner ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                          style={{
                            width: `${
                              metric.val_a + metric.val_b > 0
                                ? Math.max(10, Math.min(90, (metric.val_a / (metric.val_a + metric.val_b)) * 100))
                                : 50
                            }%`
                          }}
                        />
                        {/* Bar B */}
                        <div
                          className={`h-full rounded-r-full transition-all duration-500 ${
                            isBWinner ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                          style={{
                            width: `${
                              metric.val_a + metric.val_b > 0
                                ? Math.max(10, Math.min(90, (metric.val_b / (metric.val_a + metric.val_b)) * 100))
                                : 50
                            }%`
                          }}
                        />
                      </div>

                      {/* Value B */}
                      <div className="col-span-3 text-left">
                        {isBWinner && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline-block mr-1.5" />
                        )}
                        <span
                          className={`font-mono font-bold text-sm ${
                            isBWinner ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {metric.val_b} {metric.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
