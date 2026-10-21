'use client';

import React, { useState, useEffect } from 'react';
import { fetchPrediction, fetchSignal } from '../lib/api';
import { PredictionData, SignalData } from '../types/market';
import { Cpu, CheckCircle2, Clock, Ban, AlertTriangle, TrendingUp, TrendingDown, Target, ShieldAlert } from 'lucide-react';

interface Props {
  symbol: string;
}

export const PredictionsSignalsView: React.FC<Props> = ({ symbol }) => {
  const [horizon, setHorizon] = useState<string>('1_SESSION');
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [pred, sig] = await Promise.all([
          fetchPrediction(symbol, horizon),
          fetchSignal(symbol)
        ]);
        if (isMounted) {
          setPrediction(pred);
          setSignal(sig);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [symbol, horizon]);

  if (loading && !prediction) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Running Calibrated Multi-Horizon Machine Learning Inference & Factor Attribution...
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> ELIGIBLE FOR SETUP
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-4 h-4" /> WATCHLIST ONLY
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Ban className="w-4 h-4" /> TRADE BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-gray-500/10 text-gray-400 border border-gray-500/30">
            <AlertTriangle className="w-4 h-4" /> NO TRADE EDGE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header AI Horizon Selector */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-gray-400 mb-1 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>AI QUANTITATIVE PREDICTION & REGIME FORECASTING</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {symbol} • Model {prediction?.model_version} ({prediction?.calibration_status})
          </div>
        </div>

        {/* Horizon Selector */}
        <div className="flex space-x-1 bg-terminal-dark p-1 rounded-lg border border-terminal-border">
          {[
            { id: 'INTRADAY_60M', label: '60 Min' },
            { id: '1_SESSION', label: '1 Session' },
            { id: '3_SESSIONS', label: '3 Sessions' },
            { id: '5_SESSIONS', label: '5 Sessions' }
          ].map((h) => (
            <button
              key={h.id}
              onClick={() => setHorizon(h.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                horizon === h.id ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Calibrated Directional Probabilities */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bullish Probability */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border text-center">
            <div className="text-xs font-mono text-gray-400 mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-terminal-green" /> BULLISH PROBABILITY
            </div>
            <div className="text-3xl font-bold font-mono text-terminal-green my-2">
              {(prediction.bullish_prob * 100).toFixed(1)}%
            </div>
            <div className="w-full h-2 bg-terminal-dark rounded-full overflow-hidden mt-3">
              <div style={{ width: `${prediction.bullish_prob * 100}%` }} className="bg-terminal-green h-full" />
            </div>
          </div>

          {/* Sideways Probability */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border text-center">
            <div className="text-xs font-mono text-gray-400 mb-1">SIDEWAYS / CHOP PROBABILITY</div>
            <div className="text-3xl font-bold font-mono text-gray-300 my-2">
              {(prediction.sideways_prob * 100).toFixed(1)}%
            </div>
            <div className="w-full h-2 bg-terminal-dark rounded-full overflow-hidden mt-3">
              <div style={{ width: `${prediction.sideways_prob * 100}%` }} className="bg-gray-400 h-full" />
            </div>
          </div>

          {/* Bearish Probability */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border text-center">
            <div className="text-xs font-mono text-gray-400 mb-1 flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-terminal-red" /> BEARISH PROBABILITY
            </div>
            <div className="text-3xl font-bold font-mono text-terminal-red my-2">
              {(prediction.bearish_prob * 100).toFixed(1)}%
            </div>
            <div className="w-full h-2 bg-terminal-dark rounded-full overflow-hidden mt-3">
              <div style={{ width: `${prediction.bearish_prob * 100}%` }} className="bg-terminal-red h-full" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Trade Setup & Explainable Recommendation Card */}
      {signal && (
        <div className="p-6 rounded-xl bg-terminal-surface border border-terminal-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-terminal-border pb-4">
            <div>
              <div className="text-xs font-mono text-gray-400">RECOMMENDATION DIRECTIVE</div>
              <div className="text-xl font-bold font-mono text-white mt-1 flex items-center gap-3">
                <span>{signal.direction} SETUP</span>
                <span className="text-xs font-normal text-gray-400 font-mono">({signal.strategy_type})</span>
              </div>
            </div>
            <div>{getStatusBadge(signal.status)}</div>
          </div>

          {/* Target Scenarios */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border">
              <span className="text-gray-500 text-[10px]">ENTRY PRICE</span>
              <div className="font-bold text-white mt-1">₹{signal.entry_price.toFixed(2)}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border">
              <span className="text-gray-500 text-[10px]">STOP LOSS (INVALIDATION)</span>
              <div className="font-bold text-terminal-red mt-1">₹{signal.stop_loss.toFixed(2)}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border">
              <span className="text-gray-500 text-[10px]">TARGET 1 (1.5R)</span>
              <div className="font-bold text-terminal-green mt-1">₹{signal.target_1.toFixed(2)}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border">
              <span className="text-gray-500 text-[10px]">TARGET 2 (2.5R)</span>
              <div className="font-bold text-terminal-green mt-1">₹{signal.target_2.toFixed(2)}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border">
              <span className="text-gray-500 text-[10px]">RISK / REWARD</span>
              <div className="font-bold text-blue-400 mt-1">1 : {signal.risk_reward_ratio}</div>
            </div>
          </div>

          {/* Supporting & Conflicting Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Supporting Evidence ({signal.reason_codes.length})
              </h4>
              <ul className="space-y-1 text-gray-300">
                {signal.reason_codes.map((rc, i) => (
                  <li key={i}>• {rc.replace(/_/g, ' ')}</li>
                ))}
                {prediction?.supporting_factors.map((f, i) => (
                  <li key={`pred-${i}`}>• {f}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/30">
              <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Conflicting Factors & Guardrails ({signal.block_reasons.length})
              </h4>
              <ul className="space-y-1 text-gray-300">
                {signal.block_reasons.map((br, i) => (
                  <li key={i}>• {br.replace(/_/g, ' ')}</li>
                ))}
                {prediction?.conflicting_factors.map((cf, i) => (
                  <li key={`cf-${i}`}>• {cf}</li>
                ))}
                {signal.block_reasons.length === 0 && (
                  <li className="text-gray-500 italic">No hard circuit breakers active for this instrument.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
