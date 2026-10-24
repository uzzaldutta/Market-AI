'use client';

import { useState, useEffect, useRef } from 'react';

export type FlashDirection = 'up' | 'down' | 'none';

export function usePriceFlash(value: number, durationMs = 750): {
  direction: FlashDirection;
  flashClass: string;
  isFlashing: boolean;
} {
  const [direction, setDirection] = useState<FlashDirection>('none');
  const prevRef = useRef<number>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      const dir: FlashDirection = value > prevRef.current ? 'up' : value < prevRef.current ? 'down' : 'none';
      prevRef.current = value;
      setDirection(dir);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDirection('none');
      }, durationMs);
    }
  }, [value, durationMs]);

  const flashClass =
    direction === 'up'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/30'
      : direction === 'down'
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/30'
      : '';

  return {
    direction,
    flashClass,
    isFlashing: direction !== 'none'
  };
}
