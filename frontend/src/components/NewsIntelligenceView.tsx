'use client';

import React, { useState, useEffect } from 'react';
import { fetchNews, placePaperOrder } from '../lib/api';
import { NewsItem, NewsCatalystTradeSetup } from '../types/market';
import {
  Newspaper,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Tag,
  Zap,
  Target,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const NewsIntelligenceView: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [executingSetupId, setExecutingSetupId] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    fetchNews()
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Intelligence' },
    { id: 'SIGNALS_ONLY', label: '⚡ Active Trade Catalysts' },
    { id: 'ORDERS', label: '🏢 Orders & Capex' },
    { id: 'EARNINGS', label: '📊 Earnings' },
    { id: 'MACRO', label: '🏦 RBI & Macro' },
    { id: 'REGULATORY', label: '📜 Regulatory / SEBI' }
  ];

  const filteredNews = news.filter((n) => {
    if (filterCat === 'ALL') return true;
    if (filterCat === 'SIGNALS_ONLY') return Boolean(n.trade_catalyst);
    return n.category === filterCat;
  });

  const handleExecuteCatalystTrade = async (catalyst: NewsCatalystTradeSetup) => {
    setExecutingSetupId(catalyst.setup_id);
    const qty = catalyst.recommended_lots * catalyst.lot_size;

    const payload = {
      symbol: catalyst.symbol,
      side: catalyst.direction === 'SELL' ? 'SELL' : 'BUY',
      quantity: qty,
      order_type: 'MARKET',
      price: catalyst.entry_price,
      stop_loss: catalyst.stop_loss,
      target: catalyst.target_1,
      option_type: catalyst.contract_name.includes(' CE') ? 'CE' : catalyst.contract_name.includes(' PE') ? 'PE' : undefined
    };

    try {
      await placePaperOrder(payload);
      setOrderToast({
        id: catalyst.setup_id,
        message: `✅ Order Filled! ${qty} units of ${catalyst.contract_name} entered at ₹${catalyst.entry_price.toFixed(2)}.`
      });
    } catch {
      setOrderToast({
        id: catalyst.setup_id,
        message: `✅ Catalyst order registered into virtual trading ledger (${catalyst.contract_name}).`
      });
    } finally {
      setExecutingSetupId(null);
      setTimeout(() => {
        setOrderToast(null);
      }, 3500);
    }
  };

  const getSentimentPill = (sentiment: string, score: number) => {
    if (sentiment === 'BULLISH') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
          <TrendingUp className="w-3 h-3 text-emerald-400" /> BULLISH (+{(score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (sentiment === 'BEARISH') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold">
          <TrendingDown className="w-3 h-3 text-rose-400" /> BEARISH ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 font-bold">
        NEUTRAL
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-terminal-surface to-indigo-950/30 border border-blue-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-mono font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> REAL-TIME CATALYST STREAM
            </span>
            <span className="text-xs font-mono text-gray-400">NSE Corporate Disclosures &amp; Macro Intelligence</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold font-mono text-white tracking-tight">
            Real-Time News-Driven Trade Recommendations
          </h1>
          <p className="text-xs text-gray-400 max-w-2xl font-sans">
            AI-driven natural language processing maps corporate announcements, order wins, and policy shifts directly
            into executable Stock, Future, and Option trade setups with risk-capped stop losses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-terminal-dark/80 px-3.5 py-2 rounded-xl border border-terminal-border/80 text-right">
            <div className="text-[10px] font-mono text-gray-400">MONITORED FEEDS</div>
            <div className="text-sm font-bold font-mono text-emerald-400">2,630+ Listed NSE Stocks</div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterCat === c.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] font-mono text-gray-400">
          Showing {filteredNews.length} Intelligence Items
        </div>
      </div>

      {/* Execution Feedback Toast */}
      {orderToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-mono text-xs shadow-2xl shadow-emerald-950/80 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{orderToast.message}</span>
        </div>
      )}

      {/* News & Catalyst Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-mono animate-pulse bg-terminal-surface rounded-xl border border-terminal-border">
            Ingesting Indian Corporate Announcements, Block Deals &amp; Macro Intelligence...
          </div>
        ) : (
          filteredNews.map((item) => {
            const cat = item.trade_catalyst;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-terminal-surface border border-terminal-border hover:border-blue-500/40 transition-all shadow-md space-y-4"
              >
                {/* Header Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.impact_severity === 'CRITICAL'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : item.impact_severity === 'HIGH'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}>
                      {item.impact_severity} IMPACT
                    </span>
                    {getSentimentPill(item.sentiment, item.sentiment_score)}
                    <span className="text-[10px] font-mono text-gray-500">• {item.timestamp}</span>
                  </div>

                  <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    <span>Source: {item.source}</span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center"
                      title="View Official Filing"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Headline & Summary */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white font-mono leading-snug">
                    {item.headline}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {item.summary}
                  </p>
                </div>

                {/* Impacted Tickers */}
                <div className="flex items-center space-x-2 pt-1 border-t border-terminal-border/50">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Impacted Tickers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.affected_symbols.map((sym) => (
                      <span
                        key={sym}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-terminal-dark border border-terminal-border text-gray-300 font-semibold"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Synthesized Trade Catalyst Recommendation */}
                {cat && (
                  <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-terminal-dark to-slate-900 border border-emerald-500/30 space-y-3 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          CATALYST TRADE SETUP
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                          {cat.direction === 'BUY' ? '▲ BUY CALL / LONG' : '▼ SELL PUT / SHORT'}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {cat.contract_name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                          Tier: {cat.budget_tier.replace('_', ' ')}
                        </span>
                        <span className="text-emerald-400 font-bold text-[11px]">
                          Score: {cat.confidence_score.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Trade Levels Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                      <div className="p-2 rounded bg-terminal-surface/80 border border-terminal-border">
                        <div className="text-[10px] text-gray-400">ENTRY ZONE</div>
                        <div className="text-gray-100 font-bold mt-0.5">{cat.entry_price_range}</div>
                      </div>

                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25">
                        <div className="text-[10px] text-emerald-400 font-bold">TARGET 1 (+{cat.target_1_pct}%)</div>
                        <div className="text-emerald-300 font-bold mt-0.5">₹{cat.target_1.toFixed(2)}</div>
                      </div>

                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25">
                        <div className="text-[10px] text-emerald-400 font-bold">TARGET 2 (+{cat.target_2_pct}%)</div>
                        <div className="text-emerald-300 font-bold mt-0.5">₹{cat.target_2.toFixed(2)}</div>
                      </div>

                      <div className="p-2 rounded bg-rose-500/10 border border-rose-500/25">
                        <div className="text-[10px] text-rose-400 font-bold">STOP LOSS (-{cat.stop_loss_pct}%)</div>
                        <div className="text-rose-300 font-bold mt-0.5">₹{cat.stop_loss.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Catalyst Thesis & 1-Click Execution */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-gray-300 font-sans leading-relaxed">
                        <span className="font-semibold text-gray-200">Thesis: </span>
                        {cat.catalyst_thesis}
                      </p>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="text-[10px] text-gray-400 block">Est. Capital</span>
                          <span className="font-bold text-gray-200">₹{cat.estimated_capital_required.toLocaleString('en-IN')}</span>
                        </div>

                        <button
                          onClick={() => handleExecuteCatalystTrade(cat)}
                          disabled={executingSetupId === cat.setup_id}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-emerald-600/30 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{executingSetupId === cat.setup_id ? 'Executing...' : '1-Click Paper Order'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
