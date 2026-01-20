from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import MEDIA_DIR
from app.api.menu import router as menu_router
from app.api.auth import router as auth_router
from app.api.recommend import router as recommend_router    


app = FastAPI(title="MenuARt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://menu-art01.vercel.app",
        "https://menu-art01.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(menu_router)
app.include_router(auth_router)
app.include_router(recommend_router)


@app.get("/health")
def health():
    return {"status": "ok"}