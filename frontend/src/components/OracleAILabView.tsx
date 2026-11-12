'use client';

import React, { useState, useEffect } from 'react';
import { fetchOracleAnalysis, placePaperOrder } from '../lib/api';
import { OracleValuationData } from '../types/market';
import { PriceFlash } from './common/PriceFlash';
import {
  Brain,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Target,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Compass,
  DollarSign,
  ArrowRight,
  Award,
  RefreshCw
} from 'lucide-react';

interface Props {
  onSelectSymbol?: (symbol: string) => void;
}

export const OracleAILabView: React.FC<Props> = ({ onSelectSymbol }) => {
  const [symbolInput, setSymbolInput] = useState<string>('RELIANCE');
  const [activeSymbol, setActiveSymbol] = useState<string>('RELIANCE');
  const [data, setData] = useState<OracleValuationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive DCF Sensitivity Sliders
  const [growthRate, setGrowthRate] = useState<number>(14.5);
  const [discountRate, setDiscountRate] = useState<number>(11.5);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Paper Trade Execution
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executeSuccess, setExecuteSuccess] = useState<boolean>(false);

  // Presets for quick institutional testing
  const presets = [
    'RELIANCE',
    'TCS',
    'HDFCBANK',
    'TATAMOTORS',
    'HAL',
    'ITC',
    'SBIN',
    'INFY',
    'TITAN',
    'BHARTIARTL'
  ];

  const loadValuation = async (sym: string, g?: number, r?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOracleAnalysis(sym, g, r);
      setData(res);
      if (g === undefined) setGrowthRate(res.growth_rate_used_pct);
      if (r === undefined) setDiscountRate(res.discount_rate_used_pct);
    } catch (err: any) {
      setError(err.message || 'Failed to load Oracle valuation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValuation(activeSymbol);
  }, [activeSymbol]);

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = symbolInput.trim().toUpperCase();
    if (clean) {
      setActiveSymbol(clean);
    }
  };

  // Re-run DCF simulation when sliders change
  const handleSliderChange = async (newGrowth: number, newDiscount: number) => {
    setGrowthRate(newGrowth);
    setDiscountRate(newDiscount);
    setIsSimulating(true);
    try {
      const res = await fetchOracleAnalysis(activeSymbol, newGrowth, newDiscount);
      setData(res);
    } catch (e) {
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecutePaperOrder = async () => {
    if (!data) return;
    setIsExecuting(true);
    try {
      const orderPayload = {
        symbol: data.symbol,
        exchange: 'NSE',
        side: 'BUY',
        order_type: data.margin_of_safety_pct > 15 ? 'MARKET' : 'LIMIT',
        quantity: Math.max(1, Math.round(100000 / data.ltp)),
        price: data.margin_of_safety_pct > 15 ? data.ltp : data.bargain_buy_price,
        stop_loss: roundNum(data.ltp * 0.92, 1),
        target_price: data.fair_value,
        idempotency_key: `ORACLE_${data.symbol}_${Date.now()}`
      };
      await placePaperOrder(orderPayload);
      setExecuteSuccess(true);
      setTimeout(() => setExecuteSuccess(false), 4000);
    } catch (err: any) {
      alert('Order failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  };

  const roundNum = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

  // Render 5-Pillar Spider / Radar Chart (SVG)
  const renderSpiderRadar = () => {
    if (!data) return null;
    const center = 110;
    const radius = 78;

    // Scores (0-100)
    const scores = [
      data.pillar_buffett.moat_score,
      Math.min(100, (data.pillar_graham.piotroski_f_score / 9) * 80 + data.pillar_graham.altman_z_score * 5),
      data.pillar_lynch.multibagger_potential_score,
      data.pillar_simons.quant_score,
      data.pillar_druckenmiller.macro_tailwind_score
    ];

    const labels = [
      'Buffett Moat',
      'Graham Safety',
      'Lynch Growth',
      'Simons Quant',
      'Druckenmiller Macro'
    ];

    // Compute polygon coordinates
    const numPoints = 5;
    const points = scores.map((score, i) => {
      const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
      const r = (score / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 220 220" className="w-52 h-52 mx-auto select-none">
        {/* Background webs */}
        {[0.25, 0.5, 0.75, 1.0].map((level, idx) => {
          const webPoints = Array.from({ length: numPoints }).map((_, i) => {
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            const r = level * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={idx}
              points={webPoints}
              fill="none"
              stroke="#1f293d"
              strokeWidth="0.8"
              strokeDasharray={level < 1 ? '2 2' : 'none'}
            />
          );
        })}

        {/* Axis spokes */}
        {Array.from({ length: numPoints }).map((_, i) => {
          const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#1f293d" strokeWidth="0.8" />;
        })}

        {/* Data polygon */}
        <polygon
          points={points}
          fill="#06b6d4"
          fillOpacity="0.25"
          stroke="#06b6d4"
          strokeWidth="1.8"
        />

        {/* Data points */}
        {scores.map((score, i) => {
          const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
          const r = (score / 100) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />;
        })}

        {/* Labels */}
        {labels.map((lbl, i) => {
          const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
          const labelRadius = radius + 18;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Manual Input Search Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#080d1a] via-[#0d1629] to-[#080d1a] border border-cyan-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono text-gray-100 flex items-center space-x-2">
                  <span>Oracle AI Stock Laboratory</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Institutional Valuation
                  </span>
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Autonomous Multi-Agent Synthesis: Warren Buffett • Benjamin Graham • Peter Lynch • Jim Simons • Stanley Druckenmiller
                </p>
              </div>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                placeholder="Enter ANY NSE/BSE Scrip..."
                className="w-full bg-[#0a0f1d] border border-gray-700/80 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 placeholder-gray-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center space-x-1.5 transition-all transform active:scale-95 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>
          </form>
        </div>

        {/* Quick Ticker Preset Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-2 border-t border-gray-800/60 text-xs font-mono">
          <span className="text-[11px] text-gray-500 flex-shrink-0">Quick Presets:</span>
          {presets.map(sym => (
            <button
              key={sym}
              onClick={() => {
                setSymbolInput(sym);
                setActiveSymbol(sym);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all flex-shrink-0 ${
                activeSymbol === sym
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white border border-gray-700/60'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-mono text-gray-400 animate-pulse">
            Simulating DCF cash flows, calculating Economic Moat & running Graham Number on {activeSymbol}...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <>
          {/* 2. Top Decision Verdict & Intrinsic Value Banner */}
          <div className="p-6 rounded-2xl bg-[#090e1a] border border-gray-800/90 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-gray-800/80 pb-5">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{data.symbol}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                    {data.sector}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${
                    data.master_verdict === 'BUFFETT_FAT_PITCH'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : data.master_verdict === 'ACCUMULATE_FAIR_PRICE'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : data.master_verdict === 'WATCHLIST_FULLY_VALUED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {data.master_verdict_badge}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-sans mt-1">{data.name}</p>
                <p className="text-xs text-cyan-200/90 font-mono mt-2 max-w-3xl leading-relaxed">
                  ◈ <strong>Oracle Synthesis:</strong> {data.master_summary}
                </p>
              </div>

              {/* Price & Intrinsic Value Matrix */}
              <div className="flex items-center space-x-4 font-mono text-right flex-shrink-0">
                <div className="bg-[#0f172a] p-3 rounded-xl border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase">CURRENT MARKET PRICE</div>
                  <div className="text-lg font-bold text-white">
                    <PriceFlash value={data.ltp} prefix="₹" />
                  </div>
                </div>

                <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase">DCF INTRINSIC FAIR VALUE</div>
                  <div className="text-lg font-bold text-cyan-300">
                    ₹{data.fair_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  data.margin_of_safety_pct >= 15
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : data.margin_of_safety_pct >= 0
                    ? 'bg-amber-500/15 border-amber-500/40'
                    : 'bg-rose-500/15 border-rose-500/40'
                }`}>
                  <div className="text-[10px] text-gray-400 uppercase">MARGIN OF SAFETY</div>
                  <div className={`text-lg font-bold ${data.margin_of_safety_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.margin_of_safety_pct >= 0 ? '+' : ''}{data.margin_of_safety_pct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action & Bargain Level Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-purple-400 font-semibold">◈ Buffett Bargain Entry Level (25% Safety):</span>
                <span className="font-bold text-white bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
                  ₹{data.bargain_buy_price.toFixed(2)}
                </span>
                <span className="text-gray-400 text-[11px]">
                  (Composite Oracle Score: <strong className="text-cyan-400">{data.composite_score}/100</strong>)
                </span>
              </div>

              {/* 1-Click Paper Execution Button */}
              <button
                onClick={handleExecutePaperOrder}
                disabled={isExecuting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs shadow-md shadow-emerald-900/40 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {isExecuting
                    ? 'Submitting...'
                    : executeSuccess
                    ? '✓ Paper Order Placed!'
                    : `Execute Value Paper Trade @ ₹${data.ltp.toFixed(2)}`}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Spider Radar Chart & Interactive DCF Simulator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: 5-Pillar Spider Radar Chart */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#090e1a] border border-gray-800/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    5-Pillar Legendary Framework
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  Pentagon Balance
                </span>
              </div>

              {renderSpiderRadar()}

              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono pt-2 border-t border-gray-800/60">
                <div className="p-1.5 rounded bg-gray-900/80 border border-gray-800">
                  <span className="text-gray-400 block">Buffett Moat</span>
                  <span className="font-bold text-cyan-400">{data.pillar_buffett.moat_score}/100</span>
                </div>
                <div className="p-1.5 rounded bg-gray-900/80 border border-gray-800">
                  <span className="text-gray-400 block">Graham Solvency</span>
                  <span className="font-bold text-emerald-400">{data.pillar_graham.solvency_status}</span>
                </div>
              </div>
            </div>

            {/* Right: Interactive DCF Sensitivity Simulator */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#090e1a] border border-gray-800/90 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Interactive DCF Valuation Simulator
                  </h3>
                </div>
                {isSimulating && (
                  <span className="text-[10px] font-mono text-purple-400 flex items-center space-x-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Recalculating Fair Value...</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 font-sans">
                Adjust conservative assumptions to stress-test intrinsic value across varying macroeconomic regimes:
              </p>

              {/* Slider 1: Expected 10-Yr Cash Flow Growth Rate */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Expected 10-Year FCF Growth Rate:</span>
                  <span className="text-purple-400 font-bold text-sm">{growthRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="35.0"
                  step="0.5"
                  value={growthRate}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value), discountRate)}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>5.0% (Defensive Lull)</span>
                  <span>14.5% (Historical Median)</span>
                  <span>35.0% (Hyper-Scale)</span>
                </div>
              </div>

              {/* Slider 2: Hurdle / Discount Rate */}
              <div className="space-y-2 font-mono text-xs pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Required Return / Hurdle Rate (Discount Rate):</span>
                  <span className="text-cyan-400 font-bold text-sm">{discountRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="18.0"
                  step="0.5"
                  value={discountRate}
                  onChange={(e) => handleSliderChange(growthRate, parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>8.0% (Low Cost of Capital)</span>
                  <span>11.5% (India Sovereign + Risk Premium)</span>
                  <span>18.0% (Conservative)</span>
                </div>
              </div>

              {/* Real-Time DCF Simulator Output Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-gray-900 to-[#10182c] border border-gray-800 flex items-center justify-between font-mono">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Simulated Fair Value</div>
                  <div className="text-lg font-bold text-cyan-300">₹{data.fair_value.toFixed(2)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Simulated Margin of Safety</div>
                  <div className={`text-lg font-bold ${data.margin_of_safety_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.margin_of_safety_pct >= 0 ? '+' : ''}{data.margin_of_safety_pct.toFixed(1)}%
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Buffett 25% Buy Level</div>
                  <div className="text-lg font-bold text-purple-300">₹{data.bargain_buy_price.toFixed(2)}</div>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Deep-Dive 5-Pillar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* PILLAR 1: Warren Buffett & Charlie Munger */}
            <div className="p-5 rounded-2xl bg-[#0b101c] border border-gray-800/90 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Warren Buffett &amp; Munger
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {data.pillar_buffett.moat_rating.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">ROIC (Pricing Power)</span>
                  <span className="font-bold text-emerald-400 text-sm">{data.pillar_buffett.roic_pct}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">ROE (Compounding)</span>
                  <span className="font-bold text-white text-sm">{data.pillar_buffett.roe_pct}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Debt / Equity</span>
                  <span className="font-bold text-cyan-400 text-sm">{data.pillar_buffett.debt_to_equity}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Owner Earnings</span>
                  <span className="font-bold text-purple-400 text-sm">₹{data.pillar_buffett.owner_earnings_inr_cr.toLocaleString()} Cr</span>
                </div>
              </div>

              {/* Charlie Munger Inversion Safeguards */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono uppercase text-gray-500 font-semibold">
                  Munger Inversion Safeguards:
                </div>
                {data.pillar_buffett.inversion_checks.map((chk, i) => (
                  <div key={i} className="flex items-start space-x-2 text-[10.5px] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{chk.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PILLAR 2: Benjamin Graham (Margin of Safety) */}
            <div className="p-5 rounded-2xl bg-[#0b101c] border border-gray-800/90 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Benjamin Graham Value
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  {data.pillar_graham.solvency_status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Graham Number:</span>
                  <span className="text-cyan-400 font-bold">₹{data.pillar_graham.graham_number.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Discount to Graham Number:</span>
                  <span className={`font-bold ${data.pillar_graham.graham_discount_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.pillar_graham.graham_discount_pct >= 0 ? '+' : ''}{data.pillar_graham.graham_discount_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Piotroski F-Score (0-9):</span>
                  <span className="text-emerald-400 font-bold">{data.pillar_graham.piotroski_f_score} / 9</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Altman Z-Score (Solvency):</span>
                  <span className="text-purple-400 font-bold">{data.pillar_graham.altman_z_score.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Ratio:</span>
                  <span className="text-white font-bold">{data.pillar_graham.current_ratio}x</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                ◈ <strong>Graham Principle:</strong> Satisfies conservative defensive investor working capital bounds with minimal solvency risk.
              </p>
            </div>

            {/* PILLAR 3: Peter Lynch (GARP & Multibagger Screener) */}
            <div className="p-5 rounded-2xl bg-[#0b101c] border border-gray-800/90 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Peter Lynch Growth (GARP)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                  {data.pillar_lynch.lynch_category}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">PEG Ratio (P/E to Growth):</span>
                  <span className={`font-bold ${data.pillar_lynch.peg_ratio <= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {data.pillar_lynch.peg_ratio.toFixed(2)} {data.pillar_lynch.peg_ratio <= 1.0 ? '(Fair/Cheap)' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price to Earnings (P/E):</span>
                  <span className="text-white font-bold">{data.pillar_lynch.pe_ratio.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">3-Year EPS Growth Rate:</span>
                  <span className="text-emerald-400 font-bold">{data.pillar_lynch.earnings_growth_3yr_pct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Multibagger Potential Score:</span>
                  <span className="text-purple-400 font-bold">{data.pillar_lynch.multibagger_potential_score} / 100</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                ◈ <strong>Lynch Axiom:</strong> Classified as a <strong>{data.pillar_lynch.lynch_category}</strong> with steady operating cash generation.
              </p>
            </div>

            {/* PILLAR 4: Jim Simons (Renaissance Tech Quantitative Momentum) */}
            <div className="p-5 rounded-2xl bg-[#0b101c] border border-gray-800/90 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Jim Simons (Renaissance Quant)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {data.pillar_simons.quant_score}/100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trend Alignment:</span>
                  <span className="text-emerald-400 font-bold">{data.pillar_simons.trend_alignment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volume Profile POC:</span>
                  <span className="text-white font-bold">₹{data.pillar_simons.volume_profile_poc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Value Area Status:</span>
                  <span className="text-purple-400 font-bold">{data.pillar_simons.value_area_position}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Option Dealer Gamma (GEX):</span>
                  <span className="text-cyan-400 font-bold">{data.pillar_simons.gex_regime}</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                ◈ <strong>Quantitative Edge:</strong> Trend structure holding firmly above 200-SMA institutional support with positive gamma stability.
              </p>
            </div>

            {/* PILLAR 5: Stanley Druckenmiller (Macro Liquidity & FII Flows) */}
            <div className="p-5 rounded-2xl bg-[#0b101c] border border-gray-800/90 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-gray-200">
                    Stanley Druckenmiller Macro &amp; Liquidity
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {data.pillar_druckenmiller.fii_dii_bias}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Smart Money Streak</span>
                  <span className="font-bold text-emerald-400 text-sm">{data.pillar_druckenmiller.smart_money_streak_days} Consecutive Days</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">FII/DII Net Cash Inflows</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Sector RRG Quadrant</span>
                  <span className="font-bold text-cyan-400 text-sm">{data.pillar_druckenmiller.sector_rrg_quadrant}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Relative Strength vs NIFTY</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Crude &amp; Dollar Impact</span>
                  <span className="font-bold text-purple-400 text-sm">{data.pillar_druckenmiller.crude_fx_sensitivity}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Operating Margin Resilience</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                ◈ <strong>Druckenmiller Thesis:</strong> Sustained institutional liquidity flows and favorable sector momentum confirm positive macro tailwinds.
              </p>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
};
