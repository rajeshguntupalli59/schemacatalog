"""
Schema snapshots — save a point-in-time copy of a scanned schema and
diff any two schemas (snapshot vs snapshot, or snapshot vs live scan).
"""
from __future__ import annotations
import json
import time
from database import get_conn


def init_snapshots_table():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS snapshots (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT NOT NULL,
                db_type    TEXT NOT NULL DEFAULT '',
                database   TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                schema_json TEXT NOT NULL
            )
        """)


def save_snapshot(name: str, db_type: str, database: str, schema: dict) -> int:
    init_snapshots_table()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO snapshots(name, db_type, database, created_at, schema_json)"
            " VALUES(?, ?, ?, ?, ?)",
            (name.strip() or "Snapshot", db_type, database, int(time.time()),
             json.dumps(schema)),
        )
        return cur.lastrowid


def list_snapshots() -> list[dict]:
    init_snapshots_table()
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, db_type, database, created_at,"
            "       json_array_length(json_extract(schema_json, '$.tables')) AS table_count"
            " FROM snapshots ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_snapshot(snap_id: int) -> dict | None:
    init_snapshots_table()
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, name, db_type, database, created_at, schema_json"
            " FROM snapshots WHERE id = ?", (snap_id,)
        ).fetchone()
    if not row:
        return None
    d = dict(row)
    d["schema"] = json.loads(d.pop("schema_json"))
    return d


def delete_snapshot(snap_id: int) -> bool:
    init_snapshots_table()
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM snapshots WHERE id = ?", (snap_id,))
        return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Diff
# ---------------------------------------------------------------------------

def _tkey(t: dict) -> tuple:
    return (t.get("schema", ""), t.get("name", ""))


def _col_sig(c: dict) -> dict:
    return {
        "type":        (c.get("type") or "").lower(),
        "nullable":    bool(c.get("nullable")),
        "default":     c.get("default"),
        "primary_key": bool(c.get("primary_key")),
        "description": c.get("description") or "",
    }


def _idx_sig(i: dict) -> tuple:
    cols = i.get("columns")
    if isinstance(cols, list):
        cols = ",".join(cols)
    return ((cols or "").lower(), bool(i.get("unique")), bool(i.get("primary")))


def _fk_sig(f: dict) -> tuple:
    return (f.get("column"), f.get("ref_schema"), f.get("ref_table"), f.get("ref_column"))


def _norm_def(definition: str) -> str:
    return " ".join((definition or "").split()).lower()


def diff_schemas(base: dict, target: dict) -> dict:
    """Compare two scan-result dicts. Returns grouped changes base -> target."""
    diff: dict = {
        "tables_added": [], "tables_removed": [],
        "columns_added": [], "columns_removed": [], "columns_changed": [],
        "indexes_added": [], "indexes_removed": [], "indexes_changed": [],
        "fks_added": [], "fks_removed": [],
        "views_added": [], "views_removed": [], "views_changed": [],
    }

    b_tables = {_tkey(t): t for t in base.get("tables", [])}
    t_tables = {_tkey(t): t for t in target.get("tables", [])}

    for key in sorted(set(t_tables) - set(b_tables)):
        diff["tables_added"].append({"schema": key[0], "name": key[1]})
    for key in sorted(set(b_tables) - set(t_tables)):
        diff["tables_removed"].append({"schema": key[0], "name": key[1]})

    for key in sorted(set(b_tables) & set(t_tables)):
        bt, tt = b_tables[key], t_tables[key]
        label = f"{key[0]}.{key[1]}" if key[0] else key[1]

        b_cols = {c["name"]: c for c in bt.get("columns", [])}
        t_cols = {c["name"]: c for c in tt.get("columns", [])}
        for name in sorted(set(t_cols) - set(b_cols)):
            diff["columns_added"].append({"table": label, "column": t_cols[name]})
        for name in sorted(set(b_cols) - set(t_cols)):
            diff["columns_removed"].append({"table": label, "column": b_cols[name]})
        for name in sorted(set(b_cols) & set(t_cols)):
            bs, ts = _col_sig(b_cols[name]), _col_sig(t_cols[name])
            changes = {k: [bs[k], ts[k]] for k in bs if bs[k] != ts[k]}
            if changes:
                diff["columns_changed"].append(
                    {"table": label, "column": name, "changes": changes})

        b_idx = {i["name"]: i for i in bt.get("indexes", [])}
        t_idx = {i["name"]: i for i in tt.get("indexes", [])}
        for name in sorted(set(t_idx) - set(b_idx)):
            diff["indexes_added"].append({"table": label, "index": t_idx[name]})
        for name in sorted(set(b_idx) - set(t_idx)):
            diff["indexes_removed"].append({"table": label, "index": b_idx[name]})
        for name in sorted(set(b_idx) & set(t_idx)):
            if _idx_sig(b_idx[name]) != _idx_sig(t_idx[name]):
                diff["indexes_changed"].append(
                    {"table": label, "name": name,
                     "before": b_idx[name], "after": t_idx[name]})

        b_fk = {f.get("constraint") or _fk_sig(f): f for f in bt.get("foreign_keys", [])}
        t_fk = {f.get("constraint") or _fk_sig(f): f for f in tt.get("foreign_keys", [])}
        for k in sorted(set(t_fk) - set(b_fk), key=str):
            diff["fks_added"].append({"table": label, "fk": t_fk[k]})
        for k in sorted(set(b_fk) - set(t_fk), key=str):
            diff["fks_removed"].append({"table": label, "fk": b_fk[k]})

    b_views = {_tkey(v): v for v in base.get("views", [])}
    t_views = {_tkey(v): v for v in target.get("views", [])}
    for key in sorted(set(t_views) - set(b_views)):
        diff["views_added"].append({"schema": key[0], "name": key[1]})
    for key in sorted(set(b_views) - set(t_views)):
        diff["views_removed"].append({"schema": key[0], "name": key[1]})
    for key in sorted(set(b_views) & set(t_views)):
        if _norm_def(b_views[key].get("definition")) != _norm_def(t_views[key].get("definition")):
            diff["views_changed"].append({"schema": key[0], "name": key[1]})

    diff["summary"] = {
        "added":   len(diff["tables_added"]) + len(diff["columns_added"])
                   + len(diff["indexes_added"]) + len(diff["fks_added"])
                   + len(diff["views_added"]),
        "removed": len(diff["tables_removed"]) + len(diff["columns_removed"])
                   + len(diff["indexes_removed"]) + len(diff["fks_removed"])
                   + len(diff["views_removed"]),
        "changed": len(diff["columns_changed"]) + len(diff["indexes_changed"])
                   + len(diff["views_changed"]),
    }
    return diff
