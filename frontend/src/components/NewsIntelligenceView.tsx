'use client';

import React, { useState, useEffect } from 'react';
import { fetchNews } from '../lib/api';
import { NewsItem } from '../types/market';
import { Newspaper, ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Tag } from 'lucide-react';

export const NewsIntelligenceView: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNews()
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', 'MACRO', 'EARNINGS', 'ORDERS', 'REGULATORY'];

  const filteredNews = filterCat === 'ALL' ? news : news.filter(n => n.category === filterCat);

  const getSentimentPill = (sentiment: string, score: number) => {
    if (sentiment === 'BULLISH') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
          <TrendingUp className="w-3 h-3" /> BULLISH (+{(score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (sentiment === 'BEARISH') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
          <TrendingDown className="w-3 h-3" /> BEARISH ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 font-bold">
        NEUTRAL
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Ribbon */}
      <div className="p-4 rounded-xl bg-terminal-surface border border-terminal-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-gray-400 uppercase mr-2">Category:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                filterCat === c
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="text-[11px] font-mono text-gray-500">
          Curated Indian Official Disclosures &amp; Press Releases
        </div>
      </div>

      {/* News Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
            Ingesting Indian Corporate Announcements &amp; Macro Intelligence...
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-terminal-surface border border-terminal-border hover:border-terminal-border/80 transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {item.category}
                  </span>
                  {getSentimentPill(item.sentiment, item.sentiment_score)}
                  <span className="text-[10px] font-mono text-gray-500">• {item.timestamp}</span>
                </div>
                <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
                  <span>Source: {item.source}</span>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center ml-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white font-mono leading-snug">{item.headline}</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">{item.summary}</p>

              {/* Affected Tickers Tagging */}
              <div className="flex items-center space-x-2 pt-1">
                <Tag className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[10px] font-mono text-gray-500 uppercase">Impacted Tickers:</span>
                <div className="flex space-x-1.5">
                  {item.affected_symbols.map((sym) => (
                    <span
                      key={sym}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-terminal-dark border border-terminal-border text-gray-300 font-semibold"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
