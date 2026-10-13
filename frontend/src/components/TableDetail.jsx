import React, { useState } from "react";
import { Key, Link, Hash, ArrowUpRight, Sparkles, X } from "lucide-react";

const API = "/api";

async function apiGet(path) {
  const r = await fetch(API + path);
  return r.json();
}
async function apiPut(path, body) {
  const r = await fetch(API + path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "Request failed"); }
  return r.json();
}

function AiConfigModal({ onClose, onSaved }) {
  const [cfg, setCfg] = useState({ endpoint: "", api_key: "", model: "", provider: "openai" });
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { apiGet("/ai/config").then(c => setCfg({ ...c, api_key: "" })); }, []);
  async function save() {
    setSaving(true);
    await apiPut("/ai/config", cfg);
    setSaving(false);
    onSaved();
  }
  const field = "w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200";
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-[420px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles size={14} className="text-purple-400" /> AI endpoint</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={15} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Bring your own endpoint — OpenAI-compatible, Ollama, etc. Your key stays on this machine.</p>
        <div className="space-y-3">
          <label className="block text-xs text-gray-400">Provider
            <select value={cfg.provider} onChange={e => setCfg({ ...cfg, provider: e.target.value })} className={`${field} mt-1`}>
              <option value="openai">OpenAI-compatible</option>
              <option value="ollama">Ollama</option>
            </select></label>
          <label className="block text-xs text-gray-400">Endpoint URL
            <input value={cfg.endpoint} onChange={e => setCfg({ ...cfg, endpoint: e.target.value })} placeholder="https://api.openai.com/v1  or  http://localhost:11434" className={`${field} mt-1`} /></label>
          <label className="block text-xs text-gray-400">API key <span className="text-gray-600">(leave blank to keep current)</span>
            <input type="password" value={cfg.api_key} onChange={e => setCfg({ ...cfg, api_key: e.target.value })} className={`${field} mt-1`} /></label>
          <label className="block text-xs text-gray-400">Model
            <input value={cfg.model} onChange={e => setCfg({ ...cfg, model: e.target.value })} placeholder="gpt-4o-mini / llama3.1" className={`${field} mt-1`} /></label>
        </div>
        <button onClick={save} disabled={saving} className="mt-5 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition">
          {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function Badge({ children, color = "gray" }) {
  const c = {
    blue:   "bg-blue-900/40 border-blue-800/40 text-blue-300",
    green:  "bg-green-900/40 border-green-800/40 text-green-300",
    yellow: "bg-yellow-900/40 border-yellow-800/40 text-yellow-300",
    gray:   "bg-gray-800/60 border-gray-700/40 text-gray-400",
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${c}`}>{children}</span>;
}

export default function TableDetail({ table }) {
  const [aiDesc, setAiDesc] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showCfg, setShowCfg] = useState(false);

  async function generateDescriptions() {
    setAiBusy(true); setAiError("");
    try {
      const d = await apiPost("/ai/describe", {
        schema_name: table.schema, name: table.name,
        columns: table.columns, foreign_keys: table.foreign_keys,
      });
      setAiDesc(d);
    } catch (e) {
      if (String(e.message).includes("not configured")) setShowCfg(true);
      else setAiError(e.message);
    }
    setAiBusy(false);
  }

  const colDesc = c => (aiDesc?.columns?.[c.name]) || c.description || "";

  if (!table) return (
    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
      Select a table to view its documentation
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Table header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">{table.schema}</p>
            <h2 className="text-2xl font-bold text-white">{table.name}</h2>
          </div>
          <div className="flex gap-2 shrink-0 mt-1">
            <Badge color="gray">{table.columns.length} columns</Badge>
            <Badge color="gray">{Number(table.row_estimate).toLocaleString()} rows</Badge>
            <button onClick={generateDescriptions} disabled={aiBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium bg-purple-900/40 border-purple-700/50 text-purple-300 hover:bg-purple-800/50 disabled:opacity-50 transition"
              title="Generate table + column descriptions with AI (uses your configured endpoint)">
              <Sparkles size={11} /> {aiBusy ? "Generating…" : aiDesc ? "Regenerate" : "AI describe"}
            </button>
            <button onClick={() => setShowCfg(true)} className="text-xs text-gray-600 hover:text-gray-400 underline" title="Configure AI endpoint">AI settings</button>
          </div>
        </div>
        {(aiDesc?.table_description || table.description) && <p className="text-sm text-gray-400 mt-2">{aiDesc?.table_description || table.description}</p>}
        {aiDesc && <p className="text-[11px] text-purple-400/80 mt-1 flex items-center gap-1"><Sparkles size={10} /> AI-generated — review before sharing</p>}
        {aiError && <p className="text-xs text-red-400 mt-2">{aiError}</p>}
        {showCfg && <AiConfigModal onClose={() => setShowCfg(false)} onSaved={() => setShowCfg(false)} />}
      </div>

      {/* Columns */}
      <section className="mb-10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Columns</h3>
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Nullable</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Default</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col, i) => (
                <tr key={col.name} className={`border-b border-gray-800/50 ${i % 2 === 0 ? "" : "bg-gray-900/20"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-100 flex items-center gap-2">
                    {col.primary_key && <Key size={11} className="text-yellow-400 shrink-0" />}
                    {col.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{col.type}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{col.nullable ? "YES" : <span className="text-gray-200 font-medium">NO</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{col.default || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{colDesc(col) || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Indexes */}
      {table.indexes.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Indexes</h3>
          <div className="flex flex-col gap-2">
            {table.indexes.map(idx => (
              <div key={idx.name} className="flex items-center gap-3 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
                <Hash size={13} className="text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs text-gray-200">{idx.name}</span>
                  <span className="text-gray-600 mx-2 text-xs">on</span>
                  <span className="font-mono text-xs text-blue-300">{idx.columns}</span>
                </div>
                <div className="flex gap-1.5">
                  {idx.primary && <Badge color="yellow">PRIMARY</Badge>}
                  {idx.unique && !idx.primary && <Badge color="green">UNIQUE</Badge>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Foreign keys */}
      {table.foreign_keys.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Foreign Keys</h3>
          <div className="flex flex-col gap-2">
            {table.foreign_keys.map((fk, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
                <Link size={13} className="text-gray-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-mono text-gray-200">{fk.column}</span>
                  <span className="text-gray-600 mx-2">→</span>
                  <span className="font-mono text-blue-300">{fk.ref_schema}.{fk.ref_table}({fk.ref_column})</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
