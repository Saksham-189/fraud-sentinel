"""
config/dynamic_state.py
──────────────────────
Runtime-tunable configuration persisted in SQLite.

This replaces file-based persistence (e.g., dynamic_config.json) while keeping
the rest of the system architecture intact: core logic reads config through
the config layer, not directly from API modules.
"""

from __future__ import annotations

import json
import os
import sqlite3
from typing import Any


def _db_path() -> str:
    # The DB is owned/initialized by the API layer under api/fraud.db
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(project_root, "api", "fraud.db")


def load_dynamic_config() -> dict[str, Any]:
    """
    Load dynamic thresholds/config from SQLite.

    Returns defaults if DB/table doesn't exist yet.
    """
    defaults = {
        "high_risk_threshold": 0.55,
        "medium_risk_threshold": 0.30,
    }

    db_path = _db_path()
    if not os.path.exists(db_path):
        return defaults

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM dynamic_config")
        rows = cur.fetchall()
        conn.close()
    except Exception:
        return defaults

    if not rows:
        return defaults

    out: dict[str, Any] = {}
    for r in rows:
        try:
            out[r["key"]] = json.loads(r["value"])
        except Exception:
            out[r["key"]] = r["value"]

    for k, v in defaults.items():
        out.setdefault(k, v)
    return out

