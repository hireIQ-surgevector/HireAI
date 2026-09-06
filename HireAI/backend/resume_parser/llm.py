"""
llm_fields.py
Extracts the fields that need language understanding, not pattern matching:
name, location, experience, current_role.

Uses the already-extracted plain text (from text_extractor.py) with
Qwen3-VL-4B via Ollama, constrained to a strict JSON schema so the
output is always parseable.

Notice_period and current_ctc are deliberately NOT extracted here -
those are filled in by HR/admin, so the pipeline leaves them out.

Requirements:
    pip install requests --break-system-packages
    Ollama running locally with the model pulled:
        ollama pull qwen3-vl:4b
"""

import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"  # lightweight text-only model - much faster on CPU than the VL model for this text-only step

LLM_FIELDS = ["name", "location", "experience", "current_role"]

PROMPT_TEMPLATE = """Read the resume text below and extract exactly these fields:
- name: the candidate's full name
- location: current city/location the candidate is based in
- experience: total years of professional experience (e.g. "4 years")
- current_role: the candidate's most recent or current job title

Rules:
- Use null for any field that is genuinely not present in the text.
- Do not guess or infer values that aren't actually written in the resume.
- Respond with ONLY a JSON object in exactly this shape, nothing else, no explanation, no markdown fences:
{{"name": "...", "location": "...", "experience": "...", "current_role": "..."}}

RESUME TEXT:
---
{resume_text}
---
"""


def _extract_json_block(raw: str) -> str:
    """Pull the first {...} block out of the response, stripping markdown
    fences or any stray commentary the model adds despite instructions."""
    raw = raw.strip()
    raw = re.sub(r"^```(json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    return match.group(0) if match else raw


def extract_llm_fields(resume_text: str, max_chars: int = 6000) -> dict:
    truncated = resume_text[:max_chars]

    payload = {
        "model": MODEL_NAME,
        "prompt": PROMPT_TEMPLATE.format(resume_text=truncated),
        "stream": False,
        "keep_alive": "30m",  # keep model loaded in RAM between calls - avoids reload overhead each time
        "options": {"temperature": 0, "num_predict": 200},  # cap output length so it can't run away
    }

    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=600)
        resp.raise_for_status()
        raw = resp.json()["response"]
        print("---- RAW MODEL OUTPUT ----")
        print(raw)
        print("--------------------------")

        if not raw.strip():
            return {field: None for field in LLM_FIELDS} | {"_llm_error": "EMPTY_RESPONSE: model returned nothing - check 'ollama serve' logs"}

        json_block = _extract_json_block(raw)
        result = json.loads(json_block)
    except requests.exceptions.ConnectionError as e:
        return {field: None for field in LLM_FIELDS} | {"_llm_error": f"CONNECTION_ERROR: is 'ollama serve' running? {e}"}
    except requests.exceptions.HTTPError as e:
        return {field: None for field in LLM_FIELDS} | {"_llm_error": f"HTTP_ERROR: {e} - response body: {resp.text[:300]}"}
    except json.JSONDecodeError as e:
        return {field: None for field in LLM_FIELDS} | {"_llm_error": f"JSON_PARSE_ERROR: {e} - raw response was: {raw[:300]}"}
    except Exception as e:
        return {field: None for field in LLM_FIELDS} | {"_llm_error": f"UNKNOWN_ERROR: {e}"}

    return {field: result.get(field) for field in LLM_FIELDS}


if __name__ == "__main__":
    sample = """
    Jane Doe
    Bangalore, India
    Data Engineer with 4 years of experience.
    Currently working as Senior Data Engineer at Acme Corp.
    """
    print(extract_llm_fields(sample))