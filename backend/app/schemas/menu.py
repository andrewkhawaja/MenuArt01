from pydantic import BaseModel
from typing import Optional, List

class MenuItemOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "USD"
    category: Optional[str] = None
    subcategory: Optional[str] = None
    imageUrl: Optional[str] = None
    modelUrl: Optional[str] = None
    isAvailable: bool = True

    class Config:
        from_attributes = True

class MenuResponse(BaseModel):
    restaurantSlug: str
    items: List[MenuItemOut]
