import os, uuid
from typing import Optional

from app.schemas.restaurants import RestaurantCreate, RestaurantThemeUpdate
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_admin
from app.models.menu import Restaurant, Category, Subcategory, MenuItem
from app.schemas.menu import MenuResponse, MenuItemOut
from app.core.config import MEDIA_DIR, BASE_URL

router = APIRouter(prefix="/api", tags=["menu"])

DEFAULT_THEME = {
    "name": "Classic",
    "primary": "#f59e0b",
    "secondary": "#d97706",
}

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def file_url(rel_path: str) -> str:
    # served via StaticFiles at /media
    return f"{BASE_URL}/media/{rel_path.replace(os.sep, '/')}"


def normalize_url(url: str | None) -> str | None:
    if not url:
        return url
    return url


def theme_for_restaurant(r: Restaurant) -> tuple[str, str, str]:
    name = r.theme_name or DEFAULT_THEME["name"]
    primary = r.theme_primary or DEFAULT_THEME["primary"]
    secondary = r.theme_secondary or DEFAULT_THEME["secondary"]
    return name, primary, secondary


def get_restaurant_or_404(slug: str, db: Session) -> Restaurant:
    r = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if not r:
        raise HTTPException(404, "Restaurant not found")
    return r


def get_item_for_restaurant_or_404(item_id: int, r: Restaurant, db: Session) -> MenuItem:
    item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id, MenuItem.restaurant_id == r.id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item not found in restaurant")
    return item


@router.post("/restaurants")
def create_restaurant(payload: RestaurantCreate, db: Session = Depends(get_db)):
    slug = payload.slug.strip().lower()

    exists = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if exists:
        raise HTTPException(400, "Slug already exists")

    r = Restaurant(name=payload.name.strip(), slug=slug)
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, "name": r.name, "slug": r.slug}


@router.get("/restaurants/{slug}/menu", response_model=MenuResponse)
def get_menu(slug: str, db: Session = Depends(get_db)):
    r = get_restaurant_or_404(slug, db)
    theme_name, theme_primary, theme_secondary = theme_for_restaurant(r)

    items = (
        db.query(MenuItem)
        .filter(MenuItem.restaurant_id == r.id)
        .all()
    )

    out = []
    for it in items:
        out.append(MenuItemOut(
            id=it.id,
            name=it.name,
            description=it.description,
            price=float(it.price),
            currency=it.currency,
            category=it.category.name if it.category else None,
            subcategory=it.subcategory.name if it.subcategory else None,
            imageUrl=normalize_url(it.image_url),
            modelUrl=normalize_url(it.model_url),
            isAvailable=it.is_available
        ))

    return MenuResponse(
        restaurantSlug=slug,
        items=out,
        themeName=theme_name,
        themePrimary=theme_primary,
        themeSecondary=theme_secondary,
    )


