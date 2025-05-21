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
Extract only the exact clause headings from the legal contract text below.
These are the section headers used in the document — they may be numbered or bulleted, and each represents a distinct clause in the agreement.

Do not invent or infer clauses. Only return those that actually appear in the document.

Return the list as plain text, one heading per line.

TEXT:
\"\"\"
{contract_text[:12000]}
\"\"\"
"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0,
    )

    lines = response.choices[0].message.content.splitlines()
    return [line.strip() for line in lines if line.strip()]


def get_contract_clauses(contract_text, selected_titles):
    title_list = "\n".join(f"- {title}" for title in selected_titles)

    prompt = f"""
You are a legal assistant. From the contract text below, extract and summarize each of the following clauses if present:

{title_list}

For each clause found, return:
- title
- summary (brief explanation)
- text (full clause wording as found)

Skip clauses that clearly do not exist.

Respond in this JSON format:
[
  {{
    "title": "Clause Title",
    "summary": "Short summary...",
    "text": "Full clause text..."
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
            {"role": "system", "content": "You are a helpful legal assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content
