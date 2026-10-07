"""
AI-based candidate-to-job matching.

SCORE STRUCTURE
----------------
The 100-point score is split into two budgets:

    80 points — "matcher" budget (semantic similarity, reduced by
                 missing mandatory/secondary skill penalties)
    20 points — experience budget (untouched by skills, binary)

The 20-point experience budget is exactly as before: 20 if the
candidate meets the job's minimum experience, 0 if not. Nothing
below changes that.

The 80-point matcher budget starts as `ai_score * 80`, where
ai_score is semantic (embedding) similarity between the candidate's
profile text and the job's text, 0-1. That starting number is then
reduced by two kinds of penalties, each skill's "weight" being an
equal share of a 100-point pool for its category:

  MANDATORY (primary) skills — full weight
    weight per skill = 100 / (number of mandatory skills)
    penalty per missing mandatory skill = weight * 0.8
    e.g. 4 mandatory skills -> 25 each -> 25 * 0.8 = 20 points off
         the matcher budget per missing mandatory skill.

  SECONDARY (required) skills — one third the weight of mandatory
    weight per skill = 100 / (number of secondary skills)
    penalty per missing secondary skill = (weight / 3) * 0.8
    e.g. 6 secondary skills -> 16.67 each -> /3 = 5.56 -> * 0.8
         = 4.44 points off the matcher budget per missing
         secondary skill.

final_score = max(0, 80*ai_score - mandatory_penalties - secondary_penalties)
              + (20 if experience_score else 0)

Missing a mandatory skill still also forces the category down to
"Low Match", on top of the points penalty above — see
_category_for_score.

Note: the original project computed ai_score from the full resume
text vs. the full JD text (both extracted from uploaded files). This
backend doesn't have raw resume/JD text on hand, so the closest
available substitute is used instead: candidate role + skills, and
job title + skills + description.
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
    0-1 semantic closeness between the candidate's profile text and
    the job's text — this IS the "ai_score" from the original
    project's formula, produced the same way: cosine similarity
    between sentence-transformer embeddings of the two texts.
    """

    if not candidate_text.strip() or not job_text.strip():
        return 0.0

    from sklearn.metrics.pairwise import cosine_similarity

    model = _get_model()

    embeddings = model.encode([candidate_text, job_text])

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]],
    )[0][0]

    # Cosine similarity can dip slightly negative for unrelated
    # text — clamp to 0-1, same as treating it as a plain fraction.
    return max(0.0, min(1.0, float(similarity)))


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_experience_years(candidate):
    """
    The candidate payload doesn't reliably expose a raw numeric
    "experience_years" key — depending on how build_candidate_payload
    formats it, experience can show up as:

      - candidate["experience_years"]  -> a real number (best case)
      - candidate["experience"]        -> a formatted STRING like
                                           "8.0 yrs", "15 years", or
                                           "N/A" when unknown

    This checks the numeric key first, then falls back to parsing
    the leading number out of the string field. Returns 0.0 if
    neither is present/parseable (unknown experience is treated as
    not meeting the requirement, same as before).
    """

    numeric_value = _to_float(candidate.get("experience_years"))

    if numeric_value is not None:
        return numeric_value

    raw_text = candidate.get("experience")

    if raw_text:
        match = re.search(r"(\d+(?:\.\d+)?)", str(raw_text))

        if match:
            return float(match.group(1))

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


def _weighted_skill_penalty(missing_count, total_count, divisor=1):
    """
    Each skill in a pool of `total_count` holds an equal share of a
    100-point pool (100 / total_count). `divisor` lets a category of
    skill count for less than full weight (secondary skills use
    divisor=3, i.e. one third the weight of a mandatory skill).
    The 0.8 converts that weight into points off the 80-point
    matcher budget specifically (not the full 100-point score).

    Returns 0 if total_count is 0 (job defines no skills in that
    category, so nothing to penalize).
    """

    if total_count == 0 or missing_count == 0:
        return 0.0

    weight_per_skill = (100 / total_count) / divisor

    return missing_count * weight_per_skill * 0.8


def calculate_match(candidate, job):
    """
    Computes a 0-100 match score for one candidate against one job.
    See the module docstring for the full formula. In short:

      - 80 points max from semantic similarity, reduced by
        proportional penalties for missing mandatory/secondary
        skills.
      - 20 points max from experience (binary — meets min_exp or
        doesn't, no partial credit).

    Also returns the matched/missing skill breakdown, and forces
    the category to "Low Match" whenever a mandatory skill is
    missing, on top of the points penalty.

    `candidate` needs: skills, current_role, applied_role, and
    experience under either "experience_years" (numeric) or
    "experience" (a string like "8.0 yrs" / "N/A").
    `job` needs: title, mandatory_skills, required_skills, min_exp,
    and optionally description.
    """

    candidate_skills = normalize_skills(candidate.get("skills"))

    mandatory_skills = normalize_skills(job.get("mandatory_skills"))
    required_skills = normalize_skills(job.get("required_skills"))

    # ---- Skills: matched/missing breakdown ----

    matched_mandatory, missing_mandatory = _match_skill_lists(
        candidate_skills, mandatory_skills
    )

    matched_required, missing_required = _match_skill_lists(
        candidate_skills, required_skills
    )

    has_all_mandatory = len(missing_mandatory) == 0

    # ---- ai_score: semantic similarity (0-1) ----

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

    ai_score = _semantic_similarity(candidate_text, job_text)

    # ---- experience_score: binary (0 or 1), 20-point budget ----

    candidate_experience = _extract_experience_years(candidate)

    required_experience = _to_float(job.get("min_exp")) or 0.0

    if required_experience <= 0:
        experience_score = 1
    elif candidate_experience >= required_experience:
        experience_score = 1
    else:
        experience_score = 0

    experience_points = experience_score * 20

    # ---- Matcher budget (80 points), penalized by missing skills ----

    matcher_points_before_penalty = ai_score * 80

    mandatory_penalty = _weighted_skill_penalty(
        missing_count=len(missing_mandatory),
        total_count=len(mandatory_skills),
        divisor=1,
    )

    secondary_penalty = _weighted_skill_penalty(
        missing_count=len(missing_required),
        total_count=len(required_skills),
        divisor=3,
    )

    matcher_points_after_penalty = max(
        0,
        matcher_points_before_penalty - mandatory_penalty - secondary_penalty,
    )

    # ---- Final score: penalized matcher budget + experience budget ----

    final_score_pct = max(
        0,
        min(100, round(matcher_points_after_penalty + experience_points)),
    )

    return {
        "score": final_score_pct,
        "category": _category_for_score(
            final_score_pct,
            has_all_mandatory=has_all_mandatory,
        ),
        "matched_skills": sorted(set(matched_mandatory + matched_required)),
        "missing_skills": sorted(set(missing_mandatory + missing_required)),

        # ---- Diagnostics ----
        # Not used by the UI, just returned so you can see in the
        # API response (Network tab) exactly why a candidate scored
        # what they did. Safe to remove once confirmed correct.
        "debug_ai_score_pct": round(ai_score * 100),
        "debug_experience_score": experience_score,
        "debug_candidate_experience_years": candidate_experience,
        "debug_required_experience_years": required_experience,
        "debug_matcher_points_before_penalty": round(
            matcher_points_before_penalty, 2
        ),
        "debug_mandatory_penalty": round(mandatory_penalty, 2),
        "debug_secondary_penalty": round(secondary_penalty, 2),
        "debug_matcher_points_after_penalty": round(
            matcher_points_after_penalty, 2
        ),
    }