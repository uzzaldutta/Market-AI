'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { GlobalTickerBar } from '../components/common/GlobalTickerBar';
import { Sidebar, TabType } from '../components/Sidebar';
import { MarketOverviewView } from '../components/MarketOverviewView';
import { AICopilotView } from '../components/AICopilotView';
import { OracleAILabView } from '../components/OracleAILabView';
import { StockDuelView } from '../components/StockDuelView';
import { BlockDealsView } from '../components/BlockDealsView';
import { MarketDepthView } from '../components/MarketDepthView';
import { OptionsStrategyBuilderView } from '../components/OptionsStrategyBuilderView';
import { FastAlphaRadarView } from '../components/FastAlphaRadarView';
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
import { FavouritesProvider } from '../context/FavouritesContext';

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
    <FavouritesProvider>
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
          onNavigateTab={(t) => setActiveTab(t as TabType)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Real-Time Global Markets & Macro Ticker Strip */}
        <GlobalTickerBar />

        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Sidebar (Desktop + Mobile Drawer + Bottom Nav) */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {/* Main Content Workspace (With Mobile Safe Area Padding) */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-24 lg:pb-8 space-y-4 sm:space-y-6 landscape-scroll-area">
            {activeTab === 'overview' && (
              <MarketOverviewView
                data={overviewData}
                onSelectSymbol={handleSelectSymbol}
              />
            )}

            {activeTab === 'copilot' && (
              <AICopilotView
                onSelectSymbol={handleSelectSymbol}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
              />
            )}

            {activeTab === 'oracle' && (
              <OracleAILabView
                onSelectSymbol={handleSelectSymbol}
              />
            )}

            {activeTab === 'duel' && (
              <StockDuelView
                onSelectSymbol={handleSelectSymbol}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
              />
            )}

            {activeTab === 'deals' && (
              <BlockDealsView
                onSelectSymbol={handleSelectSymbol}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
              />
            )}

            {activeTab === 'depth' && (
              <MarketDepthView
                initialSymbol={selectedSymbol}
                onSelectSymbol={handleSelectSymbol}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
              />
            )}

            {activeTab === 'options-builder' && (
              <OptionsStrategyBuilderView
                initialSymbol={selectedSymbol}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
              />
            )}

            {activeTab === 'radar' && (
              <FastAlphaRadarView
                onSelectSymbol={handleSelectSymbol}
                onNavigateToPaper={(sym) => {
                  setSelectedSymbol(sym);
                  setActiveTab('paper');
                }}
              />
            )}

            {activeTab === 'recommendations' && (
              <DailyRecommendationsView
                onSelectSymbol={handleSelectSymbol}
                onNavigateToPaper={(sym) => {
                  setSelectedSymbol(sym);
                  setActiveTab('paper');
                }}
              />
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
    </FavouritesProvider>
  );
}
