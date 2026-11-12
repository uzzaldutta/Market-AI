'use client';

import React, { useState, useEffect } from 'react';
import { fetchOptionChain, fetchStrategyPayoff, fetchGEXProfile } from '../lib/api';
import { OptionChainData, StrategyPayoffData } from '../types/market';
import { PriceFlash } from './common/PriceFlash';
import { Layers, Zap, Calculator, AlertTriangle, ArrowRight, Activity, ShieldAlert, Sparkles, TrendingUp, Sliders } from 'lucide-react';

interface Props {
  symbol: string;
}

export const OptionsAnalyticsView: React.FC<Props> = ({ symbol }) => {
  const [chain, setChain] = useState<OptionChainData | null>(null);
  const [gex, setGex] = useState<any | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('BULL_CALL_SPREAD');
  const [payoff, setPayoff] = useState<StrategyPayoffData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadChainAndGex() {
      try {
        const [chainRes, gexRes] = await Promise.all([
          fetchOptionChain(symbol, selectedExpiry || undefined),
          fetchGEXProfile(symbol, selectedExpiry || undefined).catch(() => null)
        ]);
        if (isMounted) {
          setChain(chainRes);
          if (gexRes) setGex(gexRes);
          if (!selectedExpiry && chainRes.expiry_dates?.length) {
            setSelectedExpiry(chainRes.selected_expiry);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadChainAndGex();
    // 8-second polling for live option ticks
    const timer = setInterval(loadChainAndGex, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [symbol, selectedExpiry]);

  useEffect(() => {
    if (!chain) return;
    const spot = chain.underlying_price;
    const step = symbol.includes('NIFTY') ? 50 : 20;

    let legs = [];
    if (strategy === 'BULL_CALL_SPREAD') {
      legs = [
        { type: 'CE', side: 'BUY', strike: spot, premium: 160.0, qty: 1 },
        { type: 'CE', side: 'SELL', strike: spot + (step * 4), premium: 45.0, qty: 1 }
      ];
    } else if (strategy === 'BEAR_PUT_SPREAD') {
      legs = [
        { type: 'PE', side: 'BUY', strike: spot, premium: 155.0, qty: 1 },
        { type: 'PE', side: 'SELL', strike: spot - (step * 4), premium: 42.0, qty: 1 }
      ];
    } else {
      // Long Straddle
      legs = [
        { type: 'CE', side: 'BUY', strike: spot, premium: 160.0, qty: 1 },
        { type: 'PE', side: 'BUY', strike: spot, premium: 155.0, qty: 1 }
      ];
    }

    fetchStrategyPayoff({
      spot,
      strategy_name: strategy.replace(/_/g, ' '),
      legs,
      lot_size: chain.lot_size
    }).then(setPayoff).catch(console.error);
  }, [chain, strategy]);

  if (loading && !chain) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Calculating Derivatives Chain, Black-Scholes Greeks and Implied Volatility...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header F&O Metrics Bar */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-gray-400 mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>FUTURES & OPTIONS DERIVATIVES INTELLIGENCE</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-gray-400 font-mono text-xs">{symbol} Spot:</span>
            <PriceFlash
              value={chain?.underlying_price || 0}
              flashMode="badge"
              badgeClassName="text-xl sm:text-2xl font-bold font-mono"
              enableLiveSimulation={true}
            />
            <span className="text-xs font-mono text-gray-400">Lot Size: {chain?.lot_size}</span>
          </div>
        </div>

        {/* Expiry Selector and Key Ratios */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-gray-400">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="bg-terminal-dark border border-terminal-border rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
            >
              {chain?.expiry_dates.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          <div className="bg-terminal-dark px-3 py-1.5 rounded border border-terminal-border text-xs font-mono">
            <span className="text-gray-500 mr-2">PCR:</span>
            <span className={`font-bold ${(chain?.pcr || 1) >= 1 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {chain?.pcr.toFixed(2)}
            </span>
          </div>

          <div className="bg-terminal-dark px-3 py-1.5 rounded border border-terminal-border text-xs font-mono">
            <span className="text-gray-500 mr-2">MAX PAIN:</span>
            <span className="font-bold text-amber-400">₹{chain?.max_pain.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 2. Institutional Dealer Gamma Exposure (GEX) & Volatility Inversion Monitor */}
      {gex && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-terminal-surface to-blue-950/30 border border-purple-500/30 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-terminal-border/60">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="uppercase tracking-wider">OPTION DEALER GAMMA EXPOSURE (GEX) &amp; VOLATILITY INVERSION</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                Market Maker Net Gamma:
                <span className={`font-mono ${gex.total_net_gex_cr >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {gex.total_net_gex_cr >= 0 ? '+' : ''}{gex.total_net_gex_cr.toFixed(1)} Cr ₹
                </span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                  gex.regime === 'LONG_GAMMA'
                    ? 'bg-emerald-500/10 text-terminal-green border-emerald-500/30'
                    : gex.regime === 'SHORT_GAMMA'
                    ? 'bg-rose-500/10 text-terminal-red border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {gex.regime.replace(/_/g, ' ')}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl font-sans">
                {gex.regime_description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block uppercase">ZERO GAMMA FLIP</span>
                <span className="font-bold text-amber-400 text-sm">₹{gex.gamma_flip_level.toFixed(0)}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  ({gex.distance_to_flip_pct >= 0 ? '+' : ''}{gex.distance_to_flip_pct}% away)
                </span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block uppercase">MAJOR CALL WALL</span>
                <span className="font-bold text-rose-400 text-sm">₹{gex.major_call_wall.toFixed(0)}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Top Resistance</span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-500 block uppercase">MAJOR PUT WALL</span>
                <span className="font-bold text-emerald-400 text-sm">₹{gex.major_put_wall.toFixed(0)}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Top Support Floor</span>
              </div>
            </div>
          </div>

          {/* GEX Strike Spectrum Bar */}
          <div className="pt-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1.5">
              <span>DEALER SHORT GAMMA ZONE (High Volatility)</span>
              <span className="text-amber-400 font-bold">FLIP LEVEL: ₹{gex.gamma_flip_level.toFixed(0)}</span>
              <span>DEALER LONG GAMMA ZONE (Damped Volatility)</span>
            </div>
            <div className="w-full h-3 bg-terminal-dark rounded-full overflow-hidden flex border border-terminal-border/80 relative">
              <div
                style={{ width: `${Math.max(15, Math.min(85, 50 - (gex.distance_to_flip_pct * 10)))}%` }}
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
              />
              <div className="w-1 h-full bg-white z-10 animate-pulse shadow-sm" />
              <div
                style={{ width: `${Math.max(15, Math.min(85, 50 + (gex.distance_to_flip_pct * 10)))}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Strategy Payoff Simulator */}
      <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300">
              Strategy Payoff & Breakeven Simulator (NSE F&O)
            </h2>
          </div>
          <div className="flex space-x-2">
            {[
              { id: 'BULL_CALL_SPREAD', label: 'Bull Call Spread' },
              { id: 'BEAR_PUT_SPREAD', label: 'Bear Put Spread' },
              { id: 'LONG_STRADDLE', label: 'Long Straddle' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  strategy === s.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {payoff && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border text-xs font-mono">
              <span className="text-gray-500">MAX PROFIT</span>
              <div className="text-sm font-bold text-terminal-green mt-1">₹{payoff.max_profit.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border text-xs font-mono">
              <span className="text-gray-500">MAX LOSS</span>
              <div className="text-sm font-bold text-terminal-red mt-1">₹{payoff.max_loss.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border text-xs font-mono">
              <span className="text-gray-500">BREAKEVEN POINT(S)</span>
              <div className="text-sm font-bold text-white mt-1">
                {payoff.breakeven_points.length ? payoff.breakeven_points.map(p => `₹${p}`).join(', ') : 'None'}
              </div>
            </div>
            <div className="bg-terminal-dark p-3 rounded-lg border border-terminal-border text-xs font-mono">
              <span className="text-gray-500">EST. BROKERAGE & STT</span>
              <div className="text-sm font-bold text-amber-400 mt-1">₹{payoff.estimated_charges.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Option Chain Matrix (Calls | Strike | Puts) */}
      <div className="rounded-xl bg-terminal-surface border border-terminal-border overflow-hidden">
        <div className="p-3 bg-terminal-dark border-b border-terminal-border flex flex-wrap justify-between items-center text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold uppercase tracking-wider">CALLS (CE)</span>
            <span className="text-[10px] text-gray-500">|</span>
            <span className="text-gray-300 font-bold uppercase tracking-wider">STRIKE</span>
            <span className="text-[10px] text-gray-500">|</span>
            <span className="text-rose-400 font-bold uppercase tracking-wider">PUTS (PE)</span>
          </div>

          <div className="flex items-center gap-2 bg-terminal-surface/80 px-2.5 py-1 rounded-full border border-terminal-border text-[10px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-300 font-mono">Real-Time Tick Flashing Active</span>
            <span className="text-emerald-400 font-bold">▲ Green (Uptick)</span>
            <span className="text-rose-400 font-bold">▼ Red (Downtick)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-dark/50 text-gray-500 text-[11px]">
                {/* Call Columns */}
                <th className="py-2 px-2">Delta</th>
                <th className="py-2 px-2">IV (%)</th>
                <th className="py-2 px-2">OI</th>
                <th className="py-2 px-2 font-bold text-gray-300">Call LTP</th>
                {/* Strike Column */}
                <th className="py-2 px-4 bg-terminal-dark text-white font-bold">Strike</th>
                {/* Put Columns */}
                <th className="py-2 px-2 font-bold text-gray-300">Put LTP</th>
                <th className="py-2 px-2">OI</th>
                <th className="py-2 px-2">IV (%)</th>
                <th className="py-2 px-2">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40">
              {chain?.strikes.map((s) => {
                const isAtm = Math.abs(s.strike_price - (chain?.underlying_price || 0)) < 30;
                return (
                  <tr
                    key={s.strike_price}
                    className={`hover:bg-terminal-hover transition-colors ${
                      isAtm ? 'bg-blue-500/10 font-semibold' : ''
                    }`}
                  >
                    {/* Call Data */}
                    <td className="py-2.5 px-2 text-gray-400">{s.call_delta.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-gray-400">{s.call_iv.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-gray-300">{(s.call_oi / 1000).toFixed(0)}k</td>
                    <td className="py-2.5 px-2">
                      <PriceFlash
                        value={s.call_ltp}
                        flashMode="cell"
                        className="text-terminal-green font-bold"
                        enableLiveSimulation={true}
                      />
                    </td>

                    {/* Strike */}
                    <td className={`py-2.5 px-4 font-bold ${isAtm ? 'bg-blue-600 text-white' : 'bg-terminal-dark text-white'}`}>
                      {s.strike_price.toFixed(0)}
                      {isAtm && <span className="block text-[9px] font-mono">ATM</span>}
                    </td>

                    {/* Put Data */}
                    <td className="py-2.5 px-2">
                      <PriceFlash
                        value={s.put_ltp}
                        flashMode="cell"
                        className="text-terminal-red font-bold"
                        enableLiveSimulation={true}
                      />
                    </td>
                    <td className="py-2.5 px-2 text-gray-300">{(s.put_oi / 1000).toFixed(0)}k</td>
                    <td className="py-2.5 px-2 text-gray-400">{s.put_iv.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-gray-400">{s.put_delta.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
