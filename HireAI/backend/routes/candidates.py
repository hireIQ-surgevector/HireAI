import os
import uuid

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema
from utils.resume_parser import parse_resume

from utils.auth_helpers import (
    get_candidate_select_clause,
    build_candidate_payload,
    get_candidate_stage_transition,
)

candidates = Blueprint("candidates", __name__)


@candidates.route("/api/candidates", methods=["GET"])
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

        candidates_list = [build_candidate_payload(row) for row in rows]

        return jsonify(candidates_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@candidates.route("/api/candidates/<int:candidate_id>", methods=["GET"])
@jwt_required(optional=True)
def get_candidate_detail(candidate_id):
    try:
        ensure_schema()

        conn = get_connection()
        cursor = conn.cursor()

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """,
            (candidate_id,),
        )

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        return jsonify(build_candidate_payload(row)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@candidates.route("/api/candidates/<int:candidate_id>/stage", methods=["PATCH"])
@jwt_required(optional=True)
def update_candidate_stage(candidate_id):
    try:
        ensure_schema()

        data = request.get_json(silent=True) or {}

        action = (data.get("action") or "").strip().lower()

        requested_stage = (data.get("stage") or "").strip()

        if not action and not requested_stage:
            return jsonify({"error": "A stage action is required"}), 400

        target_stage = requested_stage or get_candidate_stage_transition(None, action)

        if action:
            target_stage = get_candidate_stage_transition(requested_stage, action)

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE dbo.Candidates
            SET current_status = ?
            WHERE candidate_id = ?
        """,
            (target_stage, candidate_id),
        )

        conn.commit()

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """,
            (candidate_id,),
        )

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        return jsonify(build_candidate_payload(row)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# UPLOAD MULTIPLE RESUMES
# ============================================================


@candidates.route("/api/candidates/upload", methods=["POST"])
def upload_candidates():

    conn = None

    try:

        ensure_schema()

        # ----------------------------------------------------
        # GET JOB ID
        # ----------------------------------------------------

        job_id = request.form.get("job_id")

        if not job_id:

            return jsonify({"error": "job_id is required"}), 400

        try:

            job_id = int(job_id)

        except ValueError:

            return jsonify({"error": "Invalid job_id"}), 400

        # ----------------------------------------------------
        # GET FILES
        # ----------------------------------------------------

        files = request.files.getlist("resumes")

        if not files:

            return jsonify({"error": "No resumes uploaded"}), 400

        # ----------------------------------------------------
        # UPLOAD DIRECTORY
        # ----------------------------------------------------

        upload_dir = os.path.join(os.getcwd(), "uploads", "resumes")

        os.makedirs(upload_dir, exist_ok=True)

        # ----------------------------------------------------
        # DATABASE
        # ----------------------------------------------------

        conn = get_connection()
        cursor = conn.cursor()

        # ----------------------------------------------------
        # VERIFY JOB EXISTS
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT job_id, title
            FROM dbo.Jobs
            WHERE job_id = ?
            """,
            (job_id,),
        )

        job = cursor.fetchone()

        if not job:

            return jsonify({"error": "Selected job does not exist"}), 404

        job_title = job[1]

        # ----------------------------------------------------
        # PROCESS EACH RESUME
        # ----------------------------------------------------

        created_candidates = []
        failed_files = []

        allowed_extensions = {".pdf", ".docx", ".txt"}

        for file in files:

            if not file or not file.filename:

                continue

            original_filename = file.filename

            extension = os.path.splitext(original_filename)[1].lower()

            if extension not in allowed_extensions:

                failed_files.append(
                    {"fileName": original_filename, "error": "Unsupported file type"}
                )

                continue

            # ------------------------------------------------
            # UNIQUE FILE NAME
            # ------------------------------------------------

            unique_filename = str(uuid.uuid4()) + extension

            file_path = os.path.join(upload_dir, unique_filename)

            file.save(file_path)

            # ------------------------------------------------
            # PARSE RESUME
            # ------------------------------------------------

            try:

                parsed = parse_resume(file_path)

            except Exception as e:

                failed_files.append(
                    {
                        "fileName": original_filename,
                        "error": f"Resume parsing failed: {str(e)}",
                    }
                )

                continue

            # ------------------------------------------------
            # VALIDATION
            # ------------------------------------------------

            full_name = parsed.get("full_name") or None

            email = parsed.get("email") or None

            phone = parsed.get("phone") or None

            current_role = parsed.get("current_role") or None

            location = parsed.get("location") or None

            experience_years = parsed.get("experience_years")

            current_ctc = parsed.get("current_ctc")

            notice_period = parsed.get("notice_period")

            skills = parsed.get("skills") or []

            # ------------------------------------------------
            # SKILLS → STRING
            # ------------------------------------------------

            skills_string = ", ".join(skills)

            # ------------------------------------------------
            # INSERT CANDIDATE
            # ------------------------------------------------

            cursor.execute(
                """
                INSERT INTO dbo.Candidates
                (
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
                    job_id,
                    notice_period,
                    skills
                )
                OUTPUT INSERTED.candidate_id
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                """,
                (
                    full_name,
                    email,
                    phone,
                    current_role,
                    job_title,
                    location,
                    experience_years,
                    current_ctc,
                    "New",
                    None,
                    job_id,
                    notice_period,
                    skills_string,
                ),
            )

            result = cursor.fetchone()

            candidate_id = result[0] if result else None

            created_candidates.append(
                {
                    "candidate_id": candidate_id,
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "current_role": current_role,
                    "applied_role": job_title,
                    "location": location,
                    "experience_years": experience_years,
                    "current_ctc": current_ctc,
                    "notice_period": notice_period,
                    "skills": skills,
                    "job_id": job_id,
                    "job_title": job_title,
                    "file_name": original_filename,
                }
            )

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        conn.commit()

        return (
            jsonify(
                {
                    "message": "Resume processing completed",
                    "job_id": job_id,
                    "job_title": job_title,
                    "created_count": len(created_candidates),
                    "failed_count": len(failed_files),
                    "candidates": created_candidates,
                    "failed": failed_files,
                }
            ),
            201,
        )

    except Exception as e:

        if conn:
            conn.rollback()

        print("ERROR IN POST /api/candidates/upload:", str(e))

        return jsonify({"error": str(e)}), 500

    finally:

        if conn:
            conn.close()


@candidates.route("/api/candidates/<int:candidate_id>", methods=["PATCH"])
@jwt_required(optional=True)
def update_candidate_details(candidate_id):
    try:
        ensure_schema()

        data = request.get_json(silent=True) or {}

        location = data.get("location")
        current_role = data.get("current_role")
        notice_period = data.get("notice_period")
        current_ctc = data.get("current_ctc")

        conn = get_connection()
        cursor = conn.cursor()

        # ----------------------------------------------------
        # VERIFY CANDIDATE EXISTS
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT candidate_id
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )

        candidate = cursor.fetchone()

        if not candidate:
            conn.close()

            return jsonify({"error": "Candidate not found"}), 404

        # ----------------------------------------------------
        # UPDATE ONLY EDITABLE FIELDS
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE dbo.Candidates
            SET
                location = ?,
                current_role = ?,
                notice_period = ?,
                current_ctc = ?
            WHERE candidate_id = ?
            """,
            (location, current_role, notice_period, current_ctc, candidate_id),
        )

        conn.commit()

        # ----------------------------------------------------
        # RETURN UPDATED CANDIDATE
        # ----------------------------------------------------

        select_clause = get_candidate_select_clause(cursor)

        cursor.execute(
            f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        return jsonify(build_candidate_payload(row)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
