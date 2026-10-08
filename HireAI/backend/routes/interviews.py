from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema
from utils.auth_helpers import get_required_interview_round, normalize_candidate_stage


interviews = Blueprint('interviews', __name__)


def _get_interview(cursor, interview_id):
    cursor.execute("""
        SELECT
            i.interview_id,
            c.full_name AS candidate_name,
            c.applied_role AS role_name,
            i.interview_round,
            i.scheduled_at,
            i.notes,
            i.is_completed,
            i.candidate_id,
            c.interview_notes AS candidate_interview_notes
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
        'is_completed': bool(row.is_completed),
        'candidate_id': row.candidate_id,
        'candidate_interview_notes': row.candidate_interview_notes,
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
                i.notes,
                i.is_completed,
                i.candidate_id,
                c.interview_notes AS candidate_interview_notes
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
                'is_completed': bool(row.is_completed),
                'candidate_id': row.candidate_id,
                'candidate_interview_notes': row.candidate_interview_notes,
            })

        return jsonify(interviews_list), 200

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@interviews.route('/api/interviews', methods=['POST'])
@jwt_required(optional=False)
def create_interview():
    conn = None

    try:
        data = request.get_json(silent=True) or {}
        try:
            candidate_id = int(data.get('candidate_id'))
        except (TypeError, ValueError):
            return jsonify({'error': 'A valid candidate is required'}), 400

        interview_round = data.get('interview_round')
        interview_date = data.get('interview_date')
        interview_time = data.get('interview_time')
        if not all(
            isinstance(value, str)
            for value in (interview_round, interview_date, interview_time)
        ):
            return jsonify({
                'error': 'Interview round, date, and time must be text'
            }), 400

        interview_round = interview_round.strip()
        interview_date = interview_date.strip()
        interview_time = interview_time.strip()

        if not interview_round or not interview_date or not interview_time:
            return jsonify({
                'error': 'Interview round, date, and time are required'
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
            """
            SELECT current_status, job_id
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )
        candidate_row = cursor.fetchone()
        if not candidate_row:
            return jsonify({'error': 'Candidate not found'}), 404

        current_stage = normalize_candidate_stage(candidate_row[0])
        expected_round = get_required_interview_round(current_stage)
        if not expected_round or interview_round != expected_round:
            return jsonify({
                'error': 'That interview round is not available for this candidate stage'
            }), 409

        cursor.execute(
            """
            SELECT TOP 1 interview_id
            FROM dbo.Interviews
            WHERE candidate_id = ?
                AND interview_round = ?
                AND scheduled_at >= ?
            """,
            (candidate_id, interview_round, datetime.now()),
        )
        if cursor.fetchone():
            return jsonify({
                'error': f'A future {interview_round} is already scheduled'
            }), 409

        cursor.execute(
            """
            INSERT INTO dbo.Interviews (
                candidate_id,
                job_id,
                interview_round,
                scheduled_at
            )
            OUTPUT INSERTED.interview_id
            VALUES (?, ?, ?, ?)
            """,
            (candidate_id, candidate_row[1], interview_round, scheduled_at),
        )
        interview_id = cursor.fetchone()[0]
        conn.commit()

        interview = _get_interview(cursor, interview_id)
        return jsonify(interview), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()


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
            'SELECT interview_id, is_completed FROM dbo.Interviews WHERE interview_id = ?',
            (interview_id,)
        )

        existing_interview = cursor.fetchone()
        if not existing_interview:
            return jsonify({'error': 'Interview not found'}), 404
        if existing_interview[1]:
            return jsonify({
                'error': 'Completed interviews cannot be rescheduled'
            }), 409

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
