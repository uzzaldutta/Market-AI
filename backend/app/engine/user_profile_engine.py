"""
User Profile & Personalization Engine for Bharat Market Intelligence.
Provides user-wise persistent storage for custom scrips, personalized risk/budget parameters,
custom algorithmic alert rules/scripts, and personalized trade recommendations.
Storage: database/user_profiles/{user_id}.json
"""

import os
import json
import uuid
import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path

from ..schemas.market import (
    UserProfileSettings, UserScripItem, UserCustomScriptRule,
    AddScripRequest, UpdateScripRequest, AddCustomScriptRuleRequest,
    UpdateUserProfileRequest, AutoAlertItem
)
from ..providers.manager import get_market_data_provider
from ..core.nse_instruments import NSE_SYMBOL_INDEX

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
STORAGE_DIR = PROJECT_ROOT / "database" / "user_profiles"

class UserProfileEngine:
    def __init__(self):
        self.storage_dir = STORAGE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.cache: Dict[str, UserProfileSettings] = {}
        self._ensure_default_user()

    def _get_file_path(self, user_id: str) -> Path:
        safe_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_")).lower() or "default_user"
        return self.storage_dir / f"{safe_id}.json"

    def _ensure_default_user(self):
        default_file = self._get_file_path("default_user")
        if not default_file.exists():
            now = datetime.datetime.now().isoformat()
            default_profile = UserProfileSettings(
                user_id="default_user",
                display_name="Retail Small Account Trader",
                email="retail.trader@bharatmarket.in",
                budget_tier="UNDER_5K",
                risk_appetite="BALANCED",
                max_capital_per_trade_inr=5000.0,
                max_daily_loss_limit_inr=-1500.0,
                preferred_instruments=["INDEX_OPTION", "CASH_EQUITY"],
                preferred_exchanges=["NSE", "BSE"],
                sound_alerts_enabled=True,
                auto_execute_paper_trades=False,
                theme="dark",
                scrips=[
                    UserScripItem(
                        scrip_id="SCRIP-TATAMOTORS",
                        symbol="TATAMOTORS",
                        name="Tata Motors Ltd",
                        exchange="NSE",
                        instrument_type="CASH_EQUITY",
                        target_entry_price=835.0,
                        alert_condition="PRICE_BELOW",
                        notes="Accumulate near 20 EMA on support bounce",
                        custom_budget_inr=8400.0,
                        current_price=840.0,
                        change_pct=1.45,
                        is_active=True,
                        alert_triggered=False,
                        created_at=now
                    ),
                    UserScripItem(
                        scrip_id="SCRIP-FEDERALBNK",
                        symbol="FEDERALBNK",
                        name="Federal Bank Ltd",
                        exchange="NSE",
                        instrument_type="CASH_EQUITY",
                        target_entry_price=193.0,
                        alert_condition="PRICE_BELOW",
                        notes="Low ticket stock ideal for compounding small retail profits",
                        custom_budget_inr=4000.0,
                        current_price=195.0,
                        change_pct=2.1,
                        is_active=True,
                        alert_triggered=False,
                        created_at=now
                    ),
                    UserScripItem(
                        scrip_id="SCRIP-NIFTY-25400CE",
                        symbol="NIFTY 25400 CE",
                        name="NIFTY 50 Weekly Call",
                        exchange="NSE",
                        instrument_type="INDEX_OPTION",
                        target_entry_price=72.0,
                        alert_condition="BREAKOUT_VOLUME",
                        notes="Morning momentum breakout call under ₹5,000",
                        custom_budget_inr=3650.0,
                        current_price=73.0,
                        change_pct=4.8,
                        is_active=True,
                        alert_triggered=True,
                        created_at=now
                    )
                ],
                custom_rules=[
                    UserCustomScriptRule(
                        script_id="RULE-MOMENTUM-SURGE",
                        title="Morning Momentum Surge Breakout",
                        description="Triggers high-conviction buy alert when volume expands > 1.8x with bullish 5m MACD",
                        indicator="VOLUME_SURGE",
                        condition_operator="GREATER_THAN",
                        threshold_value=1.8,
                        action_message="Heavy institutional buyer aggression detected",
                        is_enabled=True,
                        created_at=now
                    ),
                    UserCustomScriptRule(
                        script_id="RULE-RSI-OVERSOLD",
                        title="RSI Oversold Dip-Buyer Rule",
                        description="Triggers swing accumulation alert when 15m RSI dips below 30",
                        indicator="RSI",
                        condition_operator="LESS_THAN",
                        threshold_value=30.0,
                        action_message="Stock is technically oversold; risk-reward ratio is optimal",
                        is_enabled=True,
                        created_at=now
                    )
                ],
                updated_at=now
            )
            self._save_to_disk(default_profile)

    def _save_to_disk(self, profile: UserProfileSettings):
        file_path = self._get_file_path(profile.user_id)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(profile.model_dump_json(indent=2))
        self.cache[profile.user_id] = profile

    def get_profile(self, user_id: str = "default_user") -> UserProfileSettings:
        """Retrieves user profile from cache or disk with refreshed quote telemetry."""
        safe_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_")).lower() or "default_user"
        file_path = self._get_file_path(safe_id)

        if not file_path.exists():
            # Auto-create profile cloned from default settings
            now = datetime.datetime.now().isoformat()
            new_profile = UserProfileSettings(
                user_id=safe_id,
                display_name=f"User {safe_id.capitalize()}",
                email=f"{safe_id}@bharatmarket.in",
                updated_at=now
            )
            self._save_to_disk(new_profile)
            return new_profile

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            profile = UserProfileSettings(**data)

        # Refresh live quote telemetry for watched scrips
        try:
            provider = get_market_data_provider()
            for scrip in profile.scrips:
                clean_sym = scrip.symbol.split(" ")[0].upper()
                try:
                    q = provider.get_quote(clean_sym)
                    scrip.current_price = q.get("ltp", scrip.current_price or 100.0)
                    scrip.change_pct = q.get("change_pct", scrip.change_pct or 0.0)
                    # Check alert condition trigger
                    if scrip.target_entry_price and scrip.current_price:
                        if scrip.alert_condition == "PRICE_BELOW" and scrip.current_price <= scrip.target_entry_price:
                            scrip.alert_triggered = True
                        elif scrip.alert_condition == "PRICE_ABOVE" and scrip.current_price >= scrip.target_entry_price:
                            scrip.alert_triggered = True
                        elif scrip.alert_condition == "ANY":
                            scrip.alert_triggered = abs(scrip.current_price - scrip.target_entry_price) <= (scrip.target_entry_price * 0.02)
                except Exception:
                    pass
        except Exception:
            pass

        self.cache[safe_id] = profile
        return profile

    def update_profile(self, user_id: str, req: UpdateUserProfileRequest) -> UserProfileSettings:
        """Updates user personalization settings (budget, risk limits, preferences)."""
        profile = self.get_profile(user_id)
        update_data = req.model_dump(exclude_unset=True)

        for k, v in update_data.items():
            if v is not None:
                setattr(profile, k, v)

        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def add_scrip(self, user_id: str, req: AddScripRequest) -> UserProfileSettings:
        """Adds a personalized stock/contract scrip to the user's saved watchlist."""
        profile = self.get_profile(user_id)
        sym_clean = req.symbol.strip().upper()

        # Check existing
        for s in profile.scrips:
            if s.symbol.upper() == sym_clean:
                # Update existing
                if req.target_entry_price is not None:
                    s.target_entry_price = req.target_entry_price
                if req.notes is not None:
                    s.notes = req.notes
                if req.custom_budget_inr is not None:
                    s.custom_budget_inr = req.custom_budget_inr
                s.is_active = True
                profile.updated_at = datetime.datetime.now().isoformat()
                self._save_to_disk(profile)
                return profile

        # Fetch meta if available
        meta = NSE_SYMBOL_INDEX.get(sym_clean.split(" ")[0], {})
        name = req.name or meta.get("name", sym_clean)

        # Get initial quote
        ltp = req.target_entry_price or 100.0
        chg = 0.0
        try:
            provider = get_market_data_provider()
            q = provider.get_quote(sym_clean.split(" ")[0])
            ltp = q.get("ltp", ltp)
            chg = q.get("change_pct", 0.0)
        except Exception:
            pass

        scrip_id = f"SCRIP-{uuid.uuid4().hex[:8].upper()}"
        new_scrip = UserScripItem(
            scrip_id=scrip_id,
            symbol=sym_clean,
            name=name,
            exchange=req.exchange or "NSE",
            instrument_type=req.instrument_type or "CASH_EQUITY",
            target_entry_price=req.target_entry_price,
            alert_condition=req.alert_condition or "ANY",
            notes=req.notes,
            custom_budget_inr=req.custom_budget_inr or 5000.0,
            current_price=ltp,
            change_pct=chg,
            is_active=True,
            alert_triggered=False,
            created_at=datetime.datetime.now().isoformat()
        )

        profile.scrips.insert(0, new_scrip)
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def update_scrip(self, user_id: str, scrip_id: str, req: UpdateScripRequest) -> UserProfileSettings:
        """Modifies alert target price, notes, or active status of a user's scrip."""
        profile = self.get_profile(user_id)
        for s in profile.scrips:
            if s.scrip_id == scrip_id:
                if req.target_entry_price is not None:
                    s.target_entry_price = req.target_entry_price
                if req.alert_condition is not None:
                    s.alert_condition = req.alert_condition
                if req.notes is not None:
                    s.notes = req.notes
                if req.custom_budget_inr is not None:
                    s.custom_budget_inr = req.custom_budget_inr
                if req.is_active is not None:
                    s.is_active = req.is_active
                break

        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def delete_scrip(self, user_id: str, scrip_id: str) -> UserProfileSettings:
        """Deletes a custom scrip from the user's personal profile."""
        profile = self.get_profile(user_id)
        profile.scrips = [s for s in profile.scrips if s.scrip_id != scrip_id]
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def add_custom_rule(self, user_id: str, req: AddCustomScriptRuleRequest) -> UserProfileSettings:
        """Saves a user's personalized algorithmic script/rule."""
        profile = self.get_profile(user_id)
        rule_id = f"RULE-{uuid.uuid4().hex[:8].upper()}"

        new_rule = UserCustomScriptRule(
            script_id=rule_id,
            title=req.title,
            description=req.description,
            indicator=req.indicator,
            condition_operator=req.condition_operator,
            threshold_value=req.threshold_value,
            action_message=req.action_message,
            is_enabled=True,
            created_at=datetime.datetime.now().isoformat()
        )

        profile.custom_rules.insert(0, new_rule)
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def delete_custom_rule(self, user_id: str, script_id: str) -> UserProfileSettings:
        """Deletes a custom script rule."""
        profile = self.get_profile(user_id)
        profile.custom_rules = [r for r in profile.custom_rules if r.script_id != script_id]
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def list_available_users(self) -> List[Dict[str, str]]:
        """Lists all user profiles saved on disk."""
        users = []
        for file in self.storage_dir.glob("*.json"):
            u_id = file.stem
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    users.append({
                        "user_id": u_id,
                        "display_name": data.get("display_name", u_id),
                        "budget_tier": data.get("budget_tier", "UNDER_5K"),
                        "scrips_count": str(len(data.get("scrips", [])))
                    })
            except Exception:
                users.append({"user_id": u_id, "display_name": u_id, "budget_tier": "UNDER_5K", "scrips_count": "0"})
        return users

    def toggle_scrip_alert(self, user_id: str, scrip_id: str) -> UserProfileSettings:
        """Toggles the alert_triggered state of a user's scrip (useful for testing simulation)."""
        profile = self.get_profile(user_id)
        for s in profile.scrips:
            if s.scrip_id == scrip_id:
                s.alert_triggered = not s.alert_triggered
                break
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def toggle_rule(self, user_id: str, script_id: str) -> UserProfileSettings:
        """Toggles is_enabled state of a user's custom script rule."""
        profile = self.get_profile(user_id)
        for r in profile.custom_rules:
            if r.script_id == script_id:
                r.is_enabled = not r.is_enabled
                break
        profile.updated_at = datetime.datetime.now().isoformat()
        self._save_to_disk(profile)
        return profile

    def delete_user_profile(self, user_id: str) -> bool:
        """Deletes a custom user profile file from disk (default_user is preserved)."""
        safe_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_")).lower()
        if safe_id == "default_user":
            return False
        file_path = self._get_file_path(safe_id)
        if file_path.exists():
            file_path.unlink()
            if safe_id in self.cache:
                del self.cache[safe_id]
            return True
        return False

    def get_user_alerts(self, user_id: str) -> List[AutoAlertItem]:
        """Synthesizes active trade alerts for the user's custom monitored scrips."""
        profile = self.get_profile(user_id)
        alerts: List[AutoAlertItem] = []
        for scrip in profile.scrips:
            if not scrip.is_active:
                continue
            
            entry_price = scrip.target_entry_price or scrip.current_price or 100.0
            cur_price = scrip.current_price or entry_price
            budget = scrip.custom_budget_inr or profile.max_capital_per_trade_inr or 5000.0
            
            # Target 1 (+5%), Target 2 (+10%), Stop Loss (-4%)
            sl_price = round(entry_price * 0.96, 1)
            t1_price = round(entry_price * 1.05, 1)
            t2_price = round(entry_price * 1.10, 1)
            
            max_loss = round(-1 * budget * 0.04, 1)
            t1_profit = round(budget * 0.05, 1)
            t2_profit = round(budget * 0.10, 1)
            
            status = "IN_BUY_ZONE" if scrip.alert_triggered else "MONITORING"
            action_desc = scrip.alert_condition.replace("_", " ")

            alerts.append(
                AutoAlertItem(
                    alert_id=f"USER-ALERT-{scrip.scrip_id}",
                    headline=f"⭐ MY RADAR: {scrip.symbol} ({action_desc})",
                    symbol=scrip.symbol,
                    exchange=scrip.exchange,
                    asset_name=scrip.name or scrip.symbol,
                    contract_display=scrip.symbol,
                    instrument_type=scrip.instrument_type,
                    option_type="CE" if "CE" in scrip.symbol else ("PE" if "PE" in scrip.symbol else None),
                    action="BUY",
                    budget_tier=profile.budget_tier,
                    capital_required_inr=budget,
                    lot_size=1 if scrip.instrument_type == "CASH_EQUITY" else 50,
                    recommended_lots=1,
                    entry_price_min=round(entry_price * 0.99, 1),
                    entry_price_max=round(entry_price * 1.01, 1),
                    current_price=cur_price,
                    best_entry_time="Personalized Scrip Alert Active",
                    order_valid_till="Valid per your custom rule",
                    stop_loss_price=sl_price,
                    target_1_price=t1_price,
                    target_2_price=t2_price,
                    max_loss_inr=max_loss,
                    target_1_profit_inr=t1_profit,
                    target_2_profit_inr=t2_profit,
                    risk_reward_ratio=2.5,
                    win_probability_pct=90.0,
                    plain_english_reason=scrip.notes or f"Matched your personal rule '{action_desc}' with target entry ₹{entry_price}.",
                    status=status,
                    time_horizon="SWING" if scrip.instrument_type == "CASH_EQUITY" else "INTRADAY",
                    created_at=scrip.created_at
                )
            )
        return alerts

# Global Singleton
user_profile_engine = UserProfileEngine()
