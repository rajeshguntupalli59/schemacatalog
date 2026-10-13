import React, { useState, useEffect } from "react";

const C = {
  bg: "#060c18", card: "#0b1220", border: "#1f2937", text: "#e5e7eb",
  muted: "#6b7280", accent: "#3b82f6",
  green: "#34d399", red: "#f87171", yellow: "#fbbf24",
};

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleString();
}

function ChangeRow({ color, children }) {
  return (
    <div style={{ display: "flex", gap: "10px", padding: "8px 12px", background: C.card,
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: "8px",
      fontSize: "12px", color: C.text, marginBottom: "6px" }}>
      {children}
    </div>
  );
}

function Section({ title, count, color, children }) {
  if (!count) return null;
  return (
    <div style={{ marginBottom: "18px" }}>
      <h4 style={{ fontSize: "12px", fontWeight: 700, color, marginBottom: "8px",
        textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title} ({count})
      </h4>
      {children}
    </div>
  );
}

function DiffView({ diff, baseName, targetName, onClose }) {
  const s = diff.summary || { added: 0, removed: 0, changed: 0 };
  const none = s.added + s.removed + s.changed === 0;
  const colLabel = (t, c) => <span><b>{t}</b>.<span style={{ fontFamily: "monospace" }}>{c.name}</span>
    <span style={{ color: C.muted }}> {c.type}</span></span>;
  return (
    <div style={{ marginTop: "20px", borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
          {baseName} <span style={{ color: C.muted }}>→</span> {targetName}
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted,
          cursor: "pointer", fontSize: "12px" }}>✕ close</button>
      </div>
      <p style={{ fontSize: "12px", color: C.muted, marginBottom: "14px" }}>
        <span style={{ color: C.green }}>{s.added} added</span> ·{" "}
        <span style={{ color: C.red }}>{s.removed} removed</span> ·{" "}
        <span style={{ color: C.yellow }}>{s.changed} changed</span>
      </p>
      {none && <p style={{ fontSize: "13px", color: C.green }}>No structural differences — schemas are identical.</p>}

      <Section title="Tables added" count={diff.tables_added.length} color={C.green}>
        {diff.tables_added.map(t => <ChangeRow key={t.schema + t.name} color={C.green}>
          <span style={{ fontFamily: "monospace" }}>{t.schema ? t.schema + "." : ""}{t.name}</span></ChangeRow>)}
      </Section>
      <Section title="Tables removed" count={diff.tables_removed.length} color={C.red}>
        {diff.tables_removed.map(t => <ChangeRow key={t.schema + t.name} color={C.red}>
          <span style={{ fontFamily: "monospace" }}>{t.schema ? t.schema + "." : ""}{t.name}</span></ChangeRow>)}
      </Section>
      <Section title="Columns added" count={diff.columns_added.length} color={C.green}>
        {diff.columns_added.map((c, i) => <ChangeRow key={i} color={C.green}>{colLabel(c.table, c.column)}</ChangeRow>)}
      </Section>
      <Section title="Columns removed" count={diff.columns_removed.length} color={C.red}>
        {diff.columns_removed.map((c, i) => <ChangeRow key={i} color={C.red}>{colLabel(c.table, c.column)}</ChangeRow>)}
      </Section>
      <Section title="Columns changed" count={diff.columns_changed.length} color={C.yellow}>
        {diff.columns_changed.map((c, i) => (
          <ChangeRow key={i} color={C.yellow}>
            <span><b>{c.table}</b>.<span style={{ fontFamily: "monospace" }}>{c.column}</span>
              {Object.entries(c.changes).map(([k, [a, b]]) => (
                <span key={k} style={{ display: "block", color: C.muted, marginTop: "2px" }}>
                  {k}: <s>{String(a)}</s> → <b style={{ color: C.text }}>{String(b)}</b>
                </span>
              ))}
            </span>
          </ChangeRow>
        ))}
      </Section>
      <Section title="Indexes added" count={diff.indexes_added.length} color={C.green}>
        {diff.indexes_added.map((x, i) => <ChangeRow key={i} color={C.green}>
          <span><span style={{ fontFamily: "monospace" }}>{x.index.name}</span> on <b>{x.table}</b>
          <span style={{ color: C.muted }}> ({x.index.columns})</span></span></ChangeRow>)}
      </Section>
      <Section title="Indexes removed" count={diff.indexes_removed.length} color={C.red}>
        {diff.indexes_removed.map((x, i) => <ChangeRow key={i} color={C.red}>
          <span><span style={{ fontFamily: "monospace" }}>{x.index.name}</span> on <b>{x.table}</b></span></ChangeRow>)}
      </Section>
      <Section title="Foreign keys added" count={diff.fks_added.length} color={C.green}>
        {diff.fks_added.map((x, i) => <ChangeRow key={i} color={C.green}>
          <span><b>{x.table}</b>.<span style={{ fontFamily: "monospace" }}>{x.fk.column}</span>
          <span style={{ color: C.muted }}> → {x.fk.ref_table}.{x.fk.ref_column}</span></span></ChangeRow>)}
      </Section>
      <Section title="Foreign keys removed" count={diff.fks_removed.length} color={C.red}>
        {diff.fks_removed.map((x, i) => <ChangeRow key={i} color={C.red}>
          <span><b>{x.table}</b>.<span style={{ fontFamily: "monospace" }}>{x.fk.column}</span>
          <span style={{ color: C.muted }}> → {x.fk.ref_table}.{x.fk.ref_column}</span></span></ChangeRow>)}
      </Section>
      <Section title="Views added / removed / changed"
        count={diff.views_added.length + diff.views_removed.length + diff.views_changed.length} color={C.accent}>
        {diff.views_added.map((v, i) => <ChangeRow key={"a" + i} color={C.green}>
          <span style={{ fontFamily: "monospace" }}>{v.name} <span style={{ color: C.muted }}>added</span></span></ChangeRow>)}
        {diff.views_removed.map((v, i) => <ChangeRow key={"r" + i} color={C.red}>
          <span style={{ fontFamily: "monospace" }}>{v.name} <span style={{ color: C.muted }}>removed</span></span></ChangeRow>)}
        {diff.views_changed.map((v, i) => <ChangeRow key={"c" + i} color={C.yellow}>
          <span style={{ fontFamily: "monospace" }}>{v.name} <span style={{ color: C.muted }}>definition changed</span></span></ChangeRow>)}
      </Section>
    </div>
  );
}

export default function Snapshots({ schema, dbType }) {
  const [snaps, setSnaps] = useState([]);
  const [name, setName] = useState("");
  const [diff, setDiff] = useState(null);
  const [diffNames, setDiffNames] = useState(["", ""]);
  const [picked, setPicked] = useState([]);
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/snapshots").then(r => r.json()).then(setSnaps).catch(() => setErr("Could not reach the API."));

  useEffect(() => { load(); }, []);

  const save = () => {
    setErr("");
    fetch("/api/snapshots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || `Snapshot ${new Date().toLocaleDateString()}`, db_type: dbType, database: schema.database, schema_data: schema }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => { setName(""); load(); })
      .catch(() => setErr("Save failed."));
  };

  const remove = (id) => {
    if (!window.confirm("Delete this snapshot?")) return;
    fetch(`/api/snapshots/${id}`, { method: "DELETE" }).then(load);
  };

  const runDiff = (base, target, baseName, targetName) => {
    setErr(""); setDiff(null);
    fetch("/api/snapshots/diff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base, target }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setDiff(d); setDiffNames([baseName, targetName]); })
      .catch(() => setErr("Diff failed."));
  };

  const diffVsCurrent = (snap) =>
    runDiff({ snapshot_id: snap.id }, { schema_data: schema }, snap.name, "Current scan");

  const diffPicked = () => {
    if (picked.length !== 2) return;
    const [a, b] = picked.map(id => snaps.find(s => s.id === id)).sort((x, y) => x.created_at - y.created_at);
    runDiff({ snapshot_id: a.id }, { snapshot_id: b.id }, a.name, b.name);
  };

  const togglePick = (id) =>
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id].slice(-2));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: "900px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>Schema snapshots</h2>
      <p style={{ fontSize: "13px", color: C.muted, marginBottom: "20px" }}>
        Freeze the current schema, then diff it against a later scan to see exactly what changed —
        new tables, dropped columns, altered types, added indexes.
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Snapshot name (e.g. before migration)"
          style={{ flex: 1, background: "#111827", border: `1px solid ${C.border}`, borderRadius: "10px",
            padding: "8px 12px", fontSize: "13px", color: C.text, outline: "none" }} />
        <button onClick={save} style={{ padding: "8px 18px", background: C.accent, border: "none",
          borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          Save current schema
        </button>
      </div>

      {err && <p style={{ color: C.red, fontSize: "13px", marginBottom: "12px" }}>{err}</p>}

      {picked.length === 2 && (
        <button onClick={diffPicked} style={{ marginBottom: "12px", padding: "8px 18px",
          background: "#1e3a5f", border: "1px solid #1d4ed8", borderRadius: "10px",
          color: "#93c5fd", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          Compare selected snapshots
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {snaps.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
            background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
            <input type="checkbox" checked={picked.includes(s.id)} onChange={() => togglePick(s.id)}
              title="Select two to compare" style={{ accentColor: C.accent }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{s.name}</p>
              <p style={{ fontSize: "11px", color: C.muted }}>
                {s.database} · {s.table_count} tables · {fmtDate(s.created_at)}
              </p>
            </div>
            <button onClick={() => diffVsCurrent(s)} style={{ background: "none", border: `1px solid ${C.border}`,
              borderRadius: "8px", color: "#93c5fd", fontSize: "12px", padding: "6px 12px", cursor: "pointer" }}>
              Diff vs current
            </button>
            <button onClick={() => remove(s.id)} style={{ background: "none", border: "none",
              color: C.muted, fontSize: "12px", cursor: "pointer" }}>Delete</button>
          </div>
        ))}
        {snaps.length === 0 && (
          <p style={{ fontSize: "13px", color: C.muted }}>No snapshots yet — save one before your next migration.</p>
        )}
      </div>

      {diff && <DiffView diff={diff} baseName={diffNames[0]} targetName={diffNames[1]} onClose={() => setDiff(null)} />}
    </div>
  );
}
