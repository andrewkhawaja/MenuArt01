import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ar.css";
import "../App.css";

function getThemeForSlug(slug) {
  if (!slug) return { primary: "#f59e0b", secondary: "#d97706" };
  const raw = localStorage.getItem(`menuart_theme_${slug}`);
  if (!raw) return { primary: "#f59e0b", secondary: "#d97706" };
  try {
    const parsed = JSON.parse(raw);
    return parsed?.primary && parsed?.secondary
      ? parsed
      : { primary: "#f59e0b", secondary: "#d97706" };
  } catch {
    return { primary: "#f59e0b", secondary: "#d97706" };
  }
}

export default function ARViewer() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const modelUrl = params.get("model");
  const name = params.get("name") || "AR Item";
  const restaurantSlug = params.get("slug"); // Get restaurant slug from URL
  const theme = getThemeForSlug(restaurantSlug);

  if (!modelUrl) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 50% 20%, rgba(245,158,11,0.20), transparent 55%), #070b14",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "white",
          "--accent": theme.primary,
          "--accent2": theme.secondary,
        }}
      >
        <div
          style={{
            textAlign: "center",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            padding: 32,
            maxWidth: 500,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 12, color: "var(--accent)" }}>
            Missing Model URL
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 24 }}>
            The AR model URL is missing. Please return to the menu and try again.
          </p>
          <button
            onClick={() => {
              if (restaurantSlug) {
                navigate(`/r/${restaurantSlug}`);
              } else {
                navigate(-1); // Go back in browser history
              }
            }}
            style={{
              padding: "12px 24px",
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#0b1220",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back to Menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1400px 800px at 50% 20%, rgba(245,158,11,0.15), transparent 60%), radial-gradient(1000px 600px at 80% 80%, rgba(59,130,246,0.12), transparent 50%), #070b14",
        padding: "24px 20px",
        color: "white",
        "--accent": theme.primary,
        "--accent2": theme.secondary,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header
          style={{
            marginBottom: 24,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            padding: 20,
            backdropFilter: "blur(10px)",
          }}
        >
          <button
            onClick={() => {
              if (restaurantSlug) {
                navigate(`/r/${restaurantSlug}`);
              } else {
                navigate(-1); // Go back in browser history
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              color: "white",
              opacity: 0.9,
              fontWeight: 600,
              transition: "opacity 0.2s ease",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
          >
            <span>←</span> Back to Menu
          </button>
          <h1
            style={{
              margin: "0 0 8px 0",
              color: "var(--accent)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 900,
            }}
          >
            {name}
          </h1>
          <p
            style={{
              margin: 0,
              opacity: 0.85,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📱</span> On mobile, tap the AR button inside the viewer to view in
            augmented reality.
          </p>
        </header>

        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
          className="fade-in"
        >
          <model-viewer
            src={modelUrl}
            ar
            ar-modes="scene-viewer webxr quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{
              width: "100%",
              height: "75vh",
              minHeight: "500px",
              borderRadius: "16px",
              background: "rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </main>
  );
}
