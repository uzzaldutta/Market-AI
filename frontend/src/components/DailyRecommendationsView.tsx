'use client';

import React, { useState, useEffect } from 'react';
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
  Wallet
} from 'lucide-react';

interface DailyRecommendation {
  symbol: string;
  name: string;
  sector: string;
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
  recommendations: DailyRecommendation[];
}

interface Props {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToPaper?: (symbol: string, side: 'BUY' | 'SELL', price: number) => void;
}

export const DailyRecommendationsView: React.FC<Props> = ({ onSelectSymbol, onNavigateToPaper }) => {
  const [data, setData] = useState<DailyRecommendationsData | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedSym, setExpandedSym] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRecs() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/v1/recommendations/daily?limit=15');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json);
            if (json.recommendations?.length > 0) {
              setExpandedSym(json.recommendations[0].symbol);
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

  const toggleExpand = (sym: string) => {
    setExpandedSym(expandedSym === sym ? null : sym);
  };

  const filteredRecs = data?.recommendations.filter(r => {
    if (filter === 'ELIGIBLE') return r.status === 'ELIGIBLE';
    if (filter === 'WATCH') return r.status === 'WATCH';
    if (filter === 'LONG') return r.direction === 'LONG';
    if (filter === 'SHORT') return r.direction === 'SHORT';
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* 1. Hero Intelligence Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-950/40 via-terminal-surface to-indigo-950/30 border border-blue-500/30 shadow-lg shadow-blue-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="font-bold tracking-wider uppercase">AI DAILY RECOMMENDATIONS &amp; RISK ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
              Daily Quantitative Trade Setups &amp; Invalidation Levels
            </h1>
            <p className="text-xs text-gray-400 font-sans mt-1">
              Synthesizing 20+ Technical Indicators, Calibrated AI Directional Probabilities, F&amp;O Open Interest &amp; PCR, Corporate News Sentiment, and Stop-Loss Bounds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="bg-terminal-dark/80 px-3 py-1.5 rounded-lg border border-terminal-border text-gray-400">
              <span className="text-[10px] text-gray-500 block">MARKET BIAS</span>
              <span className={`font-bold ${data?.market_regime.includes('BULLISH') ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {data?.market_regime || 'CALCULATING'}
              </span>
            </div>
            <div className="bg-terminal-dark/80 px-3 py-1.5 rounded-lg border border-terminal-border text-gray-400">
              <span className="text-[10px] text-gray-500 block">UPDATED</span>
              <span className="font-bold text-white">{data?.date_display || 'Today'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Navigation Ribbon */}
      <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: `All Setups (${data?.recommendations.length || 0})` },
            { id: 'ELIGIBLE', label: `Eligible High Conviction (${data?.eligible_count || 0})` },
            { id: 'WATCH', label: `Watchlist Setups (${data?.watch_count || 0})` },
            { id: 'LONG', label: 'Long Only' },
            { id: 'SHORT', label: 'Short Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white hover:bg-terminal-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-gray-500 hidden sm:block">
          Strict Invalidation Stop-Loss &bull; Max 0.5% Capital Risk per Trade
        </div>
      </div>

      {/* 3. Recommendations Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono animate-pulse bg-terminal-surface rounded-xl border border-terminal-border">
            Analyzing all NSE stocks across Technicals, AI Machine Learning, F&amp;O positioning and News Sentiment...
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-mono bg-terminal-surface rounded-xl border border-terminal-border">
            No active setups match this filter. The algorithm maintains strict risk gates when conditions are suboptimal.
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const isExpanded = expandedSym === rec.symbol;
            const isLong = rec.direction === 'LONG';
            const isEligible = rec.status === 'ELIGIBLE';

            return (
              <div
                key={rec.symbol}
                className={`rounded-xl border transition-all ${
                  isEligible
                    ? 'bg-terminal-surface border-blue-500/40 shadow-sm'
                    : 'bg-terminal-surface/90 border-terminal-border'
                }`}
              >
                {/* Card Top Summary Row */}
                <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Ticker & Direction */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm shadow-md ${
                        isLong
                          ? 'bg-emerald-500/10 text-terminal-green border border-emerald-500/30'
                          : 'bg-rose-500/10 text-terminal-red border border-rose-500/30'
                      }`}
                    >
                      {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base font-mono text-white tracking-wide">{rec.symbol}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-dark border border-terminal-border text-gray-400">
                          {rec.sector}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
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
                      <div className="text-xs text-gray-400 font-sans mt-0.5">{rec.name}</div>
                    </div>
                  </div>

                  {/* Center: Conviction Score Meter */}
                  <div className="hidden md:flex flex-col items-center font-mono">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Conviction Score</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <div className="w-20 h-2 bg-terminal-dark rounded-full overflow-hidden border border-terminal-border">
                        <div
                          style={{ width: `${rec.conviction_score}%` }}
                          className={`h-full ${
                            rec.conviction_score >= 70 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-bold text-white">{rec.conviction_score}%</span>
                    </div>
                  </div>

                  {/* Right: Key Price Targets */}
                  <div className="flex items-center space-x-4 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">LTP / ENTRY</div>
                      <div className="font-bold text-white text-sm">₹{rec.entry_price.toFixed(2)}</div>
                    </div>

                    <div className="text-right bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                      <div className="text-[10px] text-rose-400 font-semibold">STOP-LOSS</div>
                      <div className="font-bold text-terminal-red">₹{rec.stop_loss.toFixed(2)} (-{rec.stop_loss_pct}%)</div>
                    </div>

                    <div className="text-right bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-400 font-semibold">TARGET 1 (1.5R)</div>
                      <div className="font-bold text-terminal-green">₹{rec.target_1.toFixed(2)} (+{rec.target_1_pct}%)</div>
                    </div>

                    {/* Toggle Details Chevron */}
                    <button
                      onClick={() => toggleExpand(rec.symbol)}
                      className="p-1.5 rounded-lg bg-terminal-dark hover:bg-terminal-border border border-terminal-border text-gray-400 transition-colors"
                      title="Toggle 360-degree Analysis"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded 360-Degree Analysis Tray */}
                {isExpanded && (
                  <div className="p-5 border-t border-terminal-border bg-terminal-dark/60 space-y-5">
                    {/* Trade Setup Parameters Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                      <div className="p-3 bg-terminal-surface rounded-lg border border-terminal-border">
                        <span className="text-[10px] text-gray-500 block">STRATEGY SETUP</span>
                        <span className="font-bold text-white">{rec.strategy_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="p-3 bg-terminal-surface rounded-lg border border-terminal-border">
                        <span className="text-[10px] text-gray-500 block">RISK / REWARD</span>
                        <span className="font-bold text-blue-400">1 : {rec.risk_reward_ratio}</span>
                      </div>
                      <div className="p-3 bg-terminal-surface rounded-lg border border-terminal-border">
                        <span className="text-[10px] text-gray-500 block">TARGET 2 (RUNNER)</span>
                        <span className="font-bold text-terminal-green">₹{rec.target_2.toFixed(2)} (+{rec.target_2_pct}%)</span>
                      </div>
                      <div className="p-3 bg-terminal-surface rounded-lg border border-terminal-border">
                        <span className="text-[10px] text-gray-500 block">RISK LIMIT GUIDELINE</span>
                        <span className="font-bold text-amber-400">Max 0.50% Equity Risk</span>
                      </div>
                      <div className="p-3 bg-terminal-surface rounded-lg border border-terminal-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 block">ACTIONS</span>
                          <button
                            onClick={() => onSelectSymbol(rec.symbol)}
                            className="text-blue-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            Open Chart <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5-Aspect Deep-Dive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Aspect 1: Technical Analysis */}
                      <div className="p-4 rounded-lg bg-terminal-surface border border-terminal-border space-y-1.5">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                          <Activity className="w-3.5 h-3.5" />
                          <span>1. Technical Analysis Aspect</span>
                        </div>
                        <p className="text-gray-300 font-sans leading-relaxed text-[11px]">
                          {rec.analysis_aspects.technical}
                        </p>
                      </div>

                      {/* Aspect 2: AI ML Probabilities */}
                      <div className="p-4 rounded-lg bg-terminal-surface border border-terminal-border space-y-1.5">
                        <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-[11px]">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>2. AI Prediction &amp; Volatility Aspect</span>
                        </div>
                        <p className="text-gray-300 font-sans leading-relaxed text-[11px]">
                          {rec.analysis_aspects.ai_prediction}
                        </p>
                      </div>

                      {/* Aspect 3: Derivatives F&O */}
                      <div className="p-4 rounded-lg bg-terminal-surface border border-terminal-border space-y-1.5">
                        <div className="flex items-center space-x-2 text-purple-400 font-bold uppercase tracking-wider text-[11px]">
                          <Layers className="w-3.5 h-3.5" />
                          <span>3. F&amp;O &amp; Options Positioning Aspect</span>
                        </div>
                        <p className="text-gray-300 font-sans leading-relaxed text-[11px]">
                          {rec.analysis_aspects.derivatives_fo}
                        </p>
                      </div>

                      {/* Aspect 4: News & Events */}
                      <div className="p-4 rounded-lg bg-terminal-surface border border-terminal-border space-y-1.5">
                        <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                          <Newspaper className="w-3.5 h-3.5" />
                          <span>4. News &amp; Corporate Actions Aspect</span>
                        </div>
                        <p className="text-gray-300 font-sans leading-relaxed text-[11px]">
                          {rec.analysis_aspects.news_and_events}
                        </p>
                      </div>

                      {/* Aspect 5: Concrete Stop-Loss & Risk Invalidation (Full Width) */}
                      <div className="md:col-span-2 p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-1.5">
                        <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>5. Concrete Stop-Loss &amp; Risk Invalidation Thesis</span>
                        </div>
                        <p className="text-gray-200 font-sans leading-relaxed text-[11px]">
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
    </div>
  );
};
