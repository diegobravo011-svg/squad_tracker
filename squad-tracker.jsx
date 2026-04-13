import { useState, useEffect, useRef } from "react";

// ============================================================
// SUPABASE CONFIG — reemplaza con tus credenciales
// ============================================================
const SUPABASE_URL = "https://ojuibtesufcpmgzrylbl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yNR_bvFnmymtoyYskbQgLA_lSsvfcif";

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const db = {
  async get(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers: supabaseHeaders });
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify(data),
    });
    return res.json();
  },
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: supabaseHeaders, body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE", headers: supabaseHeaders,
    });
  },
};

// ============================================================
// DEMO MODE (sin Supabase) — datos locales
// ============================================================
const DEMO_TASKS = [
  { id: 1, title: "Diseñar pantalla de Login", category: "Frontend", progress: 75, assignee: "Ana", updated_at: new Date().toISOString(), status: "active" },
  { id: 2, title: "Configurar rutas API REST", category: "Backend", progress: 40, assignee: "Carlos", updated_at: new Date().toISOString(), status: "active" },
  { id: 3, title: "Definir paleta de colores", category: "Diseño", progress: 100, assignee: "Mía", updated_at: new Date().toISOString(), status: "done" },
  { id: 4, title: "Redactar copy onboarding", category: "Marketing", progress: 20, assignee: "Luis", updated_at: new Date().toISOString(), status: "active" },
  { id: 5, title: "Setup base de datos", category: "Backend", progress: 60, assignee: "Carlos", updated_at: new Date().toISOString(), status: "active" },
  { id: 6, title: "Componente de navegación", category: "Frontend", progress: 90, assignee: "Ana", updated_at: new Date().toISOString(), status: "active" },
];

const TEAM = ["Ana", "Carlos", "Mía", "Luis"];
const TEAM_COLORS = { Ana: "#FF6B6B", Carlos: "#4ECDC4", Mía: "#FFE66D", Luis: "#A29BFE" };
const CATEGORIES = ["Frontend", "Backend", "Diseño", "Marketing", "General"];
const CAT_ICONS = { Frontend: "◈", Backend: "⬡", Diseño: "✦", Marketing: "◉", General: "◎" };

// ============================================================
// UTILS
// ============================================================
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "ahora mismo";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

function globalProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);
}

// ============================================================
// COMPONENTS
// ============================================================

