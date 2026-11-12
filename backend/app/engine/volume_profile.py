"""
Institutional Order Flow Volume Profile & Multi-Anchored VWAP (AVWAP) Engine.
Computes Point of Control (POC), Value Area (VAH/VAL at 70% threshold),
Low/High Volume Nodes, and Dynamic Anchored VWAP Bands from structural pivots.
"""

from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
import math

class VolumeProfileEngine:
    @staticmethod
    def compute_volume_profile(
        df: pd.DataFrame,
        bins: int = 30,
        value_area_pct: float = 0.70
    ) -> Dict[str, Any]:
        """
        Computes price-volume distribution, Point of Control (POC), Value Area High (VAH),
        Value Area Low (VAL), and Low Volume Nodes (LVN).
        """
        if df.empty or len(df) < 5:
            return {
                "poc": 0.0,
                "vah": 0.0,
                "val": 0.0,
                "total_volume": 0,
                "profile_bins": [],
                "low_volume_nodes": [],
                "high_volume_nodes": []
            }

        high_max = float(df['high'].max())
        low_min = float(df['low'].min())
        total_vol = int(df['volume'].sum())

        if high_max <= low_min:
            high_max = low_min + 1.0

        price_step = (high_max - low_min) / float(bins)
        bin_edges = [low_min + i * price_step for i in range(bins + 1)]
        bin_volumes = [0.0] * bins

        # Distribute volume across candle ranges
        for _, row in df.iterrows():
            c_high = float(row['high'])
            c_low = float(row['low'])
            c_vol = float(row['volume'])
            c_range = max(0.05, c_high - c_low)

            for b_idx in range(bins):
                b_low = bin_edges[b_idx]
                b_high = bin_edges[b_idx + 1]

                # Calculate overlap between candle and bin
                overlap = max(0.0, min(c_high, b_high) - max(c_low, b_low))
                if overlap > 0:
                    bin_volumes[b_idx] += c_vol * (overlap / c_range)

        # Convert to structured profile
        profile = []
        for b_idx in range(bins):
            b_mid = round((bin_edges[b_idx] + bin_edges[b_idx + 1]) / 2.0, 2)
            profile.append({
                "price": b_mid,
                "price_low": round(bin_edges[b_idx], 2),
                "price_high": round(bin_edges[b_idx + 1], 2),
                "volume": int(bin_volumes[b_idx]),
                "volume_pct": round((bin_volumes[b_idx] / max(1.0, total_vol)) * 100.0, 2)
            })

        # Find Point of Control (POC)
        max_bin = max(profile, key=lambda x: x["volume"])
        poc = max_bin["price"]
        poc_idx = profile.index(max_bin)

        # Calculate Value Area (70% of total volume radiating out from POC)
        target_va_vol = total_vol * value_area_pct
        accumulated_vol = max_bin["volume"]
        up_idx = poc_idx
        down_idx = poc_idx

        while accumulated_vol < target_va_vol and (up_idx < bins - 1 or down_idx > 0):
            next_up_vol = profile[up_idx + 1]["volume"] if up_idx < bins - 1 else 0
            next_down_vol = profile[down_idx - 1]["volume"] if down_idx > 0 else 0

            if next_up_vol >= next_down_vol and up_idx < bins - 1:
                up_idx += 1
                accumulated_vol += next_up_vol
            elif down_idx > 0:
                down_idx -= 1
                accumulated_vol += next_down_vol
            elif up_idx < bins - 1:
                up_idx += 1
                accumulated_vol += next_up_vol
            else:
                break

        vah = profile[up_idx]["price_high"]
        val = profile[down_idx]["price_low"]

        # Detect High Volume Nodes (HVNs) and Low Volume Nodes (LVNs)
        avg_vol = np.mean(bin_volumes)
        hvns = [b["price"] for b in profile if b["volume"] > avg_vol * 1.45]
        lvns = [b["price"] for b in profile if b["volume"] < avg_vol * 0.45 and b["volume"] > 0]

        # Current Price Location relative to Value Area
        last_close = float(df['close'].iloc[-1])
        if last_close > vah:
            va_status = "ABOVE_VALUE_AREA"
            va_thesis = "Trading at an institutional premium above VAH. Watch for rejection back inside or expansion runner."
        elif last_close < val:
            va_status = "BELOW_VALUE_AREA"
            va_thesis = "Trading at an institutional discount below VAL. Invalidation breakdown or short-covering recovery candidate."
        else:
            va_status = "INSIDE_VALUE_AREA"
            va_thesis = "Accepted within the 70% institutional Value Area. POC acts as a magnetic mean-reversion target."

        return {
            "poc": poc,
            "vah": vah,
            "val": val,
            "last_close": last_close,
            "va_status": va_status,
            "va_thesis": va_thesis,
            "total_volume": total_vol,
            "profile_bins": profile,
            "high_volume_nodes": hvns[:4],
            "low_volume_nodes": lvns[:4]
        }

    @staticmethod
    def compute_anchored_vwap(
        df: pd.DataFrame,
        anchor_indices: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Computes Anchored VWAP and Volatility Dispersion Bands (+-1SD, +-2SD)
        from critical structural market pivots (Session Start, Swing High, Swing Low).
        """
        if df.empty or len(df) < 5:
            return {"anchored_series": {}}

        closes = df['close'].values
        highs = df['high'].values
        lows = df['low'].values
        volumes = df['volume'].values
        typical_prices = (highs + lows + closes) / 3.0

        n = len(df)

        # Detect structural anchors if not specified
        # 1. Start of sequence (Session / Month Anchor)
        # 2. Local Swing High Anchor (Peak in last 30 bars)
        # 3. Local Swing Low Anchor (Trough in last 30 bars)
        lookback = min(30, n - 1)
        recent_window = typical_prices[-lookback:]
        high_offset = int(np.argmax(recent_window))
        low_offset = int(np.argmin(recent_window))

        high_anchor_idx = (n - lookback) + high_offset
        low_anchor_idx = (n - lookback) + low_offset
        start_anchor_idx = 0

        anchors_to_run = [
            ("session_start", start_anchor_idx, "Period Sequence Start"),
            ("swing_high", high_anchor_idx, f"Swing Peak Pivot (₹{typical_prices[high_anchor_idx]:.2f})"),
            ("swing_low", low_anchor_idx, f"Swing Trough Pivot (₹{typical_prices[low_anchor_idx]:.2f})")
        ]

        results = {}

        for anchor_name, idx_start, desc in anchors_to_run:
            cum_vol = 0.0
            cum_pv = 0.0
            cum_pv_sq = 0.0

            avwap_vals = [None] * n
            upper_1sd = [None] * n
            lower_1sd = [None] * n
            upper_2sd = [None] * n
            lower_2sd = [None] * n

            for i in range(idx_start, n):
                v = float(volumes[i])
                tp = float(typical_prices[i])

                cum_vol += v
                cum_pv += tp * v
                cum_pv_sq += (tp ** 2) * v

                if cum_vol > 0:
                    vw = cum_pv / cum_vol
                    # Variance = E[X^2] - (E[X])^2
                    variance = max(0.0, (cum_pv_sq / cum_vol) - (vw ** 2))
                    std = math.sqrt(variance)

                    avwap_vals[i] = round(vw, 2)
                    upper_1sd[i] = round(vw + std, 2)
                    lower_1sd[i] = round(vw - std, 2)
                    upper_2sd[i] = round(vw + 2.0 * std, 2)
                    lower_2sd[i] = round(vw - 2.0 * std, 2)

            curr_vwap = avwap_vals[-1] or float(closes[-1])
            curr_close = float(closes[-1])
            disp_pct = round(((curr_close - curr_vwap) / curr_vwap) * 100.0, 2)

            results[anchor_name] = {
                "anchor_index": idx_start,
                "anchor_description": desc,
                "current_avwap": curr_vwap,
                "upper_1sd": upper_1sd[-1] or curr_vwap,
                "lower_1sd": lower_1sd[-1] or curr_vwap,
                "upper_2sd": upper_2sd[-1] or curr_vwap,
                "lower_2sd": lower_2sd[-1] or curr_vwap,
                "deviation_pct": disp_pct,
                "is_above_avwap": curr_close >= curr_vwap
            }

        return results

volume_engine = VolumeProfileEngine()
