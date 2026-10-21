"""
Technical Analysis Mathematical Calculation Engine.
Strictly causality-preserving (no look-ahead bias).
Documented formulas with explicit warm-up periods and NaN handling.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any

class TechnicalIndicators:
    @staticmethod
    def sma(series: pd.Series, period: int) -> pd.Series:
        """
        Simple Moving Average (SMA).
        Formula: SMA_t = (1 / period) * sum_{i=0}^{period-1} P_{t-i}
        Warm-up: `period - 1` points will be NaN.
        """
        return series.rolling(window=period, min_periods=period).mean()

    @staticmethod
    def ema(series: pd.Series, period: int) -> pd.Series:
        """
        Exponential Moving Average (EMA).
        Formula: EMA_t = alpha * P_t + (1 - alpha) * EMA_{t-1}, where alpha = 2 / (period + 1)
        Warm-up: `period - 1` points will be NaN (using adjust=False).
        """
        return series.ewm(span=period, adjust=False, min_periods=period).mean()

    @staticmethod
    def rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """
        Relative Strength Index (Wilder's RSI).
        Formula:
            Delta = P_t - P_{t-1}
            Gain = max(Delta, 0), Loss = max(-Delta, 0)
            AvgGain = Wilder_Smooth(Gain, period)
            AvgLoss = Wilder_Smooth(Loss, period)
            RS = AvgGain / AvgLoss
            RSI = 100 - (100 / (1 + RS))
        Warm-up: period + 1 points.
        """
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        # Wilder's smoothing equivalent: alpha = 1 / period
        avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        # Handle zero loss case: RSI = 100
        rsi = rsi.fillna(100.0).where(avg_loss != 0, 100.0)
        # Handle zero gain and zero loss case: RSI = 50
        rsi = rsi.where(~((avg_gain == 0) & (avg_loss == 0)), 50.0)
        return rsi

    @staticmethod
    def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        Moving Average Convergence Divergence (MACD).
        Formula:
            MACD_Line = EMA(fast) - EMA(slow)
            Signal_Line = EMA(MACD_Line, signal)
            Histogram = MACD_Line - Signal_Line
        Warm-up: `slow + signal` points.
        """
        fast_ema = TechnicalIndicators.ema(series, fast)
        slow_ema = TechnicalIndicators.ema(series, slow)
        macd_line = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=signal, adjust=False, min_periods=signal).mean()
        hist = macd_line - signal_line
        return macd_line, signal_line, hist

    @staticmethod
    def stochastic(high: pd.Series, low: pd.Series, close: pd.Series, k_period: int = 14, d_period: int = 3) -> Tuple[pd.Series, pd.Series]:
        """
        Stochastic Oscillator (%K, %D).
        Formula:
            %K = ((Close - Lowest_Low_{k}) / (Highest_High_{k} - Lowest_Low_{k})) * 100
            %D = SMA(%K, d_period)
        Warm-up: `k_period + d_period` points.
        """
        lowest_low = low.rolling(window=k_period, min_periods=k_period).min()
        highest_high = high.rolling(window=k_period, min_periods=k_period).max()
        denom = highest_high - lowest_low
        k = ((close - lowest_low) / denom.replace(0, np.nan)) * 100.0
        k = k.fillna(50.0)
        d = k.rolling(window=d_period, min_periods=d_period).mean()
        return k, d

    @staticmethod
    def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        """
        Average True Range (ATR).
        Formula:
            TR = max(High - Low, |High - Close_{prev}|, |Low - Close_{prev}|)
            ATR = Wilder_Smooth(TR, period)
        Warm-up: `period` points.
        """
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        return atr

    @staticmethod
    def bollinger_bands(series: pd.Series, period: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
        """
        Bollinger Bands.
        Formula:
            Middle = SMA(series, period)
            Upper = Middle + (num_std * StdDev)
            Lower = Middle - (num_std * StdDev)
            Bandwidth = (Upper - Lower) / Middle
        """
        middle = series.rolling(window=period, min_periods=period).mean()
        std = series.rolling(window=period, min_periods=period).std()
        upper = middle + (num_std * std)
        lower = middle - (num_std * std)
        bandwidth = (upper - lower) / middle.replace(0, np.nan)
        return upper, middle, lower, bandwidth

    @staticmethod
    def donchian_channels(high: pd.Series, low: pd.Series, period: int = 20) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        Donchian Channels.
        Upper = max_{period}(High), Lower = min_{period}(Low), Middle = (Upper + Lower) / 2
        """
        upper = high.rolling(window=period, min_periods=period).max()
        lower = low.rolling(window=period, min_periods=period).min()
        middle = (upper + lower) / 2.0
        return upper, middle, lower

    @staticmethod
    def adx(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        Average Directional Index (ADX) with +DI and -DI.
        Warm-up: 2 * period points.
        """
        up_move = high.diff()
        down_move = -low.diff()
        
        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
        
        plus_dm_s = pd.Series(plus_dm, index=high.index)
        minus_dm_s = pd.Series(minus_dm, index=high.index)
        
        atr_val = TechnicalIndicators.atr(high, low, close, period)
        
        smooth_plus_dm = plus_dm_s.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        smooth_minus_dm = minus_dm_s.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        
        plus_di = 100.0 * (smooth_plus_dm / atr_val.replace(0, np.nan))
        minus_di = 100.0 * (smooth_minus_dm / atr_val.replace(0, np.nan))
        
        dx_denom = (plus_di + minus_di).replace(0, np.nan)
        dx = 100.0 * (plus_di - minus_di).abs() / dx_denom
        adx = dx.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
        return adx, plus_di, minus_di

    @staticmethod
    def vwap(df: pd.DataFrame) -> pd.Series:
        """
        Volume Weighted Average Price (VWAP).
        Formula: Cumulative(Typical Price * Volume) / Cumulative(Volume)
        Typical Price = (High + Low + Close) / 3
        """
        typical_price = (df['high'] + df['low'] + df['close']) / 3.0
        cum_vol = df['volume'].cumsum()
        cum_tp_vol = (typical_price * df['volume']).cumsum()
        return cum_tp_vol / cum_vol.replace(0, np.nan)

    @staticmethod
    def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
        """
        On-Balance Volume (OBV).
        """
        diff = close.diff()
        direction = np.where(diff > 0, 1, np.where(diff < 0, -1, 0))
        direction[0] = 0
        signed_volume = volume * direction
        return signed_volume.cumsum()

    @staticmethod
    def rvol(volume: pd.Series, period: int = 20) -> pd.Series:
        """
        Relative Volume (RVOL) = Volume / SMA(Volume, period)
        """
        vol_sma = volume.rolling(window=period, min_periods=period).mean()
        return volume / vol_sma.replace(0, np.nan)

    @staticmethod
    def pivot_points(high: float, low: float, close: float) -> Dict[str, float]:
        """
        Classic Standard Floor Trader Pivot Points.
        P = (H + L + C) / 3
        R1 = 2*P - L, S1 = 2*P - H
        R2 = P + (H - L), S2 = P - (H - L)
        R3 = H + 2*(P - L), S3 = L - 2*(H - P)
        """
        p = (high + low + close) / 3.0
        r1 = 2.0 * p - low
        s1 = 2.0 * p - high
        r2 = p + (high - low)
        s2 = p - (high - low)
        r3 = high + 2.0 * (p - low)
        s3 = low - 2.0 * (high - p)
        return {
            "P": round(p, 2),
            "R1": round(r1, 2), "R2": round(r2, 2), "R3": round(r3, 2),
            "S1": round(s1, 2), "S2": round(s2, 2), "S3": round(s3, 2)
        }

    @staticmethod
    def detect_support_resistance(df: pd.DataFrame, window: int = 10) -> Dict[str, List[float]]:
        """
        Calculates local swing highs and swing lows across price history.
        """
        highs = df['high'].values
        lows = df['low'].values
        resistance_levels = []
        support_levels = []
        
        n = len(df)
        if n < 2 * window + 1:
            return {"support": [], "resistance": []}
            
        for i in range(window, n - window):
            if highs[i] == max(highs[i - window : i + window + 1]):
                resistance_levels.append(round(float(highs[i]), 2))
            if lows[i] == min(lows[i - window : i + window + 1]):
                support_levels.append(round(float(lows[i]), 2))
                
        # Deduplicate and return top 3 nearest
        last_close = df['close'].iloc[-1]
        supports = sorted(list(set(support_levels)), reverse=True)
        resistances = sorted(list(set(resistance_levels)))
        
        valid_supports = [s for s in supports if s < last_close][:3]
        valid_resistances = [r for r in resistances if r > last_close][:3]
        
        return {
            "support": valid_supports if valid_supports else [round(last_close * 0.95, 2)],
            "resistance": valid_resistances if valid_resistances else [round(last_close * 1.05, 2)]
        }

    @classmethod
    def compute_all_indicators(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Executes a full technical analysis sweep on an OHLCV DataFrame.
        """
        if df.empty or len(df) < 5:
            return {}
            
        c = df['close']
        h = df['high']
        l = df['low']
        v = df['volume']
        
        # Moving averages
        smas = {
            "5": round(float(cls.sma(c, 5).iloc[-1]), 2) if len(df) >= 5 else None,
            "10": round(float(cls.sma(c, 10).iloc[-1]), 2) if len(df) >= 10 else None,
            "20": round(float(cls.sma(c, 20).iloc[-1]), 2) if len(df) >= 20 else None,
            "50": round(float(cls.sma(c, 50).iloc[-1]), 2) if len(df) >= 50 else None,
            "100": round(float(cls.sma(c, 100).iloc[-1]), 2) if len(df) >= 100 else None,
            "200": round(float(cls.sma(c, 200).iloc[-1]), 2) if len(df) >= 200 else None,
        }
        
        emas = {
            "5": round(float(cls.ema(c, 5).iloc[-1]), 2) if len(df) >= 5 else None,
            "10": round(float(cls.ema(c, 10).iloc[-1]), 2) if len(df) >= 10 else None,
            "20": round(float(cls.ema(c, 20).iloc[-1]), 2) if len(df) >= 20 else None,
            "50": round(float(cls.ema(c, 50).iloc[-1]), 2) if len(df) >= 50 else None,
            "100": round(float(cls.ema(c, 100).iloc[-1]), 2) if len(df) >= 100 else None,
            "200": round(float(cls.ema(c, 200).iloc[-1]), 2) if len(df) >= 200 else None,
        }
        
        rsi_series = cls.rsi(c, 14)
        rsi_val = round(float(rsi_series.iloc[-1]), 2) if not pd.isna(rsi_series.iloc[-1]) else 50.0
        
        m_line, m_sig, m_hist = cls.macd(c, 12, 26, 9)
        macd_dict = {
            "line": round(float(m_line.iloc[-1]), 2) if not pd.isna(m_line.iloc[-1]) else 0.0,
            "signal": round(float(m_sig.iloc[-1]), 2) if not pd.isna(m_sig.iloc[-1]) else 0.0,
            "hist": round(float(m_hist.iloc[-1]), 2) if not pd.isna(m_hist.iloc[-1]) else 0.0,
        }
        
        stoch_k, stoch_d = cls.stochastic(h, l, c, 14, 3)
        stoch_dict = {
            "k": round(float(stoch_k.iloc[-1]), 2) if not pd.isna(stoch_k.iloc[-1]) else 50.0,
            "d": round(float(stoch_d.iloc[-1]), 2) if not pd.isna(stoch_d.iloc[-1]) else 50.0,
        }
        
        bb_u, bb_m, bb_l, bb_bw = cls.bollinger_bands(c, 20, 2.0)
        boll_dict = {
            "upper": round(float(bb_u.iloc[-1]), 2) if not pd.isna(bb_u.iloc[-1]) else round(float(c.iloc[-1]) * 1.05, 2),
            "middle": round(float(bb_m.iloc[-1]), 2) if not pd.isna(bb_m.iloc[-1]) else round(float(c.iloc[-1]), 2),
            "lower": round(float(bb_l.iloc[-1]), 2) if not pd.isna(bb_l.iloc[-1]) else round(float(c.iloc[-1]) * 0.95, 2),
            "bandwidth": round(float(bb_bw.iloc[-1]), 4) if not pd.isna(bb_bw.iloc[-1]) else 0.10,
        }
        
        adx_val, p_di, m_di = cls.adx(h, l, c, 14)
        atr_series = cls.atr(h, l, c, 14)
        rvol_series = cls.rvol(v, 20)
        obv_series = cls.obv(c, v)
        vwap_series = cls.vwap(df)
        
        # Determine Overall Trend State
        last_c = c.iloc[-1]
        sma_20_val = smas["20"] or last_c
        sma_50_val = smas["50"] or last_c
        
        if last_c > sma_20_val > sma_50_val and rsi_val > 55:
            trend_state = "STRONG_BULLISH"
        elif last_c > sma_50_val:
            trend_state = "BULLISH"
        elif last_c < sma_20_val < sma_50_val and rsi_val < 45:
            trend_state = "STRONG_BEARISH"
        elif last_c < sma_50_val:
            trend_state = "BEARISH"
        else:
            trend_state = "SIDEWAYS"
            
        pivots = cls.pivot_points(h.iloc[-1], l.iloc[-1], c.iloc[-1])
        sr_levels = cls.detect_support_resistance(df)
        
        return {
            "sma": smas,
            "ema": emas,
            "rsi_14": rsi_val,
            "macd": macd_dict,
            "stochastic": stoch_dict,
            "adx_14": round(float(adx_val.iloc[-1]), 2) if not pd.isna(adx_val.iloc[-1]) else 20.0,
            "atr_14": round(float(atr_series.iloc[-1]), 2) if not pd.isna(atr_series.iloc[-1]) else 10.0,
            "bollinger": boll_dict,
            "vwap": round(float(vwap_series.iloc[-1]), 2) if not pd.isna(vwap_series.iloc[-1]) else round(last_c, 2),
            "obv": int(obv_series.iloc[-1]) if not pd.isna(obv_series.iloc[-1]) else 0,
            "rvol": round(float(rvol_series.iloc[-1]), 2) if not pd.isna(rvol_series.iloc[-1]) else 1.0,
            "pivot_points": pivots,
            "support_resistance": sr_levels,
            "trend_state": trend_state
        }
