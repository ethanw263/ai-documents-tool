import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import HTTPException


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

@app.get("/debug_key")
def debug_key():
    import os
    key = os.getenv("OPENAI_API_KEY") or ""
    return {
        "has_key": bool(key),
        "len": len(key),
        "mask": (key[:4] + "..." + key[-4:]) if key else None
    }

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
    print("📝 CLAUSE SENT TO AI:", req.clause_text[:1000])

    prompt = f"""
You are a senior legal writing expert. Your task is to rewrite and analyze the following contract clause to improve its clarity, enforceability, structure, and tone.

👇 ORIGINAL CLAUSE TO ANALYZE:
\"\"\"{req.clause_text}\"\"\"

🟩 PART 1: REWRITTEN CLAUSE
Rewrite the clause using professional legal language. Your rewrite must:
- Retain the full meaning and nuance.
- Be at least as long as the original — longer if doing so adds clarity or improves tone.
- Improve sentence structure, clarity, precision, and legal fairness.
- Maintain or enhance the paragraph structure and formatting of the original.

🟩 PART 2: CONTRACT RISK AND REVISION ANALYSIS

Perform a **deep legal and practical assessment** of the clause. Your task is not just to improve wording — you are acting as a **contract strategist**, helping a client evaluate the risks, gaps, and negotiation leverage embedded in the language.

For each of the categories below:

- **Break down what weakens the clause** from a legal, practical, or business standpoint.
- **Explain the risks posed by that weakness** (e.g., unenforceable obligations, ambiguity, one-sided responsibility, or undefined standards).
- **Suggest stronger alternatives or fallback positions** using model contract language, common legal doctrines, or best practices.
- Assume this is for real-world negotiation — **cite relevant standards** (e.g., “commercially reasonable efforts,” “material breach,” “cure period,” “time is of the essence”) when applicable.
- **No fluff. No vague generalities. No praise.** Every sentence must provide insight or strategy.

🛑 DO NOT use phrases like “The original clause...” or “This clause was...”  
Start each section with your **core observation or revision strategy**.

Respond only with raw JSON in this exact structure:

{{
  "suggestion": "[Improved rewritten clause — must retain or expand structure, formatting, and substance. Be longer if that improves clarity or enforceability.]",
  "tips": {{
    "Clarity": "[Call out any vague, undefined, or ambiguous terms. Recommend exact phrasing that removes doubt and enhances interpretation.]",
    "Structure": "[If the clause is disorganized, repetitive, or hard to parse, suggest a clear restructuring plan — including paragraph breaks or subclauses if needed.]",
    "Legal Precision": "[Identify weak legal constructions or undefined responsibilities. Replace with standard, defensible legal phrasing that reflects best practices.]",
    "Tone & Balance": "[Explain where the clause gives one party too much power or risk. Suggest neutral rewording that preserves the intent while making it fair.]",
    "Grammar & Language": "[Fix awkward phrasing, passive voice, or inconsistencies. Ensure the tone is clear, formal, and aligned with contract norms.]",
    "Enforceability": "[Spot any unenforceable, impractical, or incomplete obligations. Recommend enforceable alternatives using real contract standards or fallback clauses.]"
  }}
}}

✴️ FORMAT RULES
- Your entire response must begin with '{{' and end with '}}'.
- Do NOT include markdown, commentary, or explanations outside the JSON.
- Each tip must be a dense, multi-sentence paragraph with legal insight — no bullets, no summaries, and no vague advice like “improve clarity” or “rewrite for precision.”
"""

    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    content = response.choices[0].message.content.strip()

    if content.startswith("```json"):
        content = content[7:-3].strip()
    elif content.startswith("```"):
        content = content[3:-3].strip()

    try:
        parsed = json.loads(content)
        return {"suggestions": parsed}
    except Exception:
        print("❌ Failed to parse suggestions:", content)
        return {
            "suggestions": {
                "suggestion": "No suggestion returned.",
                "tips": {
                    "Clarity": "",
                    "Structure": "",
                    "Legal Precision": "",
                    "Tone & Balance": "",
                    "Grammar & Language": "",
                    "Enforceability": ""
                }
            }
        }

@app.get("/ping")
def ping():
    return {"ok": True}