import os
import re

import pdfplumber
from docx import Document

# ============================================================
# SKILL MAPPINGS
# ============================================================

SKILL_MAPPINGS = {
    "python": ["python"],
    "sql": ["sql", "postgresql", "mysql", "mssql", "sql server"],
    "gcp": ["gcp", "google cloud", "google cloud platform"],
    "airflow": ["airflow", "cloud composer", "apache airflow"],
    "bigquery": ["bigquery", "gbq", "google bigquery"],
    "terraform": ["terraform"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "etl": ["etl", "elt", "data pipeline", "data pipelines"],
    "ci/cd": ["ci/cd", "github actions", "cloud build", "jenkins", "gitlab ci"],
    "flask": ["flask"],
    "django": ["django"],
    "react": ["react"],
    "javascript": ["javascript", "js"],
    "java": ["java"],
    "c++": ["c++"],
    "c#": ["c#", ".net", "dotnet"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "spark": ["spark", "apache spark", "pyspark"],
    "hadoop": ["hadoop"],
    "git": ["git", "github", "gitlab"],
}


# ============================================================
# TEXT CLEANING
# ============================================================


def clean_text(text):

    if not text:
        return ""

    return re.sub(r"\s+", " ", str(text)).strip()


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================


def extract_text_from_pdf(pdf_path):

    text = ""

    with pdfplumber.open(pdf_path) as pdf:

        for page in pdf.pages:

            extracted = page.extract_text()

            if extracted:
                text += extracted + " "

    return clean_text(text)


# ============================================================
# DOCX TEXT EXTRACTION
# ============================================================


def extract_text_from_docx(docx_path):

    doc = Document(docx_path)

    text = ""

    for paragraph in doc.paragraphs:

        if paragraph.text:
            text += paragraph.text + " "

    return clean_text(text)


# ============================================================
# TXT TEXT EXTRACTION
# ============================================================


def extract_text_from_txt(txt_path):

    with open(txt_path, "r", encoding="utf-8", errors="ignore") as file:

        text = file.read()

    return clean_text(text)


# ============================================================
# EXTRACT TEXT FROM RESUME
# ============================================================


def extract_text_from_resume(file_path):

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":

        return extract_text_from_pdf(file_path)

    elif extension == ".docx":

        return extract_text_from_docx(file_path)

    elif extension == ".txt":

        return extract_text_from_txt(file_path)

    else:

        raise ValueError(f"Unsupported file type: {extension}")


# ============================================================
# NAME EXTRACTION
# ============================================================


def normalize_person_name(name):

    normalized = re.sub(r"\s+", " ", str(name or "")).strip()

    return normalized.title()


def extract_name(text, file_name=None):

    # --------------------------------------------------------
    # Try explicit labels first
    # --------------------------------------------------------

    patterns = [
        r"(?:name)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,60})",
        r"(?:full name)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,60})",
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return normalize_person_name(match.group(1))

    # --------------------------------------------------------
    # Try filename
    # --------------------------------------------------------

    if file_name:

        name = os.path.splitext(os.path.basename(file_name))[0]

        # Remove common resume/job suffixes
        name = re.sub(
            r"[_\-\s]+(?:resume|cv|data engineer|developer|software engineer|\d+\s*years?.*)$",
            "",
            name,
            flags=re.IGNORECASE,
        )

        name = re.sub(r"\s*\(\d+\)$", "", name)

        # Only use filename if it looks like a person's name
        if re.match(r"^[A-Za-z][A-Za-z .'-]{2,60}$", name):
            return normalize_person_name(name.replace("_", " "))

    # --------------------------------------------------------
    # Fallback: first few words
    # --------------------------------------------------------

    words = text.split()

    if len(words) >= 2:

        blocked = {
            "resume", "curriculum", "vitae", "profile", "summary", "objective",
            "data", "software", "cloud", "senior", "junior", "lead", "engineer",
            "developer", "specialist", "professional", "bengaluru", "bangalore",
            "pune", "india", "hyderabad", "mumbai", "delhi",
        }
        name_words = []

        for word in words[:8]:
            cleaned = re.sub(r"[^A-Za-z'-]", "", word)
            if not cleaned:
                continue
            if cleaned.lower() in blocked:
                break
            name_words.append(cleaned)
            if len(name_words) == 3:
                break

        if len(name_words) >= 2:
            return normalize_person_name(" ".join(name_words))

    return ""


# ============================================================
# EMAIL EXTRACTION
# ============================================================


def extract_email(text):

    if not text:
        return ""

    # PDF text extraction can insert spaces where an email wrapped across
    # lines, for example: "person@gmail.co m" or "person @ gmail . com".
    split_pattern = (
        r"(?<![A-Za-z0-9._%+-])"
        r"([A-Za-z0-9][A-Za-z0-9._%+-]*(?:\s+[A-Za-z0-9][A-Za-z0-9._%+-]*){0,2})"
        r"\s*@\s*"
        r"([A-Za-z0-9][A-Za-z0-9.-]*(?:\s+[A-Za-z0-9][A-Za-z0-9.-]*){0,2})"
        r"\s*\.\s*([A-Za-z]{2,}(?:\s+[A-Za-z](?=\s|$))?)"
    )

    match = re.search(split_pattern, text)

    if match:
        local_part = re.sub(
            r"^(?:contact|email|e-mail|mail)\s+",
            "",
            match.group(1),
            flags=re.IGNORECASE,
        )
        local_part = re.sub(r"^\d+\s+", "", local_part)
        email = re.sub(
            r"\s+", "", f"{local_part}@{match.group(2)}.{match.group(3)}"
        ).lower()
        email_match = re.fullmatch(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", email
        )

        if email_match:
            return email_match.group(0)

    pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    match = re.search(pattern, text)

    if match:
        email = match.group(0)
        suffix = re.match(r"\s+([A-Za-z])(?=\s|$)", text[match.end():])

        if suffix:
            email += suffix.group(1)

        return email

    return ""


# ============================================================
# PHONE EXTRACTION
# ============================================================

# ============================================================
# PHONE EXTRACTION
# ============================================================


def extract_phone(text):

    patterns = [
        # +91 9876543210
        r"(?:\+91[\s\-]?)?([6-9]\d{9})",
        # +1 1234567890
        r"\+\d{1,3}[\s\-]?(\d{7,12})",
        # 987-654-3210
        r"\b(\d{3})[\s\-](\d{3})[\s\-](\d{4})\b",
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if match:

            # If pattern has multiple groups
            groups = match.groups()

            if len(groups) == 1:

                phone = groups[0]

            else:

                phone = "".join(groups)

            # Keep only digits
            phone = re.sub(r"\D", "", phone)

            if phone:
                return int(phone)

    return None


# ============================================================
# EXPERIENCE EXTRACTION
# ============================================================


def extract_experience(text):

    text = clean_text(text).lower()

    patterns = [
        # Total Experience: 7 years
        r"total\s+experience\s*:?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?",
        # Overall Experience: 7 years
        r"overall\s+experience\s*:?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?",
        # Professional Experience: 7 years
        r"professional\s+experience\s*:?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?",
        # Experience: 7 years
        r"experience\s*:?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?",
        # 7 years 4 months
        r"(\d+(?:\.\d+)?)\s*\+?\s*years?(?:\s*(?:and\s*)?\d+\s*months?)?",
        # 7 yrs
        r"(\d+(?:\.\d+)?)\s*\+?\s*yrs",
        # Experience 7.5
        r"experience\s+(\d+(?:\.\d+)?)",
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            try:
                return float(match.group(1))

            except ValueError:
                pass

    return None


# ============================================================
# SKILLS EXTRACTION
# ============================================================


def extract_skills(text):

    text = clean_text(text).lower()

    found_skills = []

    for main_skill, variations in SKILL_MAPPINGS.items():

        for variation in variations:

            variation = variation.lower()

            if re.search(rf"\b{re.escape(variation)}\b", text):

                found_skills.append(main_skill)

                break

    return sorted(list(set(found_skills)))


# ============================================================
# CURRENT ROLE EXTRACTION
# ============================================================


def extract_current_role(text):

    patterns = [
        r"(?:current role|current position|current designation)\s*[:\-]\s*([^|,\n]{2,80})",
        r"(?:designation|job title|title)\s*[:\-]\s*([^|,\n]{2,80})",
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            value = clean_text(match.group(1))

            if value:
                return value

    role_match = re.search(
        r"\b(?:(?:senior|junior|lead|principal)\s+)?"
        r"(?:data|software|cloud|frontend|backend|full[ -]?stack)\s+"
        r"engineer(?:\s+(?:specialist|developer))?\b",
        text,
        re.IGNORECASE,
    )

    if role_match:
        return clean_text(role_match.group(0))

    return ""


# ============================================================
# LOCATION EXTRACTION
# ============================================================


def extract_location(text):

    patterns = [
        r"(?:location|current location|based in|address)\s*[:\-]\s*([^|]{2,80})"
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            value = clean_text(match.group(1))

            if value:
                return value

    location_match = re.search(
        r"\b((?:Bengaluru|Bangalore|Pune|Hyderabad|Mumbai|Delhi|Vizianagaram|"
        r"Guntur|Chennai)(?:,?\s+(?:India|Maharashtra|Karnataka|Telangana|"
        r"Andhra Pradesh|Tamil Nadu|MH|KA|TS|AP))?(?:\s+\d{5,6})?)\b",
        text,
        re.IGNORECASE,
    )

    if location_match:
        return clean_text(location_match.group(1))

    return ""


# ============================================================
# NOTICE PERIOD EXTRACTION
# ============================================================


def extract_notice_period(text):

    patterns = [
        # Notice Period: 30 days
        r"notice\s+period\s*[:\-]?\s*(\d+)\s*days?",
        # Notice Period: 2 months
        r"notice\s+period\s*[:\-]?\s*(\d+)\s*months?",
        # 30 days notice period
        r"(\d+)\s*days?\s*notice\s+period",
        # 2 months notice period
        r"(\d+)\s*months?\s*notice\s+period",
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            value = int(match.group(1))

            # Convert months to approximately days
            if "month" in match.group(0).lower():

                value = value * 30

            return value

    # Immediate joining
    if re.search(r"\bimmediate(?:ly)?\b", text, re.IGNORECASE):
        return 0

    return None


# ============================================================
# CURRENT CTC EXTRACTION
# ============================================================


def extract_current_ctc(text):

    patterns = [
        # Current CTC: 8 LPA
        r"(?:current\s+ctc|current\s+salary)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?)",
        # CTC: 8 LPA
        r"\bctc\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?)",
        # 8 LPA current CTC
        r"(?:current)\s+(?:ctc|salary)\s+(?:is\s+)?(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?)",
    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            try:

                # Different regexes have different group positions
                number = None

                for group in match.groups():

                    if group and re.match(r"^\d+(?:\.\d+)?$", group):
                        number = float(group)
                        break

                return number

            except ValueError:
                pass

    return None


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
