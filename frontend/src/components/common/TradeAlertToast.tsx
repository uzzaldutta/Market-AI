'use client';

import React, { useState, useEffect } from 'react';
import { AutoAlertItem } from '../../types/market';
import { executeAutoAlertInPaper } from '../../lib/api';
import { 
  Bell, CheckCircle2, ShieldAlert, ArrowRight, Zap, X, 
  Volume2, VolumeX, Sparkles, TrendingUp, Clock
} from 'lucide-react';

interface TradeAlertToastProps {
  alert: AutoAlertItem | null;
  onClose: () => void;
  onNavigateToSignals?: () => void;
  onTradeExecuted?: () => void;
}

export const TradeAlertToast: React.FC<TradeAlertToastProps> = ({
  alert,
  onClose,
  onNavigateToSignals,
  onTradeExecuted
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executed, setExecuted] = useState<boolean>(false);

  // Play gentle institutional notification chime on alert mount
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.52);
    } catch {
      // Audio context policy fallback
    }
  };

  useEffect(() => {
    if (alert) {
      playChime();
    }
  }, [alert?.alert_id]);

  if (!alert) return null;

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await executeAutoAlertInPaper(alert.alert_id, alert.recommended_lots || 1);
      setExecuted(true);
      if (onTradeExecuted) onTradeExecuted();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (e) {
      console.error('Failed to execute alert:', e);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full animate-bounce-in font-sans">
      <div className="p-4 rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/60 text-white space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> High-Win Buy Alert Triggered
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute Alert Chime' : 'Enable Alert Chime'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contract & Price Headline */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              {alert.contract_display}
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {alert.exchange}
              </span>
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              ₹{alert.current_price.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
            💡 {alert.plain_english_reason}
          </p>
        </div>

        {/* Retail Friendly Rupee Metrics Box */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
          <div>
            <span className="text-[9px] text-slate-400 block uppercase">MONEY NEEDED</span>
            <span className="text-xs font-bold text-white">₹{alert.capital_required_inr.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block uppercase">EST. PROFIT</span>
            <span className="text-xs font-bold text-emerald-400">+₹{alert.target_1_profit_inr.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block uppercase">MAX RISK</span>
            <span className="text-xs font-bold text-rose-400">{alert.max_loss_inr}</span>
          </div>
        </div>

        {/* Timing Window */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> {alert.best_entry_time}
          </span>
          <span className="text-emerald-400 font-bold">
            {alert.win_probability_pct}% Win Score
          </span>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing || executed}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${
              executed 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black'
            }`}
          >
            {executing ? (
              <span>Placing Order...</span>
            ) : executed ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Filled in Paper Account!</span>
            ) : (
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> ⚡ Take Trade in Paper (1-Click)</span>
            )}
          </button>

          {onNavigateToSignals && (
            <button
              type="button"
              onClick={onNavigateToSignals}
              className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition-colors"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
