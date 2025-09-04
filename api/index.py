# api/index.py
# Wrap your existing FastAPI app so it works at "/" AND at "/api" in Vercel.
from starlette.applications import Starlette
from backend.main import app as fastapi_app

app = Starlette()
app.mount("/", fastapi_app)
app.mount("/api", fastapi_app)
