"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// SUPABASE ✅
// ============================================================
const SUPABASE_URL = "https://ojuibtesufcpmgzrylbl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yNR_bvFnmymtoyYskbQgLA_lSsvfcif";
const GEMINI_KEY = "AIzaSyBkgngp3t_SzzhVuvnI7STqSrXGEJx6U6c";

const H = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const db = {
  async get(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, { headers: H });
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: H, body: JSON.stringify(data),
    });
    return r.json();
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: H, body: JSON.stringify(data),
    });
    return r.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE", headers: H,
    });
  },
};

// ============================================================
// PALETA INTERIUS — CLARO
// ============================================================
const C = {
  bgPage:     "#ede5d8",
  bgCard:     "rgba(255,255,255,0.72)",
  bgCardHov:  "rgba(255,255,255,0.93)",
  bgModal:    "#faf6f0",
  textPrimary:   "#1a130f",
  textSecondary: "#6b5545",
  textMuted:     "rgba(26,19,15,0.42)",
  border:        "rgba(94,125,90,0.18)",
  borderCard:    "rgba(188,162,127,0.35)",
  borderLight:   "rgba(188,162,127,0.2)",
  greenLichen:   "#5E7D5A",
  greenForest:   "#2D5A27",
  emerald:       "#1BB39A",
  emeraldHov:    "#169a84",
  sand:          "#d2c2b3",
  khaki:         "#BCA27F",
  khakiHov:      "#a88d6a",
  shadow:        "rgba(45,26,15,0.10)",
  shadowMd:      "rgba(45,26,15,0.16)",
};

const glass = {
  background: C.bgCard,
  border: `1px solid ${C.borderCard}`,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: `0 2px 16px ${C.shadow}`,
};

// ============================================================
// EQUIPO
// ============================================================
const TEAM = ["Diego", "Martin", "Rorro", "Zarko"];
const TEAM_COLORS = {
  Diego:  "#2D5A27",
  Martin: "#5E7D5A",
  Rorro:  "#1BB39A",
  Zarko:  "#a88d6a",
};
const CATEGORIES = ["App Nahueroute", "Frontend", "Backend", "Diseño", "General"];
const CAT_ICONS  = {
  "App Nahueroute": "🗺", Frontend: "◈", Backend: "⬡", Diseño: "✦", General: "◎",
};

// ============================================================
// UTILS
// ============================================================
function timeAgo(iso) {
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60)    return "ahora mismo";
  if (d < 3600)  return `hace ${Math.floor(d / 60)}m`;
  if (d < 86400) return `hace ${Math.floor(d / 3600)}h`;
  return `hace ${Math.floor(d / 86400)}d`;
}
function calcProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length);
}
function progressLabel(pct) {
  if (pct === 0)  return { text: "Sin iniciar",       icon: "○",  color: C.textMuted };
  if (pct <= 15)  return { text: "Recién comenzado",  icon: "▸",  color: C.khaki };
  if (pct <= 39)  return { text: "En marcha",         icon: "↗",  color: C.khakiHov };
  if (pct <= 59)  return { text: "A la mitad",        icon: "◑",  color: C.greenLichen };
  if (pct <= 84)  return { text: "Bien avanzado",     icon: "▶",  color: C.greenLichen };
  if (pct <= 99)  return { text: "Casi listo",        icon: "◕",  color: C.emeraldHov };
  return           { text: "Completado",              icon: "✓",  color: C.greenForest };
}

// ============================================================
// RING SVG
// ============================================================
function Ring({ progress, size = 48, stroke = 5, color }) {
  const col  = color || C.emerald;
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(94,125,90,0.15)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function MiniRing({ progress, color }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <Ring progress={progress} size={54} stroke={5} color={color} />
      <span style={{ position: "absolute", fontSize: 10, fontWeight: 700, color, fontFamily: "var(--font-space-mono), monospace" }}>
        {progress}%
      </span>
    </div>
  );
}

