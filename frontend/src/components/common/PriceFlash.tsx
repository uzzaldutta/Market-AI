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
  const prevValRef = useRef<number>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track real value changes
  useEffect(() => {
    if (value !== prevValRef.current) {
      const dir: FlashDirection = value > prevValRef.current ? 'up' : value < prevValRef.current ? 'down' : 'none';
      prevValRef.current = value;
      setCurrentVal(value);
      setDirection(dir);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDirection('none');
      }, 750);
    }
  }, [value]);

  // Optional micro-tick oscillation for visual feedback during closed market sessions
  useEffect(() => {
    if (!enableLiveSimulation) return;

    const interval = setInterval(() => {
      // 30% chance every 4-6 seconds of a small micro-tick fluctuation (e.g. +/- 0.05% to 0.15%)
      if (Math.random() > 0.65) {
        const isUp = Math.random() > 0.48;
        const delta = (currentVal * (0.0005 + Math.random() * 0.001)) * (isUp ? 1 : -1);
        const nextVal = Math.round((currentVal + delta) * 100) / 100;
        
        setDirection(isUp ? 'up' : 'down');
        setCurrentVal(nextVal);
        prevValRef.current = nextVal;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setDirection('none');
        }, 750);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [enableLiveSimulation, currentVal]);

  const formattedValue = currentVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (flashMode === 'badge') {
    const flashBg =
      direction === 'up'
        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/30'
        : direction === 'down'
        ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/30'
        : 'bg-terminal-dark/80 text-white border-terminal-border';

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono transition-all duration-500 ease-out border ${flashBg} ${badgeClassName}`}
      >
        {showArrow && direction === 'up' && (
          <span className="text-[10px] text-emerald-400 font-bold animate-pulse">▲</span>
        )}
        {showArrow && direction === 'down' && (
          <span className="text-[10px] text-rose-400 font-bold animate-pulse">▼</span>
        )}
        <span className={className}>
          {prefix}{formattedValue}{suffix}
        </span>
      </span>
    );
  }

  // Cell flash mode (used in tables and option chains)
  const cellFlashClasses =
    direction === 'up'
      ? 'bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/40 shadow-inner'
      : direction === 'down'
      ? 'bg-rose-500/20 text-rose-300 font-bold ring-1 ring-rose-500/40 shadow-inner'
      : 'text-inherit';

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded font-mono transition-all duration-700 ease-out ${cellFlashClasses} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {showArrow && direction === 'up' && (
          <span className="text-[9px] text-emerald-400 font-bold">▲</span>
        )}
        {showArrow && direction === 'down' && (
          <span className="text-[9px] text-rose-400 font-bold">▼</span>
        )}
        <span>{prefix}{formattedValue}{suffix}</span>
      </span>
    </span>
  );
};
