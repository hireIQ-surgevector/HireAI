import os
import shutil
import tempfile
import uuid

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.schema import ensure_schema
from utils.resume_parser import parse_resume, extract_job_skills_from_resume
from utils.resume_converter import (
    SUPPORTED_RESUME_EXTENSIONS,
    convert_resume_to_pdf,
)

from utils.auth_helpers import (
    get_candidate_select_clause,
    build_candidate_payload,
    get_candidate_stage_transition,
    get_required_interview_round,
    format_interview_evaluation_note,
    normalize_candidate_stage,
)

candidates = Blueprint("candidates", __name__)


@candidates.route("/api/candidates/<int:candidate_id>/resume", methods=["GET"])
@jwt_required(optional=False)
def get_candidate_resume(candidate_id):
    conn = None
    try:
        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT resume_storage_name, resume_original_name
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )
        row = cursor.fetchone()
        conn.close()
        conn = None

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        storage_name, original_name = row
        if not storage_name:
            return jsonify({"error": "No resume is linked to this candidate"}), 404

        safe_storage_name = os.path.basename(storage_name)
        if safe_storage_name != storage_name:
            return jsonify({"error": "Invalid resume file reference"}), 500

        upload_dir = os.path.realpath(
            os.path.join(os.getcwd(), "uploads", "resumes")
        )
        file_path = os.path.realpath(os.path.join(upload_dir, safe_storage_name))
        if os.path.commonpath([upload_dir, file_path]) != upload_dir:
            return jsonify({"error": "Invalid resume file reference"}), 500
        if not os.path.isfile(file_path):
            return jsonify({"error": "The linked resume file is missing"}), 404

        return send_file(
            file_path,
            as_attachment=False,
            download_name=os.path.basename(original_name or safe_storage_name),
        )
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500


