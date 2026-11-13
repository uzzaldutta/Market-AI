import {
  MarketOverviewData,
  Quote,
  Candle,
  TechnicalIndicatorsData,
  OptionChainData,
  StrategyPayoffData,
  PredictionData,
  SignalData,
  ScreenerRow,
  PaperAccount,
  NewsItem,
  GlobalIndexDetail,
  GlobalIndexChatResponse,
  AutoAlertsResponse,
  AutoAlertsStatsResponse,
  AuditSummaryResponse,
  UserProfileSettings,
  AddScripRequest,
  UpdateScripRequest,
  AddCustomScriptRuleRequest,
  UpdateUserProfileRequest,
  UserSummaryItem
} from '../types/market';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchMarketOverview(): Promise<MarketOverviewData> {
  const res = await fetch(`${API_BASE}/overview`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch market overview');
  return res.json();
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const res = await fetch(`${API_BASE}/instruments/${symbol}/quote`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  return res.json();
}

export async function fetchCandles(symbol: string, timeframe = '1D', count = 100): Promise<Candle[]> {
  const res = await fetch(`${API_BASE}/instruments/${symbol}/candles?timeframe=${timeframe}&count=${count}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch candles for ${symbol}`);
  return res.json();
}

export async function fetchIndicators(symbol: string, timeframe = '1D'): Promise<TechnicalIndicatorsData> {
  const res = await fetch(`${API_BASE}/instruments/${symbol}/indicators?timeframe=${timeframe}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch indicators for ${symbol}`);
  return res.json();
}

export async function fetchOptionChain(symbol: string, expiry?: string): Promise<OptionChainData> {
  const url = expiry ? `${API_BASE}/options/${symbol}/chain?expiry=${expiry}` : `${API_BASE}/options/${symbol}/chain`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch option chain for ${symbol}`);
  return res.json();
}

export async function fetchStrategyPayoff(payload: any): Promise<StrategyPayoffData> {
  const res = await fetch(`${API_BASE}/options/payoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to calculate strategy payoff');
  return res.json();
}

export async function fetchPrediction(symbol: string, horizon = '1_SESSION'): Promise<PredictionData> {
  const res = await fetch(`${API_BASE}/predictions/${symbol}?horizon=${horizon}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch prediction for ${symbol}`);
  return res.json();
}

export async function fetchSignal(symbol: string): Promise<SignalData> {
  const res = await fetch(`${API_BASE}/signals/${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch signal for ${symbol}`);
  return res.json();
}

export async function fetchScreener(filters: any): Promise<{ total: number; data: ScreenerRow[] }> {
  const res = await fetch(`${API_BASE}/screener`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  if (!res.ok) throw new Error('Failed to run screener');
  return res.json();
}

export async function fetchPaperAccount(): Promise<PaperAccount> {
  const res = await fetch(`${API_BASE}/paper/account`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch paper account');
  return res.json();
}

export async function placePaperOrder(order: any): Promise<any> {
  const res = await fetch(`${API_BASE}/paper/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('Failed to place paper order');
  return res.json();
}

export const submitPaperOrder = placePaperOrder;


export async function runBacktest(req: any): Promise<any> {
  const res = await fetch(`${API_BASE}/backtest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to execute backtest');
  return res.json();
}

export async function fetchNews(symbol?: string): Promise<NewsItem[]> {
  const url = symbol ? `${API_BASE}/news?symbol=${symbol}` : `${API_BASE}/news`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function resetPaperAccount(capital = 1000000.0): Promise<PaperAccount> {
  const res = await fetch(`${API_BASE}/paper/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capital })
  });
  if (!res.ok) throw new Error('Failed to reset paper account');
  return res.json();
}

export async function fetchFavourites(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/user/favourites`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch favourites');
  return res.json();
}

export async function toggleFavourite(symbol: string): Promise<{ symbol: string; is_favourite: boolean; favourites: string[] }> {
  const res = await fetch(`${API_BASE}/user/favourites/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
  if (!res.ok) throw new Error(`Failed to toggle favourite for ${symbol}`);
  return res.json();
}

// --- INSTITUTIONAL QUANT ALPHA API CALLS ---
export async function fetchGEXProfile(symbol: string, expiry?: string): Promise<any> {
  const url = expiry ? `${API_BASE}/options/${symbol}/gex?expiry=${expiry}` : `${API_BASE}/options/${symbol}/gex`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch GEX profile for ${symbol}`);
  return res.json();
}

export async function fetchVolumeProfile(symbol: string, timeframe = '1D', bins = 30): Promise<any> {
  const res = await fetch(`${API_BASE}/instruments/${symbol}/volume-profile?timeframe=${timeframe}&bins=${bins}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch volume profile for ${symbol}`);
  return res.json();
}

export async function fetchAnchoredVWAP(symbol: string, timeframe = '1D'): Promise<any> {
  const res = await fetch(`${API_BASE}/instruments/${symbol}/anchored-vwap?timeframe=${timeframe}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch anchored VWAP for ${symbol}`);
  return res.json();
}

export async function fetchParticipantFlows(): Promise<any> {
  const res = await fetch(`${API_BASE}/derivatives/participant-flows`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch participant flows');
  return res.json();
}

export async function fetchSectorRotationMatrix(): Promise<any> {
  const res = await fetch(`${API_BASE}/sectors/rotation-matrix`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sector rotation matrix');
  return res.json();
}

export async function calculateKellySizing(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/risk/kelly-sizing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to calculate Kelly sizing');
  return res.json();
}

export async function fetchFastAlphaRadar(strategy?: string): Promise<any> {
  const url = strategy ? `${API_BASE}/alpha/radar?strategy=${strategy}` : `${API_BASE}/alpha/radar`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch fast alpha radar');
  return res.json();
}

export async function fetchStockTimingAnalysis(symbol: string, timeframe = '15m'): Promise<any> {
  const res = await fetch(`${API_BASE}/timing/${symbol}?timeframe=${timeframe}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch stock timing analysis for ${symbol}`);
  return res.json();
}

export async function fetchGlobalIndices(): Promise<any> {
  const res = await fetch(`${API_BASE}/global-indices`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch global indices');
  return res.json();
}

export async function fetchGlobalIndexDetail(symbol: string, timeframe: string = '1D'): Promise<GlobalIndexDetail> {
  const res = await fetch(`${API_BASE}/global-indices/${encodeURIComponent(symbol)}/detail?timeframe=${encodeURIComponent(timeframe)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch global index detail for ${symbol}`);
  return res.json();
}

export async function chatGlobalIndex(symbol: string, message: string): Promise<GlobalIndexChatResponse> {
  const res = await fetch(`${API_BASE}/global-indices/${encodeURIComponent(symbol)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error(`Failed to chat for global index ${symbol}`);
  return res.json();
}

export async function fetchOracleAnalysis(
  symbol: string,
  growthRate?: number,
  discountRate?: number
): Promise<any> {
  let url = `${API_BASE}/oracle/analyze/${symbol}`;
  const params: string[] = [];
  if (growthRate !== undefined) params.push(`growth_rate_pct=${growthRate}`);
  if (discountRate !== undefined) params.push(`discount_rate_pct=${discountRate}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch Oracle AI valuation for ${symbol}`);
  return res.json();
}

export async function askCopilot(
  query: string,
  contextSymbol?: string,
  accountEquity: number = 1000000.0
): Promise<any> {
  const res = await fetch(`${API_BASE}/copilot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      context_symbol: contextSymbol,
      account_equity: accountEquity
    })
  });
  if (!res.ok) throw new Error('Failed to query AI Copilot');
  return res.json();
}

export async function fetchStockDuel(symbolA: string, symbolB: string): Promise<any> {
  const res = await fetch(`${API_BASE}/duel/compare?symbol_a=${symbolA}&symbol_b=${symbolB}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to duel ${symbolA} vs ${symbolB}`);
  return res.json();
}

export async function fetchBlockDeals(): Promise<any> {
  const res = await fetch(`${API_BASE}/deals/block-deals`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch institutional block deals');
  return res.json();
}

export async function fetchAlertsFeed(): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/feed`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch alerts feed');
  return res.json();
}

export async function testAlertWebhook(channel: string, destinationUrl?: string, testSymbol = 'RELIANCE'): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/test-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel,
      destination_webhook_url: destinationUrl,
      test_symbol: testSymbol
    })
  });
  if (!res.ok) throw new Error('Failed to test alert webhook');
  return res.json();
}

export async function fetchEquityDossier(symbol: string): Promise<any> {
  const res = await fetch(`${API_BASE}/dossier/${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch research dossier for ${symbol}`);
  return res.json();
}

export async function calculateStrategyPayoff(req: any): Promise<any> {
  const res = await fetch(`${API_BASE}/options/strategy-payoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to calculate options strategy payoff');
  return res.json();
}

export async function fetchOrderBookDepth(symbol: string): Promise<any> {
  const res = await fetch(`${API_BASE}/orderbook/depth/${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch order book depth for ${symbol}`);
  return res.json();
}

export async function optimizeStrategy(req: any): Promise<any> {
  const res = await fetch(`${API_BASE}/backtest/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to optimize strategy parameters');
  return res.json();
}

export async function fetchPreTradeCheck(req: any): Promise<any> {
  const res = await fetch(`${API_BASE}/paper/pretrade-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to run pre-trade validation check');
  return res.json();
}

export async function fetchDailyRecommendations(limit = 20): Promise<any> {
  const res = await fetch(`${API_BASE}/recommendations/daily?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch daily recommendations');
  return res.json();
}

export async function fetchLiveAutoAlerts(budgetTier?: string, category?: string, userId?: string): Promise<AutoAlertsResponse> {
  let url = `${API_BASE}/auto-alerts/live`;
  const params = new URLSearchParams();
  if (budgetTier && budgetTier !== 'ALL') params.append('budget_tier', budgetTier);
  if (category && category !== 'ALL') params.append('category', category);
  if (userId) params.append('user_id', userId);
  const qStr = params.toString();
  if (qStr) url += `?${qStr}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch live auto trade alerts');
  return res.json();
}

export async function fetchAutoAlertsStats(): Promise<AutoAlertsStatsResponse> {
  const res = await fetch(`${API_BASE}/auto-alerts/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch auto alerts performance stats');
  return res.json();
}

export async function executeAutoAlertInPaper(alertId: string, lots = 1): Promise<any> {
  const res = await fetch(`${API_BASE}/auto-alerts/${alertId}/paper-execute?lots=${lots}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to execute auto alert in paper account');
  return res.json();
}

export async function fetchAutoAlertsAuditSummary(filterOutcome?: string, startingCapital = 10000): Promise<AuditSummaryResponse> {
  let url = `${API_BASE}/auto-alerts/audit/summary?starting_capital=${startingCapital}`;
  if (filterOutcome && filterOutcome !== 'ALL') {
    url += `&filter_outcome=${filterOutcome}`;
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch recommendation performance audit summary');
  return res.json();
}

// --- USER-WISE PERSONALIZATION & CUSTOM SCRIP TRACKING ---
export async function fetchUserProfile(userId = 'default_user'): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/profile`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch user profile for ${userId}`);
  return res.json();
}

export async function updateUserProfile(userId: string, req: UpdateUserProfileRequest): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to update user profile settings');
  return res.json();
}

export async function addUserScrip(userId: string, req: AddScripRequest): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/scrips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to add custom scrip');
  return res.json();
}

export async function updateUserScrip(userId: string, scripId: string, req: UpdateScripRequest): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/scrips/${scripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to update custom scrip');
  return res.json();
}

export async function deleteUserScrip(userId: string, scripId: string): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/scrips/${scripId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete custom scrip');
  return res.json();
}

export async function addUserCustomRule(userId: string, req: AddCustomScriptRuleRequest): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to add custom script rule');
  return res.json();
}

export async function deleteUserCustomRule(userId: string, scriptId: string): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/custom-rules/${scriptId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete custom rule');
  return res.json();
}

export async function listUserProfiles(): Promise<UserSummaryItem[]> {
  const res = await fetch(`${API_BASE}/user/list`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to list user profiles');
  return res.json();
}

export async function toggleUserScripAlert(userId: string, scripId: string): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/scrips/${scripId}/toggle-alert`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to toggle scrip alert');
  return res.json();
}

export async function toggleUserCustomRule(userId: string, scriptId: string): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user/${userId}/custom-rules/${scriptId}/toggle`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to toggle custom rule');
  return res.json();
}

export async function deleteUserProfile(userId: string): Promise<{ success: boolean; user_id: string }> {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete user profile');
  return res.json();
}










