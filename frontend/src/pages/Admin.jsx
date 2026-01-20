import { useState } from "react";
import { createMenuItem } from "../api/adminApi";

export default function Admin() {
  const restaurantSlug = "demo";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Mains");
  const [subcategory, setSubcategory] = useState("Pasta");
  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("category", category);
      fd.append("subcategory", subcategory);
      if (image) fd.append("image", image);
      if (model) fd.append("model", model);

      await createMenuItem(restaurantSlug, fd);

      setStatus("✅ Added successfully. Refresh the menu page.");
      setName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setModel(null);
    } catch (err) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <main
      style={{ maxWidth: 700, margin: "0 auto", padding: 18, color: "white" }}
    >
      <h1 style={{ color: "#f59e0b" }}>Admin — Add Dish</h1>
      <p style={{ opacity: 0.8 }}>
        Restaurant: <b>{restaurantSlug}</b>
      </p>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          placeholder="Category (e.g. Mains)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          placeholder="Subcategory (e.g. Pasta)"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
        />

        <label>
          Image:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>

        <label>
          3D Model (GLB):
          <input
            type="file"
            accept=".glb"
            onChange={(e) => setModel(e.target.files?.[0] || null)}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 10,
            border: 0,
            background: "#d97706",
            color: "white",
            cursor: "pointer",
          }}
        >
          Add Dish
        </button>

        <div style={{ opacity: 0.9 }}>{status}</div>
      </form>
    </main>
  );
}
