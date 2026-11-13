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
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface Props {
  initialSymbol?: string;
  initialSpot?: number;
  onNavigateTab?: (tab: string) => void;
}

interface AssetConfig {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  spot: number;
  step: number;
  lotSize: number;
}

const SUPPORTED_ASSETS: AssetConfig[] = [
  { symbol: 'NIFTY50', name: 'NIFTY 50', exchange: 'NSE', spot: 24850, step: 50, lotSize: 50 },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', exchange: 'NSE', spot: 51200, step: 100, lotSize: 15 },
  { symbol: 'FINNIFTY', name: 'FINNIFTY', exchange: 'NSE', spot: 23850, step: 50, lotSize: 25 },
  { symbol: 'MIDCPNIFTY', name: 'MIDCP NIFTY', exchange: 'NSE', spot: 12850, step: 25, lotSize: 50 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', exchange: 'BSE', spot: 79450, step: 100, lotSize: 10 },
  { symbol: 'BANKEX', name: 'BSE BANKEX', exchange: 'BSE', spot: 58200, step: 100, lotSize: 15 },
  { symbol: 'RELIANCE', name: 'Reliance', exchange: 'NSE', spot: 2980, step: 20, lotSize: 250 },
  { symbol: 'TCS', name: 'TCS', exchange: 'NSE', spot: 4120, step: 20, lotSize: 175 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', spot: 1640, step: 10, lotSize: 550 },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', spot: 1890, step: 10, lotSize: 400 }
];

const getPresetLegs = (key: string, spot: number, step: number = 50, lot: number = 50): OptionLeg[] => {
  const atm = Math.round(spot / step) * step;
  if (key === 'BULL_CALL_SPREAD') {
    return [
      { strike: atm, option_type: 'CE', side: 'BUY', quantity: lot, premium: Math.round(spot * 0.007), iv: 0.14 },
      { strike: atm + step * 4, option_type: 'CE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.0025), iv: 0.13 }
    ];
  } else if (key === 'BEAR_PUT_SPREAD') {
    return [
      { strike: atm, option_type: 'PE', side: 'BUY', quantity: lot, premium: Math.round(spot * 0.0065), iv: 0.14 },
      { strike: atm - step * 4, option_type: 'PE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.0022), iv: 0.15 }
    ];
  } else if (key === 'IRON_CONDOR') {
    return [
      { strike: atm - step * 6, option_type: 'PE', side: 'BUY', quantity: lot, premium: Math.max(5, Math.round(spot * 0.001)), iv: 0.16 },
      { strike: atm - step * 3, option_type: 'PE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.003), iv: 0.15 },
      { strike: atm + step * 3, option_type: 'CE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.003), iv: 0.14 },
      { strike: atm + step * 6, option_type: 'CE', side: 'BUY', quantity: lot, premium: Math.max(5, Math.round(spot * 0.001)), iv: 0.13 }
    ];
  } else if (key === 'LONG_STRADDLE') {
    return [
      { strike: atm, option_type: 'CE', side: 'BUY', quantity: lot, premium: Math.round(spot * 0.007), iv: 0.14 },
      { strike: atm, option_type: 'PE', side: 'BUY', quantity: lot, premium: Math.round(spot * 0.0065), iv: 0.14 }
    ];
  } else {
    // SHORT_STRANGLE
    return [
      { strike: atm - step * 4, option_type: 'PE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.0025), iv: 0.15 },
      { strike: atm + step * 4, option_type: 'CE', side: 'SELL', quantity: lot, premium: Math.round(spot * 0.0025), iv: 0.14 }
    ];
  }
};

const PRESET_LABELS: Record<string, string> = {
  BULL_CALL_SPREAD: 'Bull Call Spread',
  BEAR_PUT_SPREAD: 'Bear Put Spread',
  IRON_CONDOR: 'Iron Condor',
  LONG_STRADDLE: 'Long Straddle',
  SHORT_STRANGLE: 'Short Strangle'
};

export const OptionsStrategyBuilderView: React.FC<Props> = ({
  initialSymbol = 'NIFTY50',
  initialSpot = 24850,
  onNavigateTab
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [spotPrice, setSpotPrice] = useState<number>(initialSpot);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(7);
  const [strategyName, setStrategyName] = useState<string>('Bull Call Spread');
  const [legs, setLegs] = useState<OptionLeg[]>(getPresetLegs('BULL_CALL_SPREAD', initialSpot, 50, 50));
  const [payoff, setPayoff] = useState<OptionStrategyPayoffResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const activeAsset = SUPPORTED_ASSETS.find((a) => a.symbol === symbol) || SUPPORTED_ASSETS[0];

  const handleSelectAsset = (cfg: AssetConfig) => {
    setSymbol(cfg.symbol);
    setSpotPrice(cfg.spot);
    setLegs(getPresetLegs('BULL_CALL_SPREAD', cfg.spot, cfg.step, cfg.lotSize));
    setStrategyName('Bull Call Spread');
  };

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
    const label = PRESET_LABELS[key];
    if (label) {
      setStrategyName(label);
      setLegs(getPresetLegs(key, spotPrice, activeAsset.step, activeAsset.lotSize));
    }
  };

  const handleLegChange = (index: number, field: keyof OptionLeg, value: any) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    setLegs(updated);
  };

  const handleAddLeg = () => {
    const atm = Math.round(spotPrice / activeAsset.step) * activeAsset.step;
    setLegs([
      ...legs,
      { strike: atm, option_type: 'CE', side: 'BUY', quantity: activeAsset.lotSize, premium: 100.0, iv: 0.14 }
    ]);
  };

  const handleRemoveLeg = (index: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, idx) => idx !== index));
  };

  const handleSimulateExecution = async () => {
    try {
      for (const leg of legs) {
        const unitsInLots = Math.max(1, Math.round(leg.quantity / activeAsset.lotSize));
        await placePaperOrder({
          symbol: symbol.toUpperCase(),
          side: leg.side,
          quantity: unitsInLots,
          order_type: 'MARKET',
          product_type: 'NRML',
          instrument_type: 'OPTIONS',
          strike_price: leg.strike,
          option_type: leg.option_type,
          lot_size: activeAsset.lotSize,
          price: leg.premium,
          client_order_id: `STRAT-${symbol}-${leg.strike}-${leg.option_type}-${Date.now()}`
        });
      }
      setOrderSuccess(
        `Multi-leg ${strategyName} (${legs.length} legs) successfully filled in your Virtual Paper Portfolio!`
      );
      setTimeout(() => setOrderSuccess(null), 8000);
    } catch (err: any) {
      alert(`Paper basket order placement failed: ${err.message}`);
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

    const pnlMargin = Math.max(Math.abs(minPnl), Math.abs(maxPnl)) * 0.1 || 500;
    minPnl -= pnlMargin;
    maxPnl += pnlMargin;
  }

  const getX = (price: number) => {
    return padding.left + ((price - minPrice) / (maxPrice - minPrice || 1)) * chartWidth;
  };

  const getY = (pnl: number) => {
    return padding.top + chartHeight - ((pnl - minPnl) / (maxPnl - minPnl || 1)) * chartHeight;
  };

  const zeroY = getY(0);

  const expiryPointsStr = payoff?.payoff_curve
    .map((p) => `${getX(p.underlying_price)},${getY(p.payoff_at_expiry)}`)
    .join(' ');

  const tnPointsStr = payoff?.payoff_curve
    .map((p) => `${getX(p.underlying_price)},${getY(p.payoff_t_plus_n)}`)
    .join(' ');

  return (
    <div className="space-y-6 pb-12">
      {/* 0. Asset & Exchange Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#070b16] rounded-2xl border border-slate-800 shadow-md font-mono text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-blue-400 font-extrabold uppercase mr-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            NSE F&O:
          </span>
          {SUPPORTED_ASSETS.filter((a) => a.exchange === 'NSE' && a.symbol.includes('NIFTY')).map((a) => (
            <button
              key={a.symbol}
              onClick={() => handleSelectAsset(a)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                symbol === a.symbol
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {a.name}
            </button>
          ))}

          <span className="text-slate-700 mx-1.5">|</span>

          <span className="text-[10px] text-amber-400 font-extrabold uppercase mr-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            BSE F&O:
          </span>
          {SUPPORTED_ASSETS.filter((a) => a.exchange === 'BSE').map((a) => (
            <button
              key={a.symbol}
              onClick={() => handleSelectAsset(a)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                symbol === a.symbol
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {a.name} (BSE)
            </button>
          ))}

          <span className="text-slate-700 mx-1.5">|</span>

          <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-1">
            Equities:
          </span>
          {SUPPORTED_ASSETS.filter((a) => !a.symbol.includes('NIFTY') && a.exchange !== 'BSE').map((a) => (
            <button
              key={a.symbol}
              onClick={() => handleSelectAsset(a)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                symbol === a.symbol
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('paper')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition ml-auto shadow-sm"
          >
            <span>📋 View in Paper Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Banner with Presets & Settings */}
      <div className="bg-gradient-to-r from-[#0c1429] via-[#0f1a36] to-[#0c1429] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400">
                <Layers className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  {activeAsset.name} ({activeAsset.exchange}) Strategy Payoff Simulator
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
              {Object.entries(PRESET_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => handleApplyPreset(k)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    strategyName === label
                      ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Underlying Settings */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/70 p-3 rounded-xl shadow-inner font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Underlying Spot (₹)
              </label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(parseFloat(e.target.value) || activeAsset.spot)}
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
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold">{orderSuccess}</span>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('paper')}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5 shadow"
            >
              <span>📋 View in Paper Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Interactive Payoff Graph & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Payoff Chart */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Expiration &amp; T+{Math.round(daysToExpiry / 2)} Payoff Curve</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Payoff at Expiry
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed border-b inline-block" /> T+{Math.round(daysToExpiry / 2)} (Half-life)
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none font-mono"
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

                {/* Expiration Payoff Line */}
                {expiryPointsStr && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    points={expiryPointsStr}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Breakeven Indicators Bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Breakeven Points:</span>
              <div className="flex gap-2">
                {(payoff?.breakeven_points || []).map((be: number, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-cyan-300 font-bold border border-slate-700">
                    ₹{be.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Net Flow:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  (payoff?.net_debit_credit || 0) >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {(payoff?.net_debit_credit || 0) >= 0 ? 'NET CREDIT' : 'NET DEBIT'}: ₹{Math.abs(payoff?.net_debit_credit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Quantitative Strategy Telemetry */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between pb-3 border-b border-slate-800">
              <span>Strategy Scorecard</span>
              <span className="text-xs font-mono text-cyan-400">1-CLICK PAPER DESK</span>
            </h3>

            {/* Probability of Profit (POP) Gauge */}
            <div className="bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" /> Probability of Profit (POP)
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {(payoff?.probability_of_profit_pct ?? 50).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${payoff?.probability_of_profit_pct || 50}%` }}
                />
              </div>
            </div>

            {/* Max Profit / Max Loss Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">MAX PROFIT</span>
                <span className="text-base font-bold text-emerald-400">
                  {payoff?.max_profit === null || (payoff && payoff.max_profit > 1000000)
                    ? 'Unlimited ∞'
                    : `₹${payoff?.max_profit.toLocaleString()}`}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">MAX LOSS</span>
                <span className="text-base font-bold text-rose-400">
                  {payoff?.max_loss === null || (payoff && payoff.max_loss > 1000000)
                    ? 'Unlimited ∞'
                    : `₹${payoff?.max_loss.toLocaleString()}`}
                </span>
              </div>
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

            {/* 1-Click Paper Trade Basket Button */}
            <button
              onClick={handleSimulateExecution}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Execute Strategy Basket in Paper Account</span>
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
                      step={activeAsset.step}
                      value={leg.strike}
                      onChange={(e) => handleLegChange(idx, 'strike', parseFloat(e.target.value) || spotPrice)}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold text-xs"
                    />
                  </td>

                  {/* Premium */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.05"
                      value={leg.premium}
                      onChange={(e) => handleLegChange(idx, 'premium', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold text-xs"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step={activeAsset.lotSize}
                      value={leg.quantity}
                      onChange={(e) => handleLegChange(idx, 'quantity', parseInt(e.target.value) || activeAsset.lotSize)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold text-xs"
                    />
                  </td>

                  {/* IV */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={leg.iv}
                      onChange={(e) => handleLegChange(idx, 'iv', parseFloat(e.target.value) || 0.15)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold text-xs"
                    />
                  </td>

                  {/* Delete Leg */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleRemoveLeg(idx)}
                      disabled={legs.length <= 1}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-400 disabled:opacity-30 transition-all"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
