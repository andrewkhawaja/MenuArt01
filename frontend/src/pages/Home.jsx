import { Link } from "react-router-dom";
import "../App.css";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1400px 800px at 50% 20%, rgba(245,158,11,0.25), transparent 60%), radial-gradient(1000px 600px at 80% 80%, rgba(59,130,246,0.15), transparent 50%), #070b14",
        display: "grid",
        placeItems: "center",
        padding: "24px 20px",
        color: "white",
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
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "250px",
          height: "250px",
          background: "rgba(59,130,246,0.05)",
          borderRadius: "50%",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-in"
        style={{
          width: "100%",
          maxWidth: 920,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          padding: "32px 28px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              fontSize: 15,
              opacity: 0.9,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            MenuARt • AR-Enhanced Smart Food Menu
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.5px",
            }}
          >
            Welcome to{" "}
            <span
              style={{
                color: "#f59e0b",
                background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MenuARt
            </span>
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
              maxWidth: 720,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            This is the admin entry page. Customers will access menus only by
            scanning a QR code that opens:{" "}
            <code
              style={{
                color: "#f59e0b",
                fontWeight: 700,
                background: "rgba(245,158,11,0.15)",
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 15,
              }}
            >
              /r/restaurant-slug
            </code>
            .
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/admin/login"
              style={{
                padding: "14px 24px",
                borderRadius: 16,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#0b1220",
                fontWeight: 800,
                textDecoration: "none",
                fontSize: 16,
                boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
                transition: "all 0.2s ease",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(245,158,11,0.3)";
              }}
            >
              Admin Login →
            </Link>

            <div
              style={{
                padding: "14px 20px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Customer link example:{" "}
              <span
                style={{
                  color: "#f59e0b",
                  fontWeight: 800,
                  fontFamily: "monospace",
                }}
              >
                /r/demo
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                color: "#f59e0b",
                marginBottom: 4,
              }}
            >
              How it works
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 24,
                opacity: 0.95,
                display: "grid",
                gap: 10,
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              <li>
                Admin creates a restaurant and dishes (image + GLB model).
              </li>
              <li>Dashboard generates a QR code for the customer menu.</li>
              <li>Customers scan → they only see the menu & AR viewer.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
