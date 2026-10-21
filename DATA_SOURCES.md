# DATA SOURCES & LICENSING SPECIFICATION

## 1. Supported Providers

### Provider A: Yahoo Finance NSE Adapter (`YFinanceNSEProvider`)
- **Symbol Formats**: `.NS` for National Stock Exchange of India (e.g., `RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFCBANK.NS`, `^NSEI`, `^NSEBANK`).
- **Data Coverage**:
  - Daily & intraday OHLCV candles (1m, 5m, 15m, 60m, 1d).
  - Quotes, market cap, 52-week high/low, trailing PE, volume, bid/ask.
  - Option chain snapshots where supported for indices and high-liquidity stocks.
- **Latency / Delay**: Typically 15-minute delayed during live Indian market hours unless licensed real-time feed is subscribed. Clearly labeled in the UI as `DELAYED (15m)` during live market hours.
- **Rate Limits & Caching**: Bounded requests with in-memory TTL caching (30s for live quotes, 5m for historical candles).

### Provider B: Deterministic Synthetic Fixture Provider (`SyntheticFixtureProvider`)
- **Purpose**: Fully reproducible CI/CD testing, offline development, and fallback when external network or broker APIs are unavailable.
- **Characteristics**:
  - Generates realistic Indian equity price action, gaps, volatility, and volume clusters.
  - Strictly respects Indian market hours (09:15 - 15:30 IST).
  - Fully deterministic using seeded pseudo-random walks and standard geometric Brownian motion with jump-diffusion.
  - Clearly labeled in the UI as `SIMULATED / SYNTHETIC`.

### Provider C: Indian Financial News Feeds
- **Sources**: Major Indian financial publication RSS feeds and official exchange announcements.
- **Processing**: Regex-based ticker extraction, category tagging (Earnings, Regulatory, Orders, Macro, Management), and NLP sentiment scoring.

---

## 2. Market Session Hours (Asia/Kolkata - IST)
- **Pre-Market Open**: 09:00 - 09:08 IST
- **Pre-Market Price Discovery & Matching**: 09:08 - 09:15 IST
- **Normal Trading Session**: 09:15 - 15:30 IST
- **Post-Market Closing**: 15:40 - 16:00 IST
- **Market Holidays**: NSE official trading holiday calendar observed.
