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
  NewsItem
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


