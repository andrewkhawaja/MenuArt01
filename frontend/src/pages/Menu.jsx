import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DishCard from "../components/DishCard";
import { getRecommendations } from "../api/recommendApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const THEMES = [
  { id: "classic", name: "Classic", primary: "#f59e0b", secondary: "#d97706" },
  { id: "ocean", name: "Ocean", primary: "#38bdf8", secondary: "#0ea5e9" },
  { id: "forest", name: "Forest", primary: "#34d399", secondary: "#059669" },
  { id: "berry", name: "Berry", primary: "#f472b6", secondary: "#db2777" },
  { id: "plum", name: "Plum", primary: "#a78bfa", secondary: "#7c3aed" },
];

function getThemeForSlug(slug) {
  if (!slug) return THEMES[0];
  const raw = localStorage.getItem(`menuart_theme_${slug}`);
  if (!raw) return THEMES[0];
  try {
    const parsed = JSON.parse(raw);
    return parsed?.primary && parsed?.secondary ? parsed : THEMES[0];
  } catch {
    return THEMES[0];
  }
}

export default function Menu() {
  const { slug } = useParams();

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // AI Modal state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiStep, setAiStep] = useState("form"); // "form" | "results"
  const [prefs, setPrefs] = useState({
    diet: "any",
    lactoseFree: false,
    glutenFree: false,
    spicy: "any",
    protein: "any",
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [theme, setTheme] = useState(THEMES[0]);
  // aiResult shape:
  // { picks: [{ id, name, reason }], recommendedIds: [] }

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!slug) {
        setItems([]);
        setErr("Missing restaurant slug in URL. Use /r/<slug> مثل /r/andrew");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const safeSlug = encodeURIComponent(slug);
        const res = await fetch(`${API_BASE}/restaurants/${safeSlug}/menu`);
        if (!res.ok) throw new Error("Menu not found");
        const data = await res.json();
        if (!ignore) setItems(data.items || []);
      } catch {
        if (!ignore) {
          setItems([]);
          setErr("Could not load this restaurant menu.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    setTheme(getThemeForSlug(slug));
  }, [slug]);

  const itemById = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => i.category && set.add(i.category));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchesCat = activeCat === "All" ? true : it.category === activeCat;
      const matchesQuery = !q
        ? true
        : `${it.name} ${it.description || ""}`.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [items, query, activeCat]);

  // Group filtered items by category
  const groupedByCategory = useMemo(() => {
    const grouped = {};
    filtered.forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map((cat) => ({
      category: cat,
      items: grouped[cat],
    }));
  }, [filtered]);

  // Highlight AI recommended items in the grid
  const recommendedSet = useMemo(() => {
    const s = new Set();
    (aiResult?.recommendedIds || []).forEach((id) => s.add(id));
    return s;
  }, [aiResult]);

  function buildBackendPrefs() {
    const allergies = [];
    if (prefs.lactoseFree) allergies.push("lactose");
    if (prefs.glutenFree) allergies.push("gluten");

    let diet = prefs.diet === "any" ? null : prefs.diet;
    let preference = prefs.protein === "any" ? null : prefs.protein;

    // spice -> mood
    let mood = prefs.spicy === "any" ? null : prefs.spicy;

    return {
      diet,
      allergies: allergies.length ? allergies : null,
      preference,
      mood,
    };
  }

  async function runAiRecommend() {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      if (!slug) throw new Error("Missing restaurant slug");

      const backendPrefs = buildBackendPrefs();
      const data = await getRecommendations(slug, backendPrefs);

      const picksRaw = Array.isArray(data?.picks) ? data.picks : [];

      // ✅ Convert ids -> names using the loaded menu
      const picks = picksRaw.slice(0, 3).map((p) => {
        const id = p?.id;
        const it = itemById.get(id);
        return {
          id,
          name: it?.name || `Item #${id}`,
          reason: (p?.reason || "").toString(),
        };
      });

      const recommendedIds = picks.map((p) => p.id).filter(Boolean);

      setAiResult({ picks, recommendedIds });
      setAiStep("results"); // ✅ hide form and show results
    } catch (e) {
      setAiError(e?.message || "AI request failed");
      setAiStep("results"); // still show results panel (with error)
    } finally {
      setAiLoading(false);
    }
  }

  function clearAi() {
    setAiError("");
    setAiResult(null);
  }

  function resetAndCloseAi() {
    setAiOpen(false);
    setAiStep("form");
    setAiLoading(false);
    setAiError("");
    setAiResult(null);
  }

  return (
    <main
      style={{
        ...styles.page,
        "--accent": theme.primary,
        "--accent2": theme.secondary,
      }}
    >
      <div style={styles.container}>
        {/* Top bar */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logo}>
              <span style={{ color: "var(--accent)" }}>Menu</span>
              <span style={{ color: "white" }}>ARt</span>
            </div>
            <div style={styles.sub}>
              Restaurant: <span style={styles.slug}>{slug}</span>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button
              onClick={() => {
                setAiOpen(true);
                setAiStep("form");
              }}
              style={styles.aiBtn}
              disabled={loading || !!err || items.length === 0}
              title="Get AI recommendations"
            >
              <span style={{ marginRight: 6 }}>🤖</span>
              Help me choose
            </button>
          </div>
        </header>

        {/* Search + categories */}
        <section style={styles.controls}>
          <div style={{ position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search dishes…"
              style={styles.search}
            />
          </div>

          <div style={styles.catsRow}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                style={{
                  ...styles.catBtn,
                  ...(activeCat === c ? styles.catBtnActive : {}),
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Body */}
        {loading ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <div>Loading menu…</div>
          </div>
        ) : err ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div>{err}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div>No dishes match your search.</div>
          </div>
        ) : (
          <section style={styles.categoriesList}>
            {groupedByCategory.map((group, groupIdx) => (
              <div key={group.category} style={styles.categorySection}>
                <h2 style={styles.categoryTitle}>{group.category}</h2>
                <div style={styles.itemsGrid}>
                  {group.items.map((it, idx) => (
                    <div
                      key={it.id}
                      style={{
                        ...styles.cardWrap,
                        ...(recommendedSet.has(it.id)
                          ? styles.recommended
                          : {}),
                        animationDelay: `${(groupIdx * 10 + idx) * 0.05}s`,
                      }}
                      className="fade-in"
                    >
                      {recommendedSet.has(it.id) && (
                        <div style={styles.badge}>
                          <span style={{ marginRight: 4 }}>⭐</span>
                          Recommended
                        </div>
                      )}
                      <DishCard item={it} compact layout="list" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        <footer style={styles.footer}>
          <div style={{ opacity: 0.7, fontSize: 14 }}>
            Powered by{" "}
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>
              MenuARt
            </span>
          </div>
        </footer>
      </div>

      {/* AI Modal */}
      {aiOpen && (
        <div style={styles.modalOverlay} onClick={resetAndCloseAi}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <div style={styles.modalTitle}>AI Recommendations</div>
                <div style={styles.modalSub}>
                  {aiStep === "form"
                    ? "Choose preferences — then click Recommend."
                    : "Results — edit preferences if you want a different recommendation."}
                </div>
              </div>
              <button style={styles.closeBtn} onClick={resetAndCloseAi}>
                ✕
              </button>
            </div>

            {/* ✅ FORM STEP */}
            {aiStep === "form" && (
              <>
                <div style={styles.formGrid}>
                  <Field label="Diet">
                    <select
                      value={prefs.diet}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, diet: e.target.value }))
                      }
                      style={styles.select}
                    >
                      <option value="any">Any</option>
                      <option value="vegan">Vegan</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="halal">Halal</option>
                    </select>
                  </Field>

                  <Field label="Protein preference">
                    <select
                      value={prefs.protein}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, protein: e.target.value }))
                      }
                      style={styles.select}
                    >
                      <option value="any">Any</option>
                      <option value="beef">Beef</option>
                      <option value="chicken">Chicken</option>
                      <option value="seafood">Seafood</option>
                    </select>
                  </Field>

                  <Field label="Spice">
                    <select
                      value={prefs.spicy}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, spicy: e.target.value }))
                      }
                      style={styles.select}
                    >
                      <option value="any">Any</option>
                      <option value="mild">Mild</option>
                      <option value="spicy">Spicy</option>
                    </select>
                  </Field>

                  <div style={styles.checkRow}>
                    <label style={styles.check}>
                      <input
                        type="checkbox"
                        checked={prefs.lactoseFree}
                        onChange={(e) =>
                          setPrefs((p) => ({
                            ...p,
                            lactoseFree: e.target.checked,
                          }))
                        }
                      />
                      Lactose-free
                    </label>

                    <label style={styles.check}>
                      <input
                        type="checkbox"
                        checked={prefs.glutenFree}
                        onChange={(e) =>
                          setPrefs((p) => ({
                            ...p,
                            glutenFree: e.target.checked,
                          }))
                        }
                      />
                      Gluten-free
                    </label>
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button
                    style={styles.primary}
                    onClick={runAiRecommend}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Thinking…" : "Recommend dishes"}
                  </button>

                  <button
                    style={styles.secondary}
                    onClick={() => {
                      clearAi();
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {/* ✅ RESULTS STEP */}
            {aiStep === "results" && (
              <>
                <div style={styles.modalActions}>
                  <button
                    style={styles.secondary}
                    onClick={() => {
                      setAiStep("form");
                    }}
                  >
                    ✏️ Edit preferences
                  </button>

                  <button
                    style={styles.primary}
                    onClick={runAiRecommend}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Thinking…" : "Recommend again"}
                  </button>

                  <button
                    style={styles.secondary}
                    onClick={() => {
                      clearAi();
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            <div style={styles.resultBox}>
              {aiError ? (
                <div
                  style={{
                    color: "#fca5a5",
                    fontWeight: 800,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  ❌ {aiError}
                </div>
              ) : !aiResult ? (
                <div style={{ opacity: 0.85 }}>
                  {aiStep === "form"
                    ? "Choose preferences then click Recommend dishes."
                    : "No results yet. Click Recommend again."}
                </div>
              ) : aiResult.picks.length === 0 ? (
                <div style={{ opacity: 0.9 }}>
                  No matches found. Try loosening diet/allergy filters.
                </div>
              ) : (
                <>
                  <div style={styles.resultTitle}>AI Suggestions</div>
                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {aiResult.picks.map((p, i) => (
                      <div key={p.id} style={styles.pickRow}>
                        <div style={styles.pickIndex}>{i + 1}</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={styles.pickName}>
                            {p.name} <span style={styles.pickId}>#{p.id}</span>
                          </div>
                          <div style={styles.pickReason}>{p.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                    The highlighted dishes in the menu are the AI picks ⭐
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <div style={styles.label}>{label}</div>
      {children}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 20% 0%, rgba(245,158,11,0.22), transparent 55%), radial-gradient(900px 600px at 80% 10%, rgba(59,130,246,0.14), transparent 60%), #070b14",
    color: "white",
    padding: 16,
  },
  container: { maxWidth: 1100, margin: "0 auto" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    paddingTop: 6,
  },
  brand: { display: "grid", gap: 8 },
  logo: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  sub: { opacity: 0.9, fontSize: 15, fontWeight: 600 },
  slug: {
    color: "var(--accent)",
    fontWeight: 800,
    fontFamily: "monospace",
    background: "color-mix(in oklab, var(--accent) 18%, transparent)",
    padding: "2px 8px",
    borderRadius: 6,
  },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  aiBtn: {
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
  },

  controls: {
    marginTop: 20,
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 18,
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  search: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.4)",
    color: "white",
    outline: "none",
    fontSize: 16,
    fontFamily: "inherit",
  },
  catsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  catBtn: {
    padding: "10px 18px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  },
  catBtnActive: {
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0b1220",
    border: "1px solid color-mix(in oklab, var(--accent) 55%, transparent)",
    boxShadow: "0 4px 12px color-mix(in oklab, var(--accent) 35%, transparent)",
    transform: "translateY(-1px)",
  },

  centerMsg: {
    textAlign: "center",
    opacity: 0.9,
    marginTop: 60,
    fontSize: 18,
    fontWeight: 600,
  },

  categoriesList: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  categorySection: { display: "flex", flexDirection: "column", gap: 16 },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: "var(--accent)",
    margin: 0,
    paddingBottom: 8,
    borderBottom:
      "2px solid color-mix(in oklab, var(--accent) 35%, transparent)",
  },
  itemsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardWrap: {
    position: "relative",
    opacity: 0,
    animation: "fadeIn 0.4s ease forwards",
  },
  recommended: {
    outline: "3px solid color-mix(in oklab, var(--accent) 70%, transparent)",
    borderRadius: 22,
    boxShadow: "0 0 20px color-mix(in oklab, var(--accent) 45%, transparent)",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    padding: "8px 14px",
    borderRadius: 20,
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0b1220",
    fontWeight: 900,
    fontSize: 12,
    boxShadow: "0 4px 12px color-mix(in oklab, var(--accent) 55%, transparent)",
    display: "flex",
    alignItems: "center",
  },

  footer: { textAlign: "center", padding: "32px 0 20px", marginTop: 40 },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "grid",
    placeItems: "center",
    padding: 14,
    zIndex: 50,
  },
  modal: {
    width: "min(720px, 96vw)",
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: "var(--accent)",
    marginBottom: 4,
  },
  modalSub: { marginTop: 6, opacity: 0.85, fontSize: 15 },
  closeBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
  },

  formGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  field: { display: "grid", gap: 8 },
  label: { opacity: 0.85, fontWeight: 700 },
  select: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.4)",
    color: "white",
    outline: "none",
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  checkRow: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 4,
  },
  check: { display: "flex", gap: 8, alignItems: "center", opacity: 0.9 },

  modalActions: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  primary: {
    padding: "14px 20px",
    borderRadius: 16,
    border: 0,
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0b1220",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
  },
  secondary: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  resultBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  resultTitle: { fontWeight: 900, color: "var(--accent)" },

  pickRow: {
    display: "grid",
    gridTemplateColumns: "34px 1fr",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  pickIndex: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    background: "color-mix(in oklab, var(--accent) 18%, transparent)",
    color: "var(--accent)",
  },
  pickName: { fontWeight: 900, fontSize: 15 },
  pickId: {
    opacity: 0.7,
    fontWeight: 800,
    fontFamily: "monospace",
    marginLeft: 6,
  },
  pickReason: { opacity: 0.9, fontSize: 14, lineHeight: 1.35 },
};
