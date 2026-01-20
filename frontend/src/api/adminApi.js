const API_BASE = "http://127.0.0.1:8000/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("menuart_token");
  return {
    ...extra,
    Authorization: `Bearer ${token}`,
  };
}

export async function createMenuItem(slug, formData) {
  const res = await fetch(`${API_BASE}/restaurants/${slug}/items`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Unauthorized or failed");
  }
  return res.json();
}

export async function createRestaurant(name, slug) {
  const res = await fetch(`${API_BASE}/restaurants`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, slug }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create restaurant");
  }

  return res.json();
}

// ✅ ADD THIS: used by AdminDashboard preview + QR flow
export async function getMenu(slug) {
  const res = await fetch(`${API_BASE}/restaurants/${slug}/menu`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch menu");
  }

  return res.json();
}
