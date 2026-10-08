import os
import re

import pdfplumber
import pytesseract
from docx import Document
from docx.table import Table

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

SKILL_ALIASES = {
    "python": ["python", "python programming", "python development"],
    "sql": ["sql", "sql server", "t-sql", "tsql", "postgresql", "mysql", "mssql", "database querying"],
    "javascript": ["javascript", "js", "ecmascript", "es6"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "react.js", "reactjs"],
    "node.js": ["node", "node.js", "nodejs", "express.js", "expressjs"],
    "java": ["java", "core java", "spring", "spring boot"],
    "c#": ["c#", ".net", "dotnet", "asp.net", "aspnet"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation"],
    "azure": ["azure", "microsoft azure", "azure functions", "adf", "azure data factory"],
    "gcp": ["gcp", "google cloud", "google cloud platform", "bigquery", "dataflow", "cloud composer"],
    "docker": ["docker", "containerization", "containers"],
    "kubernetes": ["kubernetes", "k8s", "container orchestration"],
    "etl": ["etl", "elt", "data pipeline", "data pipelines", "data integration"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous delivery", "github actions", "jenkins"],
    "machine learning": ["machine learning", "ml", "predictive modeling", "scikit-learn", "sklearn"],
    "data analysis": ["data analysis", "data analytics", "business intelligence", "bi", "reporting"],
    "project management": ["project management", "program management", "agile", "scrum", "jira"],
}


# ============================================================
# TEXT CLEANING
# ============================================================


def clean_text(text):

    if not text:
        return ""

    return re.sub(r"\s+", " ", str(text)).strip()


def preserve_text_lines(text):
    lines = []

    for line in str(text or "").splitlines():
        cleaned_line = clean_text(line)
        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines)


def extract_job_skills_from_resume(text, job_skills):
    """Return the job's own skill labels when equivalent resume wording appears."""
    resume_text = clean_text(text).lower()
    extracted = []

    for job_skill in job_skills or []:
        label = clean_text(job_skill)
        if not label:
            continue

        normalized = label.lower()
        alias_group = next(
            (
                aliases
                for aliases in SKILL_ALIASES.values()
                if normalized in {str(alias).lower() for alias in aliases}
            ),
            [],
        )
        aliases = set(SKILL_ALIASES.get(normalized, []))
        aliases.update(alias_group)
        aliases.add(normalized)

        for alias in aliases:
            if re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", resume_text):
                extracted.append(label)
                break

    return extracted


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================


def extract_text_from_pdf(pdf_path):

    with pdfplumber.open(pdf_path) as pdf:
        pages = list(pdf.pages)
        extracted_pages = [_extract_layout_text(page) for page in pages]
        has_selectable_text = any(extracted_pages)
        text_pages = []

        for page, extracted in zip(pages, extracted_pages):

            needs_ocr = (
                not extracted and (page.images or not has_selectable_text)
            ) or (
                bool(extracted)
                and bool(page.images)
                and len(clean_text(extracted)) < 80
            )

            if needs_ocr:
                extracted = _extract_text_with_ocr(page)

            if extracted:
                text_pages.append(extracted)

        return preserve_text_lines("\n".join(text_pages))


def _extract_layout_text(page):
    """Preserve visible line and column boundaries from PDF text layout."""
    layout_text = page.extract_text(layout=True) or ""
    lines = []

    for line in layout_text.splitlines():
        columns = [
            column.strip()
            for column in re.split(r"[ \t]{4,}", line.strip())
            if column.strip()
        ]

        if columns:
            lines.append(" | ".join(columns))

    return "\n".join(lines)


def _extract_text_with_ocr(page):
    """OCR pages without an extractable text layer."""
    try:
        tesseract_cmd = os.getenv("TESSERACT_CMD")
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        image = page.to_image(resolution=300).original
        return pytesseract.image_to_string(image)
    except pytesseract.TesseractNotFoundError as error:
        raise RuntimeError(
            "This PDF has no extractable text and requires OCR. Install Tesseract "
            "OCR and ensure tesseract.exe is on PATH, or set TESSERACT_CMD to its "
            "full path."
        ) from error


# ============================================================
# DOCX TEXT EXTRACTION
# ============================================================


def extract_text_from_docx(docx_path):

    doc = Document(docx_path)

    blocks = []

    for block in doc.element.body.iterchildren():
        if block.tag.endswith("}p"):
            text = "".join(block.xpath(".//w:t/text()"))
            if text.strip():
                blocks.append(text)
        elif block.tag.endswith("}tbl"):
            table = Table(block, doc)
            for row in table.rows:
                cells = []
                seen_cells = set()
                for cell in row.cells:
                    cell_element = cell._tc
                    if cell_element in seen_cells:
                        continue
                    seen_cells.add(cell_element)

                    cell_text = clean_text(
                        "\n".join(
                            "".join(paragraph.xpath(".//w:t/text()"))
                            for paragraph in cell_element.xpath(".//w:p")
                        )
                    )
                    if cell_text:
                        cells.append(cell_text)

                if cells:
                    blocks.append(" | ".join(cells))

    return preserve_text_lines("\n".join(blocks))


# ============================================================
# TXT TEXT EXTRACTION
# ============================================================


def extract_text_from_txt(txt_path):

    with open(txt_path, "r", encoding="utf-8", errors="ignore") as file:

        text = file.read()

    return preserve_text_lines(text)


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


def extract_name_from_filename(file_name):
    name = os.path.splitext(os.path.basename(file_name))[0]

    name = re.sub(
        r"[_\-\s]+(?:resume|cv|data engineer|developer|software engineer|"
        r"\d+\s*years?.*)$",
        "",
        name,
        flags=re.IGNORECASE,
    )
    name = re.sub(r"\s*\(\d+\)$", "", name)
    name = re.sub(r"[_-]+", " ", name).strip()

    # A filename containing one concatenated token is not reliable enough
    # to use as a person's full name; let extracted resume text decide.
    if not re.fullmatch(
        r"[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3}",
        name,
    ):
        return ""

    return normalize_person_name(name)


def extract_name(text, file_name=None):

    # --------------------------------------------------------
    # Try explicit labels first
    # --------------------------------------------------------

    explicit_name = re.compile(
        r"^\s*(?:candidate\s+)?(?:full\s+)?name\s*[:\-]\s*"
        r"([A-Za-z][A-Za-z .'-]{2,60}?)(?:\s*[|,;].*)?\s*$",
        re.IGNORECASE,
    )
    for line in text.splitlines():
        match = explicit_name.match(line)
        if match:
            return normalize_person_name(match.group(1))

    # --------------------------------------------------------
    # Fallback: first few words
    # --------------------------------------------------------

    blocked = {
        "resume", "curriculum", "vitae", "profile", "summary", "objective",
        "data", "software", "cloud", "senior", "junior", "lead", "engineer",
        "developer", "specialist", "professional", "specialized", "experienced",
        "bengaluru", "bangalore",
        "pune", "india", "hyderabad", "mumbai", "delhi", "email", "phone",
        "contact", "linkedin", "skills", "experience", "education", "location",
        "python", "sql", "gcp", "aws", "azure", "google", "bigquery", "airflow",
        "etl", "spark", "java", "years", "year", "month", "months",
        "client", "project",
    }

    def name_words_from_line(line):
        line = line.strip()
        if not line:
            return []
        line = re.split(r"\b(?:email|e-mail|phone|contact|mobile)\s*:", line, maxsplit=1, flags=re.IGNORECASE)[0]
        line = line.replace("|", " ")
        name_words = []

        for word in line.split()[:3]:
            cleaned = re.sub(r"[^A-Za-z'-]", "", word)
            if not cleaned:
                continue
            if cleaned.lower() in blocked:
                break
            name_words.append(cleaned)
            if len(name_words) == 3:
                break
        return name_words

    lines = text.splitlines()
    first_line_words = name_words_from_line(lines[0]) if lines else []
    if len(first_line_words) >= 2:
        return normalize_person_name(" ".join(first_line_words))

    if file_name:
        filename_name = extract_name_from_filename(file_name)
        if filename_name:
            return filename_name

    if file_name and len(first_line_words) == 1:
        # Accept a one-word name only when it agrees with the filename prefix.
        filename_prefix = os.path.splitext(os.path.basename(file_name))[0]
        filename_prefix = re.sub(
            r"[_\-\s]+(?:resume|cv|data engineer|developer|software engineer|"
            r"\d+\s*years?.*)$",
            "",
            filename_prefix,
            flags=re.IGNORECASE,
        )
        first_filename_token = re.split(r"[_\-\s]+", filename_prefix)[0]
        if first_line_words[0].casefold() == first_filename_token.casefold():
            return normalize_person_name(first_line_words[0])

    for line in lines[1:8]:
        name_words = name_words_from_line(line)
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
