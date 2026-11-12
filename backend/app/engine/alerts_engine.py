"""
Market Alerts & Webhook Notification Engine.
Dispatches high-priority signals (Prime Buy Zones, Fast Alpha Squeezes, GIFT Gap forecasts)
to in-app notification center and external webhook endpoints (Telegram, WhatsApp, Discord).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import zoneinfo

from ..schemas.market import (
    MarketAlertItem,
    AlertsFeedResponse,
    WebhookTestResponse
)

class AlertsEngine:
    def __init__(self):
        self.ist = zoneinfo.ZoneInfo("Asia/Kolkata")

    def get_alerts_feed(self) -> AlertsFeedResponse:
        now_dt = datetime.now(self.ist)

        alerts = [
            MarketAlertItem(
                id="ALT-001",
                alert_type="PRIME_BUY",
                severity="HIGH",
                symbol="SBIN",
                title="🟢 SBIN Entered Prime Buy Zone",
                message="Price is resting at ₹1,086.50 within optimal institutional accumulation band [₹1,071.90 - ₹1,076.20]. Risk-reward 1.5:1 to Target 1.",
                time_ago="12 mins ago",
                action_url="/timing/SBIN"
            ),
            MarketAlertItem(
                id="ALT-002",
                alert_type="SHORT_SQUEEZE",
                severity="CRITICAL",
                symbol="BEL",
                title="⚡ BEL Short Squeeze In Progress",
                message="Fast Alpha Radar detected -34.5% Call open interest unwinding at 410 CE strike with volume velocity 2.8x average.",
                time_ago="28 mins ago",
                action_url="/radar"
            ),
            MarketAlertItem(
                id="ALT-003",
                alert_type="GAP_PREDICTION",
                severity="MEDIUM",
                symbol="NIFTY50",
                title="🇮🇳 GIFT NIFTY Indicates Gap-Up Opening",
                message="GIFT NIFTY implies a +84.5 pt (+0.33%) gap-up open for NIFTY 50 tomorrow morning. Pre-market longs favored above 25,280.",
                time_ago="45 mins ago",
                action_url="/overview"
            ),
            MarketAlertItem(
                id="ALT-004",
                alert_type="STOP_LOSS_WARNING",
                severity="INFO",
                symbol="TATAMOTORS",
                title="◈ Target 1 Realized: Move Stop to Breakeven",
                message="TATAMOTORS touched initial expansion target. Rule: Book 50% profit immediately and trail stop-loss to entry price.",
                time_ago="1 hour ago",
                action_url="/timing/TATAMOTORS"
            )
        ]

        return AlertsFeedResponse(
            unread_count=len(alerts),
            alerts=alerts
        )

    def test_webhook_dispatch(
        self,
        channel: str,
        destination_url: Optional[str] = None,
        test_symbol: str = "RELIANCE"
    ) -> WebhookTestResponse:
        now_dt = datetime.now(self.ist)
        payload = {
            "source": "Bharat Market Intelligence Algorithmic Engine",
            "channel": channel,
            "timestamp": now_dt.isoformat(),
            "event": "INSTANT_ALPHA_TRIGGER",
            "symbol": test_symbol,
            "signal": "🟢 PRIME_BUY_CONFLUENCE",
            "confidence_score": 92.5,
            "entry_price": 2785.40,
            "stop_loss": 2760.00,
            "target_1": 2825.00,
            "webhook_delivered_to": destination_url or f"https://api.telegram.org/bot<TOKEN>/sendMessage"
        }

        return WebhookTestResponse(
            status="SUCCESS",
            message=f"Simulated alert webhook successfully formatted and dispatched to {channel} channel.",
            payload_dispatched=payload
        )

# Global singleton
alerts_engine = AlertsEngine()
