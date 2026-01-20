from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import json

from app.core.db import get_db
from app.models.menu import Restaurant, MenuItem
from openai import OpenAI

router = APIRouter(prefix="/api", tags=["recommendations"])


# ---------- Schemas ----------
class RecommendIn(BaseModel):
    diet: Optional[str] = None                 # vegan / vegetarian / halal / any
    allergies: Optional[List[str]] = None      # ["lactose", "gluten"]
    preference: Optional[str] = None           # beef / chicken / seafood
    mood: Optional[str] = None                 # mild / spicy / any
    budget: Optional[float] = None             # optional


class RecommendOutItem(BaseModel):
    id: int
    reason: str


class RecommendOut(BaseModel):
    picks: List[RecommendOutItem]


# ---------- OpenAI ----------
def _get_openai_client() -> OpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in backend/.env")
    return OpenAI(api_key=key)


# ---------- Rule-based filters (keyword heuristics) ----------
def looks_lactose(item_name: str, item_desc: str) -> bool:
    t = f"{item_name} {item_desc}".lower()
    lactose_words = [
        "cheese", "mozzarella", "cheddar", "parmesan", "cream", "milk", "butter",
        "yogurt", "ice cream", "dairy", "alfredo", "bechamel", "lactose"
    ]
    return any(w in t for w in lactose_words)


def looks_gluten(item_name: str, item_desc: str) -> bool:
    t = f"{item_name} {item_desc}".lower()
    gluten_words = [
        "bread", "bun", "pizza", "pasta", "noodles", "flour", "wheat",
        "wrap", "tortilla", "breadcrumbs", "cracker", "burger bun"
    ]
    return any(w in t for w in gluten_words)


def matches_protein(preference: Optional[str], item_name: str, item_desc: str) -> bool:
    """
    Hard filter for protein preference:
    - If preference is set, item must contain matching keywords.
    - If preference not set, allow all.
    """
    if not preference:
        return True

    pref = str(preference).lower().strip()
    t = f"{item_name} {item_desc}".lower()

    chicken_words = ["chicken", "tender", "nugget", "wings"]
    beef_words = ["beef", "burger", "steak", "brisket", "veal"]
    seafood_words = ["fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "seafood"]

    if pref == "chicken":
        return any(w in t for w in chicken_words)
    if pref == "beef":
        return any(w in t for w in beef_words)
    if pref == "seafood":
        return any(w in t for w in seafood_words)

    # unknown preference -> do not filter
    return True


# ---------- Route ----------
@router.post("/restaurants/{slug}/recommend", response_model=RecommendOut)
def recommend(slug: str, payload: RecommendIn, db: Session = Depends(get_db)):
    # 1) Load restaurant
    r = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # 2) Load menu items
    items = (
        db.query(MenuItem)
        .filter(MenuItem.restaurant_id == r.id, MenuItem.is_available == True)
        .all()
    )
    if not items:
        return {"picks": []}

    # 3) HARD FILTERS BEFORE AI (allergies + protein preference)
    allergies = payload.allergies or []
    want_lactose_free = any(str(a).lower() == "lactose" for a in allergies)
    want_gluten_free = any(str(a).lower() == "gluten" for a in allergies)

    filtered_items = []
    for it in items:
        name = it.name or ""
        desc = it.description or ""

        # allergy constraints (hard)
        if want_lactose_free and looks_lactose(name, desc):
            continue
        if want_gluten_free and looks_gluten(name, desc):
            continue

        # protein constraint (hard)
        if not matches_protein(payload.preference, name, desc):
            continue

        filtered_items.append(it)

    items = filtered_items
    if not items:
        # Nothing matches strict constraints
        return {"picks": []}

    # 4) Prepare menu for model
    menu_compact = [
        {
            "id": it.id,
            "name": it.name,
            "description": it.description or "",
            "price": float(it.price),
            "currency": it.currency,
            "category": it.category.name if it.category else None,
            "subcategory": it.subcategory.name if it.subcategory else None,
        }
        for it in items
    ]

    # 5) Prompt (AI ranks ONLY among the already-filtered items)
    instructions = (
        "You are a restaurant menu recommender.\n"
        "Rules:\n"
        "- Only recommend from the provided menu items.\n"
        "- The menu was already filtered for allergies and protein preference. Do not violate constraints.\n"
        "- Return UP TO 3 DIFFERENT items (unique IDs). If fewer items exist, return fewer.\n"
        "- IDs must be UNIQUE. Never repeat the same id.\n"
        "- Return STRICT JSON ONLY with this exact shape:\n"
        '  {"picks":[{"id":<int>,"reason":"<short>"}]}\n'
        "- No extra text, no markdown.\n"
    )

    user_payload = {
        "preferences": payload.model_dump(),
        "menu": menu_compact,
    }

    prompt = instructions + "\nDATA:\n" + json.dumps(user_payload, ensure_ascii=False)

    # 6) Call OpenAI
    try:
        client = _get_openai_client()
        resp = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )
        text = (getattr(resp, "output_text", "") or "").strip()
        if not text:
            raise HTTPException(status_code=500, detail="AI returned empty response text.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI call failed: {str(e)}")

    # 7) Parse JSON + enforce uniqueness + validate ids
    try:
        data = json.loads(text)
        picks_raw = data.get("picks", [])
        if not isinstance(picks_raw, list):
            picks_raw = []

        valid_ids = {it.id for it in items}

        seen = set()
        filtered = []
        for p in picks_raw:
            try:
                pid = int(p.get("id"))
            except Exception:
                continue

            if pid not in valid_ids:
                continue
            if pid in seen:
                continue

            seen.add(pid)
            reason = str(p.get("reason", ""))[:160]
            filtered.append({"id": pid, "reason": reason})

            # up to 3 only
            if len(filtered) == 3:
                break

        # IMPORTANT: no fillers. If AI returns 1, user sees 1.
        return {"picks": filtered}

    except Exception:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {text[:400]}")
