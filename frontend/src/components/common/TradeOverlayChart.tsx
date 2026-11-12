'use client';

import React, { useState } from 'react';
import { Candle, TradeTimingLevels } from '../../types/market';

interface Props {
  candles: Candle[];
  tradeLevels: TradeTimingLevels;
  vwap: number;
  ltp: number;
  symbol: string;
}

export const TradeOverlayChart: React.FC<Props> = ({
  candles,
  tradeLevels,
  vwap,
  ltp,
  symbol
}) => {
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (!candles || candles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 font-mono text-xs bg-black/40 rounded-lg border border-gray-800">
        No candlestick price series available for {symbol}
      </div>
    );
  }

  const height = 300;
  const width = 850;
  const paddingLeft = 15;
  const paddingRight = 110; // Space for price level labels
  const paddingTop = 25;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate Price Range
  const candleHighs = candles.map(c => c.high);
  const candleLows = candles.map(c => c.low);

  const rawMin = Math.min(...candleLows, tradeLevels.stop_loss, ltp, vwap);
  const rawMax = Math.max(...candleHighs, tradeLevels.target_2, ltp, vwap);

  const paddingMargin = (rawMax - rawMin) * 0.08 || 1.0;
  const minPrice = rawMin - paddingMargin;
  const maxPrice = rawMax + paddingMargin;
  const priceRange = maxPrice - minPrice || 1.0;

  const scaleY = (price: number) => {
    return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = Math.max(3, Math.min(14, (chartWidth / candles.length) * 0.7));
  const stepX = chartWidth / candles.length;

  const buyZoneTop = scaleY(tradeLevels.buy_zone_max);
  const buyZoneBottom = scaleY(tradeLevels.buy_zone_min);
  const buyZoneHeight = Math.max(4, Math.abs(buyZoneBottom - buyZoneTop));

  const slY = scaleY(tradeLevels.stop_loss);
  const t1Y = scaleY(tradeLevels.target_1);
  const t2Y = scaleY(tradeLevels.target_2);
  const vwapY = scaleY(vwap);
  const ltpY = scaleY(ltp);

  return (
    <div className="relative w-full bg-[#0a0f1d] rounded-xl border border-gray-800/80 p-3 shadow-inner">
      {/* Top Chart Header / Controls */}
      <div className="flex items-center justify-between mb-2 text-xs font-mono text-gray-400">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-200">Execution Trade Map</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Buy Zone: ₹{tradeLevels.buy_zone_min.toFixed(2)} – ₹{tradeLevels.buy_zone_max.toFixed(2)}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            SL: ₹{tradeLevels.stop_loss.toFixed(2)} ({tradeLevels.stop_loss_pct > 0 ? `-${tradeLevels.stop_loss_pct}` : tradeLevels.stop_loss_pct}%)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            <span className="text-gray-300">T1: ₹{tradeLevels.target_1.toFixed(2)} (+{tradeLevels.target_1_pct}%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
            <span className="text-gray-300">T2: ₹{tradeLevels.target_2.toFixed(2)} (+{tradeLevels.target_2_pct}%)</span>
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-72 block select-none"
          onMouseLeave={() => {
            setHoveredCandle(null);
            setHoverPos(null);
          }}
        >
          <defs>
            <linearGradient id="buyZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="t2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, i) => {
            const y = paddingTop + pct * chartHeight;
            const p = maxPrice - pct * priceRange;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1f293d"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 3}
                  fill="#4b5563"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ₹{p.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* BUY ZONE SHADED BAND */}
          <rect
            x={paddingLeft}
            y={Math.min(buyZoneTop, buyZoneBottom)}
            width={chartWidth}
            height={buyZoneHeight}
            fill="url(#buyZoneGrad)"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeDasharray="4 2"
            opacity="0.85"
          />
          <text
            x={paddingLeft + 10}
            y={Math.min(buyZoneTop, buyZoneBottom) + 12}
            fill="#34d399"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            INSTITUTIONAL ACCUMULATION BUY ZONE
          </text>

          {/* STOP LOSS LINE */}
          <line
            x1={paddingLeft}
            y1={slY}
            x2={width - paddingRight}
            y2={slY}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <g transform={`translate(${width - paddingRight + 4}, ${slY - 8})`}>
            <rect width="98" height="17" rx="3" fill="#881337" fillOpacity="0.85" stroke="#f43f5e" strokeWidth="0.8" />
            <text x="5" y="12" fill="#fda4af" fontSize="9" fontWeight="bold" fontFamily="monospace">
              SL ₹{tradeLevels.stop_loss.toFixed(1)}
            </text>
          </g>

          {/* TARGET 1 LINE */}
          <line
            x1={paddingLeft}
            y1={t1Y}
            x2={width - paddingRight}
            y2={t1Y}
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeDasharray="5 3"
          />
          <g transform={`translate(${width - paddingRight + 4}, ${t1Y - 8})`}>
            <rect width="98" height="17" rx="3" fill="#164e63" fillOpacity="0.85" stroke="#06b6d4" strokeWidth="0.8" />
            <text x="5" y="12" fill="#67e8f9" fontSize="9" fontWeight="bold" fontFamily="monospace">
              T1 ₹{tradeLevels.target_1.toFixed(1)} (+{tradeLevels.target_1_pct}%)
            </text>
          </g>

          {/* TARGET 2 LINE */}
          <line
            x1={paddingLeft}
            y1={t2Y}
            x2={width - paddingRight}
            y2={t2Y}
            stroke="#a855f7"
            strokeWidth="1.2"
            strokeDasharray="5 3"
          />
          <g transform={`translate(${width - paddingRight + 4}, ${t2Y - 8})`}>
            <rect width="98" height="17" rx="3" fill="#581c87" fillOpacity="0.85" stroke="#a855f7" strokeWidth="0.8" />
            <text x="5" y="12" fill="#d8b4fe" fontSize="9" fontWeight="bold" fontFamily="monospace">
              T2 ₹{tradeLevels.target_2.toFixed(1)} (+{tradeLevels.target_2_pct}%)
            </text>
          </g>

          {/* VWAP LINE */}
          <line
            x1={paddingLeft}
            y1={vwapY}
            x2={width - paddingRight}
            y2={vwapY}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <g transform={`translate(${width - paddingRight + 4}, ${vwapY - 8})`}>
            <rect width="98" height="16" rx="3" fill="#78350f" fillOpacity="0.7" stroke="#f59e0b" strokeWidth="0.6" />
            <text x="5" y="11" fill="#fde68a" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              VWAP ₹{vwap.toFixed(1)}
            </text>
          </g>

          {/* CANDLESTICKS */}
          {candles.map((candle, idx) => {
            const cx = paddingLeft + idx * stepX + stepX / 2;
            const openY = scaleY(candle.open);
            const closeY = scaleY(candle.close);
            const highY = scaleY(candle.high);
            const lowY = scaleY(candle.low);
            const isBullish = candle.close >= candle.open;

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));
            const candleColor = isBullish ? '#10b981' : '#f43f5e';

            return (
              <g
                key={idx}
                className="cursor-crosshair transition-opacity duration-150 hover:opacity-80"
                onMouseEnter={(e) => {
                  setHoveredCandle(candle);
                  setHoverPos({ x: cx, y: highY });
                }}
              >
                {/* Wick */}
                <line
                  x1={cx}
                  y1={highY}
                  x2={cx}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={cx - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  stroke={candleColor}
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            );
          })}

          {/* LIVE CURRENT PRICE HORIZONTAL LINE */}
          <line
            x1={paddingLeft}
            y1={ltpY}
            x2={width - paddingRight}
            y2={ltpY}
            stroke="#ffffff"
            strokeWidth="1"
            strokeDasharray="1 2"
          />
          <circle cx={width - paddingRight - 6} cy={ltpY} r="3" fill="#10b981" className="animate-ping" />
          <circle cx={width - paddingRight - 6} cy={ltpY} r="3" fill="#10b981" />

          {/* Hover Crosshair Overlay */}
          {hoverPos && (
            <line
              x1={hoverPos.x}
              y1={paddingTop}
              x2={hoverPos.x}
              y2={height - paddingBottom}
              stroke="#60a5fa"
              strokeWidth="0.75"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Hover Tooltip Float */}
        {hoveredCandle && hoverPos && (
          <div
            className="absolute pointer-events-none z-20 bg-gray-900/95 border border-gray-700/80 rounded-md p-2 text-[10px] font-mono shadow-xl backdrop-blur-sm"
            style={{
              left: Math.min(width - 180, Math.max(10, (hoverPos.x / width) * 100)) + '%',
              top: '10px'
            }}
          >
            <div className="text-gray-400 mb-1 border-b border-gray-800 pb-0.5">{hoveredCandle.timestamp}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <span className="text-gray-400">Open:</span>
              <span className="text-gray-200">₹{hoveredCandle.open.toFixed(2)}</span>
              <span className="text-gray-400">High:</span>
              <span className="text-emerald-400 font-medium">₹{hoveredCandle.high.toFixed(2)}</span>
              <span className="text-gray-400">Low:</span>
              <span className="text-rose-400 font-medium">₹{hoveredCandle.low.toFixed(2)}</span>
              <span className="text-gray-400">Close:</span>
              <span className="text-gray-100 font-bold">₹{hoveredCandle.close.toFixed(2)}</span>
              <span className="text-gray-400">Volume:</span>
              <span className="text-cyan-400">{hoveredCandle.volume.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trailing Stop Protocol Strip */}
      <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-purple-400 font-semibold">◈ Trailing Protocol:</span>
          <span>{tradeLevels.trailing_stop_rule}</span>
        </div>
        <div className="text-gray-400">
          Risk/Reward: <span className="text-emerald-400 font-bold">{tradeLevels.risk_reward_ratio}:1</span>
        </div>
      </div>
    </div>
  );
};
