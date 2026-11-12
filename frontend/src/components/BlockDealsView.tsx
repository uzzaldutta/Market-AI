'use client';

import React, { useState, useEffect } from 'react';
import { fetchBlockDeals } from '../lib/api';
import { BlockDealsResponse, BlockDealItem } from '../types/market';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ExternalLink,
  Coins
} from 'lucide-react';

interface Props {
  onSelectSymbol?: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const BlockDealsView: React.FC<Props> = ({ onSelectSymbol, onNavigateTab }) => {
  const [data, setData] = useState<BlockDealsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await fetchBlockDeals();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load block deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
    const interval = setInterval(loadDeals, 60000); // 1-minute auto-refresh
    return () => clearInterval(interval);
  }, []);

  const filteredDeals = (data?.deals || []).filter((deal) => {
    const matchesType = filterType === 'ALL' || deal.deal_type === filterType;
    const matchesSearch =
      deal.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalBuyValue = (data?.deals || [])
    .filter((d) => d.deal_type === 'BUY')
    .reduce((acc, d) => acc + d.deal_value_cr, 0);

  const totalSellValue = (data?.deals || [])
    .filter((d) => d.deal_type === 'SELL')
    .reduce((acc, d) => acc + d.deal_value_cr, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1128] via-[#0f1b38] to-[#0a1128] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400">
                <Layers className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Institutional Dark Pool & Block Deals
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono">
                    NSE / BSE LODR FEED (&gt; ₹5 Cr)
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time large-ticket order executions tracking institutional accumulation & distribution by sovereign funds, LIC, Vanguard, Morgan Stanley, and GQG Partners.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={loadDeals}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deals */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Block Deals</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {data?.total_deals || 0}
            </span>
            <span className="text-xs font-mono text-slate-400">Trades &gt; ₹5 Cr</span>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Value Transacted</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white font-mono">
              ₹{(data?.total_value_cr || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr
            </span>
            <span className="text-xs font-mono text-cyan-400">Exchange Gross</span>
          </div>
        </div>

        {/* Institutional Buying vs Selling */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Institutional Buy / Sell Ratio</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm font-bold text-emerald-400 font-mono">
              ₹{totalBuyValue.toFixed(0)} Cr
            </span>
            <span className="text-xs text-slate-500 font-mono">vs</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              ₹{totalSellValue.toFixed(0)} Cr
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  totalBuyValue + totalSellValue > 0
                    ? (totalBuyValue / (totalBuyValue + totalSellValue)) * 100
                    : 50
                }%`
              }}
            />
            <div
              className="bg-rose-500 h-full"
              style={{
                width: `${
                  totalBuyValue + totalSellValue > 0
                    ? (totalSellValue / (totalBuyValue + totalSellValue)) * 100
                    : 50
                }%`
              }}
            />
          </div>
        </div>

        {/* Net Bias Meter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-semibold">Net Market Bias</span>
          <div className="mt-2 flex items-center gap-2">
            {data?.net_institutional_bias === 'NET_BUYING' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1 font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" /> NET ACCUMULATION
              </span>
            ) : data?.net_institutional_bias === 'NET_SELLING' ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1 font-mono">
                <ArrowDownRight className="w-3.5 h-3.5" /> NET DISTRIBUTION
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1 font-mono">
                BALANCED FLOW
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Deals ({data?.deals?.length || 0})
          </button>
          <button
            onClick={() => setFilterType('BUY')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'BUY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" /> Buys Only
          </button>
          <button
            onClick={() => setFilterType('SELL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'SELL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <ArrowDownRight className="w-3 h-3" /> Sells Only
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or fund name..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Client / Institution</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Value (₹ Cr)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No block deals matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => {
                  const isBuy = deal.deal_type === 'BUY';
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectSymbol?.(deal.symbol)}
                    >
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {deal.time_str}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {deal.symbol}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {deal.exchange}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-sans">
                          {deal.company_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300 font-medium">
                        {deal.client_name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {deal.deal_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {deal.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ₹{deal.trade_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black ${
                            isBuy ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ₹{deal.deal_value_cr.toFixed(2)} Cr
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbol?.(deal.symbol);
                            onNavigateTab?.('oracle');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-sans font-semibold border border-slate-700 flex items-center gap-1 mx-auto"
                        >
                          Audit DCF
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
  );
};
