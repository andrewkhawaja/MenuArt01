import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres.epfkfhoqndguwldcfvpt:Wq4VVpOaK2XMfHqW@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
)

MEDIA_DIR = os.getenv("MEDIA_DIR", "media")
BASE_URL = os.getenv("BASE_URL", "https://menuart.onrender.com")
