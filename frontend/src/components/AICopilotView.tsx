'use client';

import React, { useState, useRef, useEffect } from 'react';
import { askCopilot } from '../lib/api';
import { CopilotQueryResponse } from '../types/market';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
  Target,
  RefreshCw,
  Compass
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  data?: CopilotQueryResponse;
  timestamp: string;
}

interface Props {
  onSelectSymbol?: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AICopilotView: React.FC<Props> = ({ onSelectSymbol, onNavigateTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "Greetings. I am your Antigravity AI Market Copilot, connected directly to real-time NSE order books, 10-year DCF cash flow models, options gamma exposure, and global macro feeds. How can I assist your portfolio today?",
      data: {
        query: "Initial greeting",
        intent: "GENERAL",
        executive_answer: "Connected to institutional valuation engines (Buffett Moat, Graham Number, Lynch GARP, Simons Quant). Ready for equity audits, stress-testing, and strategy generation.",
        key_takeaways: [
          "Ask for any stock's DCF intrinsic value and margin of safety",
          "Simulate portfolio drawdown under market drops (e.g., 'What if NIFTY drops 300 pts?')",
          "Screen for high-probability setups and multibaggers"
        ],
        suggested_actions: [
          { label: "Analyze Reliance DCF Valuation", action: "ORACLE_RELIANCE" },
          { label: "Stress Test Portfolio Under -300 Pt Drop", action: "STRESS_TEST" },
          { label: "Find Buffett Fat Pitch Stocks", action: "SCREEN_FAT_PITCH" }
        ],
        confidence_score: 98.0,
        timestamp: new Date().toLocaleTimeString()
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await askCopilot(q);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: res.executive_answer,
        data: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: `Analysis error: ${err.message || 'Unable to connect to Copilot reasoning engine'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.startsWith('ORACLE_') || action.startsWith('TIMING_') || action.startsWith('PAPER_')) {
      const sym = action.split('_')[1];
      if (sym && onSelectSymbol) onSelectSymbol(sym);
      if (onNavigateTab) onNavigateTab(action.startsWith('ORACLE_') ? 'oracle' : 'overview');
    } else if (action === 'STRESS_TEST') {
      handleSend('What happens if NIFTY drops 300 points?');
    } else if (action === 'SCREEN_FAT_PITCH') {
      handleSend('Which stocks are in Buffett Fat Pitch territory?');
    } else if (action === 'VIEW_RADAR' && onNavigateTab) {
      onNavigateTab('radar');
    } else if (action === 'VIEW_OVERVIEW' && onNavigateTab) {
      onNavigateTab('overview');
    }
  };

  const promptChips = [
    'Analyze Reliance DCF valuation and moat',
    'What happens if NIFTY drops 300 points?',
    'Which stocks are in Buffett Fat Pitch territory?',
    'GIFT Nifty opening prediction for tomorrow',
    'Evaluate Tata Motors growth potential'
  ];

  return (
    <div className="h-[80vh] flex flex-col bg-[#070b14] border border-gray-800/90 rounded-2xl shadow-2xl overflow-hidden font-mono">
      
      {/* Top Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-[#0a101f] via-[#0e172e] to-[#0a101f] border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Antigravity AI Market Copilot</h2>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Quant Model</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Natural Language Equity Valuation • Risk Stress Testing • Trade Thesis Generator
            </p>
          </div>
        </div>

        <div className="text-[10px] text-gray-500 hidden sm:block">
          Latency: <strong className="text-cyan-400">&lt; 35ms</strong>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'copilot' && (
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-sans font-medium shadow-md shadow-blue-900/30 ml-12'
                : 'bg-[#0d1424] border border-gray-800/90 text-gray-200 mr-12 space-y-3'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1 border-b border-gray-800/60 pb-1">
                <span className="font-bold text-cyan-400">
                  {msg.sender === 'user' ? 'You' : 'Antigravity Copilot'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="text-xs font-sans text-gray-100 whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>

              {/* Structured Copilot Takeaways & Action Cards */}
              {msg.data && msg.data.key_takeaways && msg.data.key_takeaways.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800/80 font-mono text-[11px]">
                  <div className="text-gray-400 font-semibold uppercase text-[10px] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Institutional Synthesis:</span>
                  </div>
                  <div className="space-y-1">
                    {msg.data.key_takeaways.map((takeaway, i) => (
                      <div key={i} className="flex items-start space-x-2 text-gray-300">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {msg.data && msg.data.suggested_actions && msg.data.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800/60 font-mono">
                  {msg.data.suggested_actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act.action)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10.5px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0d1424] border border-gray-800 text-xs font-mono text-cyan-300 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Synthesizing DCF cash flows, Gamma dealer positioning, and macro telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="px-4 py-2 border-t border-gray-800/60 bg-[#060a14] flex items-center space-x-2 overflow-x-auto scrollbar-none text-[11px] font-mono">
        <span className="text-gray-500 flex-shrink-0">Quick Queries:</span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/60 flex-shrink-0 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#0a0f1d] border-t border-gray-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot anything (e.g. 'Evaluate Reliance DCF', 'Stress test my portfolio', 'Multibagger screens')..."
            className="flex-1 bg-[#050811] border border-gray-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-900/40 flex items-center space-x-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>

    </div>
  );
};
