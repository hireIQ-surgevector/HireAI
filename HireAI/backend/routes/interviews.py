from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema


interviews = Blueprint('interviews', __name__)


def _get_interview(cursor, interview_id):
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
        WHERE i.interview_id = ?
    """, (interview_id,))

    row = cursor.fetchone()

    if not row:
        return None

    return {
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
    }


@interviews.route('/api/interviews', methods=['GET'])
@jwt_required(optional=False)
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


@interviews.route('/api/interviews/<int:interview_id>/schedule', methods=['PATCH'])
@jwt_required(optional=False)
def update_interview_schedule(interview_id):
    conn = None

    try:
        data = request.get_json(silent=True) or {}
        interview_date = (data.get('interview_date') or '').strip()
        interview_time = (data.get('interview_time') or '').strip()

        if not interview_date or not interview_time:
            return jsonify({
                'error': 'Interview date and time are required'
            }), 400

        try:
            scheduled_at = datetime.strptime(
                f'{interview_date} {interview_time}',
                '%Y-%m-%d %H:%M'
            )
        except ValueError:
            return jsonify({
                'error': 'Invalid interview date or time'
            }), 400

        if scheduled_at < datetime.now():
            return jsonify({
                'error': 'Interview must be scheduled in the future'
            }), 400

        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            'SELECT interview_id FROM dbo.Interviews WHERE interview_id = ?',
            (interview_id,)
        )

        if not cursor.fetchone():
            return jsonify({'error': 'Interview not found'}), 404

        cursor.execute(
            """
            UPDATE dbo.Interviews
            SET scheduled_at = ?
            WHERE interview_id = ?
            """,
            (scheduled_at, interview_id)
        )
        conn.commit()

        interview = _get_interview(cursor, interview_id)

        return jsonify(interview), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()


