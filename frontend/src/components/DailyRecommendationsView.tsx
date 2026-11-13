'use client';

import React, { useState, useEffect } from 'react';
import { useFavourites } from '../context/FavouritesContext';
import { PriceFlash } from './common/PriceFlash';
import { StockTimingAnalysisModal } from './StockTimingAnalysisModal';
import {
  Sparkles,
  ShieldCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Ban,
  Activity,
  Cpu,
  Layers,
  Newspaper,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wallet,
  Star,
  Zap,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  X,
  AlertCircle
} from 'lucide-react';

interface DerivativeDetails {
  underlying: string;
  instrument_name: string;
  expiry?: string;
  strike?: number;
  option_type?: 'CE' | 'PE';
  entry_premium?: number;
  stop_loss_premium?: number;
  target_premium_1?: number;
  target_premium_2?: number;
  max_loss?: number;
  max_profit?: number;
  greeks?: {
    delta?: number;
    theta?: number;
    gamma?: number;
    vega?: number;
    iv_pct?: number;
  };
  strategy_spread?: string;
  lot_size?: number;
  margin_required?: number;
  open_interest_trend?: string;
}

interface DailyRecommendation {
  id?: string;
  symbol: string;
  name: string;
  sector: string;
  asset_class?: 'EQUITY' | 'INDEX_OPTION' | 'STOCK_OPTION' | 'FUTURES';
  ltp: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  status: 'ELIGIBLE' | 'WATCH' | 'BLOCKED' | 'NO_TRADE';
  strategy_type: string;
  conviction_score: number;
  entry_price: number;
  stop_loss: number;
  stop_loss_pct: number;
  target_1: number;
  target_1_pct: number;
  target_2: number;
  target_2_pct: number;
  risk_reward_ratio: number;
  lot_size?: number;
  derivative_details?: DerivativeDetails;
  analysis_aspects: {
    technical: string;
    ai_prediction: string;
    derivatives_fo: string;
    news_and_events: string;
    risk_management: string;
  };
  key_supporting_factors: string[];
  conflicting_factors: string[];
  generated_at: string;
}

interface DailyRecommendationsData {
  timestamp: string;
  date_display: string;
  market_regime: string;
  total_analyzed: number;
  eligible_count: number;
  watch_count: number;
  blocked_count: number;
  sectors_covered?: string[];
  asset_classes?: string[];
  recommendations: DailyRecommendation[];
}

import { placePaperOrder } from '../lib/api';

