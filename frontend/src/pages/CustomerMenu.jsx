import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DishCard from "../components/DishCard";
import { fetchMenu } from "../api/menuApi";
import "../styles/menu.css";

export default function CustomerMenu() {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMenu(slug)
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, [slug]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [items]);

  const filtered = items.filter((item) => {
    const matchCat = category === "All" || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <p style={{ textAlign: "center" }}>Loading menu…</p>;

  return (
    <main className="menu-page">
      <h1 className="menu-title">{slug} Menu</h1>

      <div className="menu-toolbar">
        <input
          className="menu-search"
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <nav className="menu-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={cat === category ? "active" : ""}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <section className="menu-grid">
        {filtered.map((item) => (
          <DishCard key={item.id} item={item} />
        ))}
      </section>
    </main>
  );
}
