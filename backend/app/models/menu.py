from sqlalchemy import (
    String, Text, Numeric, Boolean, ForeignKey,
    DateTime, func, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base


class Restaurant(Base):
    __tablename__ = "restaurants"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    theme_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    theme_primary: Mapped[str | None] = mapped_column(String(20), nullable=True)
    theme_secondary: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    categories = relationship("Category", back_populates="restaurant", cascade="all, delete-orphan")
    items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("restaurant_id", "name", name="uq_category_per_restaurant"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(default=0)

    restaurant = relationship("Restaurant", back_populates="categories")
    subcategories = relationship("Subcategory", back_populates="category", cascade="all, delete-orphan")
    items = relationship("MenuItem", back_populates="category")


class Subcategory(Base):
    __tablename__ = "subcategories"
    __table_args__ = (UniqueConstraint("category_id", "name", name="uq_subcategory_per_category"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(default=0)

    category = relationship("Category", back_populates="subcategories")
    items = relationship("MenuItem", back_populates="subcategory")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    subcategory_id: Mapped[int | None] = mapped_column(ForeignKey("subcategories.id", ondelete="SET NULL"), nullable=True)

    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    model_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # GLB URL
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="items")
    category = relationship("Category", back_populates="items")
    subcategory = relationship("Subcategory", back_populates="items")
