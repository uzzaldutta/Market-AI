'use client';

import React, { useState, useEffect } from 'react';
import { fetchOptionChain, fetchStrategyPayoff, fetchGEXProfile } from '../lib/api';
import { OptionChainData, StrategyPayoffData } from '../types/market';
import { PriceFlash } from './common/PriceFlash';
import { OptionOrderModal } from './common/OptionOrderModal';
import {
  Layers,
  Zap,
  Calculator,
  AlertTriangle,
  ArrowRight,
  Activity,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Sliders,
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface Props {
  symbol: string;
  onNavigateToPaperTrading?: () => void;
}

export const OptionsAnalyticsView: React.FC<Props> = ({ symbol, onNavigateToPaperTrading }) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(symbol || 'NIFTY50');
  const [chain, setChain] = useState<OptionChainData | null>(null);
  const [gex, setGex] = useState<any | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('BULL_CALL_SPREAD');
  const [payoff, setPayoff] = useState<StrategyPayoffData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Paper Options Order Modal State
  const [orderModalData, setOrderModalData] = useState<{
    strike: number;
    optionType: 'CE' | 'PE';
    premium: number;
    side: 'BUY' | 'SELL';
    greeks: { delta: number; gamma: number; theta: number; vega: number; iv: number };
  } | null>(null);

  // Sync activeSymbol if parent passes new symbol
  useEffect(() => {
    if (symbol) {
      setActiveSymbol(symbol);
    }
  }, [symbol]);

  const isBSE = activeSymbol.includes('SENSEX') || activeSymbol.includes('BANKEX');

  useEffect(() => {
    let isMounted = true;
    async function loadChainAndGex() {
      try {
        const [chainRes, gexRes] = await Promise.all([
          fetchOptionChain(activeSymbol, selectedExpiry || undefined),
          fetchGEXProfile(activeSymbol, selectedExpiry || undefined).catch(() => null)
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
    // 4-second polling for live option ticks
    const timer = setInterval(loadChainAndGex, 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeSymbol, selectedExpiry]);

  useEffect(() => {
    if (!chain) return;
    const spot = chain.underlying_price;
    const step = isBSE ? 100 : activeSymbol.includes('NIFTY') ? 50 : 20;

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
  }, [chain, strategy, activeSymbol, isBSE]);

  const handleOpenOrder = (
    strike: number,
    optionType: 'CE' | 'PE',
    premium: number,
    side: 'BUY' | 'SELL',
    greeks: { delta: number; gamma: number; theta: number; vega: number; iv: number }
  ) => {
    setOrderModalData({
      strike,
      optionType,
      premium,
      side,
      greeks
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Master F&O Exchange & Asset Selector Bar (NSE vs BSE) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#070b16] rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] text-blue-400 font-extrabold uppercase mr-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            NSE F&O:
          </span>
          {[
            { id: 'NIFTY50', label: 'NIFTY 50 (Thurs)' },
            { id: 'BANKNIFTY', label: 'BANK NIFTY (Thurs)' },
            { id: 'FINNIFTY', label: 'FINNIFTY (Tues)' },
            { id: 'MIDCPNIFTY', label: 'MIDCP NIFTY (Mon)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSymbol(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSymbol === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          <span className="text-slate-700 mx-1.5">|</span>

          <span className="text-[10px] text-amber-400 font-extrabold uppercase mr-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            BSE F&O:
          </span>
          {[
            { id: 'SENSEX', label: 'SENSEX (Friday Expiry)' },
            { id: 'BANKEX', label: 'BANKEX (Monday Expiry)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSymbol(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSymbol === item.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          <span className="text-slate-700 mx-1.5">|</span>

          <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-1">
            Top Equities:
          </span>
          {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS'].map((sym) => (
            <button
              key={sym}
              onClick={() => setActiveSymbol(sym)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSymbol === sym
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Paper Portfolio Shortcut */}
        {onNavigateToPaperTrading && (
          <button
            onClick={onNavigateToPaperTrading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ml-auto"
          >
            <span>📋 View in Paper Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Header F&O Metrics Bar */}
      <div className="p-5 rounded-2xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-gray-400 mb-1 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                isBSE
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}
            >
              {isBSE ? 'BSE DERIVATIVES' : 'NSE DERIVATIVES'}
            </span>
            <span>{activeSymbol} OPTIONS INTELLIGENCE &amp; PAPER TRADING</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-gray-400 font-mono text-xs">{activeSymbol} Spot:</span>
            <PriceFlash
              value={chain?.underlying_price || 0}
              flashMode="badge"
              badgeClassName="text-xl sm:text-2xl font-bold font-mono"
              enableLiveSimulation={true}
            />
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
              Lot Size: {chain?.lot_size || (isBSE ? 10 : 50)}
            </span>
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
                <option key={exp} value={exp}>
                  {exp} {isBSE ? '(BSE)' : '(NSE)'}
                </option>
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

      {/* 3. Dealer Gamma Exposure (GEX) */}
      {gex && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-terminal-surface to-blue-950/30 border border-purple-500/30 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-terminal-border/60">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="uppercase tracking-wider">OPTION DEALER GAMMA EXPOSURE (GEX)</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                Market Maker Net Gamma:
                <span className={`font-mono ${gex.total_net_gex_cr >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {gex.total_net_gex_cr >= 0 ? '+' : ''}{gex.total_net_gex_cr.toFixed(1)} Cr ₹
                </span>
                <span
                  className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                    gex.regime === 'LONG_GAMMA'
                      ? 'bg-emerald-500/10 text-terminal-green border-emerald-500/30'
                      : gex.regime === 'SHORT_GAMMA'
                      ? 'bg-rose-500/10 text-terminal-red border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {gex.regime.replace(/_/g, ' ')}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl font-sans">{gex.regime_description}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block uppercase">ZERO GAMMA FLIP</span>
                <span className="font-bold text-amber-400 text-sm">₹{gex.gamma_flip_level.toFixed(0)}</span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80">
                <span className="text-[10px] text-gray-500 block uppercase">MAJOR CALL WALL</span>
                <span className="font-bold text-rose-400 text-sm">₹{gex.major_call_wall.toFixed(0)}</span>
              </div>

              <div className="bg-terminal-dark/90 p-2.5 rounded-xl border border-terminal-border/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-500 block uppercase">MAJOR PUT WALL</span>
                <span className="font-bold text-emerald-400 text-sm">₹{gex.major_put_wall.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Option Chain Matrix with Direct 1-Click Buy / Sell Paper Trading Actions */}
      <div className="rounded-2xl bg-terminal-surface border border-terminal-border overflow-hidden shadow-xl">
        {/* Banner with 1-Click Instructions */}
        <div className="p-3 bg-terminal-dark border-b border-terminal-border flex flex-wrap justify-between items-center text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold uppercase tracking-wider">CALLS (CE)</span>
            <span className="text-[10px] text-gray-500">|</span>
            <span className="text-gray-300 font-bold uppercase tracking-wider">STRIKE</span>
            <span className="text-[10px] text-gray-500">|</span>
            <span className="text-rose-400 font-bold uppercase tracking-wider">PUTS (PE)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-500/30 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span className="text-slate-300 font-bold">1-Click Paper Trade:</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/40">
              B = BUY
            </span>
            <span className="text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40">
              S = SELL
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-dark/60 text-gray-400 text-[11px]">
                {/* Call Columns */}
                <th className="py-2.5 px-2">Delta (Δ)</th>
                <th className="py-2.5 px-2">IV (%)</th>
                <th className="py-2.5 px-2">OI (Lots)</th>
                <th className="py-2.5 px-3 font-bold text-emerald-400 text-right">Call Actions &amp; LTP</th>

                {/* Center Strike Column */}
                <th className="py-2.5 px-4 bg-terminal-dark text-white font-bold">Strike</th>

                {/* Put Columns */}
                <th className="py-2.5 px-3 font-bold text-rose-400 text-left">Put LTP &amp; Actions</th>
                <th className="py-2.5 px-2">OI (Lots)</th>
                <th className="py-2.5 px-2">IV (%)</th>
                <th className="py-2.5 px-2">Delta (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40">
              {chain?.strikes.map((s) => {
                const isAtm = Math.abs(s.strike_price - (chain?.underlying_price || 0)) < (isBSE ? 60 : 30);
                return (
                  <tr
                    key={s.strike_price}
                    className={`hover:bg-slate-800/60 transition-colors ${
                      isAtm ? 'bg-blue-500/10 font-semibold' : ''
                    }`}
                  >
                    {/* Call Delta, IV, OI */}
                    <td className="py-2 px-2 text-gray-400">{s.call_delta.toFixed(2)}</td>
                    <td className="py-2 px-2 text-gray-400">{s.call_iv.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-gray-300">{(s.call_oi / 1000).toFixed(0)}k</td>

                    {/* Call Action Buttons (BUY & SELL) + Call LTP */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* 1-Click BUY Call Button */}
                        <button
                          onClick={() =>
                            handleOpenOrder(s.strike_price, 'CE', s.call_ltp, 'BUY', {
                              delta: s.call_delta,
                              gamma: s.call_gamma,
                              theta: s.call_theta,
                              vega: s.call_vega,
                              iv: s.call_iv
                            })
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/40 transition shadow-sm"
                          title={`Paper Trade: BUY ${activeSymbol} ${s.strike_price} CE`}
                        >
                          B
                        </button>

                        {/* 1-Click SELL/WRITE Call Button */}
                        <button
                          onClick={() =>
                            handleOpenOrder(s.strike_price, 'CE', s.call_ltp, 'SELL', {
                              delta: s.call_delta,
                              gamma: s.call_gamma,
                              theta: s.call_theta,
                              vega: s.call_vega,
                              iv: s.call_iv
                            })
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 transition shadow-sm"
                          title={`Paper Trade: SELL/WRITE ${activeSymbol} ${s.strike_price} CE`}
                        >
                          S
                        </button>

                        {/* Live Price Flash */}
                        <PriceFlash
                          value={s.call_ltp}
                          flashMode="cell"
                          className="text-terminal-green font-bold text-xs tabular-nums ml-1"
                          enableLiveSimulation={true}
                        />
                      </div>
                    </td>

                    {/* Strike Price */}
                    <td
                      className={`py-2 px-4 font-bold ${
                        isAtm ? 'bg-blue-600 text-white' : 'bg-terminal-dark text-white'
                      }`}
                    >
                      {s.strike_price.toFixed(0)}
                      {isAtm && <span className="block text-[8px] font-mono tracking-tighter">ATM</span>}
                    </td>

                    {/* Put LTP + Put Action Buttons (BUY & SELL) */}
                    <td className="py-2 px-3 text-left">
                      <div className="flex items-center justify-start space-x-1.5">
                        {/* Live Price Flash */}
                        <PriceFlash
                          value={s.put_ltp}
                          flashMode="cell"
                          className="text-terminal-red font-bold text-xs tabular-nums mr-1"
                          enableLiveSimulation={true}
                        />

                        {/* 1-Click BUY Put Button */}
                        <button
                          onClick={() =>
                            handleOpenOrder(s.strike_price, 'PE', s.put_ltp, 'BUY', {
                              delta: s.put_delta,
                              gamma: s.put_gamma,
                              theta: s.put_theta,
                              vega: s.put_vega,
                              iv: s.put_iv
                            })
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/40 transition shadow-sm"
                          title={`Paper Trade: BUY ${activeSymbol} ${s.strike_price} PE`}
                        >
                          B
                        </button>

                        {/* 1-Click SELL/WRITE Put Button */}
                        <button
                          onClick={() =>
                            handleOpenOrder(s.strike_price, 'PE', s.put_ltp, 'SELL', {
                              delta: s.put_delta,
                              gamma: s.put_gamma,
                              theta: s.put_theta,
                              vega: s.put_vega,
                              iv: s.put_iv
                            })
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 transition shadow-sm"
                          title={`Paper Trade: SELL/WRITE ${activeSymbol} ${s.strike_price} PE`}
                        >
                          S
                        </button>
                      </div>
                    </td>

                    {/* Put OI, IV, Delta */}
                    <td className="py-2 px-2 text-gray-300">{(s.put_oi / 1000).toFixed(0)}k</td>
                    <td className="py-2 px-2 text-gray-400">{s.put_iv.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-gray-400">{s.put_delta.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Strategy Payoff Simulator */}
      <div className="p-5 rounded-2xl bg-terminal-surface border border-terminal-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300">
              Strategy Payoff &amp; Breakeven Simulator ({isBSE ? 'BSE F&O' : 'NSE F&O'})
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <span className="text-gray-500">EST. BROKERAGE &amp; STT</span>
              <div className="text-sm font-bold text-amber-400 mt-1">₹{payoff.estimated_charges.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Quick Paper Option Order Modal */}
      {orderModalData && chain && (
        <OptionOrderModal
          symbol={activeSymbol}
          exchange={isBSE ? 'BSE' : 'NSE'}
          strikePrice={orderModalData.strike}
          optionType={orderModalData.optionType}
          expiryDate={selectedExpiry}
          premium={orderModalData.premium}
          lotSize={chain.lot_size}
          underlyingPrice={chain.underlying_price}
          greeks={orderModalData.greeks}
          initialSide={orderModalData.side}
          onClose={() => setOrderModalData(null)}
          onNavigateToPaperTrading={onNavigateToPaperTrading}
        />
      )}
    </div>
  );
};
