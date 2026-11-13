'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchGlobalIndexDetail, chatGlobalIndex } from '../../lib/api';
import { GlobalIndexDetail, Candle } from '../../types/market';
import { GlobalIndexChart } from './GlobalIndexChart';
import {
  X,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Activity,
  Send,
  Sparkles,
  Layers,
  ShieldAlert,
  Clock,
  Compass,
  Zap,
  Info
} from 'lucide-react';

interface Props {
  symbol: string | null;
  onClose: () => void;
  onSelectIndianStock?: (symbol: string) => void;
}

interface ChatMessage {
  sender: 'AI' | 'USER';
  text: string;
  time: string;
}

export const GlobalIndexModal: React.FC<Props> = ({
  symbol,
  onClose,
  onSelectIndianStock
}) => {
  const [detail, setDetail] = useState<GlobalIndexDetail | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '1Y'>('1D');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'LEVELS'>('CHAT');

  // Live Tick Flashing State
  const [flash, setFlash] = useState<'UP' | 'DOWN' | null>(null);
  const prevLtpRef = useRef<number | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load Global Index Detail
  useEffect(() => {
    if (!symbol) return;
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetchGlobalIndexDetail(symbol!, timeframe);
        if (!isMounted) return;

        // Detect price tick for green/red flash
        if (prevLtpRef.current !== null && prevLtpRef.current !== res.ltp) {
          setFlash(res.ltp > prevLtpRef.current ? 'UP' : 'DOWN');
          setTimeout(() => {
            if (isMounted) setFlash(null);
          }, 1200);
        }
        prevLtpRef.current = res.ltp;

        setDetail(res);
        setLoading(false);

        // Pre-populate chat if empty
        if (messages.length === 0 && res.institutional_briefing) {
          setMessages([
            {
              sender: 'AI',
              text: res.institutional_briefing,
              time: 'Just now'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to load global index detail:', err);
        setLoading(false);
      }
    }

    loadData();
    // 3.5s real-time tick poll
    const timer = setInterval(loadData, 3500);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [symbol, timeframe]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!symbol) return null;

  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { sender: 'USER', text: text.trim(), time: userTime };

    setMessages((prev) => [...prev, userMsg]);
    if (!msgToSend) setInputMessage('');
    setIsSending(true);

    try {
      const res = await chatGlobalIndex(symbol, text.trim());
      const aiMsg: ChatMessage = {
        sender: 'AI',
        text: res.reply,
        time: res.timestamp || 'Just now'
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: 'Telemetry temporarily unavailable. Please retry shortly.',
          time: 'Now'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const isPositive = detail ? detail.change >= 0 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#050811] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* 1. Modal Header Bar with Live Price & Ticks */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-[#070b16] border-b border-slate-800/80 gap-3">
          {/* Symbol Title & Flags */}
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              {detail?.flag || '🌐'}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  {detail?.name || symbol}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">
                  {symbol}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border uppercase ${
                    detail?.market_status === 'OPEN'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {detail?.market_status || 'OPEN'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono mt-0.5">
                <span>{detail?.exchange_name}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {detail?.trading_hours_ist}
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Live Ticking Price Badge */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-baseline space-x-2 px-3.5 py-1.5 rounded-xl border transition-all duration-300 ${
                flash === 'UP'
                  ? 'flash-up-glow border-emerald-500/80 bg-emerald-950/30'
                  : flash === 'DOWN'
                  ? 'flash-down-glow border-rose-500/80 bg-rose-950/30'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <span className="text-lg sm:text-2xl font-black text-white font-mono tabular-nums tracking-tight">
                {detail?.currency === '₹' ? '₹' : detail?.currency === 'USD' ? '$' : ''}
                {detail?.ltp
                  ? detail.ltp.toLocaleString('en-IN', {
                      minimumFractionDigits: detail.ltp < 100 ? 2 : 1,
                      maximumFractionDigits: 2
                    })
                  : '—'}
                {detail?.currency === '%' ? '%' : ''}
              </span>

              {detail && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-black font-mono ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {isPositive ? '+' : ''}
                  {detail.change_pct.toFixed(2)}% ({isPositive ? '+' : ''}
                  {detail.change.toFixed(detail.ltp < 100 ? 2 : 1)})
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl border border-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Modal Body Grid: Left Column (Chart + Correlation) | Right Column (Copilot Chat + Levels) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-5 overflow-y-auto">
          {/* LEFT COLUMN: Chart + Day Ranges + Indian Sector Correlation (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Interactive SVG Chart */}
            <GlobalIndexChart
              candles={detail?.candles || []}
              ltp={detail?.ltp || 0}
              prevClose={detail?.prev_close || 0}
              currency={detail?.currency || ''}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              keyLevels={detail?.key_levels}
            />

            {/* Day Range & 52-Week Range Sliders */}
            {detail && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#070b16] p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                {/* Day Range */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                    <span>Day Low: {detail.low.toFixed(1)}</span>
                    <span className="font-bold text-slate-300">Session Range</span>
                    <span>Day High: {detail.high.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                    {detail.high > detail.low && (
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              ((detail.ltp - detail.low) / (detail.high - detail.low)) * 100
                            )
                          )}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 52-Week Range */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                    <span>52W L: {detail.week_52_low.toFixed(1)}</span>
                    <span className="font-bold text-slate-300">52-Week Range</span>
                    <span>52W H: {detail.week_52_high.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                    {detail.week_52_high > detail.week_52_low && (
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              ((detail.ltp - detail.week_52_low) /
                                (detail.week_52_high - detail.week_52_low)) *
                                100
                            )
                          )}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dalal Street Correlation Matrix & Sector Heatmap */}
            {detail && (
              <div className="bg-[#070b16] p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-sm text-slate-200 font-display">
                      Dalal Street Macro Correlation Matrix
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-slate-400">NIFTY 50 Beta:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded text-[11px] ${
                        detail.nifty_correlation >= 0
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {detail.nifty_correlation > 0 ? '+' : ''}
                      {detail.nifty_correlation.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Macro Narrative */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {detail.impact_on_india}
                </p>

                {/* Sensitive Indian Equities Pills */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                    High-Beta Correlated Indian Equities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.correlated_indian_sectors.map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          onSelectIndianStock?.(sec);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition flex items-center gap-1 group"
                      >
                        <span>{sec}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Copilot Chat & Key Resistance/Support Levels (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-[#070b16] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            {/* Tab Header: Copilot Chat vs Technical Levels */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-2 bg-slate-900/70">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'CHAT'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Macro Copilot AI</span>
                </button>
                <button
                  onClick={() => setActiveTab('LEVELS')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'LEVELS'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Key Levels & Pivots</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 text-[10px] text-cyan-400 font-mono">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>Macro AI</span>
              </div>
            </div>

            {/* TAB 1: Macro Copilot Chat View */}
            {activeTab === 'CHAT' && (
              <div className="flex-1 flex flex-col justify-between p-3 space-y-3 min-h-[380px]">
                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px] no-scrollbar">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        m.sender === 'USER' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[90%] p-3 rounded-2xl text-xs font-sans leading-relaxed shadow ${
                          m.sender === 'USER'
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                        {m.sender === 'AI' ? 'Macro Analyst' : 'You'} • {m.time}
                      </span>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono p-2 bg-slate-900/50 rounded-lg animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Synthesizing institutional macro transmission...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Suggested Quick Question Chips */}
                {detail?.suggested_prompts && detail.suggested_prompts.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Quick Institutional Queries:
                    </span>
                    <div className="flex flex-col space-y-1">
                      {detail.suggested_prompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(p)}
                          className="text-left text-[11px] text-slate-300 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/30 transition truncate"
                        >
                          ⚡ {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input Field */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Ask about ${symbol} transmission to Dalal Street...`}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !inputMessage.trim()}
                    className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Key Levels & Quantitative Audit */}
            {activeTab === 'LEVELS' && detail && (
              <div className="p-4 space-y-4 text-xs font-mono overflow-y-auto max-h-[460px]">
                {/* Pivots Table */}
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    Daily Camarilla & Pivot Bounds
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-rose-400">Resistance 2 (R2):</span>
                      <span className="font-bold text-white">
                        {detail.key_levels.resistance_2.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-rose-300">Resistance 1 (R1):</span>
                      <span className="font-bold text-white">
                        {detail.key_levels.resistance_1.toFixed(1)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-between p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <span>Central Floor Pivot (P):</span>
                      <span className="font-black">
                        {detail.key_levels.pivot.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-emerald-300">Support 1 (S1):</span>
                      <span className="font-bold text-white">
                        {detail.key_levels.support_1.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-emerald-400">Support 2 (S2):</span>
                      <span className="font-bold text-white">
                        {detail.key_levels.support_2.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Moving Averages & RSI */}
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    Momentum & Trend Oscillators
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">20-Period EMA</span>
                      <span className="font-bold text-cyan-400 text-sm">
                        {detail.key_levels.ema_20.toFixed(1)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">50-Period SMA</span>
                      <span className="font-bold text-indigo-400 text-sm">
                        {detail.key_levels.sma_50.toFixed(1)}
                      </span>
                    </div>
                    <div className="col-span-2 p-2 rounded bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">14-Period RSI</span>
                        <span className="font-black text-white text-sm">
                          {detail.rsi_14.toFixed(1)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          detail.rsi_14 >= 70
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : detail.rsi_14 <= 30
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {detail.rsi_14 >= 70
                          ? 'OVERBOUGHT'
                          : detail.rsi_14 <= 30
                          ? 'OVERSOLD'
                          : 'NEUTRAL EQUILIBRIUM'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exchange Information */}
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exchange:</span>
                    <span className="text-slate-200 font-bold">{detail.exchange_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Currency:</span>
                    <span className="text-slate-200 font-bold">{detail.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Region:</span>
                    <span className="text-slate-200 font-bold">{detail.region}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
