from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema

from utils.auth_helpers import (
    get_candidate_select_clause,
    build_candidate_payload,
)

from services.ai_matcher import calculate_match


matching = Blueprint('matching', __name__)


# ============================================================
# HELPERS
# ============================================================

def _has_column(cursor, table_name, column_name):
    """
    Self-contained column check (SQL Server catalog query) instead
    of depending on a has_column() helper from elsewhere in the
    codebase, whose location may differ between environments.
    """

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
        AND COLUMN_NAME = ?
        """,
        (table_name, column_name)
    )

    result = cursor.fetchone()

    return bool(result and result[0] > 0)


def _get_job_by_id(cursor, job_id):
    columns = [
        'job_id',
        'title',
        'department',
        'location',
        'min_exp',
        'mandatory_skills',
        'required_skills',
    ]

    if _has_column(cursor, 'Jobs', 'description'):
        columns.append('description')

    select_clause = ', '.join(columns)

    cursor.execute(
        f"""
        SELECT {select_clause}
        FROM dbo.Jobs
        WHERE job_id = ?
        """,
        (job_id,)
    )

    row = cursor.fetchone()

    if not row:
        return None

    return dict(zip(columns, row))


# ============================================================
# CALCULATE + STORE SCORES FOR EVERY CANDIDATE ON A JOB
# ============================================================

@matching.route(
    '/api/jobs/<int:job_id>/calculate-scores',
    methods=['POST']
)
@jwt_required(optional=True)
def calculate_scores_for_job(job_id):

    conn = None

    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        job = _get_job_by_id(cursor, job_id)

        if not job:
            return jsonify({
                'error': 'Job not found'
            }), 404

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE job_id = ?
            """,
            (job_id,)
        )

        rows = cursor.fetchall()

        results = []

        for row in rows:
            candidate = build_candidate_payload(row)

            match = calculate_match(candidate, job)

            cursor.execute(
                """
                UPDATE dbo.Candidates
                SET ai_score = ?
                WHERE candidate_id = ?
                """,
                (match['score'], candidate['candidate_id'])
            )

            candidate['ai_score'] = match['score']
            candidate['match_category'] = match['category']
            candidate['matched_skills'] = match['matched_skills']
            candidate['missing_skills'] = match['missing_skills']
            candidate['debug_ai_score_pct'] = match.get('debug_ai_score_pct')
            candidate['debug_experience_score'] = match.get('debug_experience_score')
            candidate['debug_candidate_experience_years'] = match.get('debug_candidate_experience_years')
            candidate['debug_required_experience_years'] = match.get('debug_required_experience_years')

            results.append(candidate)

        conn.commit()

        results.sort(
            key=lambda item: item['ai_score'],
            reverse=True
        )

        return jsonify({
            'job_id': job_id,
            'job_title': job['title'],
            'updated_count': len(results),
            'candidates': results,
        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "ERROR IN POST /api/jobs/<job_id>/calculate-scores:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if conn:
            conn.close()


# ============================================================
# CALCULATE + STORE SCORE FOR ONE CANDIDATE
# ============================================================

@matching.route(
    '/api/jobs/<int:job_id>/candidates/<int:candidate_id>/calculate-score',
    methods=['POST']
)
@jwt_required(optional=True)
def calculate_score_for_candidate(job_id, candidate_id):

    conn = None

    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        job = _get_job_by_id(cursor, job_id)

        if not job:
            return jsonify({
                'error': 'Job not found'
            }), 404

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,)
        )

        row = cursor.fetchone()

        if not row:
            return jsonify({
                'error': 'Candidate not found'
            }), 404

        candidate = build_candidate_payload(row)

        match = calculate_match(candidate, job)

        cursor.execute(
            """
            UPDATE dbo.Candidates
            SET ai_score = ?
            WHERE candidate_id = ?
            """,
            (match['score'], candidate_id)
        )

        conn.commit()

        candidate['ai_score'] = match['score']
        candidate['match_category'] = match['category']
        candidate['matched_skills'] = match['matched_skills']
        candidate['missing_skills'] = match['missing_skills']
        candidate['debug_ai_score_pct'] = match.get('debug_ai_score_pct')
        candidate['debug_experience_score'] = match.get('debug_experience_score')
        candidate['debug_candidate_experience_years'] = match.get('debug_candidate_experience_years')
        candidate['debug_required_experience_years'] = match.get('debug_required_experience_years')

        return jsonify(candidate), 200

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "ERROR IN POST .../calculate-score:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if conn:
            conn.close()