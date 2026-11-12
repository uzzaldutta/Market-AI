'use client';

import React, { useState, useEffect } from 'react';
import { MarketOverviewData, Quote, GlobalIndicesData } from '../types/market';
import { useFavourites } from '../context/FavouritesContext';
import { PriceFlash } from './common/PriceFlash';
import { fetchParticipantFlows, fetchSectorRotationMatrix, fetchGlobalIndices } from '../lib/api';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart2, Star, Sparkles, ShieldAlert, Layers, Compass, Globe, DollarSign } from 'lucide-react';

interface Props {
  data: MarketOverviewData | null;
  onSelectSymbol: (s: string) => void;
}

export const MarketOverviewView: React.FC<Props> = ({ data, onSelectSymbol }) => {
  const { isFavourite, toggle } = useFavourites();
  const [participantFlows, setParticipantFlows] = useState<any | null>(null);
  const [sectorRotation, setSectorRotation] = useState<any | null>(null);
  const [globalData, setGlobalData] = useState<GlobalIndicesData | null>(null);
  const [globalCategory, setGlobalCategory] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    async function loadQuantTelemetry() {
      try {
        const [flows, rrg, gData] = await Promise.all([
          fetchParticipantFlows().catch(() => null),
          fetchSectorRotationMatrix().catch(() => null),
          fetchGlobalIndices().catch(() => null)
        ]);
        if (isMounted) {
          if (flows) setParticipantFlows(flows);
          if (rrg) setSectorRotation(rrg);
          if (gData) setGlobalData(gData);
        }
      } catch (e) {}
    }
    loadQuantTelemetry();
    const timer = setInterval(loadQuantTelemetry, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

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
          const isFav = isFavourite(idx.symbol);
          return (
            <div
              key={idx.symbol}
              onClick={() => onSelectSymbol(idx.symbol)}
              className="p-4 rounded-xl bg-terminal-surface border border-terminal-border hover:border-blue-500/50 cursor-pointer transition-all shadow-sm group relative"
            >
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(idx.symbol);
                    }}
                    className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <span>{idx.name}</span>
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-terminal-dark border border-terminal-border">
                  NSE
                </span>
              </div>
              <div className="my-1.5">
                <PriceFlash
                  value={idx.ltp}
                  flashMode="badge"
                  badgeClassName="text-xl md:text-2xl font-bold font-mono tracking-tight"
                  enableLiveSimulation={true}
                />
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

      {/* 1B. Institutional Smart Money (FII / DII) & Cycle Sentiment Telemetry */}
      {participantFlows && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-terminal-surface to-indigo-950/30 border border-blue-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-terminal-border/60">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="uppercase tracking-wider">INSTITUTIONAL PARTICIPANT POSITIONING &amp; FII LONG/SHORT RATIO</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                Smart Money Divergence:
                <span className={`font-mono ${participantFlows.smart_money_divergence >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {participantFlows.smart_money_divergence >= 0 ? '+' : ''}{participantFlows.smart_money_divergence}%
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {participantFlows.cycle_phase.replace(/_/g, ' ')}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl font-sans">
                {participantFlows.cycle_thesis}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block">FII FUTURES LONG</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {participantFlows.participants.fii.long_ratio_pct}%
                </span>
                <span className="text-[9px] text-gray-500 block">
                  {participantFlows.participants.fii.stance}
                </span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block">RETAIL CLIENT LONG</span>
                <span className="font-bold text-amber-400 text-sm">
                  {participantFlows.participants.client.long_ratio_pct}%
                </span>
                <span className="text-[9px] text-gray-500 block">
                  {participantFlows.participants.client.stance}
                </span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block">DII NET FUTURES</span>
                <span className="font-bold text-gray-300 text-sm">
                  {(participantFlows.participants.dii.net_futures / 1000).toFixed(1)}k
                </span>
                <span className="text-[9px] text-gray-500 block">Contracts</span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block">PRO DESK NET</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {(participantFlows.participants.pro.net_futures / 1000).toFixed(1)}k
                </span>
                <span className="text-[9px] text-gray-500 block">Market Makers</span>
              </div>
            </div>
          </div>

          {/* Institutional vs Retail Sentiment Comparison Meter */}
          <div className="pt-3">
            <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
              <span className="text-emerald-400 font-bold">FII (Smart Money): {participantFlows.participants.fii.long_ratio_pct}% Long</span>
              <span className="text-gray-400">Institutional Long/Short Index</span>
              <span className="text-amber-400 font-bold">Client (Retail): {participantFlows.participants.client.long_ratio_pct}% Long</span>
            </div>
            <div className="w-full h-2.5 bg-terminal-dark rounded-full overflow-hidden flex border border-terminal-border/80">
              <div
                style={{ width: `${participantFlows.participants.fii.long_ratio_pct}%` }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${100 - participantFlows.participants.fii.long_ratio_pct}%` }}
                className="bg-rose-500 h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1C. Sector Relative Strength & Momentum Rotation Matrix (RRG Quadrants) */}
      {sectorRotation && (
        <div className="p-5 rounded-2xl bg-terminal-surface border border-terminal-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border/80 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-200">
                Sector Relative Strength &amp; Momentum Rotation (RRG Model vs NIFTY 50)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                {sectorRotation.leading_count} Leading
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                {sectorRotation.improving_count} Improving
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                {sectorRotation.weakening_count} Weakening
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                {sectorRotation.lagging_count} Lagging
              </span>
            </div>
          </div>

          {/* RRG Quadrant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {sectorRotation.sectors.slice(0, 8).map((sec: any) => {
              const isLeading = sec.quadrant === 'LEADING';
              const isImproving = sec.quadrant === 'IMPROVING';
              const isWeakening = sec.quadrant === 'WEAKENING';
              return (
                <div
                  key={sec.sector_name}
                  className={`p-3 rounded-xl border transition-all ${
                    isLeading
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : isImproving
                      ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
                      : isWeakening
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-xs">{sec.sector_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isLeading ? 'bg-emerald-500/20 text-emerald-400' :
                      isImproving ? 'bg-cyan-500/20 text-cyan-400' :
                      isWeakening ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {sec.quadrant}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2">{sec.category}</div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-terminal-border/40">
                    <div>
                      <span className="text-gray-500 block">RS-RATIO</span>
                      <span className="font-bold text-white">{sec.rs_ratio}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">RS-MOMENTUM</span>
                      <span className="font-bold text-white">{sec.rs_momentum}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1D. Global Indices & Macro Commodities (Dollar, Crude, Gold, Wall Street, Asia) */}
      {globalData && (
        <div className="p-5 rounded-2xl bg-terminal-surface border border-terminal-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-200">
                Global Markets &amp; Macro Telemetry (Crude, Dollar, Wall St, Asia)
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                globalData.global_sentiment === 'RISK_ON_BULLISH'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : globalData.global_sentiment === 'RISK_OFF_BEARISH'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {globalData.global_sentiment.replace(/_/g, ' ')} ({globalData.sentiment_score > 0 ? '+' : ''}{globalData.sentiment_score.toFixed(2)})
              </span>
            </div>
          </div>

          {/* GIFT NIFTY Opening Gap Predictor Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1527] via-[#091122] to-[#0d1527] border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🇮🇳</span>
                  <span className="text-xs font-mono font-bold text-gray-200">GIFT NIFTY Opening Gap Predictor</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold ${
                    globalData.gap_prediction.gap_points >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {globalData.gap_prediction.gap_bias.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {globalData.gap_prediction.pre_market_advice}
                </p>
              </div>

              <div className="flex items-center space-x-4 font-mono text-right flex-shrink-0">
                <div className="bg-terminal-dark/80 px-3 py-1.5 rounded-lg border border-terminal-border">
                  <div className="text-[10px] text-gray-400">GIFT NIFTY LTP</div>
                  <div className="text-sm font-bold text-white">
                    {globalData.gap_prediction.gift_nifty_ltp.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border ${
                  globalData.gap_prediction.gap_points >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="text-[10px] text-gray-400">IMPLIED GAP</div>
                  <div className={`text-sm font-bold ${globalData.gap_prediction.gap_points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {globalData.gap_prediction.gap_points >= 0 ? '+' : ''}{globalData.gap_prediction.gap_points.toFixed(1)} pts ({globalData.gap_prediction.gap_pct >= 0 ? '+' : ''}{globalData.gap_prediction.gap_pct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: 'ALL', label: 'All Global Assets (20)' },
              { id: 'COMMODITIES_CURRENCIES', label: '🛢️ Crude, Dollar & Gold (8)' },
              { id: 'AMERICAS', label: '🇺🇸 Wall Street (4)' },
              { id: 'ASIA_PACIFIC', label: '🌏 Asia-Pacific (4)' },
              { id: 'EUROPE', label: '🇪🇺 Europe (3)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGlobalCategory(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  globalCategory === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                    : 'bg-terminal-dark/80 text-gray-400 hover:text-white border border-terminal-border/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Global Indices & Macro Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono">
            {globalData.indices
              .filter(item => globalCategory === 'ALL' || item.region === globalCategory)
              .map((item) => {
                const isUp = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="p-3 rounded-xl bg-terminal-dark/80 border border-terminal-border/80 hover:border-cyan-500/40 transition-all shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm">{item.flag}</span>
                        <span className="font-semibold text-gray-200 truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.market_status === 'OPEN' ? 'bg-emerald-500' : 'bg-gray-600'}`} title={item.market_status === 'OPEN' ? 'Open' : 'Closed'} />
                    </div>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <div className="text-lg font-bold text-gray-100">
                        {item.currency === '₹' ? '₹' : item.currency === 'USD' ? '$' : ''}
                        {item.ltp.toLocaleString(undefined, {
                          minimumFractionDigits: item.ltp < 100 ? 2 : 1,
                          maximumFractionDigits: 2
                        })}
                        {item.currency === '%' ? '%' : ''}
                      </div>

                      <div className={`flex items-center text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        {isUp ? '+' : ''}{item.change_pct.toFixed(2)}%
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-terminal-border/40">
                      <span>{item.category} • {item.currency}</span>
                      <span>H: {item.high.toFixed(1)} L: {item.low.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
                {top_gainers.map((stk) => {
                  const isFav = isFavourite(stk.symbol);
                  return (
                    <tr
                      key={stk.symbol}
                      onClick={() => onSelectSymbol(stk.symbol)}
                      className="hover:bg-terminal-hover cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-bold text-gray-200">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(stk.symbol);
                            }}
                            className="p-1 -ml-1 rounded hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                            title={isFav ? 'Remove favourite' : 'Add favourite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <span>{stk.symbol}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <PriceFlash
                          value={stk.ltp}
                          flashMode="cell"
                          className="font-semibold text-gray-200"
                          enableLiveSimulation={true}
                        />
                      </td>
                      <td className="py-2.5 text-right text-terminal-green font-semibold">
                        +{stk.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right text-gray-400">{(stk.volume / 1000).toFixed(0)}k</td>
                    </tr>
                  );
                })}
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
                {top_losers.map((stk) => {
                  const isFav = isFavourite(stk.symbol);
                  return (
                    <tr
                      key={stk.symbol}
                      onClick={() => onSelectSymbol(stk.symbol)}
                      className="hover:bg-terminal-hover cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-bold text-gray-200">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(stk.symbol);
                            }}
                            className="p-1 -ml-1 rounded hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                            title={isFav ? 'Remove favourite' : 'Add favourite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <span>{stk.symbol}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <PriceFlash
                          value={stk.ltp}
                          flashMode="cell"
                          className="font-semibold text-gray-200"
                          enableLiveSimulation={true}
                        />
                      </td>
                      <td className="py-2.5 text-right text-terminal-red font-semibold">
                        {stk.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right text-gray-400">{(stk.volume / 1000).toFixed(0)}k</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
