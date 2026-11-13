'use client';

import React, { useState, useEffect } from 'react';
import { AutoAlertItem, AutoAlertsStatsResponse, PaperPosition } from '../types/market';
import { 
  fetchLiveAutoAlerts, fetchAutoAlertsStats, executeAutoAlertInPaper, 
  fetchPaperAccount, placePaperOrder 
} from '../lib/api';
import { PriceFlash } from './common/PriceFlash';
import { 
  Zap, Bell, CheckCircle2, ShieldAlert, ArrowUpRight, TrendingUp,
  Clock, Sparkles, Filter, ChevronRight, Award, Target, HelpCircle,
  Sliders, Layers, RefreshCw, AlertTriangle
} from 'lucide-react';

interface LiveTradeAlertsViewProps {
  onNavigateToPaperTrading?: () => void;
}

export const LiveTradeAlertsView: React.FC<LiveTradeAlertsViewProps> = ({
  onNavigateToPaperTrading
}) => {
  const [alerts, setAlerts] = useState<AutoAlertItem[]>([]);
  const [stats, setStats] = useState<AutoAlertsStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [budgetFilter, setBudgetFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isQuantMode, setIsQuantMode] = useState<boolean>(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [openPositions, setOpenPositions] = useState<PaperPosition[]>([]);
  const [executedMap, setExecutedMap] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [alertsRes, statsRes, paperRes] = await Promise.all([
        fetchLiveAutoAlerts(budgetFilter, categoryFilter),
        fetchAutoAlertsStats(),
        fetchPaperAccount().catch(() => null)
      ]);
      setAlerts(alertsRes.active_alerts || []);
      setStats(statsRes);
      if (paperRes?.positions) {
        setOpenPositions(paperRes.positions);
      }
    } catch (e) {
      console.error('Failed to load auto alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [budgetFilter, categoryFilter]);

  const handleExecute = async (alert: AutoAlertItem) => {
    setExecutingId(alert.alert_id);
    setFeedbackMessage(null);
    try {
      const res = await executeAutoAlertInPaper(alert.alert_id, alert.recommended_lots || 1);
      setExecutedMap(prev => ({ ...prev, [alert.alert_id]: true }));
      setFeedbackMessage(res.message || 'Trade Authorized in Paper Account!');
      loadData();
    } catch (e: any) {
      setFeedbackMessage(e.message || 'Execution failed');
    } finally {
      setExecutingId(null);
    }
  };

  const handleClosePosition = async (pos: PaperPosition, alertId: string) => {
    setClosingId(alertId);
    setFeedbackMessage(null);
    try {
      const exitSide = pos.net_quantity > 0 ? 'SELL' : 'BUY';
      const absQty = Math.abs(pos.net_quantity);
      const unitsInLots = (pos.lot_size && pos.lot_size > 1) ? Math.round(absQty / pos.lot_size) : absQty;
      await placePaperOrder({
        symbol: pos.symbol,
        side: exitSide,
        order_type: 'MARKET',
        quantity: unitsInLots,
        product_type: pos.product_type,
        instrument_type: pos.instrument_type || 'EQUITY',
        strike_price: pos.strike_price,
        option_type: pos.option_type,
        expiry_date: pos.expiry_date,
        lot_size: pos.lot_size || 1,
        client_order_id: `CLOSE-${alertId}-${Date.now()}`
      });
      setFeedbackMessage(`Position closed successfully! Realized profit booked into your virtual portfolio.`);
      loadData();
    } catch (e: any) {
      setFeedbackMessage(e.message || 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Retail Mission Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 font-display">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </span>
              Auto Trade Signals Desk
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              RETAIL SMALL ACCOUNT EDITION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous multi-factor research engine continuously analyzing NSE &amp; BSE. We handle the complex math; you receive high-win BUY calls with exact Rupee targets, safety nets, and best entry times.
          </p>
        </div>

        {/* Simple vs Quant View Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setIsQuantMode(false)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                !isQuantMode ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Simple Mode (Default)
            </button>
            <button
              type="button"
              onClick={() => setIsQuantMode(true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isQuantMode ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pro Quant View
            </button>
          </div>
        </div>
      </div>

      {/* 2. Transparency Scorecard (Win Rate & Profits) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 font-mono shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">TODAY'S WIN ACCURACY</span>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-1">
              <span>{stats.today_win_rate_pct}%</span>
              <span className="text-xs text-slate-400 font-normal">Win Rate</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
              Strict multi-factor verification
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">TARGETS ACHIEVED TODAY</span>
            <div className="text-xl md:text-2xl font-black text-cyan-400 mt-1">
              {stats.targets_hit_today} <span className="text-xs text-slate-400 font-normal">of {stats.total_calls_today} Calls</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
              Hit Target 1 or Target 2
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">NET PROFITS GENERATED</span>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
              +₹{stats.total_net_profit_inr.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
              Cumulative profit on 1-lot basis
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">STOP-OUTS TRIGGERED</span>
            <div className="text-xl md:text-2xl font-black text-slate-300 mt-1">
              {stats.stopped_out_today} <span className="text-xs text-slate-500 font-normal">losses capped</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
              Safety net strictly cut risk
            </span>
          </div>
        </div>
      )}

      {/* 3. Budget & Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
        {/* Budget Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Budget Filter:
          </span>
          <button
            type="button"
            onClick={() => setBudgetFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              budgetFilter === 'ALL' ? 'bg-emerald-500 text-black shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Budgets
          </button>
          <button
            type="button"
            onClick={() => setBudgetFilter('UNDER_5K')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              budgetFilter === 'UNDER_5K' ? 'bg-emerald-500 text-black shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            💰 Under ₹5,000 (Micro Capital)
          </button>
          <button
            type="button"
            onClick={() => setBudgetFilter('UNDER_10K')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              budgetFilter === 'UNDER_10K' ? 'bg-emerald-500 text-black shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            💵 Under ₹10,000 (Standard)
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              categoryFilter === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Classes
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('INDEX_OPTION')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              categoryFilter === 'INDEX_OPTION' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Index Options
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('CASH_EQUITY')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              categoryFilter === 'CASH_EQUITY' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cash Equities
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {feedbackMessage}
          </span>
          {onNavigateToPaperTrading && (
            <button
              onClick={onNavigateToPaperTrading}
              className="underline text-white font-bold hover:text-emerald-300"
            >
              View in Paper Portfolio &rarr;
            </button>
          )}
        </div>
      )}

      {/* 4. Active Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 font-mono animate-pulse">
            Scanning 2,600+ instruments for high-win breakout signals...
          </div>
        ) : alerts.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 font-mono">
            No active trade alerts matching the selected budget tier right now. New calls are generated when volume and momentum criteria align.
          </div>
        ) : (
          alerts.map(alt => {
            const isExecuted = executedMap[alt.alert_id];
            const isIndexOpt = alt.instrument_type === 'INDEX_OPTION';
            
            // Check if user currently has an open paper trading position for this alert
            const activePosition = openPositions.find(p => {
              if (!p.net_quantity || Math.abs(p.net_quantity) <= 0) return false;
              if (alt.instrument_type === 'INDEX_OPTION' || alt.instrument_type === 'OPTIONS') {
                const strikeMatch = p.strike_price && alt.strike_price && Math.round(Number(p.strike_price)) === Math.round(Number(alt.strike_price));
                const optTypeMatch = p.option_type && alt.option_type && p.option_type.toUpperCase() === alt.option_type.toUpperCase();
                const symMatch = p.symbol && alt.symbol && (
                  p.symbol.toUpperCase() === alt.symbol.toUpperCase() ||
                  p.symbol.toUpperCase().includes(alt.symbol.toUpperCase()) ||
                  alt.symbol.toUpperCase().includes(p.symbol.toUpperCase())
                );
                return symMatch && strikeMatch && optTypeMatch;
              } else {
                return p.symbol && alt.symbol && p.symbol.toUpperCase() === alt.symbol.toUpperCase();
              }
            });

            return (
              <div
                key={alt.alert_id}
                className={`rounded-2xl transition-all p-5 shadow-xl flex flex-col justify-between space-y-4 font-sans relative overflow-hidden group ${
                  activePosition
                    ? 'bg-[#091322] border-2 border-emerald-500 shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                    : 'bg-[#090e1a]/95 border-2 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                {/* Background Accent Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all ${
                  activePosition ? 'bg-emerald-500/20' : 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
                }`} />

                {/* Top Badge & Time Window */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      {alt.action} CALL ({alt.budget_tier.replace('_', ' ')})
                    </span>

                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {alt.win_probability_pct}% Win Score
                    </span>
                  </div>

                  {/* Asset & Contract Headline */}
                  <div>
                    <h3 className="text-base font-black text-white flex items-center justify-between">
                      <span>{alt.contract_display}</span>
                      <span className="text-emerald-400 font-mono">₹{alt.current_price.toFixed(1)}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {alt.asset_name} • Exchange: {alt.exchange}
                    </span>
                  </div>

                  {/* Plain English Reason Box */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-emerald-400 font-semibold block mb-0.5">💡 Why Buy Now:</strong>
                    {alt.plain_english_reason}
                  </div>
                </div>

                {/* Best Time & Price Window Matrix */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Best Time:
                    </span>
                    <span className="font-bold text-white text-[10px]">{alt.best_entry_time}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-400" /> Best Buy Zone:
                    </span>
                    <span className="font-bold text-emerald-300">₹{alt.entry_price_min} – ₹{alt.entry_price_max}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-900">
                    <span>Order Invalidation:</span>
                    <span className="text-slate-400">{alt.order_valid_till}</span>
                  </div>
                </div>

                {/* Hard Rupee Profit & Risk Grid */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">MONEY NEEDED</span>
                    <span className="text-xs font-black text-white">₹{alt.capital_required_inr.toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-slate-500 block">1 Lot ({alt.lot_size} units)</span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-400 block uppercase font-bold">EST. PROFIT</span>
                    <span className="text-xs font-black text-emerald-400">+₹{alt.target_1_profit_inr.toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-emerald-500/80 block">Target: ₹{alt.target_1_price}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/20">
                    <span className="text-[9px] text-rose-400 block uppercase font-bold">SAFETY NET</span>
                    <span className="text-xs font-black text-rose-400">{alt.max_loss_inr}</span>
                    <span className="text-[8px] text-rose-500/80 block">Exit at: ₹{alt.stop_loss_price}</span>
                  </div>
                </div>

                {/* Extended Target & Risk:Reward Details (Quant Mode) */}
                {isQuantMode && (
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Extended Target 2:</span>
                      <span className="text-emerald-300 font-bold">₹{alt.target_2_price} (+₹{alt.target_2_profit_inr})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk-to-Reward Ratio:</span>
                      <span className="text-cyan-300 font-bold">1 : {alt.risk_reward_ratio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Holding Horizon:</span>
                      <span className="text-white font-bold">{alt.time_horizon}</span>
                    </div>
                  </div>
                )}

                {/* Live Running Position Widget or 1-Click Action */}
                {activePosition ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3 font-mono shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>POSITION LIVE IN VIRTUAL LEDGER</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {Math.abs(activePosition.net_quantity)} units {alt.lot_size ? `(${Math.round(Math.abs(activePosition.net_quantity) / alt.lot_size)} Lot)` : ''}
                      </span>
                    </div>

                    {/* Live PnL & Current Price */}
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Current MTM P&amp;L</span>
                        <div className={`text-base font-black flex items-center gap-1 ${
                          activePosition.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span>
                            {activePosition.unrealized_pnl >= 0 ? '+' : ''}₹{activePosition.unrealized_pnl.toFixed(2)}
                          </span>
                          <span className="text-xs font-normal">
                            ({activePosition.pnl_percentage >= 0 ? '+' : ''}{activePosition.pnl_percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Live LTP</span>
                        <span className="text-sm font-bold text-white flex items-center justify-end">
                          ₹<PriceFlash value={activePosition.current_market_price} />
                        </span>
                        <span className="text-[9px] text-slate-500">Bought @ ₹{activePosition.average_buy_price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Target 1 Progress Bar */}
                    {(() => {
                      const entryP = activePosition.average_buy_price || alt.entry_price_min;
                      const targetP = alt.target_1_price;
                      const currP = activePosition.current_market_price || alt.current_price;
                      const dist = targetP - entryP;
                      const progress = dist > 0 ? Math.min(100, Math.max(0, Math.round(((currP - entryP) / dist) * 100))) : 0;
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Target 1 Progress (₹{alt.target_1_price})</span>
                            <span className="text-emerald-300 font-bold">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* 1-Click Square Off / Exit Button */}
                    <button
                      type="button"
                      onClick={() => handleClosePosition(activePosition, alt.alert_id)}
                      disabled={closingId === alt.alert_id}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-black shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {closingId === alt.alert_id ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Closing &amp; Realizing Profit...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          💰 1-Click Book Profit &amp; Exit Position
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExecute(alt)}
                    disabled={executingId === alt.alert_id || isExecuted}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                      isExecuted
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black shadow-emerald-950/40'
                    }`}
                  >
                    {isExecuted ? (
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Order Placed</span>
                    ) : executingId === alt.alert_id ? (
                      <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authorizing Order in Virtual Ledger...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> ⚡ Take This Trade in Paper Account (1-Click)</span>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Small Account Safety Guidance Shelf */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
        <h4 className="font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Small Account Golden Rules for Everyday Traders:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
          <li><strong>Never risk more than 5%</strong> of your total trading capital on a single call.</li>
          <li><strong>1 Lot Rule:</strong> Keep quantity at 1 lot until your virtual account builds consistent profits.</li>
          <li><strong>Exit at Safety Net:</strong> If a stop-loss is hit, accept the small loss (-₹600) rather than hoping it recovers. Small losses protect your capital for the next big win.</li>
          <li><strong>Intraday Notice:</strong> Close open intraday positions before 03:15 PM to avoid your broker's auto-squareoff charges.</li>
        </ul>
      </div>
    </div>
  );
};
