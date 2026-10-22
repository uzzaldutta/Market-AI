'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Filter,
  TrendingUp,
  Cpu,
  Layers,
  History,
  Wallet,
  Newspaper,
  Activity,
  X
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'recommendations'
  | 'screener'
  | 'instrument'
  | 'options'
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
    { id: 'recommendations', label: 'AI Daily Recommendations', icon: Sparkles },
    { id: 'screener', label: 'Stock Screener', icon: Filter },
    { id: 'instrument', label: 'Technical Analysis', icon: TrendingUp },
    { id: 'options', label: 'F&O & Greeks', icon: Layers },
    { id: 'predictions', label: 'AI Predictions', icon: Cpu },
    { id: 'backtest', label: 'Backtesting Lab', icon: History },
    { id: 'paper', label: 'Paper Trading', icon: Wallet },
    { id: 'news', label: 'News Intelligence', icon: Newspaper },
    { id: 'admin', label: 'System Health', icon: Activity },
  ];

  const handleSelect = (id: TabType) => {
    setActiveTab(id);
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-terminal-border bg-terminal-surface flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase font-mono">
            Intelligence Modules
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id as TabType)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-hover'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-terminal-border bg-terminal-dark/50">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>VIRTUAL CASH</span>
            <span className="text-terminal-green font-semibold">₹10,00,000</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            SEBI Statutory Notice: For analytical simulation &amp; backtesting only. Does not execute real-money orders.
          </p>
        </div>
      </aside>

      {/* 2. Mobile & Landscape Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-terminal-surface border-r border-terminal-border flex flex-col justify-between h-full p-4 overflow-y-auto z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-terminal-border">
                <span className="font-bold text-xs font-mono tracking-wider text-gray-300 uppercase">
                  Terminal Navigation
                </span>
                <button
                  onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-terminal-dark border border-terminal-border text-gray-400"
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
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                          : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-hover'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-terminal-border text-[11px] font-mono text-gray-400">
              <div className="flex justify-between mb-1">
                <span>VIRTUAL CASH:</span>
                <span className="text-terminal-green font-bold">₹10,00,000</span>
              </div>
              <span className="text-[9px] text-gray-500 block">
                Optimized for Mobile Portrait &amp; Landscape View
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mobile Persistent Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-terminal-surface/95 backdrop-blur border-t border-terminal-border flex items-center justify-around py-1.5 px-2 select-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'recommendations', label: 'AI Daily', icon: Sparkles },
          { id: 'screener', label: 'Screener', icon: Filter },
          { id: 'instrument', label: 'Technical', icon: TrendingUp },
          { id: 'paper', label: 'Paper', icon: Wallet },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id as TabType)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono transition-colors ${
                isActive ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
