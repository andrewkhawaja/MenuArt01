import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import DishCard from "../components/DishCard";
import {
  createMenuItem,
  createRestaurant,
  deleteMenuItem,
  getMenu,
  getRestaurantTheme,
  updateMenuItem,
  updateRestaurantTheme,
} from "../api/adminApi";

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

function saveThemeForSlug(slug, theme) {
  if (!slug) return;
  localStorage.setItem(`menuart_theme_${slug}`, JSON.stringify(theme));
}

function themeFromApi(data) {
  if (!data?.themePrimary || !data?.themeSecondary) return null;
  const byName = THEMES.find(
    (t) => t.name.toLowerCase() === String(data.themeName || "").toLowerCase()
  );
  if (byName) return byName;
  return {
    id: "custom",
    name: data.themeName || "Custom",
    primary: data.themePrimary,
    secondary: data.themeSecondary,
  };
}

export default function AdminDashboard() {
  const nav = useNavigate();

  const [activeSlug, setActiveSlug] = useState("");

  // Restaurant creation
  const [restName, setRestName] = useState("");
  const [restSlug, setRestSlug] = useState("");

  // Menu preview
  const [items, setItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Add item form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("Mains");
  const [subcategory, setSubcategory] = useState("");
  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);

  const [status, setStatus] = useState("");

  // Edit modal
  const [editingItem, setEditingItem] = useState(null);
  const [theme, setTheme] = useState(THEMES[0]);

  // -------------------------
  // QR Base (customer menu)
  // -------------------------
  // ✅ For deployment (Vercel):
  const QR_BASE = "https://menu-art01.vercel.app";

  const customerUrl = useMemo(() => {
    if (!activeSlug) return "";
    return `${QR_BASE}/r/${activeSlug}`;
  }, [activeSlug]);

  useEffect(() => {
    const token = localStorage.getItem("menuart_token");
    if (!token) nav("/admin/login");
  }, [nav]);

  useEffect(() => {
    setTheme(getThemeForSlug(activeSlug));
  }, [activeSlug]);

  const loadMenu = async (slug) => {
    if (!slug) return;
    setLoadingMenu(true);
    try {
      const data = await getMenu(slug);
      setItems(data.items || []);
      const apiTheme = themeFromApi(data);
      if (apiTheme) {
        setTheme(apiTheme);
        saveThemeForSlug(slug, apiTheme);
      }
      if (!apiTheme) {
        const themeData = await getRestaurantTheme(slug);
        const themeFromServer = themeFromApi(themeData);
        if (themeFromServer) {
          setTheme(themeFromServer);
          saveThemeForSlug(slug, themeFromServer);
        }
      }
    } catch {
      setItems([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  const persistTheme = async (slug, nextTheme, message) => {
    setTheme(nextTheme);
    saveThemeForSlug(slug, nextTheme);
    try {
      await updateRestaurantTheme(slug, nextTheme);
      if (message) setStatus(message);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const logout = () => {
    localStorage.removeItem("menuart_token");
    nav("/admin/login");
  };

  // -------------------------
  // Create restaurant
  // -------------------------
  const handleCreateRestaurant = async () => {
    setStatus("");
    const slug = restSlug.trim().toLowerCase().replace(/\s+/g, "-");

    if (!restName.trim()) return setStatus("❌ Restaurant name is required.");
    if (!slug) return setStatus("❌ Restaurant slug is required.");

    try {
      setStatus("Creating restaurant...");
      await createRestaurant(restName.trim(), slug);
      setStatus("✅ Restaurant created.");
      setActiveSlug(slug);
      await loadMenu(slug);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  // -------------------------
  // Load existing restaurant menu
  // -------------------------
  const handleUseSlug = async () => {
    setStatus("");
    const slug = activeSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return setStatus("❌ Enter a restaurant slug.");
    setActiveSlug(slug);
    await loadMenu(slug);
    setStatus("✅ Loaded menu.");
  };

  // -------------------------
  // Add dish
  // -------------------------
  const handleAddDish = async (e) => {
    e.preventDefault();
    setStatus("");

    const slug = activeSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return setStatus("❌ Create or choose a restaurant slug first.");
    if (!name.trim()) return setStatus("❌ Dish name is required.");
    if (!price) return setStatus("❌ Price is required.");

    try {
      setStatus("Uploading dish...");
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("description", description || "");
      fd.append("price", price);
      fd.append("category", category || "");
      fd.append("subcategory", subcategory || "");
      // currency currently not accepted by backend endpoint — keep UI for later.

      if (image) fd.append("image", image);
      if (model) fd.append("model", model);

      await createMenuItem(slug, fd);

      setStatus("✅ Dish added. Refreshing menu...");
      setName("");
      setDescription("");
      setPrice("");
      setCurrency("USD");
      setCategory("Mains");
      setSubcategory("");
      setImage(null);
      setModel(null);

      await loadMenu(slug);
      setStatus("✅ Done.");
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  // -------------------------
  // Delete handler
  // -------------------------
  const handleDelete = async (it) => {
    if (!it?.id) return;
    if (!activeSlug) return;
    const ok = window.confirm(`Delete "${it.name}" permanently?`);
    if (!ok) return;

    try {
      setStatus("Deleting item...");
      await deleteMenuItem(activeSlug, it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      setStatus("✅ Item deleted.");
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  // -------------------------
  // Save edit handler
  // -------------------------
  const handleSaveEdit = async (payload) => {
    // payload: { id, name, description, price, category, subcategory, imageFile?, modelFile? }
    if (!activeSlug) return;
    try {
      setStatus("Saving changes...");
      const fd = new FormData();
      fd.append("name", payload.name.trim());
      fd.append("description", payload.description || "");
      fd.append("price", payload.price);
      fd.append("category", payload.category || "");
      fd.append("subcategory", payload.subcategory || "");
      if (payload.imageFile) fd.append("image", payload.imageFile);
      if (payload.modelFile) fd.append("model", payload.modelFile);

      const updated = await updateMenuItem(activeSlug, payload.id, fd);

      // update UI (try both updated.item or updated direct)
      const updatedItem = updated?.item || updated;

      setItems((prev) =>
        prev.map((x) => (x.id === payload.id ? { ...x, ...updatedItem } : x))
      );

      setEditingItem(null);
      setStatus("✅ Updated.");
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>
              <span style={{ color: "#f59e0b" }}>Admin</span> Dashboard
            </h1>
            <p style={styles.sub}>
              Create restaurants, add dishes, upload images + GLB, generate QR.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to={activeSlug ? `/r/${activeSlug}` : "/"}
              style={styles.linkBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            >
              <span style={{ marginRight: 6 }}>👁️</span>
              Open Customer Menu
            </Link>

            <button
              onClick={logout}
              style={styles.grayBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {status && (
          <div
            style={{
              ...styles.status,
              background: status.includes("✅")
                ? "rgba(34,197,94,0.15)"
                : status.includes("❌")
                ? "rgba(239,68,68,0.15)"
                : "rgba(255,255,255,0.08)",
              border: status.includes("✅")
                ? "1px solid rgba(34,197,94,0.3)"
                : status.includes("❌")
                ? "1px solid rgba(239,68,68,0.3)"
                : "1px solid rgba(255,255,255,0.12)",
              color: status.includes("✅")
                ? "#86efac"
                : status.includes("❌")
                ? "#fca5a5"
                : "white",
            }}
          >
            {status}
          </div>
        )}

        {/* Responsive layout */}
        <section className="admin-grid-fix" style={styles.grid}>
          {/* LEFT: Forms */}
          <div style={styles.stack}>
            <Card title="Create Restaurant">
              <div style={styles.form}>
                <input
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  placeholder="Restaurant name (e.g. Fire Grill)"
                  style={styles.input}
                />
                <input
                  value={restSlug}
                  onChange={(e) => setRestSlug(e.target.value)}
                  placeholder="Restaurant slug (e.g. fire-grill)"
                  style={styles.input}
                />
                <button
                  onClick={handleCreateRestaurant}
                  style={styles.primaryBtn}
                >
                  Create Restaurant
                </button>
              </div>
            </Card>

            <Card title="Select Restaurant">
              <div style={styles.row}>
                <input
                  value={activeSlug}
                  onChange={(e) => setActiveSlug(e.target.value)}
                  placeholder="Enter existing slug (e.g. fire-grill)"
                  style={{ ...styles.input, flex: "1 1 200px", minWidth: 0 }}
                />
                <button
                  onClick={handleUseSlug}
                  style={{ ...styles.grayBtn, flexShrink: 0 }}
                >
                  Load Menu
                </button>
              </div>
              {activeSlug && (
                <p style={{ marginTop: 10, opacity: 0.85 }}>
                  Active slug: <b style={{ color: "#f59e0b" }}>{activeSlug}</b>
                </p>
              )}
            </Card>

            <Card title="QR Code (Customer Menu)">
              {!activeSlug ? (
                <p style={{ opacity: 0.85 }}>
                  Create/select a restaurant first.
                </p>
              ) : (
                <>
                  <div style={styles.qrWrap}>
                    <QRCodeCanvas value={customerUrl} size={190} />
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      opacity: 0.9,
                      wordBreak: "break-all",
                    }}
                  >
                    URL: <span style={{ color: "#f59e0b" }}>{customerUrl}</span>
                  </div>
                  <a href={customerUrl} style={styles.smallLink}>
                    Open Customer Menu →
                  </a>
                </>
              )}
            </Card>

            <Card title="Theme (Menu Colors)">
              {!activeSlug ? (
                <p style={{ opacity: 0.85 }}>
                  Select a restaurant to choose its theme.
                </p>
              ) : (
                <>
                  <div style={styles.themeGrid}>
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        style={{
                          ...styles.themeBtn,
                          borderColor:
                            theme?.id === t.id
                              ? "rgba(255,255,255,0.6)"
                              : "rgba(255,255,255,0.15)",
                        }}
                        onClick={async () => {
                          await persistTheme(
                            activeSlug,
                            t,
                            `✅ Theme set to ${t.name}.`
                          );
                        }}
                        title={`${t.name} theme`}
                      >
                        <span
                          style={{
                            ...styles.themeSwatch,
                            background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                          }}
                        />
                        <span style={styles.themeLabel}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                  <div style={styles.themeCustomRow}>
                    <div style={styles.themeCustomField}>
                      <label style={styles.themeCustomLabel}>Primary</label>
                      <input
                        type="color"
                        value={theme?.primary || "#f59e0b"}
                        onChange={(e) => {
                          const updated = {
                            id: "custom",
                            name: "Custom",
                            primary: e.target.value,
                            secondary: theme?.secondary || "#d97706",
                          };
                          persistTheme(activeSlug, updated);
                        }}
                        style={styles.colorInput}
                      />
                    </div>
                    <div style={styles.themeCustomField}>
                      <label style={styles.themeCustomLabel}>Secondary</label>
                      <input
                        type="color"
                        value={theme?.secondary || "#d97706"}
                        onChange={(e) => {
                          const updated = {
                            id: "custom",
                            name: "Custom",
                            primary: theme?.primary || "#f59e0b",
                            secondary: e.target.value,
                          };
                          persistTheme(activeSlug, updated);
                        }}
                        style={styles.colorInput}
                      />
                    </div>
                  </div>
                  <div style={styles.themeCustomRow}>
                    <input
                      type="text"
                      value={theme?.primary || "#f59e0b"}
                      onChange={(e) => {
                        const updated = {
                          id: "custom",
                          name: "Custom",
                          primary: e.target.value,
                          secondary: theme?.secondary || "#d97706",
                        };
                        persistTheme(activeSlug, updated);
                      }}
                      placeholder="#f59e0b"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={theme?.secondary || "#d97706"}
                      onChange={(e) => {
                        const updated = {
                          id: "custom",
                          name: "Custom",
                          primary: theme?.primary || "#f59e0b",
                          secondary: e.target.value,
                        };
                        persistTheme(activeSlug, updated);
                      }}
                      placeholder="#d97706"
                      style={styles.input}
                    />
                  </div>
                  <p style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
                    Customer menu colors update instantly based on this theme.
                  </p>
                </>
              )}
            </Card>

            <Card title="Add Dish">
              <form onSubmit={handleAddDish} style={styles.form}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dish name"
                  style={styles.input}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  style={{ ...styles.input, minHeight: 90 }}
                />

                <div style={styles.twoCols}>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (e.g. 12.99)"
                    style={styles.input}
                  />
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="Currency (USD)"
                    style={styles.input}
                  />
                </div>

                <div style={styles.twoCols}>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (e.g. Mains)"
                    style={styles.input}
                  />
                  <input
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Subcategory (optional)"
                    style={styles.input}
                  />
                </div>

                <label style={styles.fileLabel}>
                  <span>Dish Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />
                </label>

                <label style={styles.fileLabel}>
                  <span>AR Model (GLB)</span>
                  <input
                    type="file"
                    accept=".glb"
                    onChange={(e) => setModel(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />
                </label>

                <button type="submit" style={styles.primaryBtn}>
                  Add Dish
                </button>
              </form>
            </Card>
          </div>

          {/* RIGHT: Preview */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#f59e0b",
                }}
              >
                Final Menu Preview
              </h2>
              {activeSlug && (
                <span
                  style={{
                    opacity: 0.8,
                    fontSize: 14,
                    fontFamily: "monospace",
                    background: "rgba(245,158,11,0.15)",
                    padding: "4px 10px",
                    borderRadius: 8,
                    color: "#f59e0b",
                    fontWeight: 700,
                  }}
                >
                  {activeSlug}
                </span>
              )}
            </div>

            <div style={{ marginTop: 12, position: "relative", zIndex: 1 }}>
              {!activeSlug ? (
                <p style={{ opacity: 0.85 }}>Select a restaurant to preview.</p>
              ) : loadingMenu ? (
                <p style={{ opacity: 0.85 }}>Loading…</p>
              ) : items.length === 0 ? (
                <p style={{ opacity: 0.85 }}>No items yet.</p>
              ) : (
                <div style={styles.previewGrid}>
                  {items.map((it) => (
                    <div key={it.id} style={styles.cardWrap}>
                      {/* ACTION ICONS */}
                      <div style={styles.itemActions}>
                        <button
                          type="button"
                          title="Edit"
                          style={styles.iconBtn}
                          onClick={() => setEditingItem(it)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.25)";
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          style={{
                            ...styles.iconBtn,
                            background: "rgba(239,68,68,0.18)",
                            borderColor: "rgba(239,68,68,0.35)",
                            color: "#fecaca",
                          }}
                          onClick={() => handleDelete(it)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.25)";
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <DishCard item={it} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <EditDishModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </main>
  );
}

function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 18,
          fontWeight: 900,
          color: "#f59e0b",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EditDishModal({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [category, setCategory] = useState(item?.category || "Mains");
  const [subcategory, setSubcategory] = useState(item?.subcategory || "");

  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Dish name is required");
    if (!price) return alert("Price is required");

    onSave({
      id: item.id,
      name,
      description,
      price,
      category,
      subcategory,
      imageFile,
      modelFile,
    });
  };

  return (
    <div style={styles.modalBackdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, color: "#f59e0b" }}>Edit Dish</h3>
          <button style={styles.modalClose} onClick={onClose}>
            ✖
          </button>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 10, marginTop: 14 }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Dish name"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...styles.input, minHeight: 90 }}
            placeholder="Description"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={styles.input}
            placeholder="Price"
          />

          <div style={styles.twoCols}>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
              placeholder="Category"
            />
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              style={styles.input}
              placeholder="Subcategory (optional)"
            />
          </div>

          <label style={styles.label}>
            Replace Image (optional):
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <label style={styles.label}>
            Replace GLB Model (optional):
            <input
              type="file"
              accept=".glb"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button type="button" style={styles.grayBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryBtn}>
              Save Changes
            </button>
          </div>
        </form>

        <p style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
          Tip: If your backend returns an error on update, your API might use
          PATCH instead of PUT.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 50% 10%, rgba(245,158,11,0.20), transparent 55%), #070b14",
    color: "white",
    padding: "20px 16px",
    overflowX: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1600,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    padding: "0 16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
    width: "100%",
    boxSizing: "border-box",
  },
  h1: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 36px)",
    fontWeight: 900,
    letterSpacing: "-0.5px",
  },
  sub: { marginTop: 8, opacity: 0.9, fontSize: 15, fontWeight: 500 },
  headerActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },

  status: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    fontWeight: 600,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  grid: {
    marginTop: 14,
    display: "grid",
    gap: 20,
    gridTemplateColumns: "minmax(350px, 450px) 1fr",
    position: "relative",
    alignItems: "start",
    width: "100%",
    boxSizing: "border-box",
  },
  stack: {
    display: "grid",
    gap: 12,
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },

  form: { display: "grid", gap: 10 },
  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  twoCols: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  input: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.4)",
    color: "white",
    outline: "none",
    fontSize: 15,
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },

  label: { opacity: 0.9, display: "grid", gap: 6 },
  fileLabel: {
    display: "grid",
    gap: 8,
    fontWeight: 700,
    opacity: 0.9,
  },
  fileInput: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.35)",
    color: "white",
  },

  primaryBtn: {
    padding: "14px 20px",
    borderRadius: 14,
    border: 0,
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#0b1220",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
    boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
    transition: "all 0.2s ease",
  },

  grayBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  linkBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },

  qrWrap: {
    background: "white",
    display: "inline-block",
    padding: 14,
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },

  smallLink: {
    display: "inline-block",
    marginTop: 10,
    color: "#f59e0b",
    fontWeight: 900,
    textDecoration: "none",
  },

  previewGrid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    position: "relative",
    zIndex: 1,
    alignContent: "start",
  },

  // wrap DishCard so we can overlay icons
  cardWrap: {
    position: "relative",
  },
  itemActions: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 6,
    zIndex: 20,
  },
  iconBtn: {
    width: 28,
    height: 28,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(2,6,23,0.55)",
    color: "white",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 14,
    lineHeight: "14px",
    display: "grid",
    placeItems: "center",
    backdropFilter: "blur(6px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },

  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
  },
  themeCustomRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 10,
  },
  themeCustomField: {
    display: "grid",
    gap: 6,
  },
  themeCustomLabel: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: 700,
  },
  colorInput: {
    width: "100%",
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  themeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
  },
  themeSwatch: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  themeLabel: {
    fontWeight: 700,
    fontSize: 13,
  },

  // modal
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    width: "min(520px, 100%)",
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 18px 70px rgba(0,0,0,0.5)",
    backdropFilter: "blur(10px)",
  },
  modalClose: {
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },
};
