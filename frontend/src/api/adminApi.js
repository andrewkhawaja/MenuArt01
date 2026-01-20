const API_BASE =
  import.meta.env.VITE_API_BASE || "https://menuart.onrender.com/api";

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

export async function updateRestaurantTheme(slug, theme) {
  const res = await fetch(`${API_BASE}/restaurants/${slug}/theme`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: theme?.name || "Classic",
      primary: theme?.primary || "#f59e0b",
      secondary: theme?.secondary || "#d97706",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update theme");
  }
  return res.json();
}

export async function updateMenuItem(slug, itemId, formData) {
  const res = await fetch(`${API_BASE}/restaurants/${slug}/items/${itemId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update item");
  }

  return res.json();
}

export async function deleteMenuItem(slug, itemId) {
  const res = await fetch(`${API_BASE}/restaurants/${slug}/items/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete item");
  }

  return res.json();
}
