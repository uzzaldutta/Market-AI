'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Zap,
  Brain,
  Filter,
  TrendingUp,
  Cpu,
  Layers,
  History,
  Wallet,
  Newspaper,
  Activity,
  X,
  MoreHorizontal,
  Bot,
  Swords,
  Coins,
  SlidersHorizontal
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'auto-alerts'
  | 'copilot'
  | 'oracle'
  | 'duel'
  | 'deals'
  | 'depth'
  | 'radar'
  | 'recommendations'
  | 'screener'
  | 'instrument'
  | 'options'
  | 'options-builder'
  | 'predictions'
  | 'backtest'
  | 'paper'
  | 'news'
  | 'admin';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const menuItems = [
    { id: 'overview', label: 'Market Overview', icon: LayoutDashboard },
    { id: 'auto-alerts', label: '🎯 Auto Buy Signals (Retail Desk)', icon: Sparkles },
    { id: 'copilot', label: '🤖 AI Market Copilot', icon: Bot },
    { id: 'oracle', label: '🧠 Oracle AI Lab (Buffett)', icon: Brain },
    { id: 'duel', label: '⚔️ Stock Duel (Compare)', icon: Swords },
    { id: 'deals', label: '🐳 Block Deals (> ₹5 Cr)', icon: Coins },
    { id: 'depth', label: '📊 Level-3 Depth & Tape', icon: Activity },
    { id: 'radar', label: '⚡ Fast Alpha Radar', icon: Zap },
    { id: 'recommendations', label: 'AI Daily Recommendations', icon: Sparkles },
    { id: 'screener', label: 'Stock Screener', icon: Filter },
    { id: 'instrument', label: 'Technical Analysis', icon: TrendingUp },
    { id: 'options', label: 'F&O & Options Greeks', icon: Layers },
    { id: 'options-builder', label: '📐 Strategy Payoff Builder', icon: SlidersHorizontal },
    { id: 'predictions', label: 'AI Predictions', icon: Cpu },
    { id: 'backtest', label: 'Backtesting Lab', icon: History },
    { id: 'paper', label: 'Paper Trading Simulator', icon: Wallet },
    { id: 'news', label: 'News Catalyst Signals', icon: Newspaper },
    { id: 'admin', label: 'System Health', icon: Activity },
  ];

  const handleSelect = (id: TabType) => {
    setActiveTab(id);
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-terminal-border/80 bg-terminal-surface flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none transition-all">
        <div className="p-3 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase font-mono">
            Intelligence Modules
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id as TabType)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25 ring-1 ring-blue-400/40'
                    : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-hover'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-terminal-border/80 bg-terminal-dark/60 rounded-b-xl">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1.5">
            <span className="text-[10px] uppercase text-gray-500">Virtual Portfolio</span>
            <span className="text-terminal-green font-bold">₹10,00,000</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            SEBI Analytical Safeguards: Educational paper simulation &amp; backtesting only.
          </p>
        </div>
      </aside>

      {/* 2. Mobile Responsive Navigation Drawer (All Screen Sizes) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-terminal-surface border-r border-terminal-border/80 flex flex-col justify-between h-full p-4 overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-terminal-border/80">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                    भ
                  </div>
                  <span className="font-bold text-xs font-mono tracking-wider text-gray-200 uppercase">
                    Terminal Modules
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id as TabType)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                          : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-hover'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-terminal-border/80 text-[11px] font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>SIMULATED BALANCE:</span>
                <span className="text-terminal-green font-bold">₹10,00,000</span>
              </div>
              <span className="text-[9px] text-gray-500 block leading-tight">
                Optimized for Mobile Portrait &amp; Landscape View
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mobile Persistent Bottom Navigation Bar (Touch-friendly & Tabular) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-terminal-dark/95 backdrop-blur-md border-t border-terminal-border/80 flex items-center justify-around py-1 px-1 safe-pb select-none transition-all">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'copilot', label: 'Copilot', icon: Bot },
          { id: 'oracle', label: 'Oracle', icon: Brain },
          { id: 'radar', label: 'Radar', icon: Zap },
          { id: 'deals', label: 'Deals', icon: Coins },
          { id: 'paper', label: 'Paper', icon: Wallet },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id as TabType)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all min-w-[48px] ${
                isActive
                  ? 'text-blue-400 font-bold bg-blue-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* More Drawer Button */}
        <button
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono text-gray-400 hover:text-white min-w-[48px]"
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5 text-gray-400" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
