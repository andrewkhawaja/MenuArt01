import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.base import Base  # noqa: F401 (used by Alembic target_metadata elsewhere)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env")

engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
