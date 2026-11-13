'use client';

import React, { useState, useEffect } from 'react';
import { fetchOrderBookDepth } from '../lib/api';
import { OrderBookDepthResponse, MarketDepthLevel } from '../types/market';
import {
  Layers,
  TrendingUp,
  RefreshCw,
  Search,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Activity,
  SlidersHorizontal
} from 'lucide-react';

interface Props {
  initialSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const QUICK_DEPTH_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'NIFTY50', 'BANKNIFTY'];

export const MarketDepthView: React.FC<Props> = ({
  initialSymbol = 'RELIANCE',
  onSelectSymbol,
  onNavigateTab
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [depthData, setDepthData] = useState<OrderBookDepthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const loadDepth = async (targetSymbol: string) => {
    setLoading(true);
    try {
      const data = await fetchOrderBookDepth(targetSymbol);
      setDepthData(data);
    } catch (err) {
      console.error('Failed to load depth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepth(symbol);
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDepth(symbol);
    }, 5000); // 5-second depth polling
    return () => clearInterval(interval);
  }, [symbol, autoRefresh]);

  const maxBidQty = depthData?.bids?.[depthData.bids.length - 1]?.cumulative_qty || 1;
  const maxAskQty = depthData?.asks?.[depthData.asks.length - 1]?.cumulative_qty || 1;
  const totalMax = Math.max(maxBidQty, maxAskQty);

  const ofi = depthData?.order_flow_imbalance || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1429] via-[#101b38] to-[#0c1429] border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
                <Activity className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Institutional Level-3 Market Depth &amp; Tape
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                    NSE MICROSTRUCTURE (10-LEVEL)
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time bid-ask liquidity ladder, cumulative depth curves, Order Flow Imbalance (OFI), and hidden iceberg order footprints.
                </p>
              </div>
            </div>

            {/* Quick Symbols */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Books:
              </span>
              {QUICK_DEPTH_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => {
                    setSymbol(sym);
                    onSelectSymbol?.(sym);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-all ${
                    symbol === sym
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {autoRefresh ? 'Auto-Streaming (5s)' : 'Paused'}
            </button>
            <button
              onClick={() => loadDepth(symbol)}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* OFI Gauge & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* LTP & Spread */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Underlying Last Traded Price</span>
          <div className="flex items-baseline justify-between mt-2 font-mono">
            <span className="text-2xl font-black text-white">
              ₹{depthData?.ltp.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-slate-400">
              Spread: ₹{depthData?.spread.toFixed(2)} ({depthData?.spread_pct.toFixed(3)}%)
            </span>
          </div>
        </div>

        {/* Total Liquidity Available */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Cumulative Depth Volume</span>
          <div className="flex items-baseline justify-between mt-2 font-mono">
            <span className="text-sm font-bold text-emerald-400">
              Bids: {(depthData?.total_bid_qty || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">vs</span>
            <span className="text-sm font-bold text-rose-400">
              Asks: {(depthData?.total_ask_qty || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Order Flow Imbalance (OFI) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Order Flow Imbalance (OFI)</span>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-lg font-black font-mono ${ofi > 0.05 ? 'text-emerald-400' : ofi < -0.05 ? 'text-rose-400' : 'text-amber-400'}`}>
              {ofi > 0 ? '+' : ''}{(ofi * 100).toFixed(1)}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
              ofi > 0.05
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : ofi < -0.05
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {ofi > 0.05 ? 'BUYER DOMINANCE' : ofi < -0.05 ? 'SELLER ABSORPTION' : 'EQUILIBRIUM'}
            </span>
          </div>
        </div>
      </div>

      {/* Level-3 Depth Ladder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bids Ladder (Left) */}
        <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider flex items-center gap-1 font-mono">
              <ArrowUpRight className="w-4 h-4" /> Bids (Buyers)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total: {(depthData?.total_bid_qty || 0).toLocaleString('en-IN')} shares
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="grid grid-cols-12 text-[10px] text-slate-400 uppercase py-1 border-b border-slate-800/80">
              <span className="col-span-2">Orders</span>
              <span className="col-span-4 text-right">Quantity</span>
              <span className="col-span-3 text-right">Bid Price</span>
              <span className="col-span-3 text-right">Cum. Qty</span>
            </div>

            {(depthData?.bids || []).map((b, idx) => {
              const widthPct = Math.min(100, Math.max(5, (b.cumulative_qty / totalMax) * 100));
              return (
                <div key={idx} className="relative grid grid-cols-12 py-1.5 px-2 rounded-lg items-center overflow-hidden">
                  {/* Cumulative Depth Progress Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all duration-300 rounded"
                    style={{ width: `${widthPct}%` }}
                  />

                  <span className="col-span-2 text-slate-400 text-[11px] relative z-10">
                    {b.orders}
                  </span>
                  <span className="col-span-4 text-right font-bold text-slate-200 relative z-10 flex items-center justify-end gap-1">
                    {b.quantity.toLocaleString('en-IN')}
                    {b.is_iceberg && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        ICEBERG
                      </span>
                    )}
                  </span>
                  <span className="col-span-3 text-right font-black text-emerald-400 relative z-10">
                    ₹{b.price.toFixed(2)}
                  </span>
                  <span className="col-span-3 text-right text-slate-400 text-[11px] relative z-10">
                    {b.cumulative_qty.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks Ladder (Right) */}
        <div className="bg-slate-900/90 border border-rose-950/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs uppercase font-extrabold text-rose-400 tracking-wider flex items-center gap-1 font-mono">
              <ArrowDownRight className="w-4 h-4" /> Asks (Sellers)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total: {(depthData?.total_ask_qty || 0).toLocaleString('en-IN')} shares
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="grid grid-cols-12 text-[10px] text-slate-400 uppercase py-1 border-b border-slate-800/80">
              <span className="col-span-3">Ask Price</span>
              <span className="col-span-4 text-right">Quantity</span>
              <span className="col-span-2 text-right">Orders</span>
              <span className="col-span-3 text-right">Cum. Qty</span>
            </div>

            {(depthData?.asks || []).map((a, idx) => {
              const widthPct = Math.min(100, Math.max(5, (a.cumulative_qty / totalMax) * 100));
              return (
                <div key={idx} className="relative grid grid-cols-12 py-1.5 px-2 rounded-lg items-center overflow-hidden">
                  {/* Cumulative Depth Progress Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all duration-300 rounded"
                    style={{ width: `${widthPct}%` }}
                  />

                  <span className="col-span-3 font-black text-rose-400 relative z-10">
                    ₹{a.price.toFixed(2)}
                  </span>
                  <span className="col-span-4 text-right font-bold text-slate-200 relative z-10 flex items-center justify-end gap-1">
                    {a.quantity.toLocaleString('en-IN')}
                    {a.is_iceberg && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        ICEBERG
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-right text-slate-400 text-[11px] relative z-10">
                    {a.orders}
                  </span>
                  <span className="col-span-3 text-right text-slate-400 text-[11px] relative z-10">
                    {a.cumulative_qty.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Iceberg Footprint Alerts */}
      {depthData?.iceberg_detected && depthData.iceberg_detected.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider font-mono">
              Detected Institutional Iceberg Orders (Resting Depth &gt; 3.5x Median)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {depthData.iceberg_detected.map((ice, idx) => (
              <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-amber-500/20 font-mono text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ice.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {ice.side} ICEBERG
                  </span>
                  <span className="text-white font-bold">₹{ice.price.toFixed(2)}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Accumulated Qty: <span className="text-amber-300 font-bold">{ice.quantity.toLocaleString('en-IN')}</span> across {ice.orders} child orders
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