function Ring({ progress, size = 120, stroke = 10, color = "#FF6B6B" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function HexProgress({ progress, color }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <Ring progress={progress} size={56} stroke={5} color={color} />
      <span style={{ position: "absolute", fontSize: 11, fontWeight: 700, color, fontFamily: "'Space Mono', monospace" }}>
        {progress}%
      </span>
    </div>
  );
}

function TaskCard({ task, currentUser, onUpdate, onDelete }) {
  const [dragging, setDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(task.progress);
  const color = TEAM_COLORS[task.assignee] || "#fff";
  const isOwn = task.assignee === currentUser;

  useEffect(() => setLocalProgress(task.progress), [task.progress]);

  function handleProgressChange(e) {
    const val = parseInt(e.target.value);
    setLocalProgress(val);
    onUpdate(task.id, { progress: val, assignee: currentUser, updated_at: new Date().toISOString(), status: val === 100 ? "done" : "active" });
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid rgba(255,255,255,${isOwn ? 0.15 : 0.06})`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      transition: "all 0.2s",
      opacity: task.status === "done" ? 0.65 : 1,
      backdropFilter: "blur(4px)",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 600, color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: task.status === "done" ? "line-through" : "none",
            opacity: task.status === "done" ? 0.6 : 1,
          }}>{task.title}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
              {timeAgo(task.updated_at)}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 20,
              background: `${color}22`, color, fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
            }}>{task.assignee}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HexProgress progress={localProgress} color={localProgress === 100 ? "#2ecc71" : color} />
          {isOwn && (
            <button onClick={() => onDelete(task.id)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.2)",
              cursor: "pointer", fontSize: 14, padding: 4,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#FF6B6B"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.2)"}
            >✕</button>
          )}
        </div>
      </div>

      {isOwn && (
        <div style={{ position: "relative" }}>
          <input type="range" min={0} max={100} value={localProgress}
            onChange={handleProgressChange}
            style={{
              width: "100%", height: 6, cursor: "pointer",
              accentColor: localProgress === 100 ? "#2ecc71" : color,
              borderRadius: 4,
            }}
          />
          <div style={{
            position: "absolute", top: -1, left: 0,
            width: `${localProgress}%`, height: 6,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            borderRadius: 4, pointerEvents: "none", transition: "width 0.3s",
          }} />
        </div>
      )}
      {!isOwn && (
        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${localProgress}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            borderRadius: 4, transition: "width 0.8s",
          }} />
        </div>
      )}
    </div>
  );
}

function AddTaskModal({ currentUser, onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Frontend");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(8px)",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, width: 360, boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
      }}>
        <h3 style={{ margin: "0 0 20px", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>
          + Nueva Tarea
        </h3>
        <input
          autoFocus
          placeholder="Título de la tarea..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && title.trim() && onAdd({ title: title.trim(), category })}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            outline: "none", boxSizing: "border-box", marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontWeight: 700,
              background: category === c ? TEAM_COLORS[currentUser] || "#fff" : "rgba(255,255,255,0.07)",
              color: category === c ? "#000" : "rgba(255,255,255,0.6)",
              border: "none", transition: "all 0.2s",
            }}>{CAT_ICONS[c]} {c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14,
          }}>Cancelar</button>
          <button
            onClick={() => title.trim() && onAdd({ title: title.trim(), category })}
            style={{
              flex: 2, padding: "10px", borderRadius: 8, border: "none",
              background: TEAM_COLORS[currentUser] || "#fff",
              color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
            }}>Agregar →</button>
        </div>
      </div>
    </div>
  );
}

function SummaryModal({ tasks, onClose }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSummary();
  }, []);

  async function generateSummary() {
    setLoading(true);
    const done = tasks.filter(t => t.status === "done");
    const inProgress = tasks.filter(t => t.status === "active" && t.progress > 0);
    const pending = tasks.filter(t => t.progress === 0);
    const global = globalProgress(tasks);

    const prompt = `Eres el asistente de un equipo de 4 desarrolladores. Genera un resumen semanal conciso y motivador del progreso del equipo.

Datos del proyecto:
- Progreso global: ${global}%
- Tareas completadas (${done.length}): ${done.map(t => `"${t.title}" (${t.assignee})`).join(", ")}
- En progreso (${inProgress.length}): ${inProgress.map(t => `"${t.title}" al ${t.progress}% (${t.assignee})`).join(", ")}
- Sin iniciar (${pending.length}): ${pending.map(t => `"${t.title}"`).join(", ")}

Genera el resumen en español, con 3 secciones: ✅ Logros, 🔄 En curso, 📌 Para la próxima semana. Máximo 200 palabras. Tono: directo, motivador, profesional.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      setSummary(data.content?.[0]?.text || "No se pudo generar el resumen.");
    } catch {
      setSummary("Error al conectar con la IA. Verifica tu conexión.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(8px)",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: 32, width: 480, maxHeight: "80vh",
        overflow: "auto", boxShadow: "0 60px 100px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 20 }}>
            📋 Resumen Semanal
          </h3>
          <button onClick={generateSummary} style={{
            background: "rgba(255,255,255,0.07)", border: "none", color: "#fff",
            padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12,
            fontFamily: "monospace",
          }}>↻ Regenerar</button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)",
              borderTop: "3px solid #4ECDC4", borderRadius: "50%",
              animation: "spin 1s linear infinite", margin: "0 auto 16px",
            }} />
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
              Generando resumen con IA...
            </p>
          </div>
        ) : (
          <div style={{
            color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap",
          }}>{summary}</div>
        )}
        <button onClick={onClose} style={{
          marginTop: 24, width: "100%", padding: "12px", borderRadius: 10,
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'Space Mono', monospace",
        }}>Cerrar</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [useSupabase] = useState(true); // ✅ Conectado a Supabase
  const [tick, setTick] = useState(0);

  // Polling (cuando useSupabase=true)
  useEffect(() => {
    if (!useSupabase) return;
    const interval = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(interval);
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase) return;
    db.get("tasks").then(data => { if (Array.isArray(data)) setTasks(data); });
  }, [tick, useSupabase]);

  function handleUpdate(id, updates) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (useSupabase) db.update("tasks", id, updates);
  }

  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (useSupabase) db.delete("tasks", id);
  }

  async function handleAdd({ title, category }) {
    const payload = {
      title, category,
      progress: 0,
      assignee: currentUser,
      updated_at: new Date().toISOString(),
      status: "active",
    };
    if (useSupabase) {
      const [inserted] = await db.insert("tasks", payload);
      if (inserted) setTasks(prev => [inserted, ...prev]);
    } else {
      setTasks(prev => [{ id: Date.now(), ...payload }, ...prev]);
    }
    setShowAddModal(false);
  }

  const allCategories = ["Todas", ...CATEGORIES.filter(c => tasks.some(t => t.category === c))];
  const filtered = activeCategory === "Todas" ? tasks : tasks.filter(t => t.category === activeCategory);
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catTasks = filtered.filter(t => t.category === cat);
    if (catTasks.length) acc[cat] = catTasks;
    return acc;
  }, {});
  const global = globalProgress(tasks);
  const done = tasks.filter(t => t.status === "done").length;

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080d14",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(78,205,196,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(162,155,254,0.06) 0%, transparent 60%)",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⬡</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: "#fff",
            margin: "0 0 4px", letterSpacing: -1,
          }}>Squad Tracker</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", margin: "0 0 40px", fontSize: 14, fontFamily: "'Space Mono', monospace" }}>
            ¿Quién eres hoy?
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {TEAM.map(name => (
              <button key={name} onClick={() => setCurrentUser(name)} style={{
                padding: "16px 28px", borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${TEAM_COLORS[name]}44`,
                color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                minWidth: 100,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${TEAM_COLORS[name]}22`;
                  e.currentTarget.style.borderColor = TEAM_COLORS[name];
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = `${TEAM_COLORS[name]}44`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: TEAM_COLORS[name], display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 800, color: "#000",
                }}>{name[0]}</span>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userColor = TEAM_COLORS[currentUser];

  return (
    <div style={{
      minHeight: "100vh", background: "#080d14", color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      backgroundImage: `radial-gradient(ellipse at 10% 10%, ${userColor}10 0%, transparent 50%), radial-gradient(ellipse at 90% 90%, rgba(78,205,196,0.05) 0%, transparent 50%)`,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: currentColor; cursor: pointer; margin-top: -4px; }
        input[type=range]::-webkit-slider-runnable-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,13,20,0.85)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⬡</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
            Squad Tracker
          </span>
          {!useSupabase && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: "rgba(255,200,0,0.15)", color: "#ffd700",
              fontFamily: "'Space Mono', monospace",
            }}>DEMO</span>
          )}
        </div>

        {/* GLOBAL PROGRESS */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>PROGRESO GLOBAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: userColor }}>
              {global}%
            </div>
          </div>
          <Ring progress={global} size={48} stroke={5} color={userColor} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Team avatars */}
          <div style={{ display: "flex", gap: -4 }}>
            {TEAM.map(name => (
              <div key={name} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: TEAM_COLORS[name],
                border: "2px solid #080d14",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#000",
                marginLeft: -6, opacity: name === currentUser ? 1 : 0.5,
                transition: "opacity 0.2s",
              }} title={name}>{name[0]}</div>
            ))}
          </div>

          <button onClick={() => setShowSummary(true)} style={{
            padding: "8px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", cursor: "pointer", fontSize: 12,
            fontFamily: "'Space Mono', monospace",
          }}>📋 Resumen</button>

          <button onClick={() => setShowAddModal(true)} style={{
            padding: "8px 16px", borderRadius: 10,
            background: userColor, border: "none",
            color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 800,
            fontFamily: "'Space Mono', monospace",
          }}>+ Tarea</button>

          <button onClick={() => setCurrentUser(null)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            cursor: "pointer", fontSize: 18,
          }} title="Cambiar usuario">⇄</button>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{
        display: "flex", gap: 1, padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {[
          { label: "Total", value: tasks.length, icon: "◈" },
          { label: "Completadas", value: done, icon: "✓", color: "#2ecc71" },
          { label: "En curso", value: tasks.filter(t => t.progress > 0 && t.progress < 100).length, icon: "↻", color: userColor },
          { label: "Pendientes", value: tasks.filter(t => t.progress === 0).length, icon: "○" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, padding: "10px 16px", background: "rgba(255,255,255,0.03)",
            borderRadius: 10, margin: "0 4px",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Space Mono', monospace", color: s.color || "rgba(255,255,255,0.7)" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: 2 }}>
              {s.icon} {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORY FILTER */}
      <div style={{ padding: "14px 24px", display: "flex", gap: 8, overflowX: "auto" }}>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none",
            background: activeCategory === cat ? userColor : "rgba(255,255,255,0.06)",
            color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.5)",
            cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
          }}>
            {cat !== "Todas" && CAT_ICONS[cat] + " "}{cat}
          </button>
        ))}
      </div>

      {/* TASK COLUMNS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16, padding: "0 24px 40px",
        animation: "fadeUp 0.4s ease",
      }}>
        {Object.entries(grouped).map(([cat, catTasks]) => (
          <div key={cat} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{CAT_ICONS[cat]}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{cat}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  {catTasks.filter(t => t.status === "done").length}/{catTasks.length}
                </span>
                <div style={{
                  width: 40, height: 4, borderRadius: 4,
                  background: "rgba(255,255,255,0.07)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${globalProgress(catTasks)}%`,
                    background: userColor, borderRadius: 4, transition: "width 0.8s",
                  }} />
                </div>
              </div>
            </div>
            {catTasks.map(task => (
              <TaskCard key={task.id} task={task} currentUser={currentUser}
                onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        ))}
      </div>

      {showAddModal && <AddTaskModal currentUser={currentUser} onAdd={handleAdd} onClose={() => setShowAddModal(false)} />}
      {showSummary && <SummaryModal tasks={tasks} onClose={() => setShowSummary(false)} />}
    </div>
  );
}
