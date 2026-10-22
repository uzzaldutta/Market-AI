'use client';

import React, { useState, useEffect } from 'react';
import { fetchScreener } from '../lib/api';
import { ScreenerRow } from '../types/market';
import { useFavourites } from '../context/FavouritesContext';
import { Filter, Download, Search, CheckCircle2, Clock, Ban, HelpCircle, Star } from 'lucide-react';

interface Props {
  onSelectSymbol: (s: string) => void;
}

export const ScreenerView: React.FC<Props> = ({ onSelectSymbol }) => {
  const [preset, setPreset] = useState<string>('STRONG_BULLISH');
  const [minRvol, setMinRvol] = useState<number>(1.0);
  const [favouritesOnly, setFavouritesOnly] = useState<boolean>(false);
  const [data, setData] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { isFavourite, toggle } = useFavourites();

  const presets = [
    { id: 'STRONG_BULLISH', label: 'Strong Bullish Trend' },
    { id: 'STRONG_BEARISH', label: 'Strong Bearish Trend' },
    { id: 'MOMENTUM_BREAKOUT', label: 'Momentum Breakout' },
    { id: 'PULLBACK_TREND', label: 'Pullback in Established Trend' },
    { id: 'UNUSUAL_VOLUME', label: 'Unusual Volume (>1.8x)' },
    { id: 'OVERSOLD', label: 'Oversold (RSI < 35)' },
    { id: 'OVERBOUGHT', label: 'Overbought (RSI > 68)' },
  ];

  const loadScreenerData = async () => {
    setLoading(true);
    try {
      const res = await fetchScreener({ preset, min_rvol: minRvol });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScreenerData();
  }, [preset, minRvol]);

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = ['Symbol', 'Name', 'Sector', 'LTP', 'Change%', 'Volume', 'RVOL', 'RSI14', 'Trend', 'Signal', 'AIBullishProb'];
    const rows = data.map(r => [
      r.symbol, `"${r.name}"`, r.sector, r.ltp, r.change_pct, r.volume, r.rvol, r.rsi_14, r.trend, r.signal_status, r.ai_bullish_prob
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nse_screener_${preset.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> ELIGIBLE
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> WATCH
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Ban className="w-3 h-3" /> BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <HelpCircle className="w-3 h-3" /> NO_TRADE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Presets & Filters */}
      <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-gray-400 uppercase flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Preset:
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                preset === p.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:text-terminal-text hover:bg-terminal-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>Min RVOL:</span>
            <select
              value={minRvol}
              onChange={(e) => setMinRvol(parseFloat(e.target.value))}
              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-xs font-mono text-terminal-text focus:outline-none"
            >
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>
          <button
            onClick={() => setFavouritesOnly(!favouritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              favouritesOnly 
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                : 'bg-terminal-dark hover:bg-terminal-border border-terminal-border text-gray-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favouritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{favouritesOnly ? 'Favourites Only' : 'All Screener'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terminal-dark hover:bg-terminal-border border border-terminal-border text-xs font-mono text-gray-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl bg-terminal-surface border border-terminal-border overflow-hidden">
        <div className="p-4 border-b border-terminal-border flex justify-between items-center">
          <div className="text-xs font-mono text-gray-400">
            Matches Found: <span className="text-terminal-text font-bold">{(favouritesOnly ? data.filter(r => isFavourite(r.symbol)) : data).length}</span> instruments
          </div>
          <div className="text-[11px] font-mono text-gray-500">
            Prices in INR (₹) • Strict No Look-Ahead Signal Attribution
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-terminal-dark/60 border-b border-terminal-border text-gray-400">
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">LTP (₹)</th>
                <th className="py-3 px-4 text-right">Change (%)</th>
                <th className="py-3 px-4 text-right">RVOL</th>
                <th className="py-3 px-4 text-right">RSI (14)</th>
                <th className="py-3 px-4 text-center">Trend</th>
                <th className="py-3 px-4 text-center">AI Bullish Prob</th>
                <th className="py-3 px-4 text-center">Setup State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 animate-pulse">
                    Filtering NSE Instruments with institutional quantitative criteria...
                  </td>
                </tr>
              ) : (favouritesOnly ? data.filter(r => isFavourite(r.symbol)) : data).length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No instruments currently match this filter criteria.
                  </td>
                </tr>
              ) : (
                (favouritesOnly ? data.filter(r => isFavourite(r.symbol)) : data).map((row) => {
                  const isUp = row.change_pct >= 0;
                  const isFav = isFavourite(row.symbol);
                  return (
                    <tr
                      key={row.symbol}
                      onClick={() => onSelectSymbol(row.symbol)}
                      className="hover:bg-terminal-hover/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-gray-200">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(row.symbol);
                            }}
                            className="p-1 -ml-1 rounded hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-colors"
                            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <div>
                            <span>{row.symbol}</span>
                            <span className="block text-[10px] text-gray-500 font-normal">{row.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{row.sector}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{row.ltp.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
                        {isUp ? '+' : ''}{row.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300 font-bold">{row.rvol.toFixed(2)}x</td>
                      <td className="py-3 px-4 text-right">{row.rsi_14.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          row.trend.includes('BULLISH') ? 'bg-emerald-500/10 text-emerald-400' :
                          row.trend.includes('BEARISH') ? 'bg-rose-500/10 text-rose-400' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {row.trend}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-terminal-dark rounded-full overflow-hidden">
                            <div style={{ width: `${row.ai_bullish_prob}%` }} className="bg-blue-500 h-full" />
                          </div>
                          <span className="font-semibold text-blue-400">{row.ai_bullish_prob}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(row.signal_status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
