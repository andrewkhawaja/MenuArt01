import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@menuart.com");
  const [password, setPassword] = useState("Admin1234!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("menuart_token", data.access_token);

      nav("/admin");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1400px 800px at 50% 20%, rgba(245,158,11,0.20), transparent 60%), radial-gradient(1000px 600px at 80% 80%, rgba(59,130,246,0.12), transparent 50%), #070b14",
        display: "grid",
        placeItems: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "300px",
          height: "300px",
          background: "rgba(245,158,11,0.05)",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 24,
          padding: 32,
          color: "white",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 20,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            ← Back to Home
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: 32,
              fontWeight: 900,
              color: "#f59e0b",
            }}
          >
            Admin Login
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 15 }}>
            Login to manage restaurants and menus
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 16, marginTop: 8 }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 700,
                opacity: 0.9,
                marginBottom: 4,
              }}
            >
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@menuart.com"
              type="email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 700,
                opacity: 0.9,
                marginBottom: 4,
              }}
            >
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              type="password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            disabled={loading}
            style={{
              ...primaryBtn,
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(245,158,11,0.3)";
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" style={{ display: "inline-block" }}>⏳</span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.4)",
  color: "white",
  outline: "none",
  fontSize: 15,
  transition: "all 0.2s ease",
  fontFamily: "inherit",
};

const primaryBtn = {
  padding: "16px 24px",
  borderRadius: 14,
  border: 0,
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "#0b1220",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 16,
  boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
  transition: "all 0.2s ease",
};
