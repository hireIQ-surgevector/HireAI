import re

from .skill_taxonomy import SKILL_ALIASES, SKILL_CATEGORIES, SKILL_MAPPINGS


# ---------------------------------------------------------------------------
# Matching engine
# ---------------------------------------------------------------------------
def _clean(value: str) -> str:
    value = value.casefold().strip()
    value = value.replace("&", " and ")
    value = re.sub(r"[\u2010-\u2015]", "-", value)
    value = re.sub(r"[^a-z0-9+#./-]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


ALIAS_TO_CANONICAL = {}
for canonical, aliases in SKILL_ALIASES.items():
    # Single-letter / very short names are ambiguous in prose.
    if canonical not in {"c", "r", "go"}:
        ALIAS_TO_CANONICAL[_clean(canonical)] = canonical
    for alias in aliases:
        ALIAS_TO_CANONICAL[_clean(alias)] = canonical

_ALIAS_PATTERNS = []
for alias, canonical in sorted(
    ALIAS_TO_CANONICAL.items(), key=lambda item: len(item[0]), reverse=True
):
    escaped = re.escape(alias).replace(r"\ ", r"\s+")
    pattern = re.compile(
        r"(?<![a-z0-9])" + escaped + r"(?![a-z0-9])", re.IGNORECASE
    )
    _ALIAS_PATTERNS.append((pattern, canonical, alias))


def normalize_skill(skill: str) -> str:
    """Return canonical name for a known alias, else cleaned value."""
    cleaned = _clean(skill)
    return ALIAS_TO_CANONICAL.get(cleaned, cleaned)


def extract_skills(text: str, include_categories: bool = False):
    """
    Extract canonical skills from resume/JD text.
    Returns de-duplicated list in order of first appearance.
    """
    if not text:
        return []
    source = _clean(text)
    found, seen = [], set()
    for pattern, canonical, _alias in _ALIAS_PATTERNS:
        if canonical in seen:
            continue
        if pattern.search(source):
            seen.add(canonical)
            found.append(canonical)
    if include_categories:
        return [
            {"skill": s, "category": SKILL_CATEGORIES.get(s, "Other")}
            for s in found
        ]
    return found


def expand_umbrella_skills(skills):
    """
    Return umbrella labels for display/filtering without discarding exact skills.
    BigQuery stays BigQuery; 'cloud' is added as a related group.
    """
    normalized = {normalize_skill(s) for s in skills}
    umbrellas = []
    for umbrella, members in SKILL_MAPPINGS.items():
        if normalized.intersection(members):
            umbrellas.append(umbrella)
    return umbrellas


def match_required_skills(required_skills, candidate_text):
    """
    Compare required skills with resume text.
    The caller decides mandatory vs optional weighting per role.
    """
    extracted = set(extract_skills(candidate_text))
    required = list(
        dict.fromkeys(
            normalize_skill(s) for s in required_skills if s and str(s).strip()
        )
    )
    matched = [s for s in required if s in extracted]
    missing = [s for s in required if s not in extracted]
    score = round((len(matched) / len(required)) * 100) if required else 0
    return {
        "matched": matched,
        "missing": missing,
        "score": score,
        "extracted_skills": sorted(extracted),
        "categories": sorted({SKILL_CATEGORIES.get(s, "Other") for s in extracted}),
    }


if __name__ == "__main__":
    # Example: an MNC IT resume that mixes IT + non-IT experience
    sample_resume = """
    Senior Consultant at a global IT services MNC. Led SAP S/4HANA
    implementation for a BFSI client; used SAP FICO, SAP MM, and ABAP.
    Delivered RPA solutions using UiPath and Power Automate.
    Built data pipelines with Python, PySpark, Airflow, dbt, and Snowflake.
    Deployed on AWS (EC2, S3, Lambda) and Azure (ADF, AKS).
    Ran ITIL-based service delivery for a managed services account,
    owned SLA management, CMDB, and incident management.
    Also handled campus recruitment, HR analytics, and POSH compliance
    for the India delivery center. Worked with Salesforce CPQ for
    pre-sales proposals and RFP responses. Drove B2B marketing demand
    generation, ABM campaigns, Marketo, and Google Analytics.
    Used JIRA, Confluence, and Agile/Scrum; PMP certified.
    """
    skills = extract_skills(sample_resume)
    print("Skills:", skills)
    print("\nWith categories:")
    for row in extract_skills(sample_resume, include_categories=True):
        print(f"  {row['skill']:35s} -> {row['category']}")
    print("\nUmbrellas:", expand_umbrella_skills(skills))
    print("\nMatch:", match_required_skills(
        ["Python", "SAP FICO", "UiPath", "Snowflake", "AWS",
         "Salesforce CPQ", "Talent Acquisition", "Power BI"],
        sample_resume,
    ))

# ============================================================
# TEXT CLEANING
# ============================================================


def clean_text(text):

    if not text:
        return ""

    return re.sub(r"\s+", " ", str(text)).strip()


def preserve_text_lines(text):
    lines = []

    for line in str(text or "").splitlines():
        cleaned_line = clean_text(line)
        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines)


def extract_job_skills_from_resume(text, job_skills):
    """
    Return the job's own skill labels when equivalent resume wording appears.

    - Preserves the ORIGINAL job-skill label (e.g. "SAP FICO", not "sap fico").
    - Uses canonical normalization so any alias in the resume matches.
    - Accepts umbrella labels from SKILL_MAPPINGS (e.g. "cloud") only when a
      member skill (e.g. "aws") was actually extracted from the resume.

    This is a *JD-matching* helper. It does not modify the resume's canonical
    `skills` set produced by `extract_skills()`.
    """
    if not text or not job_skills:
        return []

    extracted = set(extract_skills(text))
    umbrellas = set(expand_umbrella_skills(extracted))

    matched = []
    seen_canonicals = set()

    for job_skill in job_skills:
        label = clean_text(job_skill)
        if not label:
            continue

        canonical = normalize_skill(label)
        if canonical in seen_canonicals:
            continue

        if canonical in extracted or canonical in umbrellas:
            seen_canonicals.add(canonical)
            matched.append(label)

    return matched

