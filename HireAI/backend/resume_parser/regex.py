"""
regex_fields.py
Extracts email, phone, and skills using regex + keyword matching.
No LLM involved here on purpose - these fields follow fixed patterns
(email/phone) or come from a known vocabulary (skills), so a model
would be slower and less reliable than a plain match.

Edit SKILLS_LIST below (or load it from a file/DB) to match the
skill set relevant to your roles.
"""

import re

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# Matches digit-heavy runs within a single line (parens/spaces/dashes/dots allowed
# as separators, but never a newline, so it can't stitch together unrelated lines
# like a date range on one line and a year on the next).
PHONE_CANDIDATE_RE = re.compile(r"[\+]?[\d][\d \-\.\(\)]{7,16}\d")

# Extend this list to match your domain (data engineering, in your case).
# Keep it lowercase - matching is done case-insensitively.
SKILLS_LIST = [
    "python", "sql", "java", "scala", "spark", "pyspark", "hadoop",
    "snowflake", "airflow", "dbt", "kafka", "aws", "azure", "gcp",
    "docker", "kubernetes", "etl", "elt", "power bi", "tableau",
    "pandas", "numpy", "django", "flask", "fastapi", "postgresql",
    "mysql", "mongodb", "redis", "git", "linux", "shell scripting",
    "machine learning", "deep learning", "nlp", "excel", "sql server",
]


def extract_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    for line in text.split("\n"):
        for match in PHONE_CANDIDATE_RE.finditer(line):
            candidate = match.group(0)
            digits_only = re.sub(r"\D", "", candidate)
            # Real phone numbers run 10-13 digits (10 local, 11 with a leading 0,
            # 12-13 with a country code). This also rejects date ranges like
            # "2022-2025" (8 digits) and lone years like "2020" (4 digits).
            if 10 <= len(digits_only) <= 13:
                return candidate.strip()
    return None


def extract_skills(text: str, skills_list: list[str] = SKILLS_LIST) -> list[str]:
    text_lower = text.lower()
    found = []
    for skill in skills_list:
        # word-boundary match so "java" doesn't match inside "javascript" etc.
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def extract_regex_fields(text: str) -> dict:
    return {
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
    }


if __name__ == "__main__":
    # Quick manual test
    sample = "Contact: jane.doe@example.com, +91 98765 43210. Skills: Python, SQL, Snowflake, Airflow."
    print(extract_regex_fields(sample))