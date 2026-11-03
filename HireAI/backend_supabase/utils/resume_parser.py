import os

# Keep these module objects available for existing patch targets.
import pdfplumber
import pytesseract

from .resume_fields import (
    extract_current_ctc,
    extract_current_role,
    extract_email,
    extract_experience,
    extract_location,
    extract_name,
    extract_name_from_filename,
    extract_notice_period,
    extract_phone,
    normalize_person_name,
)
from .resume_skills import (
    ALIAS_TO_CANONICAL,
    _ALIAS_PATTERNS,
    _clean,
    clean_text,
    expand_umbrella_skills,
    extract_job_skills_from_resume,
    extract_skills,
    match_required_skills,
    normalize_skill,
    preserve_text_lines,
)
from .resume_text import (
    _extract_layout_text,
    _extract_text_with_ocr,
    extract_text_from_docx,
    extract_text_from_pdf,
    extract_text_from_resume,
    extract_text_from_txt,
)
from .skill_taxonomy import SKILL_ALIASES, SKILL_CATEGORIES, SKILL_MAPPINGS


# ============================================================
# PARSE ONE RESUME
# ============================================================


def parse_resume(file_path, original_file_name=None):

    file_name = original_file_name or os.path.basename(file_path)

    try:

        # ----------------------------------------------------
        # Extract text
        # ----------------------------------------------------

        text = extract_text_from_resume(file_path)

        # ----------------------------------------------------
        # Empty resume
        # ----------------------------------------------------

        if not text:

            return {
                "fileName": file_name,
                "filePath": file_path,
                "status": "failed",
                "error": "No text could be extracted from resume",
                "text": "",
                "full_name": "",
                "email": "",
                "phone": "",
                "current_role": "",
                "location": "",
                "experience_years": None,
                "current_ctc": None,
                "notice_period": "",
                "skills": [],
            }

        # ----------------------------------------------------
        # Extract candidate information
        # ----------------------------------------------------

        full_name = extract_name(text, file_name)

        email = extract_email(text)

        phone = extract_phone(text)

        current_role = extract_current_role(text)

        location = extract_location(text)

        experience_years = extract_experience(text)

        current_ctc = extract_current_ctc(text)

        notice_period = extract_notice_period(text)

        skills = extract_skills(text)

        # ----------------------------------------------------
        # Return parsed candidate
        # ----------------------------------------------------

        return {
            "fileName": file_name,
            "filePath": file_path,
            "status": "success",
            "error": None,
            "text": text,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "current_role": current_role,
            "location": location,
            "experience_years": experience_years,
            "current_ctc": current_ctc,
            "notice_period": notice_period,
            "skills": skills,
        }

    except Exception as e:

        return {
            "fileName": file_name,
            "filePath": file_path,
            "status": "failed",
            "error": str(e),
            "text": "",
            "full_name": "",
            "email": "",
            "phone": "",
            "current_role": "",
            "location": "",
            "experience_years": None,
            "current_ctc": None,
            "notice_period": "",
            "skills": [],
        }


# ============================================================
# PARSE MULTIPLE RESUMES
# ============================================================


def parse_multiple_resumes(file_paths):

    results = []

    for file_path in file_paths:

        result = parse_resume(file_path)

        results.append(result)

    return results


# ============================================================
# PARSE RESUMES FROM FOLDER
# ============================================================


def parse_resumes_from_folder(folder_path):

    supported_extensions = {".pdf", ".docx", ".txt"}

    file_paths = []

    for file_name in os.listdir(folder_path):

        file_path = os.path.join(folder_path, file_name)

        if not os.path.isfile(file_path):
            continue

        extension = os.path.splitext(file_name)[1].lower()

        if extension in supported_extensions:

            file_paths.append(file_path)

    return parse_multiple_resumes(file_paths)
