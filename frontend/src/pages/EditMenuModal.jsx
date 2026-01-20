import { useState } from "react";
import { updateMenuItem } from "../api/menuApi";

export default function EditMenuModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = await updateMenuItem(item.id, form);
    onSave(updated);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Menu Item</h3>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <div className="modal-actions">
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
