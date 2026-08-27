from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema


interviews = Blueprint('interviews', __name__)


@interviews.route('/api/interviews', methods=['GET'])
@jwt_required(optional=True)
def get_interviews():
    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                i.interview_id,
                c.full_name AS candidate_name,
                c.applied_role AS role_name,
                i.interview_round,
                i.scheduled_at,
                i.notes
            FROM dbo.Interviews i
            JOIN dbo.Candidates c
                ON c.candidate_id = i.candidate_id
            ORDER BY
                i.scheduled_at ASC
        """)

        rows = cursor.fetchall()

        conn.close()

        interviews_list = []

        for row in rows:
            interviews_list.append({
                'id': row.interview_id,
                'candidate_name': row.candidate_name,
                'role_name': row.role_name,
                'round': row.interview_round,
                'scheduled_at': (
                    row.scheduled_at.isoformat()
                    if getattr(row, 'scheduled_at', None)
                    else None
                ),
                'notes': row.notes,
            })

        return jsonify(interviews_list), 200

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500