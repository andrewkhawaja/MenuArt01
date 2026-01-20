import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

export default function DishCard({ item, compact = false, layout = "grid" }) {
  const nav = useNavigate();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);

  const hasModel = !!item.modelUrl;
  const restaurantSlug = params.slug; // Get slug from route params

  const viewAR = () => {
    if (!hasModel) return;
    const arUrl = `/ar?model=${encodeURIComponent(item.modelUrl)}&name=${encodeURIComponent(
      item.name
    )}${restaurantSlug ? `&slug=${encodeURIComponent(restaurantSlug)}` : ""}`;
    nav(arUrl);
  };

  const isList = layout === "list";
  const cardStyle = compact
    ? { ...styles.card, ...styles.cardCompact }
    : styles.card;
  const imgWrapStyle = compact
    ? { ...styles.imgWrap, ...styles.imgWrapCompact }
    : styles.imgWrap;
  const bodyStyle = compact ? { ...styles.body, ...styles.bodyCompact } : styles.body;
  const titleStyle = compact ? { ...styles.title, ...styles.titleCompact } : styles.title;
  const priceStyle = compact ? { ...styles.price, ...styles.priceCompact } : styles.price;
  const descStyle = compact ? { ...styles.desc, ...styles.descCompact } : styles.desc;
  const pillStyle = compact ? { ...styles.pill, ...styles.pillCompact } : styles.pill;
  const btnStyle = compact ? { ...styles.btn, ...styles.btnCompact } : styles.btn;
  const btnLayoutStyle = isList
    ? { ...styles.btnList, ...(compact ? styles.btnListCompact : {}) }
    : {};

  const cardLayoutStyle = isList
    ? { ...styles.cardList, ...(compact ? styles.cardListCompact : {}) }
    : {};
  const imgLayoutStyle = isList
    ? { ...styles.imgWrapList, ...(compact ? styles.imgWrapListCompact : {}) }
    : {};
  const bodyLayoutStyle = isList ? styles.bodyList : {};

  return (
    <article
      style={{
        ...cardStyle,
        ...cardLayoutStyle,
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)"
          : "0 10px 30px rgba(0,0,0,0.35)",
        zIndex: isHovered ? 5 : 1,
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ ...imgWrapStyle, ...imgLayoutStyle }}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              ...styles.img,
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        ) : (
          <div style={styles.noImg}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ opacity: 0.4 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ ...bodyStyle, ...bodyLayoutStyle }}>
        <div style={styles.topRow}>
          <h3 style={titleStyle}>{item.name}</h3>
          <div style={priceStyle}>
            {item.currency || "$"} {Number(item.price).toFixed(2)}
          </div>
        </div>

        {item.description ? (
          <p style={descStyle}>{item.description}</p>
        ) : (
          <p style={styles.descMuted}>No description available.</p>
        )}

        <div style={styles.meta}>
          {item.category && <span style={pillStyle}>{item.category}</span>}
          {item.subcategory && (
            <span style={pillStyle}>{item.subcategory}</span>
          )}
        </div>

        <button
          onClick={viewAR}
          disabled={!hasModel}
          style={{
            ...btnStyle,
            ...btnLayoutStyle,
            ...(hasModel ? styles.btnEnabled : styles.btnDisabled),
            transform: isHovered && hasModel ? "scale(1.02)" : "scale(1)",
          }}
        >
          {hasModel ? (
            <>
              <span style={{ marginRight: 6 }}>👁️</span>
              View in AR
            </>
          ) : (
            "No AR model"
          )}
        </button>
      </div>
    </article>
  );
}

const styles = {
  card: {
    borderRadius: 20,
    overflow: "hidden",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    minHeight: 380,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
    zIndex: 1,
    isolation: "isolate",
  },
  cardList: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  cardListCompact: {
    minHeight: 160,
  },
  cardCompact: {
    minHeight: 300,
    borderRadius: 16,
  },
  imgWrap: {
    height: 200,
    background: "rgba(0,0,0,0.3)",
    overflow: "hidden",
    position: "relative",
  },
  imgWrapList: {
    width: 140,
    height: "100%",
    flexShrink: 0,
  },
  imgWrapListCompact: {
    width: 120,
  },
  imgWrapCompact: {
    height: 140,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  noImg: {
    height: "100%",
    display: "grid",
    placeItems: "center",
    opacity: 0.5,
    background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.1))",
  },
  body: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
  },
  bodyList: {
    padding: 12,
  },
  bodyCompact: {
    padding: 12,
    gap: 8,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 19,
    fontWeight: 900,
    lineHeight: 1.3,
    flex: 1,
  },
  titleCompact: {
    fontSize: 16,
  },
  price: {
    fontWeight: 900,
    color: "var(--accent, #f59e0b)",
    whiteSpace: "nowrap",
    fontSize: 18,
  },
  priceCompact: {
    fontSize: 15,
  },
  desc: {
    margin: 0,
    opacity: 0.9,
    fontSize: 14,
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: 42,
  },
  descCompact: {
    fontSize: 12.5,
    minHeight: 32,
  },
  descMuted: {
    margin: 0,
    opacity: 0.6,
    fontSize: 14,
    fontStyle: "italic",
  },
  meta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: "auto",
  },
  pill: {
    fontSize: 11,
    padding: "6px 12px",
    borderRadius: 20,
    background:
      "color-mix(in oklab, var(--accent, #f59e0b) 18%, transparent)",
    border:
      "1px solid color-mix(in oklab, var(--accent, #f59e0b) 35%, transparent)",
    color: "color-mix(in oklab, var(--accent, #f59e0b) 75%, #fff)",
    fontWeight: 800,
    letterSpacing: "0.3px",
  },
  pillCompact: {
    fontSize: 9.5,
    padding: "4px 8px",
  },
  btn: {
    marginTop: 8,
    padding: "14px 16px",
    borderRadius: 14,
    border: 0,
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnList: {
    alignSelf: "flex-start",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    minWidth: 120,
  },
  btnListCompact: {
    padding: "8px 10px",
    fontSize: 12,
    minWidth: 110,
  },
  btnCompact: {
    padding: "10px 12px",
    fontSize: 13,
  },
  btnEnabled: {
    background:
      "linear-gradient(135deg, var(--accent, #f59e0b), var(--accent2, #d97706))",
    color: "#0b1220",
    boxShadow:
      "0 4px 12px color-mix(in oklab, var(--accent, #f59e0b) 35%, transparent)",
  },
  btnDisabled: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.5)",
    cursor: "not-allowed",
  },
};
