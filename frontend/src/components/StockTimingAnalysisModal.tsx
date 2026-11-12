'use client';

import React, { useState, useEffect } from 'react';
import { fetchStockTimingAnalysis, placePaperOrder } from '../lib/api';
import { StockTimingAnalysisData } from '../types/market';
import { TradeOverlayChart } from './common/TradeOverlayChart';
import { PriceFlash } from './common/PriceFlash';
import {
  X,
  Clock,
  Target,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ExternalLink,
  Wallet,
  Activity,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Props {
  symbol: string;
  onClose: () => void;
  onOrderSuccess?: (order: any) => void;
}

export const StockTimingAnalysisModal: React.FC<Props> = ({ symbol, onClose, onOrderSuccess }) => {
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [data, setData] = useState<StockTimingAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paper Order Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchStockTimingAnalysis(symbol, timeframe);
        if (isMounted) setData(res);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load timing analysis');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    // 8-second refresh for live timing ticks
    const timer = setInterval(async () => {
      try {
        const res = await fetchStockTimingAnalysis(symbol, timeframe);
        if (isMounted) setData(res);
      } catch (e) {}
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [symbol, timeframe]);

  const handleExecutePaperTrade = async () => {
    if (!data) return;
    setIsExecuting(true);
    try {
      const orderPayload = {
        symbol: data.symbol,
        exchange: 'NSE',
        side: 'BUY',
        order_type: data.timing.status_code === 'PRIME_BUY' ? 'MARKET' : 'LIMIT',
        quantity: Math.max(1, Math.round(50000 / data.ltp)),
        price: data.timing.status_code === 'PRIME_BUY' ? data.ltp : data.trade_levels.buy_zone_max,
        stop_loss: data.trade_levels.stop_loss,
        target_price: data.trade_levels.target_1,
        idempotency_key: `TIMING_${data.symbol}_${Date.now()}`
      };

      const result = await placePaperOrder(orderPayload);
      setExecutionSuccess(true);
      if (onOrderSuccess) onOrderSuccess(result);
      setTimeout(() => setExecutionSuccess(false), 3500);
    } catch (e: any) {
      alert('Order execution error: ' + (e.message || 'Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusBadgeStyle = (code: string) => {
    switch (code) {
      case 'PRIME_BUY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30';
      case 'WAIT_PULLBACK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30';
      case 'OVEREXTENDED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30';
      case 'HARVEST_PROFIT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/30';
      case 'EVENT_HOLD':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#090d16] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gradient-to-r from-gray-900 via-[#0d1424] to-gray-900">
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-100 font-mono tracking-tight">{data?.symbol || symbol}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                  {data?.sector || 'NSE Equities'}
                </span>
                {data && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${getStatusBadgeStyle(data.timing.status_code)}`}>
                    {data.timing.status_label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{data?.name || 'Algorithmic Timing & Chart Intelligence'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {data && (
              <div className="text-right font-mono">
                <div className="text-lg font-bold text-gray-100">
                  <PriceFlash value={data.ltp} prefix="₹" />
                </div>
                <div className={`text-xs ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.change_pct >= 0 ? '+' : ''}{data.change_pct.toFixed(2)}%)
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && !data ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-mono text-gray-400 animate-pulse">
                Synthesizing multi-source news catalysts, orderbook liquidity, and optimal timing windows...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Chart Controls Strip */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-gray-400 font-medium">Timeframe:</span>
                  {(['5m', '15m', '1D'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        timeframe === tf
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-gray-400 flex items-center space-x-4">
                  <span>Day High: <strong className="text-gray-200">₹{data.day_high.toFixed(2)}</strong></span>
                  <span>Day Low: <strong className="text-gray-200">₹{data.day_low.toFixed(2)}</strong></span>
                  <span>VWAP: <strong className="text-amber-400">₹{data.vwap.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* 1. Interactive Trade Overlay Chart */}
              <TradeOverlayChart
                candles={data.candles}
                tradeLevels={data.trade_levels}
                vwap={data.vwap}
                ltp={data.ltp}
                symbol={data.symbol}
              />

              {/* 2. Three Column Intelligence Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* COLUMN 1: Best Time to Buy & Sell Determination */}
                <div className="bg-[#0b101c] rounded-xl border border-gray-800/90 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                        Optimal Timing Engine
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {data.timing.readiness_score.toFixed(0)}% Ready
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                      <div className="text-[11px] text-gray-400">Current Market Session Phase</div>
                      <div className="text-gray-200 font-semibold mt-0.5">{data.timing.current_session_phase}</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-[11px] text-emerald-400 font-medium">Optimal Execution Window</div>
                      <div className="text-gray-200 font-semibold mt-0.5">{data.timing.optimal_session_window}</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                      <div className="text-[11px] text-gray-400">Algorithmic Order Action</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{data.timing.order_action_type}</div>
                    </div>
                  </div>

                  {/* Algorithmic Thesis Box */}
                  <div className="p-3 rounded-lg bg-[#0f172a] border border-gray-800 text-[11px] font-mono text-gray-300 leading-relaxed">
                    <span className="text-purple-400 font-semibold block mb-1">Execution Thesis:</span>
                    {data.timing.timing_thesis}
                  </div>

                  {/* 5-Condition Trigger Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-mono uppercase text-gray-400 font-semibold">
                      Institutional Trigger Checklist:
                    </div>
                    {data.timing.trigger_checklist.map((item, i) => (
                      <div key={i} className="flex items-start space-x-2 text-[11px] font-mono">
                        {item.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={item.passed ? 'text-gray-300' : 'text-gray-400'}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 2: Multi-Source News & Catalyst Intelligence */}
                <div className="bg-[#0b101c] rounded-xl border border-gray-800/90 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                        Multi-Source News Catalysts
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {data.news_impact.total_sources_scanned} Sources Verified
                    </span>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Media Sentiment:</span>
                      <span className="text-emerald-400 font-bold">
                        {data.news_impact.sentiment_label} ({data.news_impact.aggregated_sentiment > 0 ? '+' : ''}{data.news_impact.aggregated_sentiment.toFixed(2)})
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${Math.max(10, Math.min(100, (data.news_impact.aggregated_sentiment + 1) * 50))}%`
                        }}
                      />
                    </div>
                    <div className="text-[10.5px] text-gray-400 leading-tight pt-1">
                      {data.news_impact.timing_guidance}
                    </div>
                  </div>

                  {/* Headline Stream */}
                  <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
                    {data.recent_news.map((news) => (
                      <div
                        key={news.id}
                        className="p-2.5 rounded-lg bg-[#0e1424] border border-gray-800/80 hover:border-gray-700 transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                          <span className="font-semibold text-cyan-400">{news.source}</span>
                          <span className="text-gray-400">{news.time_ago}</span>
                        </div>
                        <h4 className="text-xs text-gray-200 font-sans font-medium line-clamp-2 leading-snug">
                          {news.headline}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                          <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                            {news.category}
                          </span>
                          <span className={`font-semibold ${
                            news.sentiment === 'BULLISH' ? 'text-emerald-400' : news.sentiment === 'BEARISH' ? 'text-rose-400' : 'text-gray-400'
                          }`}>
                            {news.sentiment} ({news.sentiment_score > 0 ? '+' : ''}{news.sentiment_score.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 3: Quantitative Confluence & 1-Click Execution */}
                <div className="bg-[#0b101c] rounded-xl border border-gray-800/90 p-4 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                          Execution Sizing
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-purple-400">
                        Half-Kelly Model
                      </span>
                    </div>

                    {/* Trade Levels Summary Card */}
                    <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-800 font-mono text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Optimal Buy Zone:</span>
                        <span className="text-emerald-400 font-bold">
                          ₹{data.trade_levels.buy_zone_min.toFixed(2)} - ₹{data.trade_levels.buy_zone_max.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Invalidation Stop Loss:</span>
                        <span className="text-rose-400 font-bold">
                          ₹{data.trade_levels.stop_loss.toFixed(2)} ({data.trade_levels.stop_loss_pct > 0 ? `-${data.trade_levels.stop_loss_pct}` : data.trade_levels.stop_loss_pct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Target 1 (Book 50%):</span>
                        <span className="text-cyan-400 font-bold">
                          ₹{data.trade_levels.target_1.toFixed(2)} (+{data.trade_levels.target_1_pct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Target 2 (Runner):</span>
                        <span className="text-purple-400 font-bold">
                          ₹{data.trade_levels.target_2.toFixed(2)} (+{data.trade_levels.target_2_pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Quant Score Badges */}
                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
                        <div className="text-[10px] text-gray-400">Trend Score</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {data.quantitative_scores.technical_trend_score}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
                        <div className="text-[10px] text-gray-400">News Catalyst</div>
                        <div className="text-sm font-bold text-cyan-400 mt-0.5">
                          {data.quantitative_scores.news_catalyst_score}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Paper Trade Execution Button */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleExecutePaperTrade}
                      disabled={isExecuting}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        {isExecuting
                          ? 'Routing Simulated Order...'
                          : `Execute Paper Trade @ ₹${data.trade_levels.buy_zone_max.toFixed(2)}`}
                      </span>
                    </button>
                    {executionSuccess && (
                      <div className="text-center font-mono text-[11px] text-emerald-400 animate-pulse">
                        ✓ Paper Order Placed! Stop-loss and Target 1 armed.
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-mono text-center">
                      Simulated execution • Auto-invalidation at ₹{data.trade_levels.stop_loss.toFixed(2)}
                    </p>
                  </div>
                </div>

              </div>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
};
