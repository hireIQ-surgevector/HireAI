from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.db import get_connection


jobs = Blueprint('jobs', __name__)


@jobs.route('/api/jobs', methods=['POST'])
@jwt_required(optional=True)
def create_job():

    try:
        user_id = get_jwt_identity()

        data = request.get_json() or {}

        title = data.get('title', '').strip()
        department = data.get('department', '').strip()
        location = data.get('location', '').strip()
        description = data.get('description', '').strip()
        mandatory_skills = data.get(
            'mandatory_skills',
            ''
        ).strip()

        required_skills = data.get(
            'required_skills',
            ''
        ).strip()

        min_exp = data.get('min_exp', 0)

        min_salary = data.get(
            'min_salary'
        ) or None

        max_salary = data.get(
            'max_salary'
        ) or None

        due_date = data.get(
            'due_date'
        ) or None

        interview_mode = data.get(
            'interview_mode',
            'Video Interview (IncVid)'
        )

        if not title or not location or not description:
            return jsonify({
                'error': (
                    'Title, location, and description '
                    'are required'
                )
            }), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Jobs (
                title,
                department,
                location,
                description,
                mandatory_skills,
                required_skills,
                min_exp,
                min_salary,
                max_salary,
                due_date,
                interview_mode,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            title,
            department,
            location,
            description,
            mandatory_skills,
            required_skills,
            min_exp,
            min_salary,
            max_salary,
            due_date,
            interview_mode,
            user_id
        ))

        conn.commit()

        cursor.execute(
            'SELECT @@IDENTITY'
        )

        job_id = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'message': 'Job posted successfully!',
            'job_id': job_id
        }), 201

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


@jobs.route('/api/jobs', methods=['GET'])
def get_jobs():
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                j.job_id,
                j.title,
                j.department,
                j.location,
                j.description,
                j.mandatory_skills,
                j.required_skills,
                j.min_exp,
                j.min_salary,
                j.max_salary,
                j.due_date,
                j.interview_mode,
                j.created_at,

                (
                    SELECT COUNT(*)
                    FROM Candidates c
                    WHERE c.job_id = j.job_id
                ) AS candidate_count

            FROM Jobs j

            ORDER BY j.created_at DESC
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        jobs = []

        for row in rows:
            job_dict = dict(zip(columns, row))

            if job_dict.get('created_at'):
                job_dict['created_at'] = job_dict['created_at'].isoformat()

            if job_dict.get('due_date'):
                job_dict['due_date'] = str(job_dict['due_date'])

            jobs.append(job_dict)

        return jsonify(jobs), 200

    except Exception as e:
        print("ERROR IN GET /api/jobs:", str(e))

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        if conn:
            conn.close()

# ==========================================
# GET CANDIDATES FOR A SPECIFIC JOB
# ==========================================

@jobs.route('/api/jobs/<int:job_id>/candidates', methods=['GET'])
def get_job_candidates(job_id):
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check whether the job exists
        cursor.execute("""
            SELECT job_id, title
            FROM Jobs
            WHERE job_id = ?
        """, (job_id,))

        job = cursor.fetchone()

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        # Get candidates using job_id
        cursor.execute("""
            SELECT 
                candidate_id,
                full_name,
                email,
                phone,
                current_role,
                applied_role,
                location,
                experience_years,
                current_ctc,
                current_status,
                ai_score,
                notice_period,
                skills,
                interview_notes,
                job_id,
                created_at
            FROM Candidates
            WHERE job_id = ?
            ORDER BY created_at DESC
        """, (job_id,))

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        candidates = []

        for row in rows:
            candidate = dict(zip(columns, row))

            if candidate.get('created_at'):
                candidate['created_at'] = candidate['created_at'].isoformat()

            candidates.append(candidate)

        return jsonify({
            'job_id': job.job_id,
            'job_title': job.title,
            'candidate_count': len(candidates),
            'candidates': candidates
        }), 200

    except Exception as e:
        print("ERROR IN GET JOB CANDIDATES:", str(e))
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()

# ==========================================
# GET SINGLE JOB BY ID
# ==========================================

@jobs.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                job_id, title, department, location, description, 
                mandatory_skills, required_skills, min_exp, 
                min_salary, max_salary, due_date,
                interview_mode, created_at, created_by
            FROM Jobs
            WHERE job_id = ?
        """, (job_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Job not found'}), 404

        columns = [column[0] for column in cursor.description]
        job = dict(zip(columns, row))

        if job.get('created_at'):
            job['created_at'] = job['created_at'].isoformat()
        if job.get('due_date'):
            job['due_date'] = str(job['due_date'])

        return jsonify(job), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================
# UPDATE JOB BY ID
# ==========================================

@jobs.route('/api/jobs/<int:job_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_job(job_id):
    try:
        data = request.get_json()

        title = data.get('title', '').strip()
        department = data.get('department', '').strip()
        location = data.get('location', '').strip()
        description = data.get('description', '').strip()
        mandatory_skills = data.get('mandatory_skills', '').strip()
        required_skills = data.get('required_skills', '').strip()
        min_exp = data.get('min_exp', 0)
        min_salary = data.get('min_salary') or None
        max_salary = data.get('max_salary') or None
        due_date = data.get('due_date') or None
        interview_mode = data.get('interview_mode', 'Video Interview (IncVid)')

        if not title or not location or not description:
            return jsonify({'error': 'Title, location, and description are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT job_id FROM Jobs WHERE job_id = ?', (job_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Job not found'}), 404

        cursor.execute("""
            UPDATE Jobs
            SET title = ?,
                department = ?,
                location = ?,
                description = ?,
                mandatory_skills = ?,
                required_skills = ?,
                min_exp = ?,
                min_salary = ?,
                max_salary = ?,
                due_date = ?,
                interview_mode = ?
            WHERE job_id = ?
        """, (
            title, department, location, description,
            mandatory_skills, required_skills, min_exp,
            min_salary, max_salary, due_date,
            interview_mode, job_id
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Job updated successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500