// ============================================================
// TASK CARD
// ============================================================
function TaskCard({ task, subtasks, currentUser, onUpdate, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }) {
  const [localPct, setLocalPct]         = useState(task.progress || 0);
  const [showNote, setShowNote]         = useState(false);
  const [noteText, setNoteText]         = useState("");
  const [showSubs, setShowSubs]         = useState(false);
  const [newSub, setNewSub]             = useState("");
  const [addingSub, setAddingSub]       = useState(false);
  const noteRef = useRef(null);

  const color  = TEAM_COLORS[task.assignee] || C.greenLichen;
  const isOwn  = task.assignee === currentUser;
  const label  = progressLabel(localPct);
  const doneColor = localPct === 100 ? C.greenForest : color;

  useEffect(() => setLocalPct(task.progress || 0), [task.progress]);
  useEffect(() => { if (showNote && noteRef.current) noteRef.current.focus(); }, [showNote]);

  function handleSliderChange(e) {
    setLocalPct(parseInt(e.target.value));
  }
  function handleSliderRelease(e) {
    const val = parseInt(e.target.value);
    onUpdate(task.id, {
      progress: val,
      updated_at: new Date().toISOString(),
      status: val === 100 ? "done" : "active",
    });
    setShowNote(true);
  }
  function handleSaveNote() {
    if (noteText.trim()) {
      onUpdate(task.id, { note: noteText.trim(), note_by: currentUser });
    }
    setNoteText("");
    setShowNote(false);
  }

  function handleAddSub() {
    if (!newSub.trim()) return;
    onAddSubtask(task.id, newSub.trim());
    setNewSub("");
    setAddingSub(false);
  }

  const completedSubs = subtasks.filter(s => s.completed).length;

  return (
    <div style={{
      ...glass,
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      marginBottom: 10,
      transition: "all 0.22s",
      opacity: task.status === "done" ? 0.68 : 1,
      overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = C.bgCardHov; e.currentTarget.style.boxShadow = `0 6px 24px ${C.shadowMd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.bgCard; e.currentTarget.style.boxShadow = `0 2px 16px ${C.shadow}`; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ padding: "13px 15px 11px" }}>

        {/* ─ Título + Ring ─ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary,
              textDecoration: task.status === "done" ? "line-through" : "none",
              opacity: task.status === "done" ? 0.55 : 1,
            }}>{task.title}</p>

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{timeAgo(task.updated_at)}</span>
              <span style={{
                fontSize: 10, padding: "1px 8px", borderRadius: 20,
                background: `${color}18`, color, fontWeight: 700,
                border: `1px solid ${color}44`,
                fontFamily: "var(--font-space-mono), monospace",
              }}>{task.assignee}</span>
              {/* Progress label */}
              <span style={{
                fontSize: 10, padding: "1px 8px", borderRadius: 20,
                background: `${label.color}15`, color: label.color, fontWeight: 700,
                border: `1px solid ${label.color}33`,
                fontFamily: "var(--font-space-mono), monospace",
                transition: "all 0.4s",
              }}>{label.icon} {label.text}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <MiniRing progress={localPct} color={doneColor} />
            {isOwn && (
              <button onClick={() => onDelete(task.id)} style={{
                background: "none", border: "none", color: "rgba(26,19,15,0.18)",
                cursor: "pointer", fontSize: 14, padding: 4, transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "#c0392b"}
                onMouseLeave={e => e.target.style.color = "rgba(26,19,15,0.18)"}
              >✕</button>
            )}
          </div>
        </div>

        {/* ─ Descripción ─ */}
        {task.description && (
          <p style={{
            margin: "7px 0 0", fontSize: 11.5, color: C.textSecondary,
            fontStyle: "italic", lineHeight: 1.55,
            borderLeft: `2px solid ${C.borderLight}`, paddingLeft: 8,
          }}>{task.description}</p>
        )}

        {/* ─ Nota de avance ─ */}
        {task.note && !showNote && (
          <div style={{
            marginTop: 7, padding: "5px 9px",
            background: `${TEAM_COLORS[task.note_by] || C.khaki}12`,
            border: `1px solid ${TEAM_COLORS[task.note_by] || C.khaki}30`,
            borderRadius: 7, fontSize: 11, color: C.textSecondary,
            display: "flex", gap: 6, alignItems: "flex-start",
          }}>
            <span style={{
              fontFamily: "var(--font-space-mono), monospace", fontWeight: 700,
              color: TEAM_COLORS[task.note_by] || C.khaki, flexShrink: 0,
              fontSize: 10,
            }}>{task.note_by}:</span>
            <span style={{ fontStyle: "italic" }}>{task.note}</span>
          </div>
        )}

        {/* ─ Slider / Barra ─ */}
        <div style={{ marginTop: 10 }}>
          {isOwn ? (
            <div style={{ position: "relative" }}>
              <input type="range" min={0} max={100} value={localPct}
                onChange={handleSliderChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                style={{ width: "100%", height: 6, cursor: "pointer", accentColor: doneColor, borderRadius: 4 }}
              />
              <div style={{
                position: "absolute", top: -1, left: 0,
                width: `${localPct}%`, height: 6,
                background: `linear-gradient(90deg, ${color}55, ${doneColor})`,
                borderRadius: 4, pointerEvents: "none", transition: "width 0.3s",
              }} />
            </div>
          ) : (
            <div style={{ height: 4, borderRadius: 4, background: "rgba(94,125,90,0.12)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${localPct}%`,
                background: `linear-gradient(90deg, ${color}66, ${doneColor})`,
                borderRadius: 4, transition: "width 0.8s",
              }} />
            </div>
          )}
        </div>

        {/* ─ Input de Nota (post-slider) ─ */}
        {showNote && (
          <div style={{
            marginTop: 8, display: "flex", gap: 6, alignItems: "center",
            animation: "fadeUp 0.2s ease",
          }}>
            <input
              ref={noteRef}
              placeholder={`¿Qué falta? (opcional, máx 120 caracteres)`}
              value={noteText}
              maxLength={120}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveNote(); if (e.key === "Escape") { setShowNote(false); setNoteText(""); }}}
              style={{
                flex: 1, padding: "6px 10px", borderRadius: 7,
                background: "rgba(255,255,255,0.9)",
                border: `1px solid ${C.borderCard}`,
                color: C.textPrimary, fontSize: 11.5, outline: "none",
                fontStyle: "italic", fontFamily: "inherit",
              }}
            />
            <button onClick={handleSaveNote} style={{
              padding: "5px 10px", borderRadius: 7, border: "none",
              background: color, color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
            }}>✓</button>
            <button onClick={() => { setShowNote(false); setNoteText(""); }} style={{
              padding: "5px 8px", borderRadius: 7,
              background: "rgba(26,19,15,0.06)", border: `1px solid ${C.borderLight}`,
              color: C.textMuted, cursor: "pointer", fontSize: 12,
            }}>✗</button>
          </div>
        )}
      </div>

      {/* ─ Subtareas ─ */}
      <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
        <button onClick={() => setShowSubs(s => !s)} style={{
          width: "100%", padding: "7px 15px",
          background: "none", border: "none",
          display: "flex", alignItems: "center", gap: 6,
          cursor: "pointer", color: C.textMuted,
          fontSize: 11, fontFamily: "var(--font-space-mono), monospace",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(94,125,90,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showSubs ? "rotate(0deg)" : "rotate(-90deg)" }}>▾</span>
          <span>Subtareas</span>
          {subtasks.length > 0 && (
            <span style={{
              background: completedSubs === subtasks.length && subtasks.length > 0 ? `${C.greenForest}20` : "rgba(94,125,90,0.12)",
              color: completedSubs === subtasks.length && subtasks.length > 0 ? C.greenForest : C.textMuted,
              borderRadius: 20, padding: "0 7px", fontSize: 10, fontWeight: 700,
            }}>{completedSubs}/{subtasks.length}</span>
          )}
        </button>

        {showSubs && (
          <div style={{ padding: "6px 15px 12px", animation: "fadeUp 0.2s ease" }}>
            {subtasks.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 5,
                padding: "4px 0",
              }}>
                <input type="checkbox" checked={s.completed}
                  onChange={() => onToggleSubtask(s.id, !s.completed)}
                  style={{ width: 14, height: 14, cursor: "pointer", accentColor: color }}
                />
                <span style={{
                  fontSize: 12, flex: 1, color: s.completed ? C.textMuted : C.textSecondary,
                  textDecoration: s.completed ? "line-through" : "none",
                  transition: "all 0.2s",
                }}>{s.title}</span>
                {isOwn && (
                  <button onClick={() => onDeleteSubtask(s.id)} style={{
                    background: "none", border: "none", color: "rgba(26,19,15,0.15)",
                    cursor: "pointer", fontSize: 12, padding: 2, transition: "color 0.15s",
                  }}
                    onMouseEnter={e => e.target.style.color = "#c0392b"}
                    onMouseLeave={e => e.target.style.color = "rgba(26,19,15,0.15)"}
                  >✕</button>
                )}
              </div>
            ))}

            {/* Agregar subtarea */}
            {addingSub ? (
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input
                  autoFocus
                  placeholder="Nueva subtarea..."
                  value={newSub}
                  maxLength={100}
                  onChange={e => setNewSub(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddSub(); if (e.key === "Escape") { setAddingSub(false); setNewSub(""); }}}
                  style={{
                    flex: 1, padding: "5px 9px", borderRadius: 7,
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${C.borderCard}`,
                    color: C.textPrimary, fontSize: 12, outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button onClick={handleAddSub} style={{
                  padding: "4px 10px", borderRadius: 7, border: "none",
                  background: color, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
                }}>✓</button>
                <button onClick={() => { setAddingSub(false); setNewSub(""); }} style={{
                  padding: "4px 8px", borderRadius: 7,
                  background: "rgba(26,19,15,0.05)", border: `1px solid ${C.borderLight}`,
                  color: C.textMuted, cursor: "pointer", fontSize: 12,
                }}>✗</button>
              </div>
            ) : (
              <button onClick={() => setAddingSub(true)} style={{
                marginTop: 4, padding: "4px 10px", borderRadius: 7,
                background: "rgba(94,125,90,0.08)", border: `1px solid ${C.border}`,
                color: C.greenLichen, cursor: "pointer", fontSize: 11,
                fontFamily: "var(--font-space-mono), monospace", fontWeight: 700,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(94,125,90,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(94,125,90,0.08)"}
              >+ subtarea</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ADD TASK MODAL
// ============================================================
function AddTaskModal({ currentUser, onAdd, onClose }) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [category, setCategory] = useState("App Nahueroute");
  const userColor = TEAM_COLORS[currentUser] || C.greenLichen;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(237,229,216,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.bgModal, border: `1px solid ${C.borderCard}`,
        borderRadius: 20, padding: 30, width: 400,
        boxShadow: `0 20px 60px ${C.shadowMd}`,
      }}>
        <h3 style={{
          margin: "0 0 20px", color: C.textPrimary,
          fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 18,
        }}>+ Nueva Tarea</h3>

        {/* Título */}
        <input autoFocus placeholder="Título de la tarea..."
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && title.trim() && onAdd({ title: title.trim(), description: desc.trim(), category })}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 9,
            background: "rgba(255,255,255,0.85)", border: `1px solid ${C.borderCard}`,
            color: C.textPrimary, fontSize: 14, outline: "none",
            boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit",
          }}
        />

        {/* Descripción */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <textarea
            placeholder="Descripción breve (opcional, máx 300 caracteres)..."
            value={desc} maxLength={300}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            style={{
              width: "100%", padding: "9px 14px 22px", borderRadius: 9,
              background: "rgba(255,255,255,0.85)", border: `1px solid ${C.borderCard}`,
              color: C.textPrimary, fontSize: 12.5, outline: "none", resize: "none",
              boxSizing: "border-box", fontFamily: "inherit", fontStyle: "italic",
              color: C.textSecondary, lineHeight: 1.5,
            }}
          />
          <span style={{
            position: "absolute", bottom: 6, right: 10,
            fontSize: 10, color: desc.length > 270 ? "#c0392b" : C.textMuted,
            fontFamily: "monospace",
          }}>{desc.length}/300</span>
        </div>

        {/* Categorías */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 22 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              fontFamily: "var(--font-space-mono), monospace", fontWeight: 700,
              background: category === c ? `${userColor}18` : "rgba(255,255,255,0.6)",
              color: category === c ? userColor : C.textSecondary,
              border: category === c ? `1px solid ${userColor}55` : `1px solid ${C.borderLight}`,
              transition: "all 0.18s",
            }}>{CAT_ICONS[c]} {c}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 9,
            border: `1px solid ${C.borderCard}`,
            background: "rgba(255,255,255,0.6)", color: C.textSecondary, cursor: "pointer", fontSize: 14,
          }}>Cancelar</button>
          <button onClick={() => title.trim() && onAdd({ title: title.trim(), description: desc.trim(), category })} style={{
            flex: 2, padding: "10px", borderRadius: 9, border: "none",
            background: `linear-gradient(135deg, ${userColor}, ${C.greenForest})`,
            color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
            fontFamily: "var(--font-space-mono), monospace",
            boxShadow: `0 4px 14px ${userColor}44`,
          }}>Agregar →</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY MODAL — Google Gemini
// ============================================================
function SummaryModal({ tasks, subtasks, onClose }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { generateSummary(); }, []);

  async function generateSummary() {
    setLoading(true);
    const done       = tasks.filter(t => t.status === "done");
    const inProgress = tasks.filter(t => t.status === "active" && t.progress > 0);
    const pending    = tasks.filter(t => t.progress === 0);
    const global     = calcProgress(tasks);

    const taskDetail = tasks.map(t => {
      const subs = subtasks.filter(s => s.task_id === t.id);
      const subsDone = subs.filter(s => s.completed).length;
      let line = `- "${t.title}" (${t.assignee}) al ${t.progress}%`;
      if (t.note) line += ` — nota: "${t.note}"`;
      if (subs.length) line += ` | subtareas: ${subsDone}/${subs.length}`;
      return line;
    }).join("\n");

    const prompt = `Eres el asistente del equipo Interius (Diego, Martin, Rorro, Zarko). Genera un resumen semanal conciso y motivador de su proyecto App Nahueroute.\n\nProgreso global: ${global}%\n\nDetalle de tareas:\n${taskDetail}\n\nEscribe en español con 3 secciones claras:\n✅ Logros\n🔄 En curso\n📌 Próxima semana\n\nMáximo 220 palabras. Tono directo, motivador y profesional. Menciona a las personas por su nombre.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setSummary(text || "No se pudo generar el resumen.");
    } catch (err) {
      setSummary(`Error al conectar con Gemini: ${err.message}`);
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(237,229,216,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.bgModal, border: `1px solid ${C.borderCard}`,
        borderRadius: 20, padding: 32, width: 520, maxHeight: "82vh",
        overflow: "auto", boxShadow: `0 24px 70px ${C.shadowMd}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: "0 0 3px", color: C.textPrimary, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 20 }}>
              📋 Resumen Semanal
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
              App Nahueroute · Equipo Interius · via Gemini
            </p>
          </div>
          <button onClick={generateSummary} style={{
            background: "rgba(94,125,90,0.1)", border: `1px solid ${C.border}`,
            color: C.greenForest, padding: "6px 14px", borderRadius: 8,
            cursor: "pointer", fontSize: 12, fontFamily: "monospace", fontWeight: 700,
          }}>↻ Regenerar</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{
              width: 38, height: 38, border: `3px solid rgba(94,125,90,0.15)`,
              borderTop: `3px solid ${C.emerald}`, borderRadius: "50%",
              animation: "spin 1s linear infinite", margin: "0 auto 14px",
            }} />
            <p style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 11 }}>
              Gemini está escribiendo...
            </p>
          </div>
        ) : (
          <div style={{
            color: C.textSecondary, fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap",
          }}>{summary}</div>
        )}

        <button onClick={onClose} style={{
          marginTop: 24, width: "100%", padding: "11px", borderRadius: 10,
          background: "rgba(94,125,90,0.08)", border: `1px solid ${C.border}`,
          color: C.textSecondary, cursor: "pointer", fontSize: 14,
          fontFamily: "var(--font-space-mono), monospace",
        }}>Cerrar</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function SquadTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [subtasks, setSubtasks]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showSummary, setShowSummary]     = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [tick, setTick]               = useState(0);

  // Polling 5s
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    Promise.all([
      db.get("tasks", "&order=id.desc"),
      db.get("subtasks", "&order=created_at.asc"),
    ]).then(([t, s]) => {
      if (Array.isArray(t)) setTasks(t);
      if (Array.isArray(s)) setSubtasks(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tick]);

  // Task handlers
  function handleUpdate(id, updates) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    db.update("tasks", id, updates);
  }
  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSubtasks(prev => prev.filter(s => s.task_id !== id));
    db.delete("tasks", id);
  }
  async function handleAdd({ title, description, category }) {
    const payload = {
      title, description: description || null,
      category, progress: 0,
      assignee: currentUser,
      updated_at: new Date().toISOString(),
      status: "active",
    };
    const [inserted] = await db.insert("tasks", payload);
    if (inserted) setTasks(prev => [inserted, ...prev]);
    setShowAddModal(false);
  }

  // Subtask handlers
  async function handleAddSubtask(taskId, title) {
    const [inserted] = await db.insert("subtasks", { task_id: taskId, title });
    if (inserted) setSubtasks(prev => [...prev, inserted]);
  }
  function handleToggleSubtask(subId, completed) {
    setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, completed } : s));
    db.update("subtasks", subId, { completed });
  }
  function handleDeleteSubtask(subId) {
    setSubtasks(prev => prev.filter(s => s.id !== subId));
    db.delete("subtasks", subId);
  }

  // Progreso global = App Nahueroute
  const nahueTasks = tasks.filter(t => t.category === "App Nahueroute");
  const globalPct  = calcProgress(nahueTasks.length ? nahueTasks : tasks);

  const allCategories = ["Todas", ...CATEGORIES.filter(c => tasks.some(t => t.category === c))];
  const filtered = activeCategory === "Todas" ? tasks : tasks.filter(t => t.category === activeCategory);
  const grouped  = CATEGORIES.reduce((acc, cat) => {
    const ct = filtered.filter(t => t.category === cat);
    if (ct.length) acc[cat] = ct;
    return acc;
  }, {});

  const done = tasks.filter(t => t.status === "done").length;

  // ── LOGIN ────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bgPage,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, rgba(94,125,90,0.14) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 80%, rgba(27,179,154,0.10) 0%, transparent 55%),
          radial-gradient(ellipse at 55% 50%, rgba(214,201,168,0.5) 0%, transparent 65%)
        `,
      }}>
        <div style={{ textAlign: "center", animation: "fadeUp 0.55s ease" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            marginBottom: 32, padding: "9px 20px 9px 12px",
            background: "rgba(255,255,255,0.75)", border: `1px solid ${C.border}`,
            borderRadius: 50, backdropFilter: "blur(10px)",
            boxShadow: `0 4px 20px ${C.shadow}`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.greenLichen}, ${C.greenForest})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: `0 3px 10px rgba(45,90,39,0.35)`,
            }}>🗺</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 15, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
                Squad Tracker
              </div>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 9, color: C.greenLichen, letterSpacing: 2, textTransform: "uppercase" }}>
                by Interius
              </div>
            </div>
          </div>

          <p style={{ color: C.textMuted, margin: "0 0 40px", fontSize: 13, fontFamily: "var(--font-space-mono), monospace", letterSpacing: 0.4 }}>
            ¿Quién eres hoy?
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {TEAM.map(name => {
              const col = TEAM_COLORS[name];
              return (
                <button key={name} onClick={() => setCurrentUser(name)} style={{
                  padding: "20px 26px", borderRadius: 16,
                  background: "rgba(255,255,255,0.7)", border: `1px solid ${C.borderCard}`,
                  color: C.textPrimary, cursor: "pointer", transition: "all 0.22s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  minWidth: 112, fontFamily: "inherit",
                  boxShadow: `0 2px 12px ${C.shadow}`, backdropFilter: "blur(8px)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.borderColor = col; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 10px 28px ${col}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = C.borderCard; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 12px ${C.shadow}`; }}
                >
                  <span style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${col}dd, ${col})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: "#fff",
                    boxShadow: `0 4px 16px ${col}55`,
                  }}>{name[0]}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{name}</span>
                </button>
              );
            })}
          </div>

          <p style={{ marginTop: 48, fontSize: 10, color: `rgba(26,19,15,0.2)`, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
            App Nahueroute · Equipo Interius · v2.0
          </p>
        </div>
      </div>
    );
  }

  const userColor = TEAM_COLORS[currentUser];

  // ── DASHBOARD ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: C.bgPage, color: C.textPrimary,
      backgroundImage: `
        radial-gradient(ellipse at 0% 0%, ${userColor}12 0%, transparent 45%),
        radial-gradient(ellipse at 100% 100%, rgba(27,179,154,0.08) 0%, transparent 45%),
        radial-gradient(ellipse at 55% 50%, rgba(214,201,168,0.4) 0%, transparent 65%)
      `,
    }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: `1px solid ${C.borderLight}`, padding: "13px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(237,229,216,0.88)",
        boxShadow: `0 1px 12px ${C.shadow}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "6px 14px 6px 9px",
            background: "rgba(255,255,255,0.82)", border: `1px solid ${C.border}`,
            borderRadius: 40, boxShadow: `0 1px 6px ${C.shadow}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.greenLichen}, ${C.greenForest})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, boxShadow: `0 2px 8px rgba(45,90,39,0.3)`,
            }}>🗺</div>
            <div>
              <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>Squad Tracker</div>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, color: C.greenLichen, letterSpacing: 1.8, textTransform: "uppercase" }}>by Interius</div>
            </div>
          </div>
          <span style={{
            fontSize: 10, padding: "2px 9px", borderRadius: 20,
            background: `rgba(27,179,154,0.12)`, border: `1px solid rgba(27,179,154,0.3)`,
            color: C.emerald, fontFamily: "var(--font-space-mono), monospace",
          }}>● LIVE</span>
        </div>

        {/* Progreso App Nahueroute */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "monospace", letterSpacing: 1.4, textTransform: "uppercase" }}>App Nahueroute</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-space-mono), monospace", color: userColor, lineHeight: 1.1 }}>{globalPct}%</div>
          </div>
          <Ring progress={globalPct} size={48} stroke={5} color={userColor} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", marginRight: 4 }}>
            {TEAM.map(name => (
              <div key={name} title={name} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `linear-gradient(135deg, ${TEAM_COLORS[name]}cc, ${TEAM_COLORS[name]})`,
                border: `2px solid ${C.bgPage}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#fff", marginLeft: -7,
                opacity: name === currentUser ? 1 : 0.4, transition: "opacity 0.2s",
                boxShadow: name === currentUser ? `0 0 0 2px ${TEAM_COLORS[name]}88` : "none",
              }}>{name[0]}</div>
            ))}
          </div>

          <button onClick={() => setShowSummary(true)} style={{
            padding: "7px 13px", borderRadius: 9,
            background: "rgba(255,255,255,0.72)", border: `1px solid ${C.borderCard}`,
            color: C.textSecondary, cursor: "pointer", fontSize: 12,
            fontFamily: "var(--font-space-mono), monospace",
            boxShadow: `0 1px 4px ${C.shadow}`, transition: "all 0.18s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.97)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.72)"}
          >📋 Resumen</button>

          <button onClick={() => setShowAddModal(true)} style={{
            padding: "7px 16px", borderRadius: 9,
            background: `linear-gradient(135deg, ${userColor}, ${C.greenForest})`,
            border: "none", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 800, fontFamily: "var(--font-space-mono), monospace",
            boxShadow: `0 3px 12px ${userColor}44`, transition: "opacity 0.18s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.87"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >+ Tarea</button>

          <button onClick={() => setCurrentUser(null)} style={{
            background: "rgba(255,255,255,0.65)", border: `1px solid ${C.borderCard}`,
            color: C.textMuted, cursor: "pointer", fontSize: 15, padding: "7px 10px",
            borderRadius: 9, transition: "all 0.18s", boxShadow: `0 1px 4px ${C.shadow}`,
          }} title="Cambiar usuario"
            onMouseEnter={e => { e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.background = "rgba(255,255,255,0.97)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "rgba(255,255,255,0.65)"; }}
          >⇄</button>
        </div>
      </header>

      {/* ── STATS ── */}
      <div style={{ display: "flex", padding: "12px 24px", gap: 8, borderBottom: `1px solid ${C.borderLight}` }}>
        {[
          { label: "Total",       value: tasks.length,                                                 icon: "◈", color: C.textPrimary },
          { label: "Completadas", value: done,                                                          icon: "✓", color: C.greenForest },
          { label: "En curso",    value: tasks.filter(t => t.progress > 0 && t.progress < 100).length, icon: "↻", color: userColor },
          { label: "Pendientes",  value: tasks.filter(t => t.progress === 0).length,                   icon: "○", color: C.khaki },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, padding: "10px 16px",
            background: "rgba(255,255,255,0.55)", border: `1px solid ${C.borderLight}`,
            borderRadius: 10, backdropFilter: "blur(8px)", boxShadow: `0 1px 6px ${C.shadow}`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-space-mono), monospace", color: s.color }}>
              {loading ? "—" : s.value}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
              {s.icon} {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div style={{ padding: "12px 24px", display: "flex", gap: 7, overflowX: "auto" }}>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: "6px 16px", borderRadius: 20,
            background: activeCategory === cat ? `${userColor}18` : "rgba(255,255,255,0.6)",
            border: activeCategory === cat ? `1px solid ${userColor}66` : `1px solid ${C.borderLight}`,
            color: activeCategory === cat ? userColor : C.textSecondary,
            cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
            fontFamily: "var(--font-space-mono), monospace", transition: "all 0.18s",
            boxShadow: activeCategory === cat ? `0 2px 8px ${userColor}20` : "none",
          }}>
            {cat !== "Todas" && CAT_ICONS[cat] + " "}{cat}
          </button>
        ))}
      </div>

      {/* ── COLUMNS ── */}
      <main style={{ padding: "4px 24px 56px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 38, height: 38, border: `3px solid rgba(94,125,90,0.2)`,
              borderTop: `3px solid ${userColor}`, borderRadius: "50%",
              animation: "spin 1s linear infinite", margin: "0 auto 14px",
            }} />
            <p style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 11, letterSpacing: 1 }}>
              cargando tareas...
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 16, animation: "fadeUp 0.4s ease",
          }}>
            {Object.keys(grouped).length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "70px 0", color: C.textMuted, fontFamily: "monospace", fontSize: 12 }}>
                Sin tareas todavía — ¡presiona &quot;+ Tarea&quot;!
              </div>
            )}
            {Object.entries(grouped).map(([cat, catTasks]) => {
              const catPct  = calcProgress(catTasks);
              const isNahue = cat === "App Nahueroute";
              return (
                <div key={cat} style={{
                  ...glass,
                  borderRadius: 16, padding: 16, overflow: "hidden",
                  ...(isNahue ? { borderTop: `2px solid ${C.emerald}` } : {}),
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 15 }}>{CAT_ICONS[cat]}</span>
                      <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 13, color: C.textPrimary }}>{cat}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                        {catTasks.filter(t => t.status === "done").length}/{catTasks.length}
                      </span>
                      <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(94,125,90,0.12)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${catPct}%`,
                          background: isNahue
                            ? `linear-gradient(90deg, ${C.greenLichen}, ${C.emerald})`
                            : `linear-gradient(90deg, ${userColor}88, ${userColor})`,
                          borderRadius: 4, transition: "width 0.8s",
                        }} />
                      </div>
                    </div>
                  </div>
                  {catTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      subtasks={subtasks.filter(s => s.task_id === task.id)}
                      currentUser={currentUser}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onAddSubtask={handleAddSubtask}
                      onToggleSubtask={handleToggleSubtask}
                      onDeleteSubtask={handleDeleteSubtask}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddTaskModal currentUser={currentUser} onAdd={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {showSummary && (
        <SummaryModal tasks={tasks} subtasks={subtasks} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
