"""
BYOE (Bring Your Own Endpoint) AI describer for schema documentation.

Same pattern as QueryOptimizer's AI assistant: the user configures their own
endpoint + key (OpenAI-compatible, Anthropic, Ollama, or generic JSON),
stored locally in app_settings. The server calls the LLM, so the key never
leaves the machine it runs on.
"""
from __future__ import annotations
import json
import urllib.request
import urllib.error

from database import get_conn


# ── Config ───────────────────────────────────────────────────────────────────

def _get_setting(key: str, fallback: str = "") -> str:
    with get_conn() as db:
        row = db.execute("SELECT value FROM app_settings WHERE key=?", (key,)).fetchone()
    return row["value"] if row and row["value"] else fallback


def get_ai_config() -> dict:
    cfg = {
        "endpoint": _get_setting("AI_ENDPOINT", ""),
        "api_key":  _get_setting("AI_API_KEY", ""),
        "model":    _get_setting("AI_MODEL", ""),
        "provider": _get_setting("AI_PROVIDER", "openai"),
    }
    return {**cfg, "enabled": bool(cfg["endpoint"])}


def save_ai_config(endpoint: str, api_key: str, model: str, provider: str):
    with get_conn() as db:
        for k, v in (("AI_ENDPOINT", endpoint), ("AI_API_KEY", api_key),
                     ("AI_MODEL", model), ("AI_PROVIDER", provider)):
            db.execute(
                "INSERT INTO app_settings(key,value) VALUES(?,?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value", (k, v))


# ── LLM call ─────────────────────────────────────────────────────────────────

_SYSTEM = (
    "You are an expert data architect. Given a database table and its columns, "
    "write concise, practical descriptions. Return ONLY valid JSON (no markdown fences) "
    "with these keys:\n"
    '  table_description: string — what this table stores, one or two sentences\n'
    '  columns: object — map each column name to a one-sentence description\n'
)


def _openai_request(prompt: str, cfg: dict) -> str:
    body = json.dumps({
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(
        cfg["endpoint"].rstrip("/") + "/chat/completions", data=body,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {cfg['api_key']}"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = json.loads(resp.read().decode())
    return raw["choices"][0]["message"]["content"]


def _ollama_request(prompt: str, cfg: dict) -> str:
    body = json.dumps({
        "model": cfg["model"],
        "system": _SYSTEM,
        "prompt": prompt,
        "stream": False,
    }).encode()
    req = urllib.request.Request(
        cfg["endpoint"].rstrip("/") + "/api/generate", data=body,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())["response"]


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    return text.strip()


def describe_table(schema: str, name: str, columns: list[dict],
                   foreign_keys: list[dict] | None = None) -> dict:
    cfg = get_ai_config()
    if not cfg["enabled"]:
        raise ValueError("AI is not configured — set your endpoint in Settings first.")
    col_lines = "\n".join(
        f"  - {c['name']} ({c.get('type', '')})"
        f"{' PK' if c.get('primary_key') else ''}"
        f"{'' if c.get('nullable', True) else ' NOT NULL'}"
        for c in columns)
    fk_lines = "\n".join(
        f"  - {fk['column']} → {fk['ref_schema']}.{fk['ref_table']}.{fk['ref_column']}"
        for fk in (foreign_keys or []))
    prompt = (
        f"Table: {schema}.{name}\nColumns:\n{col_lines}\n"
        + (f"Foreign keys:\n{fk_lines}\n" if fk_lines else "")
        + "\nWrite descriptions for the table and every column listed."
    )
    if cfg["provider"] == "ollama":
        text = _ollama_request(prompt, cfg)
    else:
        text = _openai_request(prompt, cfg)
    data = json.loads(_strip_fences(text))
    cols = data.get("columns") or {}
    return {
        "table_description": data.get("table_description", ""),
        "columns": {str(k): str(v) for k, v in cols.items()},
    }
