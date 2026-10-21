'use client';

import React from 'react';
import { MarketOverviewData, Quote } from '../types/market';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart2 } from 'lucide-react';

interface Props {
  data: MarketOverviewData | null;
  onSelectSymbol: (s: string) => void;
}

export const MarketOverviewView: React.FC<Props> = ({ data, onSelectSymbol }) => {
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Fetching Indian Market Overview & Sector Telemetry...
      </div>
    );
  }

  const { indices, market_breadth, top_gainers, top_losers, sector_performance, fii_dii_activity } = data;
  const totalStocks = market_breadth.advances + market_breadth.declines + market_breadth.unchanged;
  const advancePct = totalStocks > 0 ? (market_breadth.advances / totalStocks) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* 1. Benchmark Indices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              onClick={() => onSelectSymbol(idx.symbol)}
              className="p-4 rounded-xl bg-terminal-surface border border-terminal-border hover:border-blue-500/50 cursor-pointer transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-1">
                <span>{idx.name}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-terminal-dark border border-terminal-border">
                  NSE
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight my-1">
                ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className={`flex items-center ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isUp ? '+' : ''}{idx.change.toFixed(2)} ({isUp ? '+' : ''}{idx.change_pct.toFixed(2)}%)
                </span>
                <span className="text-gray-500 text-[10px]">H: ₹{idx.high.toFixed(0)} L: ₹{idx.low.toFixed(0)}</span>
              </div>
            </div>
          );
        })}

        {/* FII / DII Institutional Flows Card */}
        {fii_dii_activity && (
          <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border">
            <div className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
              <span>INSTITUTIONAL FLOWS (₹ CR)</span>
              <span className="text-[10px] text-gray-500">{fii_dii_activity.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-terminal-dark p-2 rounded border border-terminal-border">
                <div className="text-[10px] text-gray-400 font-mono">FII NET</div>
                <div className={`font-mono text-sm font-bold ${fii_dii_activity.fii_net_crores >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {fii_dii_activity.fii_net_crores >= 0 ? '+' : ''}₹{fii_dii_activity.fii_net_crores.toFixed(1)} Cr
                </div>
              </div>
              <div className="bg-terminal-dark p-2 rounded border border-terminal-border">
                <div className="text-[10px] text-gray-400 font-mono">DII NET</div>
                <div className={`font-mono text-sm font-bold ${fii_dii_activity.dii_net_crores >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {fii_dii_activity.dii_net_crores >= 0 ? '+' : ''}₹{fii_dii_activity.dii_net_crores.toFixed(1)} Cr
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Breadth Card */}
        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border">
          <div className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
            <span>MARKET BREADTH (NSE)</span>
            <span className="text-terminal-green font-mono text-[10px]">{advancePct.toFixed(0)}% Adv</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-terminal-dark rounded-full overflow-hidden flex my-2 border border-terminal-border">
            <div style={{ width: `${advancePct}%` }} className="bg-terminal-green h-full" />
            <div style={{ width: `${100 - advancePct}%` }} className="bg-terminal-red h-full" />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-gray-400">
            <span className="text-terminal-green">{market_breadth.advances} Adv</span>
            <span className="text-gray-500">{market_breadth.unchanged} Unch</span>
            <span className="text-terminal-red">{market_breadth.declines} Dec</span>
          </div>
        </div>
      </div>

      {/* 2. Sector Performance Heatmap */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
        <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          Sector Momentum Heatmap
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sector_performance.map((sec) => {
            const isUp = sec.change_pct >= 0;
            return (
              <div
                key={sec.sector}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isUp
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}
              >
                <div className="text-xs font-semibold">{sec.sector}</div>
                <div className="text-sm font-mono font-bold mt-1">
                  {isUp ? '+' : ''}{sec.change_pct.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top Gainers & Top Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-terminal-green flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top NIFTY Gainers
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-terminal-border text-gray-400">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2 text-right">LTP (₹)</th>
                  <th className="pb-2 text-right">Change (%)</th>
                  <th className="pb-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/50">
                {top_gainers.map((stk) => (
                  <tr
                    key={stk.symbol}
                    onClick={() => onSelectSymbol(stk.symbol)}
                    className="hover:bg-terminal-hover cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-gray-200">{stk.symbol}</td>
                    <td className="py-2.5 text-right">₹{stk.ltp.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-terminal-green font-semibold">
                      +{stk.change_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{(stk.volume / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Losers */}
        <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-terminal-red flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Top NIFTY Losers
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-terminal-border text-gray-400">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2 text-right">LTP (₹)</th>
                  <th className="pb-2 text-right">Change (%)</th>
                  <th className="pb-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/50">
                {top_losers.map((stk) => (
                  <tr
                    key={stk.symbol}
                    onClick={() => onSelectSymbol(stk.symbol)}
                    className="hover:bg-terminal-hover cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-gray-200">{stk.symbol}</td>
                    <td className="py-2.5 text-right">₹{stk.ltp.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-terminal-red font-semibold">
                      {stk.change_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{(stk.volume / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
