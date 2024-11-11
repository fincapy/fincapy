import os

from fastapi import FastAPI

from src.adapters.orm import map_imperatively
from src.adapters.postgres import Postgres

POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DRIVER = "postgresql+asyncpg"
POSTGRES_URL = (
    f"{DRIVER}://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
)

map_imperatively()

postgres = Postgres(POSTGRES_URL)


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Mello World"}
