const API = import.meta.env.VITE_API_BASE || "https://menuart.onrender.com/api";

export async function getMenuItems(slug) {
  const res = await fetch(`${API}/restaurants/${slug}/menu`);
  if (!res.ok) throw new Error("Failed to load menu");
  return res.json();
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${API}/menu/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function updateMenuItem(id, data) {
  const res = await fetch(`${API}/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}
