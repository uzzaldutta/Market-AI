'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaperAccount, placePaperOrder, fetchQuote, resetPaperAccount } from '../lib/api';
import { PaperAccount, PaperPosition, PaperOrder } from '../types/market';
import { useFavourites } from '../context/FavouritesContext';
import { PriceFlash } from './common/PriceFlash';
import { 
  Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  Send, RefreshCw, Star, Layers, Activity, History, CheckCircle2, XCircle
} from 'lucide-react';

type InstrumentCategory = 'EQUITY' | 'FUTURES' | 'OPTIONS';

const COMMON_EXPIRIES = ['29-OCT-2026', '26-NOV-2026', '31-DEC-2026'];

const LOT_SIZES: Record<string, number> = {
  'NIFTY50': 50,
  'BANKNIFTY': 15,
  'FINNIFTY': 40,
  'MIDCPNIFTY': 75,
  'RELIANCE': 250,
  'TCS': 175,
  'HDFCBANK': 550,
  'ICICIBANK': 700,
  'INFY': 400,
  'SBIN': 1500,
  'TATAMOTORS': 1425,
  'BHARTIARTL': 950,
  'ITC': 1600,
  'LT': 300
};

export const PaperTradingView: React.FC = () => {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [category, setCategory] = useState<InstrumentCategory>('EQUITY');
  const [symbol, setSymbol] = useState<string>('RELIANCE');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<string>('MARKET');
  const [productType, setProductType] = useState<string>('CNC');
  const [lots, setLots] = useState<number>(1);
  const [equityQty, setEquityQty] = useState<number>(10);
  
  // Derivatives specific state
  const [strikePrice, setStrikePrice] = useState<number>(3000);
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [expiryDate, setExpiryDate] = useState<string>('29-OCT-2026');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  
  const [livePrice, setLivePrice] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  
  const { favourites, isFavourite, toggle } = useFavourites();

  const loadAccount = async () => {
    try {
      const acc = await fetchPaperAccount();
      setAccount(acc);
    } catch (e) {
      console.error('Error fetching paper account:', e);
    }
  };

  useEffect(() => {
    loadAccount();
    const interval = setInterval(loadAccount, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update underlying spot and auto-populate ATM strike
  useEffect(() => {
    fetchQuote(symbol)
      .then(q => {
        setLivePrice(q.ltp);
        // Round strike to nearest 50 for NIFTY, 100 for BANKNIFTY, 20 for stocks
        const step = symbol.includes('NIFTY') ? 50 : 20;
        const atm = Math.round(q.ltp / step) * step;
        setStrikePrice(atm);
      })
      .catch(() => {});
  }, [symbol]);

  const lotSize = category === 'EQUITY' ? 1 : (LOT_SIZES[symbol] || 250);
  const totalUnits = category === 'EQUITY' ? equityQty : (lots * lotSize);

  // Approximate premium estimate for options
  const estimatedOptionPremium = (() => {
    if (customPrice && typeof customPrice === 'number') return customPrice;
    const diff = optionType === 'CE' ? (livePrice - strikePrice) : (strikePrice - livePrice);
    const intrinsic = Math.max(0, diff);
    const timeValue = Math.max(15, livePrice * 0.02);
    return Math.round((intrinsic + timeValue) * 10) / 10;
  })();

  const estimatedOrderValue = (() => {
    if (category === 'EQUITY') {
      return totalUnits * (customPrice && typeof customPrice === 'number' ? customPrice : livePrice);
    }
    if (category === 'OPTIONS') {
      return totalUnits * estimatedOptionPremium;
    }
    // Futures notional
    return totalUnits * livePrice;
  })();

  const estimatedMargin = (() => {
    if (category === 'EQUITY') return estimatedOrderValue;
    if (category === 'OPTIONS') {
      return side === 'BUY' ? estimatedOrderValue : (totalUnits * livePrice * 0.20);
    }
    // Futures margin ~20%
    return estimatedOrderValue * 0.20;
  })();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload: any = {
      symbol,
      side,
      order_type: orderType,
      quantity: category === 'EQUITY' ? equityQty : lots,
      product_type: category === 'EQUITY' ? productType : 'NRML',
      instrument_type: category,
      lot_size: lotSize,
      client_order_id: `WEB-${category}-${Date.now()}`
    };

    if (category === 'OPTIONS') {
      payload.strike_price = strikePrice;
      payload.option_type = optionType;
      payload.expiry_date = expiryDate;
      if (customPrice && typeof customPrice === 'number') payload.price = customPrice;
    } else if (category === 'FUTURES') {
      payload.expiry_date = expiryDate;
      if (customPrice && typeof customPrice === 'number') payload.price = customPrice;
    } else if (orderType === 'LIMIT' && customPrice && typeof customPrice === 'number') {
      payload.price = customPrice;
    }

    try {
      const res = await placePaperOrder(payload);
      if (res.status === 'REJECTED') {
        setMessage({ text: `Order Rejected: ${res.rejection_reason}`, error: true });
      } else {
        setMessage({ 
          text: `Simulated order ${res.order_id} filled! ${res.side} ${res.quantity} ${category === 'EQUITY' ? 'shares' : 'lots'} @ ₹${res.price.toFixed(2)}` 
        });
        loadAccount();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Order execution failed', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSquareOff = async (pos: PaperPosition) => {
    setLoading(true);
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
        lot_size: pos.lot_size || 1,
        client_order_id: `SQ-OFF-${Date.now()}`
      });
      loadAccount();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAccount = async () => {
    if (!window.confirm('Are you sure you want to reset your virtual portfolio? All open positions and orders will be cleared, and capital will be reset to ₹10,00,000 INR.')) {
      return;
    }
    setResetting(true);
    try {
      const acc = await resetPaperAccount(1000000.0);
      setAccount(acc);
      setMessage({ text: 'Virtual portfolio successfully reset to ₹10,00,000 initial capital.' });
    } catch (e: any) {
      setMessage({ text: e.message || 'Reset failed', error: true });
    } finally {
      setResetting(false);
    }
  };

  if (!account) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
        Synchronizing Paper Trading Ledger & Virtual Positions...
      </div>
    );
  }

  const isPnlPositive = account.unrealized_pnl >= 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-terminal-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-terminal-green" /> Paper Trading Simulation Terminal
            </h1>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-semibold">
              NSE / BSE LIVE MTM
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Institutional virtual ledger for Equities, Futures & Options with SPAN margin checks, STT and brokerage simulation.
          </p>
        </div>

        <button
          onClick={handleResetAccount}
          disabled={resetting}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono transition-colors border border-gray-700 shadow-sm"
          title="Reset portfolio to ₹10,00,000 initial capital"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          Reset Portfolio
        </button>
      </div>

      {/* 2. Account Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono shadow-sm">
          <span className="text-gray-500 text-[10px] tracking-wider uppercase font-semibold">TOTAL PORTFOLIO EQUITY</span>
          <div className="text-lg md:text-xl font-bold text-white mt-1">₹{account.total_equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono shadow-sm">
          <span className="text-gray-500 text-[10px] tracking-wider uppercase font-semibold">AVAILABLE CASH BALANCE</span>
          <div className="text-lg md:text-xl font-bold text-terminal-green mt-1">₹{account.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono shadow-sm">
          <span className="text-gray-500 text-[10px] tracking-wider uppercase font-semibold">UNREALIZED MTM P&amp;L</span>
          <div className={`text-lg md:text-xl font-bold mt-1 ${isPnlPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {isPnlPositive ? '+' : ''}₹{account.unrealized_pnl.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border text-xs font-mono shadow-sm">
          <span className="text-gray-500 text-[10px] tracking-wider uppercase font-semibold">REALIZED P&amp;L (NET)</span>
          <div className={`text-lg md:text-xl font-bold mt-1 ${account.realized_pnl >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {account.realized_pnl >= 0 ? '+' : ''}₹{account.realized_pnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3. Order Entry & Risk Management Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border font-mono text-xs shadow-sm">
          {/* Instrument Category Selector */}
          <div className="flex rounded-lg bg-terminal-dark p-1 border border-terminal-border mb-4">
            <button
              type="button"
              onClick={() => setCategory('EQUITY')}
              className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded transition-colors ${
                category === 'EQUITY' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              EQUITY (CASH)
            </button>
            <button
              type="button"
              onClick={() => setCategory('FUTURES')}
              className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded transition-colors ${
                category === 'FUTURES' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              FUTURES (FUT)
            </button>
            <button
              type="button"
              onClick={() => setCategory('OPTIONS')}
              className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded transition-colors ${
                category === 'OPTIONS' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              OPTIONS (CE/PE)
            </button>
          </div>

          {/* Quick Select from Favourites */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1.5">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" /> Watchlist / Favourites
              </span>
              <button
                type="button"
                onClick={() => toggle(symbol)}
                className="text-[10px] text-gray-400 hover:text-white underline"
              >
                {isFavourite(symbol) ? 'Remove ⭐' : 'Add to ⭐'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {favourites.map((fav) => (
                <button
                  key={fav}
                  type="button"
                  onClick={() => setSymbol(fav)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    symbol === fav
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'bg-terminal-dark border border-terminal-border text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {fav}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Symbol & Live Spot */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400">UNDERLYING ASSET</label>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span>Spot:</span>
                  <PriceFlash
                    value={livePrice}
                    flashMode="badge"
                    badgeClassName="text-xs font-bold font-mono"
                    enableLiveSimulation={true}
                  />
                </div>
              </div>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NIFTY50, RELIANCE, TCS"
                className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-2 text-white font-bold focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            {/* Side Selector (BUY vs SELL) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded font-bold transition-colors text-xs ${
                  side === 'BUY' ? 'bg-terminal-green text-black shadow-sm shadow-terminal-green/20' : 'bg-terminal-dark border border-terminal-border text-gray-400'
                }`}
              >
                BUY {category === 'OPTIONS' ? '(LONG)' : ''}
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded font-bold transition-colors text-xs ${
                  side === 'SELL' ? 'bg-terminal-red text-white shadow-sm shadow-terminal-red/20' : 'bg-terminal-dark border border-terminal-border text-gray-400'
                }`}
              >
                SELL {category === 'OPTIONS' ? '(WRITE)' : ''}
              </button>
            </div>

            {/* OPTIONS SPECIFIC CONTROLS */}
            {category === 'OPTIONS' && (
              <div className="space-y-3 p-3 bg-terminal-dark rounded-lg border border-terminal-border">
                {/* Option Type CE / PE */}
                <div>
                  <label className="text-gray-400 block mb-1">OPTION TYPE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOptionType('CE')}
                      className={`py-1.5 rounded font-bold text-xs ${
                        optionType === 'CE' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      CALL (CE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionType('PE')}
                      className={`py-1.5 rounded font-bold text-xs ${
                        optionType === 'PE' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      PUT (PE)
                    </button>
                  </div>
                </div>

                {/* Strike Price & Expiry */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">STRIKE (₹)</label>
                    <input
                      type="number"
                      step="10"
                      value={strikePrice}
                      onChange={(e) => setStrikePrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-terminal-surface border border-terminal-border rounded p-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">EXPIRY</label>
                    <select
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-terminal-surface border border-terminal-border rounded p-1.5 text-white focus:outline-none text-[11px]"
                    >
                      {COMMON_EXPIRIES.map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1 border-t border-terminal-border/50">
                  <span>Contract Lot Size:</span>
                  <span className="text-amber-400 font-bold">{lotSize} units / lot</span>
                </div>
              </div>
            )}

            {/* FUTURES SPECIFIC CONTROLS */}
            {category === 'FUTURES' && (
              <div className="space-y-3 p-3 bg-terminal-dark rounded-lg border border-terminal-border">
                <div>
                  <label className="text-gray-400 block mb-1">CONTRACT EXPIRY</label>
                  <select
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-terminal-surface border border-terminal-border rounded p-1.5 text-white focus:outline-none text-[11px]"
                  >
                    {COMMON_EXPIRIES.map((exp) => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-400">
                  <span>Contract Lot Size:</span>
                  <span className="text-amber-400 font-bold">{lotSize} units / lot</span>
                </div>
              </div>
            )}

            {/* Quantity: Lots for F&O, Shares for Equity */}
            {category === 'EQUITY' ? (
              <div>
                <label className="text-gray-400 block mb-1">SHARES QUANTITY</label>
                <input
                  type="number"
                  min="1"
                  value={equityQty}
                  onChange={(e) => setEquityQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400">NUMBER OF LOTS</label>
                  <span className="text-gray-400 text-[10px]">Total: <strong className="text-white">{totalUnits} units</strong></span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            )}

            {/* Order Type & Custom Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 block mb-1">ORDER TYPE</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-terminal-dark border border-terminal-border rounded p-2 text-white focus:outline-none text-[11px]"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </div>

              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-gray-400 block mb-1">LIMIT PRICE (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || '')}
                    placeholder="Enter limit price"
                    className="w-full bg-terminal-dark border border-terminal-border rounded p-2 text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Value & Margin Summary Box */}
            <div className="p-3 bg-terminal-dark rounded-lg border border-terminal-border space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-400">
                <span>ESTIMATED VALUE:</span>
                <span className="text-white font-bold">₹{estimatedOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>MARGIN REQUIRED:</span>
                <span className="text-terminal-green font-bold">₹{estimatedMargin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>BROKERAGE &amp; STT:</span>
                <span className="text-amber-400 font-bold">₹25.00</span>
              </div>
            </div>

            {message && (
              <div className={`p-2.5 rounded text-[11px] font-mono ${message.error ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-bold transition-all shadow-md ${
                side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {loading ? 'Executing Ledger Order...' : `Simulate ${side} ${category} Order`}
            </button>
          </form>
        </div>

        {/* Positions & Orders History (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Positions Table */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border shadow-sm">
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Active Open Positions ({account.positions.length})
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Live Mark-to-Market Valuation</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-terminal-border text-gray-400">
                    <th className="pb-2">Contract / Asset</th>
                    <th className="pb-2 text-center">Type</th>
                    <th className="pb-2 text-right">Units</th>
                    <th className="pb-2 text-right">Avg Entry</th>
                    <th className="pb-2 text-right">LTP (₹)</th>
                    <th className="pb-2 text-right">Unrealized P&amp;L</th>
                    <th className="pb-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/50">
                  {account.positions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No open positions currently held in virtual ledger.
                      </td>
                    </tr>
                  ) : (
                    account.positions.map((pos, idx) => {
                      const isWin = pos.unrealized_pnl >= 0;
                      const instType = pos.instrument_type || 'EQUITY';
                      return (
                        <tr key={`${pos.symbol}-${idx}`} className="hover:bg-terminal-hover">
                          <td className="py-2.5 font-bold text-white">
                            <div>{pos.contract_display || pos.symbol}</div>
                            {pos.lot_size && pos.lot_size > 1 && (
                              <span className="text-[10px] text-gray-400 font-normal">Lot Size: {pos.lot_size}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              instType === 'OPTIONS' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              instType === 'FUTURES' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {instType}
                            </span>
                          </td>
                          <td className={`py-2.5 text-right font-bold ${pos.net_quantity > 0 ? 'text-white' : 'text-rose-400'}`}>
                            {pos.net_quantity > 0 ? `+${pos.net_quantity}` : pos.net_quantity}
                          </td>
                          <td className="py-2.5 text-right text-gray-400">₹{pos.average_buy_price.toFixed(2)}</td>
                          <td className="py-2.5 text-right">
                            <PriceFlash
                              value={pos.current_market_price}
                              flashMode="cell"
                              className="font-semibold text-gray-200"
                              enableLiveSimulation={true}
                            />
                          </td>
                          <td className="py-2.5 text-right">
                            <PriceFlash
                              value={pos.unrealized_pnl}
                              prefix={isWin ? '+₹' : '₹'}
                              flashMode="cell"
                              className={`font-bold ${isWin ? 'text-terminal-green' : 'text-terminal-red'}`}
                            />
                            <span className={`block text-[10px] ${isWin ? 'text-terminal-green' : 'text-terminal-red'}`}>
                              ({isWin ? '+' : ''}{pos.pnl_percentage.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => handleSquareOff(pos)}
                              className="px-2.5 py-1 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors font-bold"
                            >
                              Square Off
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders Execution Ledger */}
          <div className="p-5 rounded-xl bg-terminal-surface border border-terminal-border shadow-sm">
            <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-gray-300 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" /> Recent Execution Ledger ({account.recent_orders.length})
            </h2>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-terminal-border text-gray-400">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2 text-right">Units</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/50">
                  {account.recent_orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    account.recent_orders.map((o) => (
                      <tr key={o.order_id} className="hover:bg-terminal-hover">
                        <td className="py-2 text-gray-400">{o.order_id}</td>
                        <td className="py-2 font-bold text-white">{o.symbol}</td>
                        <td className="py-2 text-[10px] text-gray-400">{o.instrument_type || 'EQUITY'}</td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            o.side === 'BUY' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-terminal-red/20 text-terminal-red'
                          }`}>
                            {o.side}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">{o.quantity}</td>
                        <td className="py-2 text-right font-mono">₹{o.price ? o.price.toFixed(2) : '--'}</td>
                        <td className="py-2 text-center">
                          {o.status === 'FILLED' ? (
                            <span className="text-terminal-green text-[10px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Filled
                            </span>
                          ) : (
                            <span className="text-terminal-red text-[10px] flex items-center justify-center gap-1" title={o.rejection_reason || ''}>
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
