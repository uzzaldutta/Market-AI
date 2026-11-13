'use client';

import React, { useState, useEffect } from 'react';
import { calculateStrategyPayoff, placePaperOrder } from '../lib/api';
import { OptionLeg, OptionStrategyPayoffResponse, StrategyPayoffPoint } from '../types/market';
import {
  Layers,
  Plus,
  Trash2,
  TrendingUp,
  Percent,
  Zap,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface Props {
  initialSymbol?: string;
  initialSpot?: number;
  onNavigateTab?: (tab: string) => void;
}

const PRESET_STRATEGIES: Record<string, { name: string; getLegs: (spot: number) => OptionLeg[] }> = {
  BULL_CALL_SPREAD: {
    name: 'Bull Call Spread',
    getLegs: (spot: number) => {
      const strike1 = Math.round(spot / 50) * 50;
      const strike2 = strike1 + 300;
      return [
        { strike: strike1, option_type: 'CE', side: 'BUY', quantity: 50, premium: 165.0, iv: 0.14 },
        { strike: strike2, option_type: 'CE', side: 'SELL', quantity: 50, premium: 52.0, iv: 0.13 }
      ];
    }
  },
  BEAR_PUT_SPREAD: {
    name: 'Bear Put Spread',
    getLegs: (spot: number) => {
      const strike1 = Math.round(spot / 50) * 50;
      const strike2 = strike1 - 300;
      return [
        { strike: strike1, option_type: 'PE', side: 'BUY', quantity: 50, premium: 155.0, iv: 0.14 },
        { strike: strike2, option_type: 'PE', side: 'SELL', quantity: 50, premium: 48.0, iv: 0.15 }
      ];
    }
  },
  IRON_CONDOR: {
    name: 'Iron Condor',
    getLegs: (spot: number) => {
      const atm = Math.round(spot / 50) * 50;
      return [
        { strike: atm - 500, option_type: 'PE', side: 'BUY', quantity: 50, premium: 18.0, iv: 0.16 },
        { strike: atm - 250, option_type: 'PE', side: 'SELL', quantity: 50, premium: 65.0, iv: 0.15 },
        { strike: atm + 250, option_type: 'CE', side: 'SELL', quantity: 50, premium: 68.0, iv: 0.14 },
        { strike: atm + 500, option_type: 'CE', side: 'BUY', quantity: 50, premium: 20.0, iv: 0.13 }
      ];
    }
  },
  LONG_STRADDLE: {
    name: 'Long Straddle',
    getLegs: (spot: number) => {
      const atm = Math.round(spot / 50) * 50;
      return [
        { strike: atm, option_type: 'CE', side: 'BUY', quantity: 50, premium: 175.0, iv: 0.14 },
        { strike: atm, option_type: 'PE', side: 'BUY', quantity: 50, premium: 165.0, iv: 0.14 }
      ];
    }
  },
  SHORT_STRANGLE: {
    name: 'Short Strangle',
    getLegs: (spot: number) => {
      const atm = Math.round(spot / 50) * 50;
      return [
        { strike: atm - 300, option_type: 'PE', side: 'SELL', quantity: 50, premium: 55.0, iv: 0.15 },
        { strike: atm + 300, option_type: 'CE', side: 'SELL', quantity: 50, premium: 58.0, iv: 0.14 }
      ];
    }
  }
};

export const OptionsStrategyBuilderView: React.FC<Props> = ({
  initialSymbol = 'NIFTY50',
  initialSpot = 24500,
  onNavigateTab
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [spotPrice, setSpotPrice] = useState<number>(initialSpot);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(7);
  const [strategyName, setStrategyName] = useState<string>('Bull Call Spread');
  const [legs, setLegs] = useState<OptionLeg[]>(PRESET_STRATEGIES.BULL_CALL_SPREAD.getLegs(initialSpot));
  const [payoff, setPayoff] = useState<OptionStrategyPayoffResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const calculatePayoff = async () => {
    setLoading(true);
    setOrderSuccess(null);
    try {
      const data = await calculateStrategyPayoff({
        symbol,
        spot_price: spotPrice,
        days_to_expiry: daysToExpiry,
        legs,
        strategy_name: strategyName
      });
      setPayoff(data);
    } catch (err) {
      console.error('Failed to calculate payoff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePayoff();
  }, [spotPrice, daysToExpiry, legs]);

  const handleApplyPreset = (key: string) => {
    const preset = PRESET_STRATEGIES[key];
    if (preset) {
      setStrategyName(preset.name);
      setLegs(preset.getLegs(spotPrice));
    }
  };

  const handleLegChange = (index: number, field: keyof OptionLeg, value: any) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    setLegs(updated);
  };

  const handleAddLeg = () => {
    const atm = Math.round(spotPrice / 50) * 50;
    setLegs([
      ...legs,
      { strike: atm, option_type: 'CE', side: 'BUY', quantity: 50, premium: 100.0, iv: 0.14 }
    ]);
  };

  const handleRemoveLeg = (index: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, idx) => idx !== index));
  };

  const handleSimulateExecution = async () => {
    try {
      for (const leg of legs) {
        await placePaperOrder({
          symbol: `${symbol}_${leg.strike}_${leg.option_type}`,
          side: leg.side,
          quantity: leg.quantity,
          order_type: 'MARKET',
          instrument_type: 'OPTIONS',
          product: 'NRML'
        });
      }
      setOrderSuccess(`Multi-leg strategy basket (${legs.length} legs) submitted to Virtual Paper Trading account!`);
      setTimeout(() => setOrderSuccess(null), 6000);
    } catch (err: any) {
      alert(`Paper order placement failed: ${err.message}`);
    }
  };

  // SVG dimensions for Payoff Chart
  const svgWidth = 800;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  let minPnl = -5000;
  let maxPnl = 5000;
  let minPrice = spotPrice * 0.9;
  let maxPrice = spotPrice * 1.1;

  if (payoff && payoff.payoff_curve.length > 0) {
    const prices = payoff.payoff_curve.map((p) => p.underlying_price);
    const expPnls = payoff.payoff_curve.map((p) => p.payoff_at_expiry);
    const tnPnls = payoff.payoff_curve.map((p) => p.payoff_t_plus_n);

    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);

    const allPnls = [...expPnls, ...tnPnls].filter((v) => isFinite(v));
    minPnl = Math.min(...allPnls);
    maxPnl = Math.max(...allPnls);

    // Give breathing room
    const pnlRange = maxPnl - minPnl;
    minPnl -= pnlRange * 0.1;
    maxPnl += pnlRange * 0.1;
  }

  const getX = (price: number) => {
    const pct = (price - minPrice) / (maxPrice - minPrice || 1);
    return padding.left + pct * chartWidth;
  };

  const getY = (pnlVal: number) => {
    const clamped = Math.max(minPnl, Math.min(maxPnl, pnlVal));
    const pct = (clamped - minPnl) / (maxPnl - minPnl || 1);
    return padding.top + chartHeight - pct * chartHeight;
  };

  const zeroY = getY(0);

  // Expiry path
  const expiryPointsStr = (payoff?.payoff_curve || [])
    .map((p) => `${getX(p.underlying_price)},${getY(p.payoff_at_expiry)}`)
    .join(' ');

  // T+n path
  const tnPointsStr = (payoff?.payoff_curve || [])
    .map((p) => `${getX(p.underlying_price)},${getY(p.payoff_t_plus_n)}`)
    .join(' ');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c1429] via-[#0f1a36] to-[#0c1429] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400">
                <Layers className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Options Strategy Payoff Simulator
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono">
                    MULTI-LEG GREEKS
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Construct custom options structures with exact expiration payoff, T+n Greek decay curves, Probability of Profit (POP), and 1-click execution.
                </p>
              </div>
            </div>

            {/* Strategy Preset Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Institutional Presets:
              </span>
              {Object.entries(PRESET_STRATEGIES).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => handleApplyPreset(k)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    strategyName === p.name
                      ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Underlying Settings */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/70 p-3 rounded-xl shadow-inner">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Underlying Spot
              </label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(parseFloat(e.target.value) || initialSpot)}
                className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Days to Expiry (DTE)
              </label>
              <input
                type="number"
                value={daysToExpiry}
                min={1}
                max={90}
                onChange={(e) => setDaysToExpiry(parseInt(e.target.value) || 7)}
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {orderSuccess}
        </div>
      )}

      {/* Payoff Chart & Key Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Payoff Curve Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Interactive Payoff Diagram (P&amp;L vs Underlying)</h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> At Expiry
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" /> T+n Curve
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 inline-block" /> Spot (₹{spotPrice})
              </span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="w-full overflow-hidden bg-slate-950/50 rounded-xl p-2 border border-slate-800/80 my-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 select-none"
            >
              {/* Zero Profit Line */}
              <line
                x1={padding.left}
                y1={zeroY}
                x2={svgWidth - padding.right}
                y2={zeroY}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={zeroY + 4}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                ₹0
              </text>

              {/* Spot Price Line */}
              <line
                x1={getX(spotPrice)}
                y1={padding.top}
                x2={getX(spotPrice)}
                y2={svgHeight - padding.bottom}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={getX(spotPrice)}
                y={svgHeight - padding.bottom + 16}
                fill="#06b6d4"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Spot ₹{spotPrice}
              </text>

              {/* T+n Payoff Line */}
              {tnPointsStr && (
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  points={tnPointsStr}
                />
              )}

              {/* Expiry Payoff Line */}
              {expiryPointsStr && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={expiryPointsStr}
                />
              )}

              {/* Breakeven Point Markers */}
              {(payoff?.breakeven_points || []).map((be, idx) => (
                <g key={idx}>
                  <circle
                    cx={getX(be)}
                    cy={zeroY}
                    r="4"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={getX(be)}
                    y={zeroY - 8}
                    fill="#10b981"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    BE ₹{be}
                  </text>
                </g>
              ))}

              {/* X Axis Labels */}
              <text
                x={getX(minPrice * 1.02)}
                y={svgHeight - padding.bottom + 16}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                ₹{minPrice.toFixed(0)}
              </text>
              <text
                x={getX(maxPrice * 0.98)}
                y={svgHeight - padding.bottom + 16}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                ₹{maxPrice.toFixed(0)}
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 px-2">
            <span>Left: Downside Bear Zone</span>
            <span>Zero Crossing = Breakeven Threshold</span>
            <span>Right: Upside Bull Zone</span>
          </div>
        </div>

        {/* Strategy Metrics & Risk Matrix (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">
              Strategy Risk &amp; Reward Matrix
            </h3>

            {/* Max Profit vs Max Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Profit</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {payoff?.max_profit === 999999.0 ? 'Unlimited' : `₹${payoff?.max_profit.toFixed(0)}`}
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Loss</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  {payoff?.max_loss === -999999.0 ? 'Unlimited' : `₹${Math.abs(payoff?.max_loss || 0).toFixed(0)}`}
                </span>
              </div>
            </div>

            {/* POP & Risk Reward */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Probability of Profit</span>
                <span className="text-xl font-black text-cyan-300 font-mono">
                  {payoff?.probability_of_profit_pct || 50}%
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk/Reward</span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  1:{payoff?.risk_reward_ratio || 1.5}
                </span>
              </div>
            </div>

            {/* Net Entry Premium */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Entry Cashflow</span>
                <span className="text-xs text-slate-400">
                  {payoff && payoff.net_debit_credit >= 0 ? 'Net Credit Collected' : 'Net Debit Paid'}
                </span>
              </div>
              <span className={`text-base font-black font-mono ${payoff && payoff.net_debit_credit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{Math.abs(payoff?.net_debit_credit || 0).toFixed(2)}
              </span>
            </div>

            {/* Net Portfolio Greeks */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                Aggregate Greeks Exposure
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">DELTA</span>
                  <span className="text-xs font-bold text-white">{payoff?.net_delta.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">GAMMA</span>
                  <span className="text-xs font-bold text-white">{payoff?.net_gamma.toFixed(4)}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">THETA</span>
                  <span className="text-xs font-bold text-emerald-400">{payoff?.net_theta.toFixed(1)}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">VEGA</span>
                  <span className="text-xs font-bold text-white">{payoff?.net_vega.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* 1-Click Paper Trade Button */}
            <button
              onClick={handleSimulateExecution}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <Zap className="w-4 h-4" />
              Execute Strategy Basket in Paper Account
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Option Legs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Strategy Legs Breakdown</h3>
            <p className="text-xs text-slate-400">
              Customize strikes, premiums, and positions. Instant re-calculation on every change.
            </p>
          </div>
          <button
            onClick={handleAddLeg}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Leg
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Option</th>
                <th className="py-2.5 px-3">Strike Price</th>
                <th className="py-2.5 px-3">Premium (₹)</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">IV (%)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {legs.map((leg, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  {/* Side */}
                  <td className="py-2.5 px-3">
                    <select
                      value={leg.side}
                      onChange={(e) => handleLegChange(idx, 'side', e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-bold bg-slate-800 border border-slate-700 ${
                        leg.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </td>

                  {/* Option Type */}
                  <td className="py-2.5 px-3">
                    <select
                      value={leg.option_type}
                      onChange={(e) => handleLegChange(idx, 'option_type', e.target.value)}
                      className="px-2 py-1 rounded text-xs font-bold bg-slate-800 border border-slate-700 text-cyan-300"
                    >
                      <option value="CE">CALL (CE)</option>
                      <option value="PE">PUT (PE)</option>
                    </select>
                  </td>

                  {/* Strike */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step={50}
                      value={leg.strike}
                      onChange={(e) => handleLegChange(idx, 'strike', parseFloat(e.target.value) || 0)}
                      className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                    />
                  </td>

                  {/* Premium */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step={1}
                      value={leg.premium}
                      onChange={(e) => handleLegChange(idx, 'premium', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step={25}
                      value={leg.quantity}
                      onChange={(e) => handleLegChange(idx, 'quantity', parseInt(e.target.value) || 25)}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
                    />
                  </td>

                  {/* IV */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step={0.01}
                      value={leg.iv}
                      onChange={(e) => handleLegChange(idx, 'iv', parseFloat(e.target.value) || 0.14)}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-amber-300"
                    />
                  </td>

                  {/* Delete Button */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleRemoveLeg(idx)}
                      disabled={legs.length <= 1}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
