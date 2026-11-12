'use client';

import React, { useState, useEffect } from 'react';
import { fetchAlertsFeed, testAlertWebhook } from '../../lib/api';
import { AlertsFeedResponse, MarketAlertItem } from '../../types/market';
import {
  Bell,
  X,
  Zap,
  Send,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AlertCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectSymbol,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'WEBHOOK'>('ALERTS');
  const [feed, setFeed] = useState<AlertsFeedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Webhook Tester State
  const [webhookChannel, setWebhookChannel] = useState<string>('telegram');
  const [webhookDestination, setWebhookDestination] = useState<string>('');
  const [testSymbol, setTestSymbol] = useState<string>('RELIANCE');
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlertsFeed();
      setFeed(data);
    } catch (err) {
      console.error('Failed to load alerts feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await testAlertWebhook(
        webhookChannel,
        webhookDestination || undefined,
        testSymbol
      );
      setWebhookResult(res);
    } catch (err: any) {
      setWebhookResult({
        status: 'ERROR',
        error: err?.message || 'Failed to dispatch webhook'
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101f] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Alert & Webhook Center
                {feed && feed.unread_count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    {feed.unread_count} NEW
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Institutional notifications, breakout alerts & instant messenger integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ALERTS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Signal Feed ({feed?.alerts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOK')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'WEBHOOK'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram & WhatsApp Webhook Dispatch
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'ALERTS' && (
            <>
              {loading && !feed ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                  Loading institutional signals...
                </div>
              ) : (
                feed?.alerts?.map((alert: MarketAlertItem) => {
                  const isHigh = alert.severity === 'HIGH';
                  const isMedium = alert.severity === 'MEDIUM';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHigh
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : isMedium
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg mt-0.5 ${
                              isHigh
                                ? 'bg-rose-500/20 text-rose-400'
                                : isMedium
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {isHigh ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : isMedium ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Info className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white font-mono">
                                {alert.symbol}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                {alert.alert_type}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {alert.time_ago}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-200 mt-1">
                              {alert.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {alert.message}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onSelectSymbol?.(alert.symbol);
                            onNavigateTab?.('recommendations');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-medium border border-slate-700 flex items-center gap-1 shrink-0"
                        >
                          Chart <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'WEBHOOK' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 leading-relaxed">
                Configure instant push delivery of high-confidence breakout alerts and DCF Margin of Safety warnings straight to your personal Telegram channel or WhatsApp Business webhook.
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Delivery Channel
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWebhookChannel('telegram')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        webhookChannel === 'telegram'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      Telegram Bot (HTML)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebhookChannel('whatsapp')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        webhookChannel === 'whatsapp'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-emerald-400" />
                      WhatsApp Cloud Webhook
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Destination Webhook URL or Chat ID (Optional for simulated test)
                  </label>
                  <input
                    type="text"
                    value={webhookDestination}
                    onChange={(e) => setWebhookDestination(e.target.value)}
                    placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage or leave empty to simulate"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Test Trigger Stock
                  </label>
                  <input
                    type="text"
                    value={testSymbol}
                    onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                    placeholder="RELIANCE"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {testingWebhook ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Dispatch Test Signal Now
                </button>
              </div>

              {webhookResult && (
                <div
                  className={`p-4 rounded-xl border font-mono text-xs ${
                    webhookResult.status === 'SUCCESS'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Status: {webhookResult.status} (Simulated Dispatch Latency: {webhookResult.latency_ms?.toFixed(1) || 12}ms)
                  </div>
                  <pre className="text-[11px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-slate-300 mt-2">
                    {webhookResult.message_preview || JSON.stringify(webhookResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
