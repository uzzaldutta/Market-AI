'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AutoAlertItem } from '../../types/market';
import { fetchLiveAutoAlerts, executeAutoAlertInPaper } from '../../lib/api';
import { 
  Bell, CheckCircle2, Zap, ArrowRight, X, Clock, 
  Sparkles, Target, ShieldCheck, ChevronRight
} from 'lucide-react';

interface TradeAlertNotificationBellProps {
  onNavigateToSignals: () => void;
  onAlertTriggered?: (alert: AutoAlertItem) => void;
}

export const TradeAlertNotificationBell: React.FC<TradeAlertNotificationBellProps> = ({
  onNavigateToSignals,
  onAlertTriggered
}) => {
  const [alerts, setAlerts] = useState<AutoAlertItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [lastSeenId, setLastSeenId] = useState<string>('');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());
  const drawerRef = useRef<HTMLDivElement>(null);

  const loadAlerts = async () => {
    try {
      const res = await fetchLiveAutoAlerts();
      const list = res.active_alerts || [];
      setAlerts(list);

      // If a brand new alert appears, notify parent to trigger floating toast
      if (list.length > 0 && list[0].alert_id !== lastSeenId) {
        setLastSeenId(list[0].alert_id);
        if (onAlertTriggered) {
          onAlertTriggered(list[0]);
        }
      }
    } catch {
      // Quiet background polling failure
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [lastSeenId]);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleQuickExecute = async (alert: AutoAlertItem) => {
    setExecutingId(alert.alert_id);
    try {
      await executeAutoAlertInPaper(alert.alert_id, alert.recommended_lots || 1);
      setExecutedIds(prev => new Set(prev).add(alert.alert_id));
    } catch (e) {
      console.error('Failed to execute alert in paper:', e);
    } finally {
      setExecutingId(null);
    }
  };

  const unreadCount = alerts.length;

  return (
    <div className="relative font-sans" ref={drawerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
        title="High-Win Trade Alerts"
      >
        <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-bold text-white hidden sm:inline">Signals</span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-black text-[10px] font-extrabold font-mono shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl bg-[#090e1a]/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Active Trade Calls ({alerts.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                Scanning markets... next high-win call will appear here automatically.
              </div>
            ) : (
              alerts.map(alt => {
                const isExecuted = executedIds.has(alt.alert_id);
                return (
                  <div
                    key={alt.alert_id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 transition-all font-mono text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white block">{alt.contract_display}</span>
                        <span className="text-[10px] text-emerald-400 font-sans line-clamp-1">
                          {alt.plain_english_reason}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                        {alt.win_probability_pct}% Win
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">COST</span>
                        <span className="font-bold text-white">₹{alt.capital_required_inr.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">EST. GAIN</span>
                        <span className="font-bold text-emerald-400">+₹{alt.target_1_profit_inr}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">MAX RISK</span>
                        <span className="font-bold text-rose-400">{alt.max_loss_inr}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickExecute(alt)}
                      disabled={executingId === alt.alert_id || isExecuted}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isExecuted
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      {isExecuted ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Filled in Paper Ledger</span>
                      ) : executingId === alt.alert_id ? (
                        <span>Authorizing...</span>
                      ) : (
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> ⚡ 1-Click Paper Trade</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToSignals();
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 w-full"
            >
              Open Full Retail Signals Desk <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