@router.put("/restaurants/{slug}/theme")
def update_theme(
    slug: str,
    payload: RestaurantThemeUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    r = get_restaurant_or_404(slug, db)
    r.theme_name = payload.name.strip() if payload.name else DEFAULT_THEME["name"]
    r.theme_primary = payload.primary.strip() if payload.primary else DEFAULT_THEME["primary"]
    r.theme_secondary = payload.secondary.strip() if payload.secondary else DEFAULT_THEME["secondary"]
    db.add(r)
    db.commit()
    return {
        "themeName": r.theme_name,
        "themePrimary": r.theme_primary,
        "themeSecondary": r.theme_secondary,
    }


@router.post("/restaurants/{slug}/items")
def create_item(
    slug: str,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(""),
    subcategory: str = Form(""),
    image: UploadFile | None = File(None),
    model: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    r = get_restaurant_or_404(slug, db)

    cat_obj = None
    sub_obj = None

    if category.strip():
        cat_obj = db.query(Category).filter(
            Category.restaurant_id == r.id, Category.name == category
        ).first()
        if not cat_obj:
            cat_obj = Category(restaurant_id=r.id, name=category)
            db.add(cat_obj)
            db.flush()

        if subcategory.strip():
            sub_obj = db.query(Subcategory).filter(
                Subcategory.category_id == cat_obj.id, Subcategory.name == subcategory
            ).first()
            if not sub_obj:
                sub_obj = Subcategory(category_id=cat_obj.id, name=subcategory)
                db.add(sub_obj)
                db.flush()

    image_url = None
    model_url = None

    ensure_dir(MEDIA_DIR)
    rest_dir = os.path.join(MEDIA_DIR, slug)
    ensure_dir(rest_dir)

    if image:
        ext = os.path.splitext(image.filename or "")[1] or ".jpg"
        fname = f"{uuid.uuid4().hex}{ext}"
        rel = os.path.join(slug, fname)
        full = os.path.join(MEDIA_DIR, rel)
        with open(full, "wb") as f:
            f.write(image.file.read())
        image_url = file_url(rel)

    if model:
        ext = os.path.splitext(model.filename or "")[1] or ".glb"
        fname = f"{uuid.uuid4().hex}{ext}"
        rel = os.path.join(slug, fname)
        full = os.path.join(MEDIA_DIR, rel)
        with open(full, "wb") as f:
            f.write(model.file.read())
        model_url = file_url(rel)

    item = MenuItem(
        restaurant_id=r.id,
        category_id=cat_obj.id if cat_obj else None,
        subcategory_id=sub_obj.id if sub_obj else None,
        name=name,
        description=description,
        price=price,
        image_url=image_url,
        model_url=model_url,
        is_available=True
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"id": item.id}


# -----------------------------
# ✅ NEW: UPDATE ITEM
# -----------------------------
def _update_item(
    item: MenuItem,
    r: Restaurant,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(""),
    subcategory: str = Form(""),
    image: UploadFile | None = File(None),
    model: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    slug = r.slug

    # Category/Subcategory (optional)
    cat_obj = None
    sub_obj = None

    if category.strip():
        cat_obj = db.query(Category).filter(
            Category.restaurant_id == r.id, Category.name == category
        ).first()
        if not cat_obj:
            cat_obj = Category(restaurant_id=r.id, name=category)
            db.add(cat_obj)
            db.flush()

        if subcategory.strip():
            sub_obj = db.query(Subcategory).filter(
                Subcategory.category_id == cat_obj.id, Subcategory.name == subcategory
            ).first()
            if not sub_obj:
                sub_obj = Subcategory(category_id=cat_obj.id, name=subcategory)
                db.add(sub_obj)
                db.flush()

    # Upload new files if provided
    ensure_dir(MEDIA_DIR)
    rest_dir = os.path.join(MEDIA_DIR, slug)
    ensure_dir(rest_dir)

    if image:
        ext = os.path.splitext(image.filename or "")[1] or ".jpg"
        fname = f"{uuid.uuid4().hex}{ext}"
        rel = os.path.join(slug, fname)
        full = os.path.join(MEDIA_DIR, rel)
        with open(full, "wb") as f:
            f.write(image.file.read())
        item.image_url = file_url(rel)

    if model:
        ext = os.path.splitext(model.filename or "")[1] or ".glb"
        fname = f"{uuid.uuid4().hex}{ext}"
        rel = os.path.join(slug, fname)
        full = os.path.join(MEDIA_DIR, rel)
        with open(full, "wb") as f:
            f.write(model.file.read())
        item.model_url = file_url(rel)

    # Update fields
    item.name = name
    item.description = description
    item.price = price
    item.category_id = cat_obj.id if cat_obj else None
    item.subcategory_id = sub_obj.id if sub_obj else None

    db.commit()
    db.refresh(item)

    return {
        "item": {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
            "currency": item.currency,
            "category": item.category.name if item.category else None,
            "subcategory": item.subcategory.name if item.subcategory else None,
            "imageUrl": normalize_url(item.image_url),
            "modelUrl": normalize_url(item.model_url),
            "isAvailable": item.is_available,
        }
    }


# -----------------------------
# ✅ UPDATE ITEM (global)
# -----------------------------
@router.put("/items/{item_id}")
def update_item(
    item_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(""),
    subcategory: str = Form(""),
    image: UploadFile | None = File(None),
    model: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    r = db.query(Restaurant).filter(Restaurant.id == item.restaurant_id).first()
    if not r:
        raise HTTPException(404, "Restaurant not found")

    return _update_item(
        item=item,
        r=r,
        name=name,
        description=description,
        price=price,
        category=category,
        subcategory=subcategory,
        image=image,
        model=model,
        db=db,
    )


# -----------------------------
# ✅ UPDATE ITEM (restaurant-scoped)
# -----------------------------
@router.put("/restaurants/{slug}/items/{item_id}")
def update_item_scoped(
    slug: str,
    item_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(""),
    subcategory: str = Form(""),
    image: UploadFile | None = File(None),
    model: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    r = get_restaurant_or_404(slug, db)
    item = get_item_for_restaurant_or_404(item_id, r, db)
    return _update_item(
        item=item,
        r=r,
        name=name,
        description=description,
        price=price,
        category=category,
        subcategory=subcategory,
        image=image,
        model=model,
        db=db,
    )


# -----------------------------
# ✅ Legacy: UPDATE ITEM (compat)
# -----------------------------
@router.put("/menu/{item_id}")
def update_item_legacy(
    item_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(""),
    subcategory: str = Form(""),
    image: UploadFile | None = File(None),
    model: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    return update_item(
        item_id=item_id,
        name=name,
        description=description,
        price=price,
        category=category,
        subcategory=subcategory,
        image=image,
        model=model,
        db=db,
    )


# -----------------------------
# ✅ NEW: DELETE ITEM
# -----------------------------
@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    db.delete(item)
    db.commit()
    return {"ok": True}


# -----------------------------
# ✅ DELETE ITEM (restaurant-scoped)
# -----------------------------
@router.delete("/restaurants/{slug}/items/{item_id}")
def delete_item_scoped(slug: str, item_id: int, db: Session = Depends(get_db)):
    r = get_restaurant_or_404(slug, db)
    item = get_item_for_restaurant_or_404(item_id, r, db)
    db.delete(item)
    db.commit()
    return {"ok": True}


# -----------------------------
# ✅ Legacy: DELETE ITEM (compat)
# -----------------------------
@router.delete("/menu/{item_id}")
def delete_item_legacy(item_id: int, db: Session = Depends(get_db)):
    return delete_item(item_id=item_id, db=db)
