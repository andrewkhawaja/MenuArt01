from pydantic import BaseModel

class RestaurantCreate(BaseModel):
    name: str
    slug: str


class RestaurantThemeUpdate(BaseModel):
    name: str
    primary: str
    secondary: str