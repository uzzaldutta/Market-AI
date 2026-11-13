'use client';

import React, { useState, useEffect } from 'react';
import { fetchEquityDossier } from '../lib/api';
import { ResearchDossierResponse } from '../types/market';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Target,
  RefreshCw,
  Building,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';

interface Props {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchDossierModal: React.FC<Props> = ({ symbol, isOpen, onClose }) => {
  const [dossier, setDossier] = useState<ResearchDossierResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && symbol) {
      setLoading(true);
      setError(null);
      fetchEquityDossier(symbol)
        .then((data) => setDossier(data))
        .catch((err) => setError(err.message || 'Failed to load research dossier'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1120] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:w-full print:bg-white print:text-black print:border-none">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Institutional Equity Research Dossier
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  AUTONOMOUS AI REPORT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Full 5-Pillar valuation, balance sheet audit, comps and downside stress bounds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible text-slate-200">
          {loading && (
            <div className="py-24 text-center">
              <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">
                Synthesizing multi-pillar financial data and generating institutional report...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
              {error}
            </div>
          )}

          {dossier && !loading && (
            <div className="space-y-6 print:space-y-4">
              {/* Report Header Document Banner */}
              <div className="border-b border-slate-700/80 pb-6 print:border-black">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                        BHARAT MARKET INTELLIGENCE • INSTITUTIONAL EQUITY RESEARCH
                      </span>
                    </div>
                    <h1 className="text-3xl font-black text-white mt-1 print:text-black">
                      {dossier.company_name} ({dossier.symbol})
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono print:text-gray-700">
                      <span>ISIN: {dossier.isin}</span>
                      <span>•</span>
                      <span>SECTOR: {dossier.sector}</span>
                      <span>•</span>
                      <span>MCAP: ₹{(dossier.market_cap_cr / 1000).toFixed(1)}k Cr</span>
                      <span>•</span>
                      <span>GENERATED: {dossier.generated_at}</span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 print:border-gray-300">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Target Fair Value
                    </span>
                    <span className="text-3xl font-black text-emerald-400 font-mono print:text-emerald-700">
                      ₹{dossier.target_price.toFixed(2)}
                    </span>
                    <div className="mt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:bg-gray-100 print:text-black">
                        {dossier.analyst_rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Valuation Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current LTP</span>
                  <div className="text-lg font-black text-white font-mono mt-1 print:text-black">
                    ₹{dossier.ltp.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">DCF Fair Value</span>
                  <div className="text-lg font-black text-cyan-400 font-mono mt-1 print:text-blue-700">
                    ₹{dossier.dcf_fair_value.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Margin of Safety</span>
                  <div className={`text-lg font-black font-mono mt-1 ${dossier.margin_of_safety_pct >= 0 ? 'text-emerald-400 print:text-green-700' : 'text-rose-400 print:text-red-700'}`}>
                    {dossier.margin_of_safety_pct > 0 ? '+' : ''}{dossier.margin_of_safety_pct.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Graham Number</span>
                  <div className="text-lg font-black text-amber-400 font-mono mt-1 print:text-amber-800">
                    ₹{dossier.graham_number.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Executive Investment Thesis */}
              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 relative print:bg-gray-50 print:border-gray-300">
                <span className="text-xs uppercase tracking-wider font-extrabold text-cyan-400 block mb-2 font-mono">
                  Executive Investment Thesis &amp; Core Appraisal
                </span>
                <p className="text-sm leading-relaxed text-slate-300 print:text-gray-900 font-sans">
                  {dossier.investment_thesis}
                </p>
              </div>

              {/* 5-Pillar Score Summary */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 font-mono">
                  Legendary 5-Pillar Institutional Scorecard (/100)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {Object.entries(dossier.pillar_scores).map(([k, score]) => (
                    <div key={k} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center print:bg-gray-50 print:border-gray-300">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block truncate">
                        {k.replace('_', ' ')}
                      </span>
                      <span className="text-xl font-black text-white font-mono mt-1 block print:text-black">
                        {score.toFixed(0)}
                      </span>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden print:bg-gray-200">
                        <div
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catalysts & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strategic Strengths */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase text-slate-200 print:text-black">
                      Key Catalysts &amp; Strategic Strengths
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 print:text-gray-800">
                    {dossier.key_strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Downside Risks */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold uppercase text-slate-200 print:text-black">
                      Critical Risk Factors &amp; Downside Triggers
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 print:text-gray-800">
                    {dossier.key_risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sector Peer Comparison Table */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <h4 className="text-xs font-bold uppercase text-slate-300 mb-3 font-mono print:text-black">
                  Sector Peer Valuation Matrix ({dossier.sector})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 print:border-gray-300">
                        <th className="py-2 px-3">Symbol</th>
                        <th className="py-2 px-3 text-right">P/E</th>
                        <th className="py-2 px-3 text-right">P/B</th>
                        <th className="py-2 px-3 text-right">ROE %</th>
                        <th className="py-2 px-3 text-right">Market Cap (₹ Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 print:divide-gray-200">
                      {dossier.peer_comparison.map((peer) => (
                        <tr key={peer.symbol} className={peer.symbol === dossier.symbol ? 'bg-cyan-500/10 font-bold text-cyan-300' : ''}>
                          <td className="py-2 px-3">{peer.symbol}</td>
                          <td className="py-2 px-3 text-right">{peer.pe_ratio.toFixed(1)}x</td>
                          <td className="py-2 px-3 text-right">{peer.pb_ratio.toFixed(1)}x</td>
                          <td className="py-2 px-3 text-right">{peer.roe_pct.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right">₹{peer.market_cap_cr.toLocaleString('en-IN')} Cr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Institutional Sign-off & Stamp */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-2 print:border-gray-300 print:text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  <span>SEBI Analytical Safeguards: Educational Research &amp; Paper Simulation Only.</span>
                </div>
                <span>Certified by Bharat Market Intelligence Autonomous Financial Engine</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