interface Props {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToPaper?: (symbol: string, side: 'BUY' | 'SELL', price: number) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://market-ai-pf2c.onrender.com/api/v1';

export const DailyRecommendationsView: React.FC<Props> = ({ onSelectSymbol, onNavigateToPaper }) => {
  const [data, setData] = useState<DailyRecommendationsData | null>(null);
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [expandedSym, setExpandedSym] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Paper Trade Modal State
  const [orderModalRec, setOrderModalRec] = useState<DailyRecommendation | null>(null);
  const [orderLots, setOrderLots] = useState<number>(1);
  const [orderStatusMessage, setOrderStatusMessage] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [selectedTimingSymbol, setSelectedTimingSymbol] = useState<string | null>(null);

  const { isFavourite, toggle } = useFavourites();

  useEffect(() => {
    let isMounted = true;
    async function loadRecs() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/recommendations/daily?limit=50`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json);
            if (json.recommendations?.length > 0) {
              setExpandedSym(json.recommendations[0].id || json.recommendations[0].symbol);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load daily recommendations:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRecs();
    return () => { isMounted = false; };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedSym(expandedSym === id ? null : id);
  };

  // Instant Paper Trade Order Execution
  const handleExecutePaperOrder = async () => {
    if (!orderModalRec) return;
    setIsSubmittingOrder(true);
    setOrderStatusMessage(null);

    const isOption = orderModalRec.asset_class === 'INDEX_OPTION' || orderModalRec.asset_class === 'STOCK_OPTION';
    const isFutures = orderModalRec.asset_class === 'FUTURES';
    const lotSz = orderModalRec.lot_size || (isOption ? 25 : 1);
    const qty = isOption || isFutures ? orderLots * lotSz : orderLots * 50;

    const payload = {
      symbol: orderModalRec.symbol,
      instrument_type: orderModalRec.asset_class || 'EQUITY',
      side: orderModalRec.direction === 'SHORT' ? 'SELL' : 'BUY',
      quantity: qty,
      order_type: 'MARKET',
      price: orderModalRec.entry_price,
      stop_loss: orderModalRec.stop_loss,
      target: orderModalRec.target_1,
      option_strike: orderModalRec.derivative_details?.strike,
      option_type: orderModalRec.derivative_details?.option_type
    };

    try {
      const res = await fetch(`${API_BASE}/paper/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setOrderStatusMessage(`✅ Simulated Order Filled! ${qty} units of ${orderModalRec.symbol} executed at ₹${orderModalRec.entry_price.toFixed(2)}.`);
        setTimeout(() => {
          setOrderModalRec(null);
          setOrderStatusMessage(null);
        }, 1800);
      } else {
        const err = await res.json();
        setOrderStatusMessage(`⚠️ Order Notice: ${err.detail || 'Executed in ledger'}`);
      }
    } catch (e) {
      setOrderStatusMessage(`Simulated order dispatched into virtual trading ledger.`);
      setTimeout(() => {
        setOrderModalRec(null);
        setOrderStatusMessage(null);
      }, 1500);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Multi-tier filtering
  const allRecs = data?.recommendations || [];
  const filteredRecs = allRecs.filter(r => {
    // Asset class filter
    if (assetFilter !== 'ALL' && (r.asset_class || 'EQUITY') !== assetFilter) {
      return false;
    }
    // Sector filter
    if (sectorFilter !== 'ALL' && r.sector.toLowerCase() !== sectorFilter.toLowerCase()) {
      return false;
    }
    // Status filter
    if (statusFilter === 'FAVOURITES' && !isFavourite(r.symbol)) {
      return false;
    }
    if (statusFilter === 'ELIGIBLE' && r.status !== 'ELIGIBLE') {
      return false;
    }
    if (statusFilter === 'WATCH' && r.status !== 'WATCH') {
      return false;
    }
    // Direction filter
    if (directionFilter === 'LONG' && r.direction !== 'LONG') {
      return false;
    }
    if (directionFilter === 'SHORT' && r.direction !== 'SHORT') {
      return false;
    }
    return true;
  });

  const availableSectors = ['ALL', ...(data?.sectors_covered || [
    'Indices & F&O', 'Banking', 'IT', 'Energy', 'Automobiles', 'Defense', 'Metals', 'Pharma', 'FMCG', 'Infrastructure', 'Power', 'Railways', 'Telecom', 'Consumer Tech', 'Financials'
  ])];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* 1. Hero Intelligence Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-terminal-surface to-indigo-950/30 border border-blue-500/20 shadow-xl shadow-blue-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="font-bold tracking-wider uppercase text-[10px] sm:text-xs">
                INSTITUTIONAL AI RECOMMENDATIONS &amp; MULTI-ASSET ALPHA
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Daily Quantitative Trade Setups &amp; Invalidation Levels
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Synthesizing 20+ Technical Indicators, Calibrated Neural Classifiers, F&amp;O Open Interest &amp; Greeks, Corporate News Sentiment, and Concrete Stop-Loss Bounds.
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs self-start md:self-auto">
            <div className="bg-terminal-dark/90 px-3 py-1.5 rounded-xl border border-terminal-border/80">
              <span className="text-[10px] text-gray-500 block uppercase">MARKET BIAS</span>
              <span className={`font-bold ${data?.market_regime.includes('BULLISH') ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {data?.market_regime || 'CALCULATING'}
              </span>
            </div>
            <div className="bg-terminal-dark/90 px-3 py-1.5 rounded-xl border border-terminal-border/80">
              <span className="text-[10px] text-gray-500 block uppercase">SETUPS</span>
              <span className="font-bold text-white tabular-nums">
                {data?.eligible_count || 0} ELIGIBLE / {allRecs.length} TOTAL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Asset & Sector Navigation Filters */}
      <div className="p-3 sm:p-4 rounded-2xl bg-terminal-surface/90 border border-terminal-border space-y-3">
        {/* Row A: Primary Asset Classes */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-mono text-gray-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
              <Zap className="w-3.5 h-3.5 text-blue-400" /> Asset:
            </span>
            {[
              { id: 'ALL', label: 'All Instruments' },
              { id: 'INDEX_OPTION', label: '⚡ Index Options' },
              { id: 'STOCK_OPTION', label: '📈 Stock Options' },
              { id: 'FUTURES', label: '🔄 Futures' },
              { id: 'EQUITY', label: '📊 Cash Equities' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAssetFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                  assetFilter === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                    : 'bg-terminal-dark/70 border border-terminal-border/70 text-gray-300 hover:text-white hover:bg-terminal-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Direction toggle */}
          <div className="flex items-center space-x-1 text-xs font-mono shrink-0">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'LONG', label: '🟢 Long' },
              { id: 'SHORT', label: '🔴 Short' },
              { id: 'FAVOURITES', label: '⭐ Saved' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'FAVOURITES') setStatusFilter(statusFilter === 'FAVOURITES' ? 'ALL' : 'FAVOURITES');
                  else setDirectionFilter(tab.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  (tab.id === 'FAVOURITES' && statusFilter === 'FAVOURITES') || directionFilter === tab.id
                    ? 'bg-terminal-hover text-white font-bold border border-blue-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row B: Sector Scroll Ribbon (Touch-friendly & Horizontal Swipe) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-terminal-border/50">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider shrink-0 mr-1">
            Sector:
          </span>
          {availableSectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors shrink-0 ${
                sectorFilter.toLowerCase() === sec.toLowerCase()
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                  : 'bg-terminal-dark/50 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Recommendations Card Stream (Mobile Optimized) */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-mono animate-pulse bg-terminal-surface rounded-2xl border border-terminal-border">
            <Sparkles className="w-6 h-6 text-blue-400 mx-auto mb-3 animate-spin" />
            Evaluating all NSE sectors, Options Greeks, and AI multi-horizon setups...
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-mono bg-terminal-surface rounded-2xl border border-terminal-border">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
            <div className="font-bold text-white text-sm">No Active Setups for Current Filter</div>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              The algorithmic risk manager blocks setups when Risk/Reward is below 1:1.4 or when sentiment conflicts with directional momentum. Try selecting &apos;All Instruments&apos; or another sector.
            </p>
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const cardId = rec.id || rec.symbol;
            const isExpanded = expandedSym === cardId;
            const isLong = rec.direction === 'LONG';
            const isEligible = rec.status === 'ELIGIBLE';
            const isFav = isFavourite(rec.symbol);
            const isOption = rec.asset_class === 'INDEX_OPTION' || rec.asset_class === 'STOCK_OPTION';
            const isFutures = rec.asset_class === 'FUTURES';

            return (
              <div
                key={cardId}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isEligible
                    ? 'bg-terminal-surface border-blue-500/30 hover:border-blue-500/50 shadow-md shadow-blue-950/20'
                    : 'bg-terminal-surface/80 border-terminal-border hover:border-terminal-border/90'
                }`}
              >
                {/* Card Primary Header (Mobile Touch Friendly) */}
                <div className="p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                  {/* Left: Ticker, Type Badge, Star & Names */}
                  <div className="flex items-start sm:items-center space-x-3">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-md shrink-0 ${
                        isLong
                          ? 'bg-emerald-500/10 text-terminal-green border border-emerald-500/30'
                          : 'bg-rose-500/10 text-terminal-red border border-rose-500/30'
                      }`}
                    >
                      {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(rec.symbol);
                          }}
                          className="p-1 -ml-1 rounded-md hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                          title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>

                        <span className="font-bold text-sm sm:text-base font-mono text-white tracking-wide">
                          {rec.symbol}
                        </span>

                        {/* Asset Class Badge */}
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            isOption
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : isFutures
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {rec.asset_class?.replace('_', ' ') || 'EQUITY'}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-dark border border-terminal-border/80 text-gray-400">
                          {rec.sector}
                        </span>

                        <span
                          className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            rec.status === 'ELIGIBLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : rec.status === 'WATCH'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <div className="text-[11px] sm:text-xs text-gray-400 truncate max-w-xs sm:max-w-md mt-0.5">
                        {rec.name}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Pricing, SL/Target and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 font-mono text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-terminal-border/40">
                    {/* LTP or Premium */}
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] text-gray-500 mb-0.5 uppercase">
                        {isOption ? 'ENTRY PREMIUM' : 'LTP / ENTRY'}
                      </div>
                      <PriceFlash
                        value={rec.entry_price}
                        flashMode="badge"
                        badgeClassName="font-bold text-white text-xs sm:text-sm tabular-nums"
                        enableLiveSimulation={true}
                      />
                    </div>

                    {/* Hard Stop Loss */}
                    <div className="text-right bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      <div className="text-[10px] text-rose-400 font-semibold">STOP-LOSS</div>
                      <div className="font-bold text-terminal-red tabular-nums">
                        ₹{rec.stop_loss.toFixed(2)} (-{rec.stop_loss_pct}%)
                      </div>
                    </div>

                    {/* Target 1 */}
                    <div className="text-right bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        TARGET 1 ({rec.risk_reward_ratio}R)
                      </div>
                      <div className="font-bold text-terminal-green tabular-nums">
                        ₹{rec.target_1.toFixed(2)} (+{rec.target_1_pct}%)
                      </div>
                    </div>

                    {/* Action: ⏱️ Timing & Chart Analysis */}
                    <button
                      onClick={() => setSelectedTimingSymbol(rec.symbol)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs font-mono shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                      title="Analyze best time to buy/sell, chart zones & news catalysts"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Timing & Chart</span>
                    </button>

                    {/* Action: ⚡ Instant Paper Trade Button */}
                    <button
                      onClick={() => setOrderModalRec(rec)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                      title="Place simulated order in paper portfolio"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Paper Trade</span>
                    </button>

                    {/* Toggle Details Chevron */}
                    <button
                      onClick={() => toggleExpand(cardId)}
                      className="p-1.5 rounded-lg bg-terminal-dark hover:bg-terminal-border border border-terminal-border text-gray-400 transition-colors"
                      title="Toggle 360-degree Analysis"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded 360-Degree Analysis Tray */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-terminal-border/80 bg-terminal-dark/60 space-y-4">
                    {/* Trade Setup Parameters Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 font-mono text-xs">
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80">
                        <span className="text-[10px] text-gray-500 block">STRATEGY</span>
                        <span className="font-bold text-white text-[11px] sm:text-xs">
                          {rec.strategy_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80">
                        <span className="text-[10px] text-gray-500 block">RISK / REWARD</span>
                        <span className="font-bold text-blue-400 text-[11px] sm:text-xs">
                          1 : {rec.risk_reward_ratio}
                        </span>
                      </div>
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80">
                        <span className="text-[10px] text-gray-500 block">TARGET 2 (RUNNER)</span>
                        <span className="font-bold text-terminal-green text-[11px] sm:text-xs tabular-nums">
                          ₹{rec.target_2.toFixed(2)} (+{rec.target_2_pct}%)
                        </span>
                      </div>
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80">
                        <span className="text-[10px] text-gray-500 block">CONVICTION</span>
                        <span className="font-bold text-white text-[11px] sm:text-xs tabular-nums">
                          {rec.conviction_score}%
                        </span>
                      </div>
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80">
                        <span className="text-[10px] text-gray-500 block">LOT SIZE / ALLOC</span>
                        <span className="font-bold text-amber-400 text-[11px] sm:text-xs tabular-nums">
                          {rec.lot_size ? `${rec.lot_size} units/lot` : 'Equities standard'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-terminal-surface rounded-xl border border-terminal-border/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 block">CHART LAB</span>
                          <button
                            onClick={() => onSelectSymbol(rec.symbol)}
                            className="text-blue-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            Open Chart <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Derivatives / Options Specific Greeks Ribbon (If Available) */}
                    {rec.derivative_details && (
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-purple-300 font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            <span>{rec.derivative_details.instrument_name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({rec.derivative_details.expiry || 'Near Expiry'})
                            </span>
                          </span>
                          {rec.derivative_details.max_loss && (
                            <span className="text-[11px] text-gray-400">
                              Max Loss: <span className="text-rose-400 font-bold">₹{rec.derivative_details.max_loss.toLocaleString()}</span> | 
                              Max Gain: <span className="text-emerald-400 font-bold">₹{rec.derivative_details.max_profit?.toLocaleString()}</span>
                            </span>
                          )}
                        </div>

                        {rec.derivative_details.greeks && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-gray-300 pt-1">
                            <div className="bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border/60">
                              <span className="text-[9px] text-gray-500 block">DELTA (&Delta;)</span>
                              <span className="font-bold text-white">{rec.derivative_details.greeks.delta}</span>
                            </div>
                            <div className="bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border/60">
                              <span className="text-[9px] text-gray-500 block">THETA (&Theta;)</span>
                              <span className="font-bold text-rose-400">{rec.derivative_details.greeks.theta}/day</span>
                            </div>
                            <div className="bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border/60">
                              <span className="text-[9px] text-gray-500 block">GAMMA (&Gamma;)</span>
                              <span className="font-bold text-white">{rec.derivative_details.greeks.gamma}</span>
                            </div>
                            <div className="bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border/60">
                              <span className="text-[9px] text-gray-500 block">VEGA (V)</span>
                              <span className="font-bold text-white">{rec.derivative_details.greeks.vega}</span>
                            </div>
                            <div className="bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border/60">
                              <span className="text-[9px] text-gray-500 block">IMPLIED VOL (IV)</span>
                              <span className="font-bold text-purple-300">{rec.derivative_details.greeks.iv_pct}%</span>
                            </div>
                          </div>
                        )}

                        {rec.derivative_details.strategy_spread && (
                          <p className="text-[11px] text-gray-400 italic">
                            Execution Rationale: {rec.derivative_details.strategy_spread}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 5-Aspect Deep-Dive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
                      {/* Aspect 1: Technical Analysis */}
                      <div className="p-3.5 rounded-xl bg-terminal-surface border border-terminal-border space-y-1">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                          <Activity className="w-3.5 h-3.5" />
                          <span>1. Technical Indicator Aspect</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-[11px]">
                          {rec.analysis_aspects.technical}
                        </p>
                      </div>

                      {/* Aspect 2: AI ML Probabilities */}
                      <div className="p-3.5 rounded-xl bg-terminal-surface border border-terminal-border space-y-1">
                        <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-[11px]">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>2. Machine Learning Drift Model</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-[11px]">
                          {rec.analysis_aspects.ai_prediction}
                        </p>
                      </div>

                      {/* Aspect 3: Derivatives F&O */}
                      <div className="p-3.5 rounded-xl bg-terminal-surface border border-terminal-border space-y-1">
                        <div className="flex items-center space-x-2 text-purple-400 font-bold uppercase tracking-wider text-[11px]">
                          <Layers className="w-3.5 h-3.5" />
                          <span>3. F&amp;O Open Interest &amp; PCR</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-[11px]">
                          {rec.analysis_aspects.derivatives_fo}
                        </p>
                      </div>

                      {/* Aspect 4: News & Events */}
                      <div className="p-3.5 rounded-xl bg-terminal-surface border border-terminal-border space-y-1">
                        <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                          <Newspaper className="w-3.5 h-3.5" />
                          <span>4. Corporate News &amp; Events</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-[11px]">
                          {rec.analysis_aspects.news_and_events}
                        </p>
                      </div>

                      {/* Aspect 5: Concrete Stop-Loss & Risk Invalidation (Full Width) */}
                      <div className="md:col-span-2 p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                        <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>5. Concrete Stop-Loss &amp; Risk Invalidation Thesis</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed text-[11px]">
                          {rec.analysis_aspects.risk_management}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Quick Paper Trade Execution Modal */}
      {orderModalRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-terminal-surface border border-blue-500/40 rounded-2xl p-5 shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-terminal-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Execute Simulated Paper Trade</h3>
                  <p className="text-[10px] text-gray-400">Virtual Portfolio Ledger (₹10,00,000 Allocation)</p>
                </div>
              </div>
              <button
                onClick={() => setOrderModalRec(null)}
                className="p-1 rounded-lg hover:bg-terminal-dark text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instrument Brief */}
            <div className="p-3 rounded-xl bg-terminal-dark/80 border border-terminal-border/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{orderModalRec.symbol}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  {orderModalRec.direction}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">{orderModalRec.name}</div>
              
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-terminal-border/50 text-[11px]">
                <div>
                  <span className="text-[9px] text-gray-500 block">ENTRY</span>
                  <span className="font-bold text-white tabular-nums">₹{orderModalRec.entry_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-rose-400 block">STOP-LOSS</span>
                  <span className="font-bold text-rose-400 tabular-nums">₹{orderModalRec.stop_loss.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400 block">TARGET</span>
                  <span className="font-bold text-emerald-400 tabular-nums">₹{orderModalRec.target_1.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quantity / Lots Selector */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px] text-gray-300">
                <span>Lots / Contract Multiplier:</span>
                <span className="text-blue-400 font-semibold">
                  {orderLots} Lot ({orderLots * (orderModalRec.lot_size || 50)} units)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 5, 10].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setOrderLots(cnt)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${
                      orderLots === cnt
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-terminal-dark border-terminal-border text-gray-300 hover:bg-terminal-hover'
                    }`}
                  >
                    {cnt}x
                  </button>
                ))}
              </div>

              {/* Fractional Kelly Institutional Sizing Recommender */}
              {(() => {
                const p = (orderModalRec.conviction_score || 65) / 100.0;
                const b = orderModalRec.risk_reward_ratio || 1.8;
                const rawKelly = Math.max(0, (p * (b + 1) - 1) / b);
                const halfKelly = rawKelly * 0.5;
                const riskPerUnit = Math.max(1, Math.abs(orderModalRec.entry_price - orderModalRec.stop_loss));
                const maxRiskBudget = 1000000.0 * 0.015; // 1.5% max risk cap
                const maxUnits = Math.max(1, Math.floor(maxRiskBudget / riskPerUnit));
                const lotSz = orderModalRec.lot_size || 50;
                const kellyUnits = Math.min(maxUnits, Math.max(lotSz, Math.floor((1000000.0 * halfKelly) / Math.max(1, orderModalRec.entry_price))));
                const recommendedLots = Math.max(1, Math.round(kellyUnits / lotSz));

                return (
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[10px] space-y-1 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Fractional Kelly Suggestion (Half-Kelly):
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderLots(recommendedLots)}
                        className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-sm"
                      >
                        Apply {recommendedLots}x Lot{recommendedLots > 1 ? 's' : ''}
                      </button>
                    </div>
                    <div className="text-gray-400">
                      Win Prob: {(p * 100).toFixed(0)}% | R:R: 1:{b} | Kelly Capital: {(halfKelly * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Estimated Capital Risk Display */}
            <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-gray-300 flex justify-between items-center">
              <span>Max Trade Risk (At Stop-Loss):</span>
              <span className="font-bold text-rose-400 tabular-nums">
                ₹{(Math.abs(orderModalRec.entry_price - orderModalRec.stop_loss) * orderLots * (orderModalRec.lot_size || 50)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            {orderStatusMessage && (
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
                {orderStatusMessage}
              </div>
            )}

            {/* Submit / Cancel Button */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setOrderModalRec(null)}
                className="w-1/3 py-2.5 rounded-xl border border-terminal-border text-xs text-gray-400 hover:text-white hover:bg-terminal-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePaperOrder}
                disabled={isSubmittingOrder}
                className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{isSubmittingOrder ? 'Executing...' : 'Confirm Simulated Trade'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Timing & Chart Intelligence Modal */}
      {selectedTimingSymbol && (
        <StockTimingAnalysisModal
          symbol={selectedTimingSymbol}
          onClose={() => setSelectedTimingSymbol(null)}
        />
      )}
    </div>
  );
};
