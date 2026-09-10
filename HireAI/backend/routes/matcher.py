from flask import Blueprint, jsonify, request
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
# CALCULATE SCORES FOR EVERY NEW CANDIDATE ON A JOB
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
            AND LOWER(LTRIM(RTRIM(current_status))) IN ('new', 'applied')
            AND ai_score IS NULL
            """,
            (job_id,)
        )

        rows = cursor.fetchall()

        results = []

        for row in rows:
            candidate = build_candidate_payload(row)

            match = calculate_match(candidate, job)

            candidate['ai_score'] = match['score']
            candidate['match_category'] = match['category']
            candidate['matched_skills'] = match['matched_skills']
            candidate['missing_skills'] = match['missing_skills']

            results.append(candidate)

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
# CALCULATE SCORE FOR ONE NEW CANDIDATE
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
            AND job_id = ?
            """,
            (candidate_id, job_id)
        )

        row = cursor.fetchone()

        if not row:
            return jsonify({
                'error': 'Candidate not found'
            }), 404

        candidate = build_candidate_payload(row)

        if candidate.get('current_status') != 'New' or candidate.get('ai_score') is not None:
            return jsonify({
                'error': 'Candidate has already been evaluated or is no longer new'
            }), 409

        match = calculate_match(candidate, job)

        candidate['ai_score'] = match['score']
        candidate['match_category'] = match['category']
        candidate['matched_skills'] = match['matched_skills']
        candidate['missing_skills'] = match['missing_skills']

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


# ============================================================
# ACCEPT OR OVERRIDE AN AI MATCH
# ============================================================

@matching.route(
    '/api/jobs/<int:job_id>/candidates/<int:candidate_id>/decision',
    methods=['POST']
)
@jwt_required(optional=True)
def save_match_decision(job_id, candidate_id):

    conn = None

    try:
        data = request.get_json(silent=True) or {}
        decision = (data.get('decision') or '').strip().lower()

        if decision not in {'accept', 'override'}:
            return jsonify({
                'error': 'Decision must be accept or override'
            }), 400

        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()

        job = _get_job_by_id(cursor, job_id)

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
            AND job_id = ?
            """,
            (candidate_id, job_id)
        )

        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'Candidate not found'}), 404

        candidate = build_candidate_payload(row)

        current_status = str(
            getattr(row, 'current_status', '') or ''
        ).strip().lower()

        if current_status not in {'new', 'applied'}:
            return jsonify({
                'error': 'Candidate is no longer new'
            }), 409

        match = (
            {
                'score': candidate['ai_score'],
                'category': 'Previously evaluated',
                'matched_skills': [],
                'missing_skills': [],
            }
            if candidate.get('ai_score') is not None
            else calculate_match(candidate, job)
        )

        candidate['ai_score'] = match['score']
        candidate['match_category'] = match['category']
        candidate['matched_skills'] = match['matched_skills']
        candidate['missing_skills'] = match['missing_skills']
        candidate['match_decision'] = decision
        candidate['decision_pending'] = True

        return jsonify(candidate), 200

    except Exception as e:
        if conn:
            conn.rollback()

        print(
            "ERROR IN .../decision:",
            str(e)
        )

        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()


@matching.route(
    '/api/jobs/<int:job_id>/candidates/<int:candidate_id>/finalize',
    methods=['POST']
)
@jwt_required(optional=True)
def finalize_match_decision(job_id, candidate_id):

    conn = None

    try:
        data = request.get_json(silent=True) or {}
        decision = (data.get('decision') or '').strip().lower()
        stage = (data.get('stage') or '').strip()

        if decision not in {'accept', 'override'}:
            return jsonify({'error': 'A valid AI decision is required'}), 400

        if stage not in {'L1 Interview', 'Rejected'}:
            return jsonify({'error': 'Stage must be L1 Interview or Rejected'}), 400

        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()
        job = _get_job_by_id(cursor, job_id)

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        select_clause = get_candidate_select_clause(cursor)
        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
            AND job_id = ?
            """,
            (candidate_id, job_id)
        )
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'Candidate not found'}), 404

        current_status = str(getattr(row, 'current_status', '') or '').strip().lower()

        if current_status not in {'new', 'applied'}:
            return jsonify({'error': 'Candidate is no longer new'}), 409

        candidate = build_candidate_payload(row)
        match = (
            {'score': candidate['ai_score'], 'category': 'Previously evaluated',
             'matched_skills': [], 'missing_skills': []}
            if candidate.get('ai_score') is not None
            else calculate_match(candidate, job)
        )

        cursor.execute(
            """
            UPDATE dbo.Candidates
            SET ai_score = ?, current_status = ?
            WHERE candidate_id = ?
            AND job_id = ?
            AND LOWER(LTRIM(RTRIM(current_status))) IN ('new', 'applied')
            """,
            (match['score'], stage, candidate_id, job_id)
        )

        if cursor.rowcount not in (1, -1):
            conn.rollback()
            return jsonify({'error': 'Candidate was already finalized'}), 409

        conn.commit()
        candidate['ai_score'] = match['score']
        candidate['current_status'] = stage
        candidate['match_decision'] = decision
        return jsonify(candidate), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()