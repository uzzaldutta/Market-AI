'use client';

import React, { useState, useEffect } from 'react';
import { fetchQuote, fetchCandles, fetchIndicators } from '../lib/api';
import { Quote, Candle, TechnicalIndicatorsData } from '../types/market';
import { PriceFlash } from './common/PriceFlash';
import { TrendingUp, BarChart2, ShieldCheck, Activity, Compass, Layers, Zap } from 'lucide-react';

interface Props {
  symbol: string;
}

export const InstrumentDeepDiveView: React.FC<Props> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicatorsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [q, c, ind] = await Promise.all([
          fetchQuote(symbol),
          fetchCandles(symbol, timeframe, 60),
          fetchIndicators(symbol, timeframe)
        ]);
        if (isMounted) {
          setQuote(q);
          setCandles(c);
          setIndicators(ind);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    // 6-second polling for live tick updates
    const timer = setInterval(async () => {
      try {
        const q = await fetchQuote(symbol);
        if (isMounted) setQuote(q);
      } catch (err) {}
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [symbol, timeframe]);

  if (loading && !quote) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Loading Technical Deep-Dive for {symbol}...
      </div>
    );
  }

  const isUp = (quote?.change ?? 0) >= 0;

  // Simple clean SVG Candlestick renderer for zero external bundle lock
  const renderCandlestickChart = () => {
    if (!candles.length) return null;
    const height = 240;
    const width = 800;
    const padding = 20;

    const prices = candles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const range = maxP - minP || 1;

    const scaleY = (p: number) => height - padding - ((p - minP) / range) * (height - 2 * padding);
    const stepX = (width - 2 * padding) / candles.length;

    const lastCandle = candles[candles.length - 1];
    const liveLtp = quote?.ltp ?? lastCandle.close;
    const liveLtpY = scaleY(liveLtp);
    const isLiveUp = lastCandle.close >= lastCandle.open;
    const liveColor = isLiveUp ? '#10b981' : '#ef4444';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 bg-terminal-dark rounded-lg">
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((pct, i) => {
          const y = padding + pct * (height - 2 * padding);
          const pVal = maxP - pct * range;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
              <text x={width - padding - 45} y={y - 4} fill="#6b7280" fontSize="9" fontFamily="monospace">
                ₹{pVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = padding + i * stepX + stepX / 2;
          const openY = scaleY(c.open);
          const closeY = scaleY(c.close);
          const highY = scaleY(c.high);
          const lowY = scaleY(c.low);
          const isGreen = c.close >= c.open;
          const color = isGreen ? '#10b981' : '#ef4444';
          const candleW = Math.max(3, stepX * 0.7);

          return (
            <g key={i} className="hover:opacity-80 transition-opacity">
              {/* Wick */}
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
              {/* Candle Body */}
              <rect
                x={x - candleW / 2}
                y={Math.min(openY, closeY)}
                width={candleW}
                height={Math.max(2, Math.abs(closeY - openY))}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}

        {/* Live Real-Time Tick Price Line across chart */}
        <line
          x1={padding}
          y1={liveLtpY}
          x2={width - padding - 65}
          y2={liveLtpY}
          stroke={liveColor}
          strokeDasharray="2 2"
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Pulsating Live Tick Radar Ping */}
        <circle
          cx={width - padding - 68}
          cy={liveLtpY}
          r="4.5"
          fill={liveColor}
          className="animate-ping"
          opacity="0.75"
        />
        <circle
          cx={width - padding - 68}
          cy={liveLtpY}
          r="2.5"
          fill={liveColor}
        />

        {/* Real-time LTP Axis Pill with flashing highlight */}
        <rect
          x={width - padding - 62}
          y={liveLtpY - 9}
          width="62"
          height="18"
          rx="3"
          fill={isLiveUp ? '#064e3b' : '#881337'}
          stroke={liveColor}
          strokeWidth="1.2"
        />
        <text
          x={width - padding - 31}
          y={liveLtpY + 3.5}
          fill="#ffffff"
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          ₹{liveLtp.toFixed(1)}
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Quote Banner */}
      <div className="p-6 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white">{symbol}</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-terminal-dark border border-terminal-border text-gray-400">
              NSE: {symbol}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              quote?.data_quality === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              quote?.data_quality === 'DELAYED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {quote?.data_quality || 'DELAYED 15m'}
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <PriceFlash
              value={quote?.ltp || 0}
              flashMode="badge"
              badgeClassName="text-2xl sm:text-3xl font-bold font-mono"
              enableLiveSimulation={true}
            />
            <span className={`text-sm font-mono font-semibold flex items-center ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {isUp ? '+' : ''}{quote?.change.toFixed(2)} ({isUp ? '+' : ''}{quote?.change_pct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Fundamental & Day Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-terminal-dark p-2.5 rounded-lg border border-terminal-border">
            <div className="text-gray-500 text-[10px]">DAY RANGE</div>
            <div className="font-semibold text-gray-200 mt-0.5">₹{quote?.low.toFixed(1)} - ₹{quote?.high.toFixed(1)}</div>
          </div>
          <div className="bg-terminal-dark p-2.5 rounded-lg border border-terminal-border">
            <div className="text-gray-500 text-[10px]">52W HIGH / LOW</div>
            <div className="font-semibold text-gray-200 mt-0.5">₹{quote?.day_52w_high?.toFixed(0)} / ₹{quote?.day_52w_low?.toFixed(0)}</div>
          </div>
          <div className="bg-terminal-dark p-2.5 rounded-lg border border-terminal-border">
            <div className="text-gray-500 text-[10px]">VOLUME</div>
            <div className="font-semibold text-gray-200 mt-0.5">{((quote?.volume || 0) / 100000).toFixed(2)} Lakh</div>
          </div>
          <div className="bg-terminal-dark p-2.5 rounded-lg border border-terminal-border">
            <div className="text-gray-500 text-[10px]">TREND REGIME</div>
            <div className="font-bold text-blue-400 mt-0.5">{indicators?.trend_state || 'EVALUATING'}</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Candlestick Chart Area */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300">
              Price Action & Intraday Structure ({timeframe})
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Tick Pulse
            </div>
          </div>
          {/* Timeframe Buttons */}
          <div className="flex space-x-1 bg-terminal-dark p-1 rounded-lg border border-terminal-border">
            {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  timeframe === tf ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {renderCandlestickChart()}
      </div>

      {/* 3. Comprehensive Technical Indicators Grid */}
      {indicators && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Oscillators & Momentum */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border space-y-3 font-mono text-xs">
            <h3 className="uppercase font-semibold tracking-wider text-gray-400 border-b border-terminal-border pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Oscillators & Momentum
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">RSI (14 Wilder):</span>
              <span className="font-bold text-gray-200">{indicators.rsi_14.toFixed(1)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">MACD Line / Signal:</span>
              <span className="font-bold text-gray-200">{indicators.macd.line} / {indicators.macd.signal}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">MACD Histogram:</span>
              <span className={`font-bold ${indicators.macd.hist >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {indicators.macd.hist >= 0 ? '+' : ''}{indicators.macd.hist}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Stochastic %K / %D:</span>
              <span className="font-bold text-gray-200">{indicators.stochastic.k} / {indicators.stochastic.d}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Relative Volume (RVOL):</span>
              <span className="font-bold text-blue-400">{indicators.rvol.toFixed(2)}x</span>
            </div>
          </div>

          {/* Moving Averages & Trend */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border space-y-3 font-mono text-xs">
            <h3 className="uppercase font-semibold tracking-wider text-gray-400 border-b border-terminal-border pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Moving Averages
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">EMA 20:</span>
              <span className="font-bold text-gray-200">₹{indicators.ema['20'] || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">SMA 50:</span>
              <span className="font-bold text-gray-200">₹{indicators.sma['50'] || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">SMA 200 (Long Term):</span>
              <span className="font-bold text-gray-200">₹{indicators.sma['200'] || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Bollinger Upper / Lower:</span>
              <span className="font-bold text-gray-200">₹{indicators.bollinger.upper} / ₹{indicators.bollinger.lower}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">VWAP:</span>
              <span className="font-bold text-amber-400">₹{indicators.vwap}</span>
            </div>
          </div>

          {/* Pivots & Support / Resistance */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border space-y-3 font-mono text-xs">
            <h3 className="uppercase font-semibold tracking-wider text-gray-400 border-b border-terminal-border pb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Floor Pivots & Structural Levels
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Resistance (R1 / R2):</span>
              <span className="font-bold text-terminal-red">₹{indicators.pivot_points.R1} / ₹{indicators.pivot_points.R2}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Pivot Point (P):</span>
              <span className="font-bold text-white">₹{indicators.pivot_points.P}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Support (S1 / S2):</span>
              <span className="font-bold text-terminal-green">₹{indicators.pivot_points.S1} / ₹{indicators.pivot_points.S2}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">ATR 14 (Expected Swing):</span>
              <span className="font-bold text-gray-200">₹{indicators.atr_14.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Swing Support:</span>
              <span className="font-bold text-terminal-green">₹{indicators.support_resistance.support[0] || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
