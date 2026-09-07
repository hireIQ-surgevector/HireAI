"""
AI-based candidate-to-job matching.

Ported from the standalone `ai_ats_project` (sentence-transformers
semantic similarity + rule-based skill/experience scoring) so scores
are calculated once on the backend and persisted to
dbo.Candidates.ai_score — instead of being recomputed inaccurately
in the browser with plain substring matching.

Weighting mirrors the frontend's original point scale so existing
"Strong / Good / Moderate / Low Match" buckets still make sense:

    Mandatory skills   : 40 points
    Required skills    : 30 points
    Experience          : 20 points
    Semantic relevance  : 10 points
"""

import re


_model = None


def _get_model():
    """
    Lazily load the sentence-transformer model once per process.
    Loading it at import time would slow down every route in the
    app (including ones that never touch matching), and would try
    to download the model even when the server is just booting.
    """

    global _model

    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as e:
            raise RuntimeError(
                "sentence-transformers (and its dependency torch) "
                "isn't installed in this backend's environment. Run: "
                "pip install sentence-transformers scikit-learn "
                "torch numpy — inside the same virtualenv the Flask "
                f"server is running in. Original error: {e}"
            ) from e

        try:
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            raise RuntimeError(
                "Failed to load the 'all-MiniLM-L6-v2' model. This "
                "usually means the first-time download from "
                "huggingface.co couldn't complete (no internet "
                "access, a corporate proxy/firewall blocking it, or "
                "a partial download in the HF cache). "
                f"Original error: {e}"
            ) from e

    return _model


def normalize_skills(skills):
    """
    Accepts either a list of skills or a delimited string
    (comma / semicolon / pipe separated) and returns a clean,
    lower-cased, de-duplicated list. Mirrors the frontend's
    normalizeSkills() so both sides agree on what a "skill" is.
    """

    if not skills:
        return []

    if isinstance(skills, (list, tuple, set)):
        items = [str(skill) for skill in skills]
    else:
        items = re.split(r"[;,|]", str(skills))

    cleaned = []

    for item in items:
        value = item.strip().lower()

        if value and value not in cleaned:
            cleaned.append(value)

    return cleaned


def _skill_is_match(candidate_skill, job_skill, threshold=0.6):
    """
    Two skills match if one is a substring of the other (handles
    'gcp' vs 'google cloud platform' style variants), or — for
    skills phrased differently — if their embeddings are close
    enough. The substring check is cheap and catches most real
    cases; the embedding fallback catches paraphrases without a
    hand-maintained synonym table.
    """

    if not candidate_skill or not job_skill:
        return False

    if candidate_skill in job_skill or job_skill in candidate_skill:
        return True

    from sklearn.metrics.pairwise import cosine_similarity

    model = _get_model()

    embeddings = model.encode([candidate_skill, job_skill])

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]],
    )[0][0]

    return similarity >= threshold


def _match_skill_lists(candidate_skills, job_skills):
    """
    Returns (matched, missing) job_skills, checked against
    candidate_skills.
    """

    matched = []
    missing = []

    for job_skill in job_skills:
        found = any(
            _skill_is_match(candidate_skill, job_skill)
            for candidate_skill in candidate_skills
        )

        if found:
            matched.append(job_skill)
        else:
            missing.append(job_skill)

    return matched, missing


def _semantic_similarity(candidate_text, job_text):
    """
    0-100 semantic closeness between the candidate's profile text
    and the job's description text, using the same embedding model
    the original ai_ats_project used for resume-to-JD matching.
    """

    if not candidate_text.strip() or not job_text.strip():
        return 0

    from sklearn.metrics.pairwise import cosine_similarity

    model = _get_model()

    embeddings = model.encode([candidate_text, job_text])

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]],
    )[0][0]

    # Cosine similarity can dip slightly negative for unrelated
    # text — clamp to 0-1 before scaling to a percentage.
    similarity = max(0.0, min(1.0, float(similarity)))

    return similarity * 100


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _category_for_score(score, has_all_mandatory):
    """
    Mandatory-skill gate first: missing a mandatory skill caps the
    result at "Low Match" no matter how high the raw score is —
    same intent as the original project's "Rejected" bucket, mapped
    onto the frontend's existing four categories.
    """

    if not has_all_mandatory:
        return "Low Match"

    if score >= 80:
        return "Strong Match"

    if score >= 60:
        return "Good Match"

    if score >= 40:
        return "Moderate Match"

    return "Low Match"


def calculate_match(candidate, job):
    """
    Computes an accurate 0-100 match score for one candidate against
    one job, plus the matched/missing skill breakdown so the UI can
    show *why* the score is what it is.

    `candidate` needs: skills, experience_years, current_role,
    applied_role.
    `job` needs: title, mandatory_skills, required_skills, min_exp,
    and optionally description.
    """

    candidate_skills = normalize_skills(candidate.get("skills"))

    mandatory_skills = normalize_skills(job.get("mandatory_skills"))
    required_skills = normalize_skills(job.get("required_skills"))

    score = 0.0

    # ---- Mandatory skills (40) ----
    matched_mandatory, missing_mandatory = _match_skill_lists(
        candidate_skills, mandatory_skills
    )

    if mandatory_skills:
        score += (len(matched_mandatory) / len(mandatory_skills)) * 40
    else:
        score += 40

    # ---- Required skills (30) ----
    matched_required, missing_required = _match_skill_lists(
        candidate_skills, required_skills
    )

    if required_skills:
        score += (len(matched_required) / len(required_skills)) * 30
    else:
        score += 30

    # ---- Experience (20) ----
    candidate_experience = _to_float(candidate.get("experience_years"))
    required_experience = _to_float(job.get("min_exp"))

    if required_experience <= 0:
        score += 20
    elif candidate_experience >= required_experience:
        score += 20
    else:
        score += (candidate_experience / required_experience) * 20

    # ---- Semantic relevance (10) ----
    candidate_text = " ".join(filter(None, [
        candidate.get("current_role"),
        candidate.get("applied_role"),
        ", ".join(candidate_skills),
    ]))

    job_text = " ".join(filter(None, [
        job.get("title"),
        ", ".join(mandatory_skills + required_skills),
        job.get("description"),
    ]))

    semantic_score = _semantic_similarity(candidate_text, job_text)

    score += (semantic_score / 100) * 10

    final_score = max(0, min(100, round(score)))

    return {
        "score": final_score,
        "category": _category_for_score(
            final_score,
            has_all_mandatory=len(missing_mandatory) == 0,
        ),
        "matched_skills": sorted(set(matched_mandatory + matched_required)),
        "missing_skills": sorted(set(missing_mandatory + missing_required)),
    }