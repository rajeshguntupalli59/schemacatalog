import React from "react";
import { KeyRound, Link2 } from "lucide-react";

const BOX_W = 250, ROW_H = 22, HEAD_H = 36, GAP_X = 90, GAP_Y = 70, PER_ROW = 3;

export default function ErdDiagram({ tables, onSelect }) {
  const pos = {};
  tables.forEach((t, i) => {
    const col = i % PER_ROW, row = Math.floor(i / PER_ROW);
    pos[`${t.schema}.${t.name}`] = { x: col * (BOX_W + GAP_X), y: row * 340 + 10, table: t };
  });

  const maxX = PER_ROW * (BOX_W + GAP_X);
  const maxY = Math.ceil(tables.length / PER_ROW) * 340 + 40;

  const edges = [];
  tables.forEach(t => {
    const p = pos[`${t.schema}.${t.name}`];
    (t.foreign_keys || []).forEach((fk, fi) => {
      const target = pos[`${fk.ref_schema}.${fk.ref_table}`];
      if (!target) return;
      const colIdx = t.columns.findIndex(c => c.name === fk.column);
      const y1 = p.y + HEAD_H + (colIdx >= 0 ? colIdx : 0) * ROW_H + ROW_H / 2;
      const y2 = target.y + HEAD_H + ROW_H / 2;
      const x1 = p.x + BOX_W, x2 = target.x;
      const mx = (x1 + x2) / 2;
      edges.push(
        <g key={`${t.name}-${fk.column}-${fi}`}>
          <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.65" />
          <circle cx={x2} cy={y2} r="3.5" fill="#3b82f6" opacity="0.85" />
          <title>{`${t.schema}.${t.name}.${fk.column} → ${fk.ref_schema}.${fk.ref_table}.${fk.ref_column}`}</title>
        </g>
      );
    });
  });

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px", background: "#04070f" }}>
      <div style={{ position: "relative", width: maxX, height: maxY }}>
        <svg style={{ position: "absolute", inset: 0, width: maxX, height: maxY, pointerEvents: "none" }}>
          {edges}
        </svg>
        {tables.map(t => {
          const p = pos[`${t.schema}.${t.name}`];
          return (
            <div key={`${t.schema}.${t.name}`}
              onClick={() => onSelect && onSelect(t)}
              style={{
                position: "absolute", left: p.x, top: p.y, width: BOX_W,
                background: "#0b1220", border: "1px solid #1e3a5f", borderRadius: "10px",
                overflow: "hidden", cursor: onSelect ? "pointer" : "default",
                boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
              }}>
              <div style={{
                height: HEAD_H, display: "flex", alignItems: "center", padding: "0 12px",
                background: "linear-gradient(135deg,#1e3a5f,#1e40af)", gap: "6px",
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</p>
                  <p style={{ fontSize: "10px", color: "#93c5fd" }}>{t.schema}</p>
                </div>
              </div>
              <div>
                {t.columns.map(c => {
                  const isFk = (t.foreign_keys || []).some(fk => fk.column === c.name);
                  return (
                    <div key={c.name} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      height: ROW_H, padding: "0 10px", fontSize: "11px",
                      borderTop: "1px solid #111c30",
                    }}>
                      {c.primary_key
                        ? <KeyRound size={10} color="#fbbf24" style={{ flexShrink: 0 }} />
                        : isFk
                          ? <Link2 size={10} color="#60a5fa" style={{ flexShrink: 0 }} />
                          : <span style={{ width: 10, flexShrink: 0 }} />}
                      <span style={{ color: "#e5e7eb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                      <span style={{ marginLeft: "auto", color: "#4b5563", fontSize: "10px", flexShrink: 0 }}>{c.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {tables.length === 0 && <p style={{ color: "#4b5563", fontSize: "13px" }}>No tables to diagram.</p>}
      <p style={{ color: "#374151", fontSize: "11px", marginTop: "12px" }}>
        <span style={{ color: "#fbbf24" }}>🔑 primary key</span> · <span style={{ color: "#60a5fa" }}>🔗 foreign key</span> · blue lines = relationships (hover for details)
      </p>
    </div>
  );
}
