'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchGlobalIndices } from '../../lib/api';
import { GlobalIndicesData, GlobalIndexItem } from '../../types/market';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface Props {
  onSelectSymbol?: (symbol: string) => void;
}

export const GlobalTickerBar: React.FC<Props> = ({ onSelectSymbol }) => {
  const [data, setData] = useState<GlobalIndicesData | null>(null);
  const [flashStates, setFlashStates] = useState<Record<string, 'UP' | 'DOWN' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadGlobalCues() {
      try {
        const res = await fetchGlobalIndices();
        if (!isMounted) return;

        // Detect tick directional changes for live color flashing
        const newFlash: Record<string, 'UP' | 'DOWN' | null> = {};
        if (res?.indices) {
          res.indices.forEach((item: GlobalIndexItem) => {
            const prev = prevPricesRef.current[item.symbol];
            if (prev !== undefined && prev !== item.ltp) {
              newFlash[item.symbol] = item.ltp > prev ? 'UP' : 'DOWN';
            }
            prevPricesRef.current[item.symbol] = item.ltp;
          });
        }

        if (Object.keys(newFlash).length > 0) {
          setFlashStates(newFlash);
          setTimeout(() => {
            if (isMounted) setFlashStates({});
          }, 1500);
        }

        setData(res);
      } catch (err) {
        // Silent failover to prevent UI breakage
      }
    }

    loadGlobalCues();
    const timer = setInterval(loadGlobalCues, 8000); // 8-second refresh
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  if (!data || !data.indices || data.indices.length === 0) {
    return null;
  }

  // Curated list of high-impact macro benchmarks
  const prioritySymbols = [
    'GIFTNIFTY',
    'BRENT',
    'USDINR',
    'DXY',
    'SPX',
    'NDX',
    'DJI',
    'GOLD',
    'SILVER',
    'N225',
    'DAX',
    'FTSE'
  ];

  const priorityItems = prioritySymbols
    .map((sym) => data.indices.find((i) => i.symbol === sym))
    .filter((item): item is GlobalIndexItem => Boolean(item));

  // Double-buffered stream for seamless continuous looping
  const marqueeItems = [...priorityItems, ...priorityItems];

  const gap = data.gap_prediction;
  const isGapUp = gap ? gap.gap_points >= 0 : true;

  return (
    <div className="w-full bg-[#050811] border-b border-slate-800/80 text-xs font-mono select-none overflow-hidden relative shadow-lg">
      {/* 1. Header Micro-Bar: Sentiment Badge, GIFT NIFTY Gap & Heartbeat */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1 border-b border-slate-800/40 text-[11px] text-slate-400 bg-[#070b16]/70">
        <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider text-slate-300 font-display text-[10px] uppercase">
              Global Macro Telemetry
            </span>
          </div>

          {/* Sentiment Badge */}
          <span
            className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold tracking-wider flex-shrink-0 border uppercase ${
              data.global_sentiment === 'RISK_ON_BULLISH'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : data.global_sentiment === 'RISK_OFF_BEARISH'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {data.global_sentiment.replace(/_/g, ' ')}
          </span>

          {/* GIFT NIFTY Opening Gap Predictor */}
          {gap && (
            <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-700/60 flex-shrink-0 shadow-inner">
              <span className="text-[10px] text-slate-400 font-sans">GIFT NIFTY Gap Forecast:</span>
              <span
                className={`font-black text-[11px] font-mono flex items-center gap-0.5 ${
                  isGapUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isGapUp ? '+' : ''}{gap.gap_points.toFixed(1)} pts ({isGapUp ? '+' : ''}{gap.gap_pct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Live Streaming Indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-500 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-slate-400 text-[10px]">Real-Time Streaming Tape</span>
        </div>
      </div>

      {/* 2. Continuous Right-to-Left Marquee Ticker Tape with Feathered Edges */}
      <div className="w-full overflow-hidden edge-fade-mask py-1.5 group cursor-pointer">
        <div className="animate-marquee-continuous flex items-center space-x-3 hover:[animation-play-state:paused]">
          {marqueeItems.map((item, index) => {
            const isPositive = item.change >= 0;
            const flash = flashStates[item.symbol];

            return (
              <div
                key={`${item.symbol}-${index}`}
                onClick={() => onSelectSymbol?.(item.symbol)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-900/80 border transition-all duration-300 flex-shrink-0 select-none shadow-sm ${
                  flash === 'UP'
                    ? 'flash-up-glow border-emerald-500/80'
                    : flash === 'DOWN'
                    ? 'flash-down-glow border-rose-500/80'
                    : isPositive
                    ? 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-slate-800/90'
                    : 'border-rose-500/20 hover:border-rose-500/50 hover:bg-slate-800/90'
                }`}
              >
                {/* Flag / Icon */}
                <span className="text-xs">{item.flag}</span>

                {/* Instrument Name */}
                <span className="font-bold text-slate-300 text-[11px] tracking-tight">
                  {item.name}
                </span>

                {/* Price Display */}
                <span className="font-black text-white text-[11px] tabular-nums font-mono">
                  {item.currency === '₹' ? '₹' : item.currency === 'USD' ? '$' : ''}
                  {item.ltp.toLocaleString('en-IN', {
                    minimumFractionDigits: item.ltp < 100 ? 2 : 1,
                    maximumFractionDigits: 2
                  })}
                  {item.currency === '%' ? '%' : ''}
                </span>

                {/* Dynamic Change % Pill with Up/Down Arrow */}
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-black font-mono transition-colors ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-400 inline" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-rose-400 inline" />
                  )}
                  {isPositive ? '+' : ''}
                  {item.change_pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
