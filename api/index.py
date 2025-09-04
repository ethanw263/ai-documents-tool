# api/index.py
# ASGI wrapper: restores the original path from ?p=... so FastAPI sees /extract_clause_titles/, /ping, etc.
from urllib.parse import parse_qs
from backend.main import app as fastapi_app  # your FastAPI app

async def app(scope, receive, send):
    # Only adjust HTTP requests
    if scope.get("type") == "http":
        # Parse query string like b"p=/extract_clause_titles/"
        qs = scope.get("query_string", b"").decode("latin-1")
        p = parse_qs(qs).get("p", [None])[0]
        if p:
            new_scope = dict(scope)
            new_scope["path"] = p
            new_scope["raw_path"] = p.encode("latin-1")
            return await fastapi_app(new_scope, receive, send)
    # Fall back to original scope if no ?p=
    return await fastapi_app(scope, receive, send)
