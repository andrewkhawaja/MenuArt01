import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://menuart:menuartpass@localhost:5432/menuart"
)

MEDIA_DIR = os.getenv("MEDIA_DIR", "media")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