@candidates.route("/api/candidates", methods=["GET"])
@jwt_required(optional=False)
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

        cursor.execute("""
            SELECT DISTINCT candidate_id
            FROM dbo.Interviews
        """)
        interviewed_candidate_ids = {
            row[0]
            for row in cursor.fetchall()
        }

        cursor.execute("""
            SELECT candidate_id, interview_round, scheduled_at, is_completed
            FROM dbo.Interviews
            WHERE scheduled_at IS NOT NULL
            ORDER BY scheduled_at DESC
        """)
        scheduled_interviews = {}
        for interview in cursor.fetchall():
            scheduled_interviews.setdefault(interview.candidate_id, []).append({
                'round': interview.interview_round,
                'scheduled_at': interview.scheduled_at.isoformat(),
                'is_completed': bool(interview.is_completed),
            })

        conn.close()

        candidates_list = []

        for row in rows:
            candidate = build_candidate_payload(row)
            candidate['has_interview'] = candidate['candidate_id'] in interviewed_candidate_ids
            candidate_interviews = scheduled_interviews.get(
                candidate['candidate_id'],
                [],
            )
            candidate['scheduled_interviews'] = candidate_interviews
            candidate['has_scheduled_interview'] = bool(candidate_interviews)
            candidates_list.append(candidate)

        return jsonify(candidates_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@candidates.route("/api/candidates/<int:candidate_id>", methods=["GET"])
@jwt_required(optional=False)
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
@jwt_required(optional=False)
def update_candidate_stage(candidate_id):
    conn = None

    try:
        ensure_schema()

        data = request.get_json(silent=True) or {}

        action = data.get("action") or ""
        requested_stage = data.get("stage") or ""
        if not isinstance(action, str) or not isinstance(requested_stage, str):
            return jsonify({"error": "Candidate stage must be text"}), 400

        action = action.strip().lower()
        requested_stage = requested_stage.strip()

        if not action and not requested_stage:
            return jsonify({"error": "A stage action is required"}), 400

        target_stage = requested_stage or get_candidate_stage_transition(None, action)

        if action:
            target_stage = get_candidate_stage_transition(requested_stage, action)

        allowed_stages = {
            "L1 Interview",
            "L2 Interview",
            "Client Interview",
            "Offer Sent",
            "Onboarded",
            "Rejected",
        }
        if target_stage not in allowed_stages:
            return jsonify({"error": "Invalid candidate stage"}), 400

        evaluation_note = data.get("evaluation_notes")
        if evaluation_note is not None and not isinstance(evaluation_note, str):
            return jsonify({"error": "Evaluation notes must be text"}), 400
        evaluation_note = (evaluation_note or "").strip()

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT current_status
            FROM dbo.Candidates
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )
        current_row = cursor.fetchone()

        if not current_row:
            conn.close()
            return jsonify({"error": "Candidate not found"}), 404

        current_stage = normalize_candidate_stage(current_row[0])
        required_round = get_required_interview_round(current_stage)
        is_evaluation = target_stage in {
            "L1 Interview",
            "L2 Interview",
            "Client Interview",
            "Rejected",
        }

        valid_transition = (
            (current_stage == "Shortlisted" and target_stage in {"L1 Interview", "Rejected"})
            or (current_stage == "L1 Interview" and target_stage in {"L2 Interview", "Rejected"})
            or (current_stage == "L2 Interview" and target_stage in {"Client Interview", "Offer Sent", "Rejected"})
            or (current_stage == "Client Interview" and target_stage in {"Offer Sent", "Rejected"})
            or (current_stage == "Offer Sent" and target_stage == "Onboarded")
        )
        if not valid_transition:
            conn.close()
            conn = None
            return jsonify({"error": "This candidate cannot move to that stage"}), 409

        interview_note = None
        if is_evaluation:
            if not evaluation_note:
                conn.close()
                conn = None
                return jsonify({"error": "Evaluation notes are required"}), 400
            if not required_round:
                conn.close()
                conn = None
                return jsonify({
                    "error": "An interview must be scheduled before evaluation"
                }), 409

            cursor.execute(
                """
                SELECT TOP 1 interview_id, interview_round
                FROM dbo.Interviews
                WHERE candidate_id = ?
                    AND scheduled_at IS NOT NULL
                    AND interview_round = ?
                    AND is_completed = 0
                ORDER BY scheduled_at DESC
                """,
                (candidate_id, required_round),
            )
            interview_row = cursor.fetchone()
            if not interview_row:
                conn.close()
                conn = None
                return jsonify({
                    "error": f"A scheduled {required_round} is required before evaluation"
                }), 409

            interview_note = format_interview_evaluation_note(
                interview_row[1],
                evaluation_note,
            )
            evaluated_interview_id = interview_row[0]
        else:
            evaluated_interview_id = None

        if interview_note:
            cursor.execute(
                """
                UPDATE dbo.Candidates
                SET current_status = ?,
                    interview_notes = CASE
                        WHEN NULLIF(LTRIM(RTRIM(interview_notes)), '') IS NULL
                            THEN ?
                        ELSE interview_notes + CHAR(13) + CHAR(10) + ?
                    END
                WHERE candidate_id = ?
                """,
                (target_stage, interview_note, interview_note, candidate_id),
            )
        else:
            cursor.execute(
                """
                UPDATE dbo.Candidates
                SET current_status = ?
                WHERE candidate_id = ?
                """,
                (target_stage, candidate_id),
            )

        if evaluated_interview_id is not None:
            cursor.execute(
                """
                UPDATE dbo.Interviews
                SET is_completed = 1,
                    notes = ?
                WHERE interview_id = ?
                    AND is_completed = 0
                """,
                (interview_note, evaluated_interview_id),
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
        conn = None

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        return jsonify(build_candidate_payload(row)), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
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

        cursor.execute(
            """
            SELECT mandatory_skills, required_skills
            FROM dbo.Jobs
            WHERE job_id = ?
            """,
            (job_id,),
        )
        job_skill_row = cursor.fetchone()
        job_skills = []
        if job_skill_row:
            for raw_skills in job_skill_row:
                job_skills.extend(
                    skill.strip()
                    for skill in str(raw_skills or "").replace(";", ",").split(",")
                    if skill.strip()
                )

        # ----------------------------------------------------
        # PROCESS EACH RESUME
        # ----------------------------------------------------

        created_candidates = []
        failed_files = []
        converted_count = 0
        pdf_ready_count = 0
        parsed_count = 0

        allowed_extensions = SUPPORTED_RESUME_EXTENSIONS

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

            safe_original_filename = os.path.basename(
                original_filename.replace("\\", "/")
            )
            converted_filename = (
                f"{os.path.splitext(safe_original_filename)[0]}.pdf"
            )
            unique_filename = f"{uuid.uuid4()}.pdf"
            file_path = os.path.join(upload_dir, unique_filename)

            try:
                with tempfile.TemporaryDirectory(
                    prefix="resume-upload-", dir=upload_dir
                ) as staging_dir:
                    source_path = os.path.join(
                        staging_dir, f"{uuid.uuid4()}{extension}"
                    )
                    file.save(source_path)
                    pdf_path = convert_resume_to_pdf(source_path, staging_dir)
                    shutil.copyfile(pdf_path, file_path)
            except Exception as error:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                failed_files.append(
                    {
                        "fileName": original_filename,
                        "error": (
                            f"Resume conversion failed: {error}"
                            if extension != ".pdf"
                            else f"Resume upload failed: {error}"
                        ),
                    }
                )
                continue

            pdf_ready_count += 1
            if extension != ".pdf":
                converted_count += 1

            # ------------------------------------------------
            # PARSE RESUME
            # ------------------------------------------------

            try:

                parsed = parse_resume(file_path, converted_filename)

            except Exception as e:
                if os.path.isfile(file_path):
                    os.remove(file_path)

                failed_files.append(
                    {
                        "fileName": original_filename,
                        "error": f"Resume parsing failed: {str(e)}",
                    }
                )

                continue

            if parsed.get("status") != "success":
                if os.path.isfile(file_path):
                    os.remove(file_path)
                failed_files.append(
                    {
                        "fileName": original_filename,
                        "error": parsed.get("error") or "Resume parsing failed",
                    }
                )
                continue

            parsed_count += 1

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
            jd_skills = extract_job_skills_from_resume(
                parsed.get("text", ""),
                job_skills,
            )
            skills = list(dict.fromkeys([*jd_skills, *skills]))

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
                    skills,
                    resume_storage_name,
                    resume_original_name
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
                    unique_filename,
                    converted_filename,
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
                    "pdf_ready_count": pdf_ready_count,
                    "converted_count": converted_count,
                    "parsed_count": parsed_count,
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
@jwt_required(optional=False)
def update_candidate_details(candidate_id):
    try:
        ensure_schema()

        data = request.get_json(silent=True) or {}

        location = data.get("location")
        full_name = (data.get("full_name") or "").strip()
        current_role = data.get("current_role")
        skills = data.get("skills")
        notice_period = data.get("notice_period")
        current_ctc = data.get("current_ctc")

        if not full_name:
            return jsonify({"error": "Candidate name is required"}), 400

        if isinstance(skills, list):
            skills_value = ", ".join(
                str(skill).strip()
                for skill in skills
                if str(skill).strip()
            )
        else:
            skills_value = ", ".join(
                skill.strip()
                for skill in str(skills or "").replace(";", ",").split(",")
                if skill.strip()
            )

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
                full_name = ?,
                location = ?,
                current_role = ?,
                skills = ?,
                notice_period = ?,
                current_ctc = ?
            WHERE candidate_id = ?
            """,
            (
                full_name,
                location,
                current_role,
                skills_value,
                notice_period,
                current_ctc,
                candidate_id,
            ),
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
