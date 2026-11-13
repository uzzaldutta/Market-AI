'use client';

import React, { useState, useEffect } from 'react';
import { fetchPreTradeCheck } from '../../lib/api';
import { PreTradeCheckRequest, PreTradeCheckResponse, PreTradeCheckItem } from '../../types/market';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Zap,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Sliders,
  Scale
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tradeData: PreTradeCheckRequest;
  onConfirmOrder: (adjustedQuantity?: number) => void;
}

export const PreTradeChecklistModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tradeData,
  onConfirmOrder
}) => {
  const [report, setReport] = useState<PreTradeCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQty, setSelectedQty] = useState<number>(tradeData.quantity);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchPreTradeCheck({
        ...tradeData,
        quantity: selectedQty
      })
        .then((res) => {
          setReport(res);
        })
        .catch((err) => {
          console.error('Failed to run pre-trade validation:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, tradeData, selectedQty]);

  if (!isOpen) return null;

  const isBuy = tradeData.side === 'BUY';
  const isReady = report?.overall_status === 'INSTITUTIONAL_READY';
  const isBlocked = report?.overall_status === 'BLOCKED_HIGH_RISK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#070b16] border border-cyan-500/40 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Institutional Pre-Trade Risk Gate
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  PRE-FLIGHT FLIGHT CHECK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verifying capital at risk, mathematical expectancy, macro confluence, and statutory friction
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading && !report ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
              <p className="text-sm">Auditing trade parameters against institutional risk guidelines...</p>
            </div>
          ) : report ? (
            <>
              {/* Overall Readiness Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isReady
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : isBlocked
                    ? 'bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isReady
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isBlocked
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isReady ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : isBlocked ? (
                      <XCircle className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full font-mono ${
                          isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isBlocked
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {report.overall_status.replace(/_/g, ' ')} ({report.readiness_score} / 6 PASSED)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-sans">
                      {report.advisory_message}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Order Ticket</span>
                  <span className="text-sm font-black text-white font-mono">
                    <span className={isBuy ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                      {tradeData.side}
                    </span>{' '}
                    {selectedQty} {tradeData.symbol} @ ₹{tradeData.entry_price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Key Risk Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Order Value</span>
                  <div className="text-base font-black text-white font-mono mt-1">
                    ₹{report.order_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Capital at Risk (SL)</span>
                  <div className={`text-base font-black font-mono mt-1 ${report.risk_pct_of_equity <= 1.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{report.risk_amount_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    <span className="text-xs font-normal ml-1">({report.risk_pct_of_equity}%)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk/Reward Expectancy</span>
                  <div className={`text-base font-black font-mono mt-1 ${report.risk_reward_ratio >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    1 : {report.risk_reward_ratio.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Asset Concentration</span>
                  <div className={`text-base font-black font-mono mt-1 ${report.portfolio_concentration_pct <= 20 ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {report.portfolio_concentration_pct.toFixed(1)}% of Eq.
                  </div>
                </div>
              </div>

              {/* The 6-Point Institutional Checklist */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-slate-300 font-mono tracking-wider">
                  Pre-Flight Verification Checklist
                </h4>

                <div className="space-y-2">
                  {report.checks.map((item: PreTradeCheckItem, idx: number) => {
                    const isPass = item.status === 'PASS';
                    const isFail = item.status === 'FAIL';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                          isPass
                            ? 'bg-slate-950/40 border-slate-800'
                            : isFail
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-amber-950/20 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isPass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isFail ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-white block">{item.name}</span>
                            <span className="text-[11px] text-slate-400 leading-tight">
                              {item.description}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPass
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : isFail
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {item.value_str}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic 1% Sizing Sizer & Statutory Friction Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1% Position Sizing Calculator */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-cyan-400 font-mono">
                      Institutional 1% Risk Sizer
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Max Loss = 1% Equity</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Based on your Stop-Loss distance of ₹{Math.abs(tradeData.entry_price - tradeData.stop_loss).toFixed(2)}, the institutional 1% risk position size is:
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-black text-white font-mono">
                      {report.recommended_1pct_quantity} Shares
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedQty(report.recommended_1pct_quantity)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono transition-all"
                    >
                      Adopt 1% Sizing
                    </button>
                  </div>
                </div>

                {/* Statutory Friction & Breakeven */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-amber-400 font-mono">
                      Exchange Taxes &amp; Friction
                    </span>
                    <span className="text-[10px] text-slate-400">NSE / SEBI Rates</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span>STT (Turnover Tax):</span>
                      <span>₹{report.friction.stt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchange &amp; SEBI Turnover:</span>
                      <span>₹{(report.friction.exchange_turnover_fee + report.friction.sebi_charges).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                      <span>Total Statutory Friction:</span>
                      <span className="text-amber-300">₹{report.friction.total_taxes_and_charges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Breakeven Tick Offset:</span>
                      <span className="text-cyan-400">+{report.friction.breakeven_points_needed.toFixed(2)} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Cancel &amp; Re-evaluate
          </button>

          <button
            onClick={() => {
              onConfirmOrder(selectedQty);
              onClose();
            }}
            disabled={isBlocked}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              isBlocked
                ? 'bg-rose-800/50 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/30 active:scale-95'
            }`}
          >
            <Zap className="w-4 h-4" />
            Authorize Institutional Order ({selectedQty} {tradeData.symbol})
          </button>
        </div>
      </div>
    </div>
  );
};
