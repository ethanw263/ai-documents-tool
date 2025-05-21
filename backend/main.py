import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from extractor import extract_text_from_pdf, get_clause_titles, get_contract_clauses

load_dotenv()

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/extract_clause_titles/")
async def extract_clause_titles(file: UploadFile = File(None), raw_text: str = Form(None)):
    if file:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        contract_text = extract_text_from_pdf(tmp_path)
    elif raw_text:
        contract_text = raw_text
    else:
        return {"error": "Please upload a file or provide raw text."}

    try:
        titles = get_clause_titles(contract_text)
        return {"titles": titles}
    except Exception as e:
        print("Failed to extract clause titles:", str(e))
        return {"error": "Clause title extraction failed."}


@app.post("/extract_selected_clauses/")
async def extract_selected_clauses(
    file: UploadFile = File(None),
    raw_text: str = Form(None),
    selected_titles: str = Form(...)
):
    if file:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        contract_text = extract_text_from_pdf(tmp_path)
    elif raw_text:
        contract_text = raw_text
    else:
        return {"error": "Please upload a file or provide raw text."}

    try:
        titles = json.loads(selected_titles)
    except json.JSONDecodeError:
        return {"error": "Invalid clause title list."}

    try:
        result_json = get_contract_clauses(contract_text, titles)
        clauses = json.loads(result_json)
        return {"clauses": clauses}
    except Exception as e:
        print("Failed to parse extracted clauses:", str(e))
        return {"error": "Could not parse clause extraction."}


# ✅ AI Suggestions Endpoint
class SuggestionRequest(BaseModel):
    clause_text: str

@app.post("/ai_clause_suggestions/")
async def ai_clause_suggestions(req: SuggestionRequest):
    prompt = f"""
Suggest 3 alternative phrasings or improvements for the following legal clause. Be specific and concise.

Clause:
\"\"\"{req.clause_text}\"\"\"

Respond with a JSON array like:
[
  "Improved version 1...",
  "Improved version 2...",
  "Improved version 3..."
]
"""

    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    content = response.choices[0].message.content.strip()
    if content.startswith("```json"):
        content = content[7:-3].strip()
    elif content.startswith("```"):
        content = content[3:-3].strip()

    try:
        suggestions = json.loads(content)
        return {"suggestions": suggestions}
    except Exception:
        print("Failed to parse suggestions:", content)
        return {"suggestions": ["Could not parse suggestions. Please try again."]}
