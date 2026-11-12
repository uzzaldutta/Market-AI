'use client';

import React, { useState, useEffect } from 'react';
import { fetchGlobalIndices } from '../../lib/api';
import { GlobalIndicesData, GlobalIndexItem } from '../../types/market';
import { ArrowUpRight, ArrowDownRight, Globe, TrendingUp, AlertCircle, Compass } from 'lucide-react';

export const GlobalTickerBar: React.FC = () => {
  const [data, setData] = useState<GlobalIndicesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadGlobalCues() {
      try {
        const res = await fetchGlobalIndices();
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        // Silent failover to prevent UI crash
      }
    }

    loadGlobalCues();
    const timer = setInterval(loadGlobalCues, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  if (!data || !data.indices || data.indices.length === 0) {
    return null;
  }

  // Key highlight tickers for the top strip
  const prioritySymbols = ['GIFTNIFTY', 'BRENT', 'USDINR', 'DXY', 'SPX', 'NDX', 'DJI', 'GOLD', 'N225', 'DAX'];
  const priorityItems = prioritySymbols
    .map(sym => data.indices.find(i => i.symbol === sym))
    .filter((item): item is GlobalIndexItem => Boolean(item));

  const gap = data.gap_prediction;
  const isGapUp = gap.gap_points >= 0;

  return (
    <div className="w-full bg-[#060a14] border-b border-gray-800/90 text-xs font-mono select-none overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800/40 text-[11px] text-gray-400">
        
        {/* Left: Global Sentiment Badge & GIFT NIFTY Gap */}
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-gray-200">GLOBAL MACRO CUES</span>
          </div>

          <span className={`px-2 py-0.2 rounded text-[10px] font-bold flex-shrink-0 ${
            data.global_sentiment === 'RISK_ON_BULLISH'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : data.global_sentiment === 'RISK_OFF_BEARISH'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {data.global_sentiment.replace(/_/g, ' ')}
          </span>

          {/* GIFT NIFTY Implied Gap Pill */}
          <div className="flex items-center space-x-1.5 bg-gray-900/90 px-2.5 py-0.5 rounded-full border border-gray-700/80 flex-shrink-0">
            <span className="text-[10px] text-gray-400">GIFT NIFTY Implied Gap:</span>
            <span className={`font-bold text-[11px] flex items-center ${isGapUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGapUp ? '+' : ''}{gap.gap_points.toFixed(1)} pts ({isGapUp ? '+' : ''}{gap.gap_pct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Right: Refresh heartbeat */}
        <div className="hidden md:flex items-center space-x-2 text-[10px] text-gray-500 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Wall St • Crude • DXY</span>
        </div>
      </div>

      {/* Horizontal Scrolling Marquee / Pill Stream */}
      <div className="flex items-center space-x-3 px-3 py-1.5 overflow-x-auto scrollbar-none">
        {priorityItems.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item.symbol}
              className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#0c1222] border border-gray-800/80 flex-shrink-0 hover:border-gray-700 transition-colors"
            >
              <span className="text-xs">{item.flag}</span>
              <span className="font-semibold text-gray-300 text-[11px]">{item.name}</span>
              
              <span className="font-bold text-gray-100 text-[11px]">
                {item.currency === '₹' ? '₹' : item.currency === 'USD' ? '$' : ''}
                {item.ltp.toLocaleString(undefined, { minimumFractionDigits: item.ltp < 100 ? 2 : 1, maximumFractionDigits: 2 })}
                {item.currency === '%' ? '%' : ''}
              </span>

              <span className={`flex items-center text-[10.5px] font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {isUp ? '+' : ''}{item.change_pct.toFixed(2)}%
              </span>

              {/* Status Dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${item.market_status === 'OPEN' ? 'bg-emerald-500' : 'bg-gray-600'}`}
                title={item.market_status === 'OPEN' ? 'Market Open' : 'Market Closed'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
