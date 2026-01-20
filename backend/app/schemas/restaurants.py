from pydantic import BaseModel

class RestaurantCreate(BaseModel):
    name: str
    slug: str
