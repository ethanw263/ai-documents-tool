# api/index.py
# Make FastAPI handle both "/..." and "/api/..." paths on Vercel.
from starlette.applications import Starlette
from backend.main import app as fastapi_app

app = Starlette()
app.mount("/", fastapi_app)    # /ping, /extract_clause_titles/, ...
app.mount("/api", fastapi_app) # /api/ping, /api/extract_clause_titles/, ...
