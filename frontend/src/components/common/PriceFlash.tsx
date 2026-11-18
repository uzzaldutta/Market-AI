'use client';

import React, { useState, useEffect, useRef } from 'react';

export type FlashDirection = 'up' | 'down' | 'none';

interface PriceFlashProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  badgeClassName?: string;
  showArrow?: boolean;
  flashMode?: 'cell' | 'badge' | 'text';
  /** Optional micro-tick simulation during off-hours to experience live terminal feel */
  enableLiveSimulation?: boolean;
}

export const PriceFlash: React.FC<PriceFlashProps> = ({
  value,
  previousValue,
  prefix = '₹',
  suffix = '',
  decimals = 2,
  className = '',
  badgeClassName = '',
  showArrow = true,
  flashMode = 'cell',
  enableLiveSimulation = false
}) => {
  const [currentVal, setCurrentVal] = useState<number>(value);
  const [direction, setDirection] = useState<FlashDirection>('none');
  const [lastTickDir, setLastTickDir] = useState<FlashDirection>('up');
  const prevValRef = useRef<number>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track real value changes
  useEffect(() => {
    if (value !== prevValRef.current) {
      const dir: FlashDirection = value > prevValRef.current ? 'up' : value < prevValRef.current ? 'down' : 'none';
      prevValRef.current = value;
      setCurrentVal(value);
      if (dir !== 'none') {
        setDirection(dir);
        setLastTickDir(dir);
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDirection('none');
      }, 600);
    }
  }, [value]);

  // High-performance micro-tick oscillation for institutional live terminal feel
  useEffect(() => {
    if (!enableLiveSimulation) return;

    const interval = setInterval(() => {
      // 50% probability every 2.8 seconds of a realistic micro-tick tick
      if (Math.random() > 0.45) {
        const isUp = Math.random() > 0.48;
        const tickDelta = (currentVal * (0.0003 + Math.random() * 0.0008)) * (isUp ? 1 : -1);
        const nextVal = Math.round((currentVal + tickDelta) * 100) / 100;
        
        const dir: FlashDirection = isUp ? 'up' : 'down';
        setDirection(dir);
        setLastTickDir(dir);
        setCurrentVal(nextVal);
        prevValRef.current = nextVal;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setDirection('none');
        }, 600);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [enableLiveSimulation, currentVal]);

  const formattedValue = currentVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (flashMode === 'badge') {
    const flashBg =
      direction === 'up'
        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-md shadow-emerald-500/30 scale-[1.02]'
        : direction === 'down'
        ? 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-md shadow-rose-500/30 scale-[1.02]'
        : 'bg-terminal-dark/80 text-white border-terminal-border/80';

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono transition-all duration-300 ease-out border ${flashBg} ${badgeClassName}`}
      >
        {showArrow && (
          <span
            className={`text-xs font-black transition-transform duration-200 ${
              direction === 'up' || (direction === 'none' && lastTickDir === 'up')
                ? 'text-emerald-400'
                : 'text-rose-400'
            } ${direction !== 'none' ? 'scale-125' : ''}`}
          >
            {direction === 'up' || (direction === 'none' && lastTickDir === 'up') ? '▲' : '▼'}
          </span>
        )}
        <span className={className}>
          {prefix}{formattedValue}{suffix}
        </span>
      </span>
    );
  }

  // Cell flash mode (used in tables, watchlists and grids)
  const cellFlashClasses =
    direction === 'up'
      ? 'bg-emerald-500/25 text-emerald-300 font-bold ring-1 ring-emerald-400/50 shadow-inner'
      : direction === 'down'
      ? 'bg-rose-500/25 text-rose-300 font-bold ring-1 ring-rose-400/50 shadow-inner'
      : 'text-inherit';

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded font-mono transition-all duration-300 ease-out ${cellFlashClasses} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {showArrow && (
          <span
            className={`text-[10px] font-black transition-transform duration-200 ${
              direction === 'up' || (direction === 'none' && lastTickDir === 'up')
                ? 'text-emerald-400'
                : 'text-rose-400'
            } ${direction !== 'none' ? 'scale-125' : ''}`}
          >
            {direction === 'up' || (direction === 'none' && lastTickDir === 'up') ? '▲' : '▼'}
          </span>
        )}
        <span>{prefix}{formattedValue}{suffix}</span>
      </span>
    </span>
  );
};
