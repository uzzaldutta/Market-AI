'use client';

import React, { useState } from 'react';
import { placePaperOrder } from '../../lib/api';
import {
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface Props {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  strikePrice: number;
  optionType: 'CE' | 'PE';
  expiryDate: string;
  premium: number;
  lotSize: number;
  underlyingPrice: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    iv: number;
  };
  initialSide?: 'BUY' | 'SELL';
  onClose: () => void;
  onOrderSuccess?: () => void;
  onNavigateToPaperTrading?: () => void;
}

export const OptionOrderModal: React.FC<Props> = ({
  symbol,
  exchange,
  strikePrice,
  optionType,
  expiryDate,
  premium,
  lotSize,
  underlyingPrice,
  greeks,
  initialSide = 'BUY',
  onClose,
  onOrderSuccess,
  onNavigateToPaperTrading
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>(initialSide);
  const [lots, setLots] = useState<number>(1);
  const [productType, setProductType] = useState<'NRML' | 'MIS'>('NRML');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(premium);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalQuantity = lots * lotSize;
  const execPrice = orderType === 'MARKET' ? premium : limitPrice;

  // Margin calculation
  // For BUY: Premium * Total Qty + Brokerage
  // For SELL (Option Writing): 20% of Underlying Notional + Brokerage
  const charges = 25.0; // ₹20 brokerage + ₹5 STT & SEBI
  const premiumRequired = totalQuantity * execPrice;
  const writingMarginRequired = totalQuantity * underlyingPrice * 0.20;
  const totalFundsRequired = (side === 'BUY' ? premiumRequired : writingMarginRequired) + charges;

  // Breakeven price at expiry
  const breakevenPrice =
    optionType === 'CE'
      ? strikePrice + execPrice
      : strikePrice - execPrice;

  const handleExecute = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const orderPayload = {
        symbol: symbol.toUpperCase(),
        side: side,
        order_type: orderType,
        product_type: productType,
        instrument_type: 'OPTIONS',
        strike_price: strikePrice,
        option_type: optionType,
        expiry_date: expiryDate,
        lot_size: lotSize,
        quantity: lots, // number of lots
        price: execPrice,
        trigger_price: stopLoss ? parseFloat(stopLoss) : undefined
      };

      const res = await placePaperOrder(orderPayload);
      setOrderResult(res);
      onOrderSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place paper options order');
    } finally {
      setLoading(false);
    }
  };

  const contractDisplay = `${symbol} ${strikePrice.toFixed(0)} ${optionType} (${expiryDate})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#070b16] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono tracking-wider border ${
                exchange === 'BSE'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}
            >
              {exchange} F&O
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight">
                {contractDisplay}
              </h3>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <span>Spot: ₹{underlyingPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                <span>•</span>
                <span>Expiry: {expiryDate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {orderResult ? (
          /* Success Receipt */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Paper Options Order Executed</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Order ID: <span className="text-cyan-400">{orderResult.order_id}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Contract:</span>
                <span className="text-white font-bold">{contractDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Side & Lots:</span>
                <span className={side === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {side} {lots} Lots ({totalQuantity} Qty)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Premium:</span>
                <span className="text-white font-bold">₹{execPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Funds Deployed:</span>
                <span className="text-white font-bold">₹{totalFundsRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Done
              </button>
              {onNavigateToPaperTrading && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToPaperTrading();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow"
                >
                  <span>📋 View in Paper Portfolio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Order Placement Desk */
          <div className="p-4 sm:p-5 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Buy / Sell Action Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setSide('BUY')}
                className={`py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                  side === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>BUY (Long {optionType})</span>
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                  side === 'SELL'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>SELL (Write {optionType})</span>
              </button>
            </div>

            {/* 2. Order Configuration Matrix */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Product Type (NRML vs MIS) */}
              <div>
                <label className="text-slate-400 text-[10px] uppercase block mb-1">Product Type</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setProductType('NRML')}
                    className={`py-1 rounded text-center transition ${
                      productType === 'NRML' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    NRML (Overnight)
                  </button>
                  <button
                    onClick={() => setProductType('MIS')}
                    className={`py-1 rounded text-center transition ${
                      productType === 'MIS' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    MIS (Intraday)
                  </button>
                </div>
              </div>

              {/* Order Type (MARKET vs LIMIT) */}
              <div>
                <label className="text-slate-400 text-[10px] uppercase block mb-1">Order Type</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setOrderType('MARKET')}
                    className={`py-1 rounded text-center transition ${
                      orderType === 'MARKET' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    MARKET
                  </button>
                  <button
                    onClick={() => setOrderType('LIMIT')}
                    className={`py-1 rounded text-center transition ${
                      orderType === 'LIMIT' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    LIMIT
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Lots Sizer & Premium Price Input */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Lots Input with +/- */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                  <span>LOTS</span>
                  <span className="text-cyan-400">1 Lot = {lotSize} Qty</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setLots((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={lots}
                    onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent text-center font-bold text-white text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => setLots((prev) => Math.min(100, prev + 1))}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block text-center mt-1">
                  Total Units: {totalQuantity}
                </span>
              </div>

              {/* Premium Price Input */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                  <span>PREMIUM PRICE</span>
                  <span className="text-emerald-400">LTP: ₹{premium.toFixed(2)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-500 mr-1 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.05"
                    disabled={orderType === 'MARKET'}
                    value={orderType === 'MARKET' ? premium.toFixed(2) : limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-bold text-white text-sm focus:outline-none disabled:opacity-75"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {orderType === 'MARKET' ? 'Executed at Market LTP' : 'Custom Limit Price'}
                </span>
              </div>
            </div>

            {/* 4. Real-time Greeks Radar for this Leg */}
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                Black-Scholes Contract Greeks
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">DELTA (Δ)</span>
                  <span className={`font-bold ${greeks.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {greeks.delta.toFixed(2)}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">GAMMA (Γ)</span>
                  <span className="font-bold text-cyan-400">{greeks.gamma.toFixed(4)}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">THETA (Θ)</span>
                  <span className="font-bold text-rose-400">{greeks.theta.toFixed(1)}/d</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">IV (%)</span>
                  <span className="font-bold text-amber-400">{greeks.iv.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 5. Margin & Capital Requirement Summary */}
            <div className="p-3 rounded-xl bg-[#050811] border border-cyan-500/20 text-xs font-mono space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">
                  {side === 'BUY' ? 'Total Premium Payable:' : 'SPAN + Exposure Margin:'}
                </span>
                <span className="text-sm font-black text-white">
                  ₹{totalFundsRequired.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Contract Breakeven at Expiry:</span>
                <span className="text-amber-400 font-bold">₹{breakevenPrice.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Statutory Brokerage & STT:</span>
                <span>₹{charges.toFixed(2)}</span>
              </div>
            </div>

            {/* 6. Execution Button */}
            <button
              onClick={handleExecute}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              } disabled:opacity-50`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {loading
                  ? 'Submitting Paper Order...'
                  : `Execute Paper ${side} Order (${lots} Lots)`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
