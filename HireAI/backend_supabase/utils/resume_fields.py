import os
import re

from .resume_skills import clean_text


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

    if len(first_line_words) == 1 and len(first_line_words[0]) >= 2:
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


# def extract_skills(text):

#     text = clean_text(text).lower()

#     found_skills = []

#     for main_skill, variations in SKILL_MAPPINGS.items():

#         for variation in variations:

#             variation = variation.lower()

#             if re.search(rf"\b{re.escape(variation)}\b", text):

#                 found_skills.append(main_skill)

#                 break

#     return sorted(list(set(found_skills)))


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


