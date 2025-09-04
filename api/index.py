# api/index.py
# Robust boot: if importing your FastAPI app fails, expose a debug endpoint.
import os, sys, traceback
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse

app = Starlette()

# Ensure project root is importable (…/ai-documents-tool on sys.path)
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

_boot_error = None
try:
    # Import your FastAPI app
    from backend.main import app as fastapi_app

    # Mount at both "/" and "/api" so either path works
    app.mount("/", fastapi_app)
    app.mount("/api", fastapi_app)

except Exception:
    _boot_error = traceback.format_exc()

    @app.route("/_boot")
    async def boot_error(_request):
        # Shows full Python traceback so we can see the real reason for the crash
        return PlainTextResponse("BOOT_FAIL\n\n" + _boot_error, status_code=500)

    @app.route("/{path:path}")
    async def all_paths(_request):
        # Generic message everywhere else (so we don't spam trace to users)
        return PlainTextResponse(
            "Server failed to boot. Visit /_boot for details.",
            status_code=500
        )
