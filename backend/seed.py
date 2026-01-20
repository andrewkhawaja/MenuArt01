from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models.menu import Restaurant, Category, Subcategory, MenuItem

def run():
    db: Session = SessionLocal()
    try:
        slug = "demo"
        r = db.query(Restaurant).filter(Restaurant.slug == slug).first()
        if not r:
            r = Restaurant(name="Demo Restaurant", slug=slug)
            db.add(r)
            db.flush()

        mains = db.query(Category).filter(Category.restaurant_id == r.id, Category.name == "Mains").first()
        if not mains:
            mains = Category(restaurant_id=r.id, name="Mains", sort_order=1)
            db.add(mains)
            db.flush()

        pasta_sub = db.query(Subcategory).filter(Subcategory.category_id == mains.id, Subcategory.name == "Pasta").first()
        if not pasta_sub:
            pasta_sub = Subcategory(category_id=mains.id, name="Pasta", sort_order=1)
            db.add(pasta_sub)
            db.flush()

        item = db.query(MenuItem).filter(MenuItem.restaurant_id == r.id, MenuItem.name == "AR Pasta").first()
        if not item:
            item = MenuItem(
                restaurant_id=r.id,
                category_id=mains.id,
                subcategory_id=pasta_sub.id,
                name="AR Pasta",
                description="Creamy pasta dish (3D model available).",
                price=12.99,
                currency="USD",
                image_url="https://source.unsplash.com/800x600/?pasta",
                model_url="http://localhost:5173/models/Pasta.glb",  # later replace with backend /media url
                is_available=True
            )
            db.add(item)

        db.commit()
        print("Seeded demo restaurant + AR Pasta")
    finally:
        db.close()

if __name__ == "__main__":
    run()
