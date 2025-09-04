# api/index.py
# Respond at "/" and "/api" so Vercel path quirks can't break routes.
from starlette.applications import Starlette
from backend.main import app as fastapi_app

app = Starlette()
app.mount("/", fastapi_app)
app.mount("/api", fastapi_app)