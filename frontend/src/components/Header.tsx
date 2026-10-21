'use client';

import React from 'react';
import { Search, Sun, Moon, ShieldCheck, Activity, Clock } from 'lucide-react';

interface HeaderProps {
  marketStatus: string;
  isMarketOpen: boolean;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectSymbol: (s: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  isMarketOpen,
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
  onSelectSymbol
}) => {
  const quickSymbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];

  return (
    <header className="h-16 border-b border-terminal-border bg-terminal-surface/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Market Hours Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            भ
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide flex items-center gap-2">
              BHARAT MARKET INTEL
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                PRO AI
              </span>
            </h1>
          </div>
        </div>

        {/* Market Status Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-terminal-dark/80 px-2.5 py-1 rounded border border-terminal-border text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isMarketOpen ? 'bg-terminal-green animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-gray-400">NSE/BSE:</span>
          <span className={isMarketOpen ? 'text-terminal-green font-semibold' : 'text-amber-400 font-semibold'}>
            {marketStatus} (09:15-15:30 IST)
          </span>
        </div>
      </div>

      {/* Global Search & Quick Symbols */}
      <div className="flex-1 max-w-md mx-6 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NSE/BSE Equities, Indices, F&O (e.g. RELIANCE, NIFTY50)..."
            className="w-full bg-terminal-dark border border-terminal-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-blue-500 placeholder-gray-500 font-mono"
          />
        </div>
      </div>

      {/* Right Controls: Quick Tickers, Disclaimer Pill, Theme Toggle */}
      <div className="flex items-center space-x-3">
        {/* Quick Tickers */}
        <div className="hidden xl:flex items-center space-x-1">
          {quickSymbols.map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-terminal-dark hover:bg-terminal-border text-gray-300 border border-terminal-border transition-colors"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Statutory Compliance Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RESEARCH & PAPER TRADING ONLY</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg bg-terminal-dark border border-terminal-border text-gray-400 hover:text-terminal-text transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
