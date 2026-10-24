'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, ShieldCheck, Activity, Clock, Menu, X, ArrowRight, Star } from 'lucide-react';
import { NSE_UNIVERSE } from '../types/nseUniverse';
import { useFavourites } from '../context/FavouritesContext';

interface HeaderProps {
  marketStatus: string;
  isMarketOpen: boolean;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectSymbol: (s: string) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  isMarketOpen,
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
  onSelectSymbol,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { favourites, isFavourite, toggle } = useFavourites();

  const quickSymbols = favourites.length > 0 
    ? favourites.slice(0, 7) 
    : ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];

  // Dynamic search filter across all 2,630+ official NSE scrips
  useEffect(() => {
    const q = searchQuery.trim().toUpperCase();
    if (q.length >= 1) {
      const exactMatches: any[] = [];
      const prefixMatches: any[] = [];
      const substringMatches: any[] = [];
      const nameMatches: any[] = [];

      for (const item of NSE_UNIVERSE) {
        if (item.symbol === q) {
          exactMatches.push(item);
        } else if (item.symbol.startsWith(q)) {
          prefixMatches.push(item);
        } else if (item.symbol.includes(q)) {
          substringMatches.push(item);
        } else if (item.name.toUpperCase().includes(q)) {
          nameMatches.push(item);
        }
      }

      const combined = [...exactMatches, ...prefixMatches, ...substringMatches, ...nameMatches].slice(0, 15);

      // If no exact match, add user typed custom ticker
      if (!combined.some(f => f.symbol === q)) {
        combined.unshift({
          symbol: q,
          name: `${q} (NSE Listed Scrip)`,
          type: 'EQUITY',
          sector: 'NSE Equities',
          series: 'EQ'
        });
      }
      setSearchResults(combined);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    onSelectSymbol(symbol);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toUpperCase();
      if (searchResults.length > 0) {
        handleSelect(searchResults[0].symbol);
      } else if (q) {
        handleSelect(q);
      }
    }
  };

  return (
    <header className="h-16 border-b border-terminal-border bg-terminal-surface/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Market Hours Badge */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Mobile menu toggle */}
        {setMobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
            भ
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2">
              BHARAT MARKET
              <span className="text-[9px] sm:text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                AI
              </span>
            </h1>
          </div>
        </div>

        {/* Market Status Badge */}
        <div className="hidden sm:flex items-center space-x-2 bg-terminal-dark/80 px-2 py-1 rounded border border-terminal-border text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isMarketOpen ? 'bg-terminal-green animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-gray-400">NSE:</span>
          <span className={isMarketOpen ? 'text-terminal-green font-semibold' : 'text-amber-400 font-semibold'}>
            {marketStatus} (09:15-15:30 IST)
          </span>
        </div>
      </div>

      {/* Global Search with Live Autocomplete Dropdown */}
      <div ref={dropdownRef} className="flex-1 max-w-md mx-4 lg:mx-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search all NSE stocks (e.g. ZOMATO, TATAPOWER, RELIANCE, NIFTY50)..."
            className="w-full bg-terminal-dark border border-terminal-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-blue-500 placeholder-gray-500 font-mono"
          />
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-11 bg-terminal-surface border border-terminal-border rounded-xl shadow-2xl overflow-hidden z-50 font-mono text-xs max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-terminal-border text-[10px] text-gray-400 bg-terminal-dark/60 flex justify-between">
              <span>ALL 2,630+ NSE LISTED SCRIPS &amp; INDICES</span>
              <span>Showing {searchResults.length} matches • [Enter] to open</span>
            </div>
            {searchResults.map((item) => {
              const isFav = isFavourite(item.symbol);
              return (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className="p-2.5 hover:bg-terminal-hover cursor-pointer border-b border-terminal-border/40 last:border-none flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(item.symbol);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.symbol}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-terminal-dark text-blue-400 border border-blue-500/20 font-semibold">
                          {item.series || (item.type === 'INDEX' ? 'INDEX' : 'EQ')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">{item.sector}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{item.name}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls: Quick Tickers / Favourites, Disclaimer Pill, Theme Toggle */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Quick Tickers / Starred Watchlist */}
        <div className="hidden xl:flex items-center space-x-1">
          <span className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-0.5 mr-1">
            <Star className="w-3 h-3 fill-amber-400" /> Watch:
          </span>
          {quickSymbols.map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-terminal-dark hover:bg-terminal-border text-gray-300 border border-terminal-border transition-colors flex items-center gap-1"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Statutory Compliance Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RESEARCH &amp; PAPER TRADING</span>
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
