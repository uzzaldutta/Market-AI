'use client';

import React, { useState, useMemo } from 'react';
import { Candle } from '../../types/market';
import { BarChart3, TrendingUp } from 'lucide-react';

interface Props {
  candles: Candle[];
  ltp: number;
  prevClose: number;
  currency: string;
  timeframe: '1D' | '5D' | '1M' | '1Y';
  onTimeframeChange: (tf: '1D' | '5D' | '1M' | '1Y') => void;
  keyLevels?: {
    pivot: number;
    resistance_1: number;
    resistance_2: number;
    support_1: number;
    support_2: number;
    ema_20: number;
    sma_50: number;
  };
}

export const GlobalIndexChart: React.FC<Props> = ({
  candles,
  ltp,
  prevClose,
  currency,
  timeframe,
  onTimeframeChange,
  keyLevels
}) => {
  const [chartMode, setChartMode] = useState<'AREA' | 'CANDLE'>('CANDLE');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isNetPositive = ltp >= prevClose;
  const themeColor = isNetPositive ? '#10b981' : '#f43f5e';

  // SVG Chart Dimensions
  const width = 850;
  const height = 300;
  const paddingLeft = 10;
  const paddingRight = 85;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate Price Scaling Bounds
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    }
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const rawMin = Math.min(...lows, ltp);
    const rawMax = Math.max(...highs, ltp);
    const margin = (rawMax - rawMin) * 0.08 || 1.0;
    const minP = rawMin - margin;
    const maxP = rawMax + margin;
    return { minPrice: minP, maxPrice: maxP, priceRange: maxP - minP || 1.0 };
  }, [candles, ltp]);

  const scaleY = (p: number) => {
    return paddingTop + chartHeight - ((p - minPrice) / priceRange) * chartHeight;
  };

  const stepX = candles.length > 0 ? chartWidth / candles.length : 0;
  const candleWidth = Math.max(3, Math.min(12, stepX * 0.7));

  // Build Area Path and Line Path
  const { linePath, areaPath } = useMemo(() => {
    if (!candles || candles.length === 0) return { linePath: '', areaPath: '' };
    let lp = '';
    candles.forEach((c, i) => {
      const x = paddingLeft + i * stepX + stepX / 2;
      const y = scaleY(c.close);
      if (i === 0) lp += `M ${x} ${y}`;
      else lp += ` L ${x} ${y}`;
    });
    const firstX = paddingLeft + stepX / 2;
    const lastX = paddingLeft + (candles.length - 1) * stepX + stepX / 2;
    const bottomY = paddingTop + chartHeight;
    const ap = `${lp} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    return { linePath: lp, areaPath: ap };
  }, [candles, stepX, minPrice, priceRange]);

  const activeCandle = hoveredIdx !== null && candles[hoveredIdx] ? candles[hoveredIdx] : candles[candles.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const svgX = (clickX / rect.width) * width;
    const adjustedX = svgX - paddingLeft;
    if (adjustedX >= 0 && adjustedX <= chartWidth && stepX > 0) {
      const idx = Math.floor(adjustedX / stepX);
      if (idx >= 0 && idx < candles.length) {
        setHoveredIdx(idx);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  if (!candles || candles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-xl border border-slate-800">
        Loading real-time price series...
      </div>
    );
  }

  const ltpY = scaleY(ltp);
  const pivotY = keyLevels?.pivot ? scaleY(keyLevels.pivot) : null;
  const ema20Y = keyLevels?.ema_20 ? scaleY(keyLevels.ema_20) : null;

  return (
    <div className="flex flex-col bg-[#070b16] rounded-2xl border border-slate-800/80 p-3 sm:p-4 shadow-xl select-none">
      {/* 1. Header Toolbar: Mode Toggle, Timeframes, and Live Hover Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
        {/* Active Candle Hover Metrics */}
        {activeCandle ? (
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-400 font-sans text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {activeCandle.timestamp}
            </span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-500">O:</span>
              <span className="text-slate-300 font-bold">{activeCandle.open.toFixed(2)}</span>
              <span className="text-slate-500">H:</span>
              <span className="text-emerald-400 font-bold">{activeCandle.high.toFixed(2)}</span>
              <span className="text-slate-500">L:</span>
              <span className="text-rose-400 font-bold">{activeCandle.low.toFixed(2)}</span>
              <span className="text-slate-500">C:</span>
              <span
                className={`font-black ${
                  activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activeCandle.close.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono">Hover to inspect candle prices</div>
        )}

        {/* Right Controls: Chart Mode + Timeframes */}
        <div className="flex items-center space-x-2">
          {/* Candlestick vs Area Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setChartMode('CANDLE')}
              title="Candlestick View"
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                chartMode === 'CANDLE'
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Candles</span>
            </button>
            <button
              onClick={() => setChartMode('AREA')}
              title="Smooth Area View"
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                chartMode === 'AREA'
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Area</span>
            </button>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center space-x-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
            {(['1D', '5D', '1M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded transition-all ${
                  timeframe === tf
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 sm:h-72 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.35" />
              <stop offset="60%" stopColor={themeColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="candleGlowUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="candleGlowDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0.1, 0.35, 0.65, 0.9].map((ratio, i) => {
            const y = paddingTop + chartHeight * ratio;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft + chartWidth + 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {priceVal.toFixed(priceVal < 100 ? 2 : 1)}
                </text>
              </g>
            );
          })}

          {/* Pivot Level Guide Line */}
          {pivotY !== null && (
            <g>
              <line
                x1={paddingLeft}
                y1={pivotY}
                x2={paddingLeft + chartWidth}
                y2={pivotY}
                stroke="#eab308"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text
                x={paddingLeft + chartWidth + 6}
                y={pivotY + 3}
                fill="#eab308"
                fontSize="9"
                fontFamily="monospace"
              >
                P: {keyLevels?.pivot?.toFixed(1)}
              </text>
            </g>
          )}

          {/* 20 EMA Guide Line */}
          {ema20Y !== null && (
            <g>
              <line
                x1={paddingLeft}
                y1={ema20Y}
                x2={paddingLeft + chartWidth}
                y2={ema20Y}
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.5"
              />
              <text
                x={paddingLeft + chartWidth + 6}
                y={ema20Y - 4}
                fill="#06b6d4"
                fontSize="9"
                fontFamily="monospace"
              >
                EMA: {keyLevels?.ema_20?.toFixed(1)}
              </text>
            </g>
          )}

          {/* Current LTP Horizontal Active Track */}
          <line
            x1={paddingLeft}
            y1={ltpY}
            x2={paddingLeft + chartWidth}
            y2={ltpY}
            stroke={themeColor}
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.8"
          />
          {/* LTP Badge Tag on Axis */}
          <rect
            x={paddingLeft + chartWidth + 4}
            y={ltpY - 9}
            width={72}
            height={18}
            rx={4}
            fill={themeColor}
          />
          <text
            x={paddingLeft + chartWidth + 40}
            y={ltpY + 3}
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {ltp.toFixed(ltp < 100 ? 2 : 1)}
          </text>

          {/* RENDER MODE A: Smooth Area Chart */}
          {chartMode === 'AREA' && (
            <g>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {/* RENDER MODE B: Japanese Candlesticks */}
          {chartMode === 'CANDLE' && (
            <g>
              {candles.map((c, i) => {
                const x = paddingLeft + i * stepX + stepX / 2;
                const highY = scaleY(c.high);
                const lowY = scaleY(c.low);
                const openY = scaleY(c.open);
                const closeY = scaleY(c.close);

                const isUp = c.close >= c.open;
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));

                return (
                  <g key={`candle-${i}`}>
                    {/* High-Low Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      rx={1}
                      fill={isUp ? 'url(#candleGlowUp)' : 'url(#candleGlowDown)'}
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="0.8"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Interactive Mouse Crosshair Overlay */}
          {hoveredIdx !== null && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={paddingLeft + hoveredIdx * stepX + stepX / 2}
                y1={paddingTop}
                x2={paddingLeft + hoveredIdx * stepX + stepX / 2}
                y2={paddingTop + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* Horizontal Crosshair Line */}
              {activeCandle && (
                <line
                  x1={paddingLeft}
                  y1={scaleY(activeCandle.close)}
                  x2={paddingLeft + chartWidth}
                  y2={scaleY(activeCandle.close)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
              )}
            </g>
          )}

          {/* Bottom Time Axis Labels */}
          {candles.length > 0 && (
            <g>
              <text
                x={paddingLeft + 5}
                y={paddingTop + chartHeight + 18}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {candles[0].timestamp}
              </text>
              {candles.length > 2 && (
                <text
                  x={paddingLeft + chartWidth / 2}
                  y={paddingTop + chartHeight + 18}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {candles[Math.floor(candles.length / 2)].timestamp}
                </text>
              )}
              <text
                x={paddingLeft + chartWidth - 5}
                y={paddingTop + chartHeight + 18}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {candles[candles.length - 1].timestamp}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
