const API_BASE =
  import.meta.env.VITE_API_BASE || "https://menuart.onrender.com/api";

export async function getRecommendations(slug, prefs) {
  const safeSlug = encodeURIComponent(slug);
  const res = await fetch(`${API_BASE}/restaurants/${safeSlug}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to get recommendations");
  }
  return res.json(); // { picks: [{id, reason}, ...] }
}
