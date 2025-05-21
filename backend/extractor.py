import os
import pdfplumber
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def get_clause_titles(contract_text):
    prompt = f"""
You are a legal contracts analyst. Extract only the actual clause titles from the legal contract text below.

🛑 Do NOT include any extra content, trailing words like "In Process", or body text — only the literal headings as they appear in the document. Some of these appear as a watermark or gray text across the screen so forget those and grab the headings correctly.

Each heading should:
- Appear exactly in the text
- Be one short line
- Represent a contract clause

DO NOT make up or summarize anything.
Only return clause headings — no bullets, numbers, or formatting.

Return the list as plain text, one title per line.

Contract Text:
\"\"\"
{contract_text[:10000]}
\"\"\"
"""
    # ^ Value to limit text. Keep low for now to avoid going through tokens
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a precise legal document parser."},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
    )

    lines = response.choices[0].message.content.splitlines()
    return [line.strip() for line in lines if line.strip()]



def get_contract_clauses(contract_text, selected_titles):
    title_list = "\n".join(f"- {title}" for title in selected_titles)

    prompt = f"""
You are a legal assistant. Extract the full clause text and a short summary for each clause listed below.

🧠 Instructions:
- Only extract clauses that appear *exactly* as titled.
- Do NOT guess, infer, or fabricate text.
- If a title is not found in the contract, skip it.

Each extracted item must include:
- "title": The exact title matched from the list
- "summary": A short explanation of the clause (1–2 sentences max)
- "text": The full clause wording from the contract

Clause Titles:
{title_list}

Return a JSON array like this:
[
  {{
    "title": "Compensation and Payment",
    "summary": "This clause explains how and when the consultant is paid.",
    "text": "Full clause text here..."
  }},
  ...
]

Contract Text:
\"\"\"
{contract_text[:16000]}
\"\"\"
"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful legal assistant that extracts clauses precisely from text."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content
