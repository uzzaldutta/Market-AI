'use client';

import React from 'react';
import {
  LayoutDashboard,
  Filter,
  TrendingUp,
  Cpu,
  Layers,
  History,
  Wallet,
  Newspaper,
  Activity
} from 'lucide-react';

export type TabType =
  | 'overview'
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
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Market Overview', icon: LayoutDashboard },
    { id: 'screener', label: 'Stock Screener', icon: Filter },
    { id: 'instrument', label: 'Technical Analysis', icon: TrendingUp },
    { id: 'options', label: 'F&O & Greeks', icon: Layers },
    { id: 'predictions', label: 'AI Predictions', icon: Cpu },
    { id: 'backtest', label: 'Backtesting Lab', icon: History },
    { id: 'paper', label: 'Paper Trading', icon: Wallet },
    { id: 'news', label: 'News Intelligence', icon: Newspaper },
    { id: 'admin', label: 'System Health', icon: Activity },
  ];

  return (
    <aside className="w-64 border-r border-terminal-border bg-terminal-surface flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
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
              onClick={() => setActiveTab(item.id as TabType)}
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

      {/* Terminal Account & Regulatory Note */}
      <div className="p-4 border-t border-terminal-border bg-terminal-dark/50">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
          <span>VIRTUAL CASH</span>
          <span className="text-terminal-green font-semibold">₹10,00,000</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">
          SEBI Statutory Notice: For analytical simulation & backtesting only. Does not execute real-money orders.
        </p>
      </div>
    </aside>
  );
};
