'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar, TabType } from '../components/Sidebar';
import { MarketOverviewView } from '../components/MarketOverviewView';
import { DailyRecommendationsView } from '../components/DailyRecommendationsView';
import { ScreenerView } from '../components/ScreenerView';
import { InstrumentDeepDiveView } from '../components/InstrumentDeepDiveView';
import { OptionsAnalyticsView } from '../components/OptionsAnalyticsView';
import { PredictionsSignalsView } from '../components/PredictionsSignalsView';
import { BacktestLabView } from '../components/BacktestLabView';
import { PaperTradingView } from '../components/PaperTradingView';
import { NewsIntelligenceView } from '../components/NewsIntelligenceView';
import { AdminHealthView } from '../components/AdminHealthView';
import { fetchMarketOverview } from '../lib/api';
import { MarketOverviewData } from '../types/market';

export default function TerminalHome() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [overviewData, setOverviewData] = useState<MarketOverviewData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Poll overview every 15 seconds
  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const data = await fetchMarketOverview();
        if (isMounted) setOverviewData(data);
      } catch (e) {
        console.error('Error fetching market overview:', e);
      }
    }
    loadOverview();
    const timer = setInterval(loadOverview, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    if (activeTab === 'overview' || activeTab === 'screener') {
      setActiveTab('instrument');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light' : ''} bg-terminal-dark text-terminal-text flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Application Header */}
      <Header
        marketStatus={overviewData?.market_status || 'CLOSED'}
        isMarketOpen={overviewData?.is_market_open || false}
        theme={theme}
        setTheme={setTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectSymbol={handleSelectSymbol}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Desktop + Mobile Drawer + Bottom Nav) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Workspace (With Mobile Safe Area Padding) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 space-y-6">
          {activeTab === 'overview' && (
            <MarketOverviewView
              data={overviewData}
              onSelectSymbol={handleSelectSymbol}
            />
          )}

          {activeTab === 'recommendations' && (
            <DailyRecommendationsView onSelectSymbol={handleSelectSymbol} />
          )}

          {activeTab === 'screener' && (
            <ScreenerView onSelectSymbol={handleSelectSymbol} />
          )}

          {activeTab === 'instrument' && (
            <InstrumentDeepDiveView symbol={selectedSymbol} />
          )}

          {activeTab === 'options' && (
            <OptionsAnalyticsView symbol={selectedSymbol} />
          )}

          {activeTab === 'predictions' && (
            <PredictionsSignalsView symbol={selectedSymbol} />
          )}

          {activeTab === 'backtest' && (
            <BacktestLabView />
          )}

          {activeTab === 'paper' && (
            <PaperTradingView />
          )}

          {activeTab === 'news' && (
            <NewsIntelligenceView />
          )}

          {activeTab === 'admin' && (
            <AdminHealthView />
          )}
        </main>
      </div>
    </div>
  );
}
