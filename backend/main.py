from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import schema
from routers import license
from routers import snapshots
from routers import ai
from database import init_db

app = FastAPI(title="SchemaCatalog", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schema.router, prefix="/api")
app.include_router(license.router, prefix="/api")
app.include_router(snapshots.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}
