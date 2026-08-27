from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema

from utils.auth_helpers import (
    get_candidate_select_clause,
    build_candidate_payload,
    get_candidate_stage_transition,
)


candidates = Blueprint('candidates', __name__)


@candidates.route('/api/candidates', methods=['GET'])
@jwt_required(optional=True)
def get_candidates():
    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()

        conn.close()

        candidates_list = [
            build_candidate_payload(row)
            for row in rows
        ]

        return jsonify(candidates_list), 200

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@candidates.route(
    '/api/candidates/<int:candidate_id>',
    methods=['GET']
)
@jwt_required(optional=True)
def get_candidate_detail(candidate_id):
    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """, (candidate_id,))

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({
                'error': 'Candidate not found'
            }), 404

        return jsonify(
            build_candidate_payload(row)
        ), 200

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@candidates.route(
    '/api/candidates/<int:candidate_id>/stage',
    methods=['PATCH']
)
@jwt_required(optional=True)
def update_candidate_stage(candidate_id):
    try:
        ensure_schema()

        data = request.get_json(silent=True) or {}

        action = (
            data.get('action') or ''
        ).strip().lower()

        requested_stage = (
            data.get('stage') or ''
        ).strip()

        if not action and not requested_stage:
            return jsonify({
                'error': 'A stage action is required'
            }), 400

        target_stage = (
            requested_stage
            or get_candidate_stage_transition(None, action)
        )

        if action:
            target_stage = get_candidate_stage_transition(
                requested_stage,
                action
            )

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE dbo.Candidates
            SET current_status = ?
            WHERE candidate_id = ?
        """, (
            target_stage,
            candidate_id
        ))

        conn.commit()

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """, (candidate_id,))

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({
                'error': 'Candidate not found'
            }), 404

        return jsonify(
            build_candidate_payload(row)
        ), 200

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500