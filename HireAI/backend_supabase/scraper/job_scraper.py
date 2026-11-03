import json
import re
import requests

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright



# ============================================================
# HTTP SETTINGS
# ============================================================

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/151.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,"
        "application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):
    """
    Clean unnecessary whitespace.
    """

    if not text:
        return ""

    text = str(text)

    # Normalize non-breaking spaces
    text = text.replace("\xa0", " ")

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# FETCH PAGE
# ============================================================

def fetch_page(url):
    """
    Load the webpage using a real Chromium browser
    so JavaScript-rendered job content is available.
    """

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/151.0.0.0 Safari/537.36"
            )
        )

        page.goto(
            url,
            wait_until="networkidle",
            timeout=60000
        )

        # Give the page a little time for
        # dynamically loaded job data.
        page.wait_for_timeout(2000)

        html = page.content()

        browser.close()

        return html

# ============================================================
# CREATE SOUP
# ============================================================

def create_soup(html):
    """
    Create BeautifulSoup object.
    """

    return BeautifulSoup(
        html,
        "lxml"
    )


# ============================================================
# EXTRACT JSON-LD JOBPOSTING
# ============================================================

def extract_jobposting_json(soup):
    """
    Extract Schema.org JobPosting JSON-LD.

    Supports:

    1. Direct JobPosting object
    2. @graph
    3. JSON-LD arrays
    """

    scripts = soup.find_all(
        "script",
        type="application/ld+json"
    )

    for script in scripts:

        try:

            content = script.string

            if not content:
                content = script.get_text()

            if not content:
                continue

            data = json.loads(content)

        except (
            json.JSONDecodeError,
            TypeError
        ):
            continue

        # ----------------------------------------------------
        # Direct object
        # ----------------------------------------------------

        if isinstance(data, dict):

            if data.get("@type") == "JobPosting":
                return data

            # ------------------------------------------------
            # @graph
            # ------------------------------------------------

            graph = data.get("@graph", [])

            if isinstance(graph, list):

                for item in graph:

                    if not isinstance(item, dict):
                        continue

                    item_type = item.get("@type")

                    if (
                        item_type == "JobPosting"
                        or (
                            isinstance(item_type, list)
                            and "JobPosting" in item_type
                        )
                    ):
                        return item

        # ----------------------------------------------------
        # Array
        # ----------------------------------------------------

        elif isinstance(data, list):

            for item in data:

                if not isinstance(item, dict):
                    continue

                item_type = item.get("@type")

                if (
                    item_type == "JobPosting"
                    or (
                        isinstance(item_type, list)
                        and "JobPosting" in item_type
                    )
                ):
                    return item

    return None


# ============================================================
# CLEAN HTML DESCRIPTION
# ============================================================

def clean_description_html(description_html):
    """
    Convert JSON-LD HTML description into readable text.

    Preserves headings and bullet points.
    """

    if not description_html:
        return ""

    soup = BeautifulSoup(
        description_html,
        "lxml"
    )

    # Remove unwanted elements
    for tag in soup([
        "script",
        "style",
        "noscript"
    ]):
        tag.decompose()

    lines = []

    for element in soup.find_all(
        ["h1", "h2", "h3", "h4", "p", "li"]
    ):

        text = clean_text(
            element.get_text(
                " ",
                strip=True
            )
        )

        if not text:
            continue

        # ----------------------------------------------------
        # Bullet point
        # ----------------------------------------------------

        if element.name == "li":
            lines.append(f"- {text}")

        # ----------------------------------------------------
        # Heading
        # ----------------------------------------------------

        elif element.name in [
            "h1",
            "h2",
            "h3",
            "h4"
        ]:
            lines.append("")
            lines.append(text)
            lines.append("")

        # ----------------------------------------------------
        # Paragraph
        # ----------------------------------------------------

        else:
            lines.append(text)

    # Remove excessive blank lines
    result = "\n".join(lines)

    result = re.sub(
        r"\n{3,}",
        "\n\n",
        result
    )

    return result.strip()


# ============================================================
# EXTRACT TITLE
# ============================================================

def extract_title(
    soup,
    job_data
):
    """
    Extract job title.
    """

    # JSON-LD
    if job_data:

        title = job_data.get("title")

        if title:
            return clean_text(title)

    # H1
    h1 = soup.find("h1")

    if h1:

        title = clean_text(
            h1.get_text(
                " ",
                strip=True
            )
        )

        if title:
            return title

    # Page title
    if soup.title:

        title = clean_text(
            soup.title.get_text(
                " ",
                strip=True
            )
        )

        if title:

            # Remove common suffixes
            title = re.split(
                r"\s*[\-|–|]\s*",
                title
            )[0]

            return title.strip()

    return ""


# ============================================================
# EXTRACT LOCATION
# ============================================================

def extract_location(
    job_data,
    page_text
):
    """
    Extract job location.

    JSON-LD is preferred.
    """

    if job_data:

        job_location = job_data.get(
            "jobLocation"
        )

        if isinstance(job_location, dict):

            address = job_location.get(
                "address"
            )

            if isinstance(address, dict):

                city = address.get(
                    "addressLocality"
                )

                state = address.get(
                    "addressRegion"
                )

                country = address.get(
                    "addressCountry"
                )

                if city and state:
                    return clean_text(
                        f"{city}, {state}"
                    )

                if city:
                    return clean_text(city)

                if state:
                    return clean_text(state)

        # Some websites use an array
        elif isinstance(job_location, list):

            for location in job_location:

                if not isinstance(
                    location,
                    dict
                ):
                    continue

                address = location.get(
                    "address"
                )

                if not isinstance(
                    address,
                    dict
                ):
                    continue

                city = address.get(
                    "addressLocality"
                )

                state = address.get(
                    "addressRegion"
                )

                if city and state:
                    return clean_text(
                        f"{city}, {state}"
                    )

                if city:
                    return clean_text(city)

    # --------------------------------------------------------
    # HTML fallback
    # --------------------------------------------------------

    patterns = [

        r"Location\s*:\s*([^|]+)",

        r"Location\s+([A-Za-z][A-Za-z0-9 ,\-]+)"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            page_text,
            re.IGNORECASE
        )

        if match:

            location = clean_text(
                match.group(1)
            )

            if location:
                return location

    return ""


# ============================================================
# EXTRACT EXPERIENCE
# ============================================================

def extract_experience(page_text):
    """
    Extract minimum years of experience.
    """

    patterns = [

        # Experience: 5+ Years
        r"Experience\s*:\s*(\d+)\s*\+?\s*Years?",

        # 5+ years of experience
        r"(\d+)\s*\+?\s*Years?\s+of\s+experience",

        # 5+ Years
        r"(\d+)\s*\+\s*Years?",

        # 5 years
        r"(\d+)\s+Years?"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            page_text,
            re.IGNORECASE
        )

        if match:

            try:
                return int(
                    match.group(1)
                )
            except ValueError:
                pass

    return None


# ============================================================
# EXTRACT EMPLOYMENT TYPE
# ============================================================

def extract_employment_type(
    job_data,
    page_text
):
    """
    Extract employment type.
    """

    if job_data:

        employment_type = job_data.get(
            "employmentType"
        )

        if employment_type:

            if isinstance(
                employment_type,
                list
            ):
                return ", ".join(
                    clean_text(x)
                    for x in employment_type
                )

            return clean_text(
                employment_type
            )

    match = re.search(
        r"\b("
        r"Full[- ]time|"
        r"Part[- ]time|"
        r"Contract|"
        r"Temporary|"
        r"Internship|"
        r"Freelance"
        r")\b",
        page_text,
        re.IGNORECASE
    )

    if match:
        return clean_text(
            match.group(1)
        )

    return ""


# ============================================================
# EXTRACT NOTICE PERIOD
# ============================================================

def extract_notice_period(page_text):
    """
    Extract notice period.
    """

    patterns = [

        r"Notice\s+Period\s*:\s*"
        r"(.+?)(?=\s+(?:Job Summary|Responsibilities|"
        r"Mandatory Skills|Preferred Skills|$))",

        r"Notice\s+Period\s*:\s*([^|]+)"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            page_text,
            re.IGNORECASE
        )

        if match:

            value = clean_text(
                match.group(1)
            )

            if value:
                return value

    return ""


# ============================================================
# EXTRACT WORK MODE
# ============================================================

def extract_work_mode(page_text):
    """
    Extract work mode such as:

    Remote
    Hybrid
    Onsite
    Work From Home
    """

    patterns = [

        r"Mode\s+of\s+Work\s*:\s*"
        r"(Hybrid|Remote|On[- ]site|Onsite|"
        r"Work\s+From\s+Home|WFO|WFH)",

        r"\b(Hybrid|Remote|On[- ]site|Onsite)\b"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            page_text,
            re.IGNORECASE
        )

        if match:

            return clean_text(
                match.group(1)
            )

    return ""


# ============================================================
# EXTRACT SALARY
# ============================================================

def extract_salary(
    job_data,
    page_text
):
    """
    Extract salary.

    JSON-LD first.
    Text fallback second.
    """

    # --------------------------------------------------------
    # JSON-LD baseSalary
    # --------------------------------------------------------

    if job_data:

        base_salary = job_data.get(
            "baseSalary"
        )

        if isinstance(
            base_salary,
            dict
        ):

            value = base_salary.get(
                "value"
            )

            if isinstance(
                value,
                dict
            ):

                min_value = value.get(
                    "minValue"
                )

                max_value = value.get(
                    "maxValue"
                )

                # Salary might be annual INR
                if (
                    min_value is not None
                    or max_value is not None
                ):

                    return {
                        "minSalary": min_value,
                        "maxSalary": max_value
                    }

                single_value = value.get(
                    "value"
                )

                if single_value is not None:

                    return {
                        "minSalary": single_value,
                        "maxSalary": single_value
                    }

    # --------------------------------------------------------
    # Text salary
    # --------------------------------------------------------

    patterns = [

        r"₹?\s*(\d+(?:\.\d+)?)\s*[-–to]+\s*"
        r"₹?\s*(\d+(?:\.\d+)?)\s*LPA",

        r"₹?\s*(\d+(?:\.\d+)?)\s*LPA\s*[-–to]+\s*"
        r"₹?\s*(\d+(?:\.\d+)?)\s*LPA"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            page_text,
            re.IGNORECASE
        )

        if match:

            try:

                return {
                    "minSalary": float(
                        match.group(1)
                    ),
                    "maxSalary": float(
                        match.group(2)
                    )
                }

            except ValueError:
                pass

    return {
        "minSalary": None,
        "maxSalary": None
    }


# ============================================================
# FIND SECTION
# ============================================================

def find_heading(
    soup,
    heading_text
):
    """
    Find a heading even when the website
    uses h1/h2/h3/h4 or p.
    """

    for element in soup.find_all(
        ["h1", "h2", "h3", "h4", "p", "strong"]
    ):

        text = clean_text(
            element.get_text(
                " ",
                strip=True
            )
        )

        if text.lower() == heading_text.lower():
            return element

    return None


# ============================================================
# EXTRACT BULLET SECTION
# ============================================================

def extract_bullet_section(
    soup,
    heading_text
):
    """
    Extract bullet points following a section heading.
    """

    heading = find_heading(
        soup,
        heading_text
    )

    if not heading:
        return []

    # Find next UL
    next_ul = heading.find_next(
        "ul"
    )

    if not next_ul:
        return []

    # Make sure another major heading
    # didn't occur before this UL
    previous_heading = next_ul.find_previous(
        ["h1", "h2", "h3", "h4"]
    )

    if (
        previous_heading
        and previous_heading != heading
        and heading.name != "p"
    ):
        return []

    results = []

    for li in next_ul.find_all(
        "li",
        recursive=False
    ):

        text = clean_text(
            li.get_text(
                " ",
                strip=True
            )
        )

        if text:
            results.append(text)

    return results


# ============================================================
# EXTRACT SKILLS FROM TEXT
# ============================================================

SKILL_PATTERNS = {

    "FME Desktop":
        r"\bFME\s+Desktop\b",

    "FME Server":
        r"\bFME\s+Server\b",

    "FME":
        r"\bFME\b",

    "Oracle Spatial":
        r"\bOracle\s+Spatial\b",

    "Oracle":
        r"\bOracle\b",

    "PL/SQL":
        r"\bPL/SQL\b",

    "SQL":
        r"\bSQL\b",

    "ArcGIS":
        r"\bArcGIS\b",

    "QGIS":
        r"\bQGIS\b",

    "Python":
        r"\bPython\b",

    "GIS Development/Engineering":
        r"\bGIS\s+Development/Engineering\b",

    "Spatial Data Formats":
        r"\bspatial\s+data\s+formats\b",

    "Projections":
        r"\bprojections?\b",

    "Coordinate Systems":
        r"\bcoordinate\s+systems?\b",

    "Spatial Data Modeling":
        r"\bspatial\s+data\s+modeling\b",

    "Geospatial ETL":
        r"\bgeospatial\s+ETL\b",

    "Shapefile":
        r"\bShapefile\b",

    "GeoJSON":
        r"\bGeoJSON\b",

    "KML":
        r"\bKML\b",

    "KMZ":
        r"\bKMZ\b",

    "GeoPackage":
        r"\bGeoPackage\b",

    "GeoTIFF":
        r"\bGeoTIFF\b",

    "Spatial Data Quality":
        r"\bspatial\s+data\s+quality\b",

    "Data Validation":
        r"\bvalidation\b",

    "Data Optimization":
        r"\boptimization\b",

    "Analytical Skills":
        r"\banalytical\b",

    "Troubleshooting":
        r"\btroubleshooting\b",

    "Communication":
        r"\bcommunication\b",
}


# ============================================================
# EXTRACT SKILLS
# ============================================================

def extract_skills(
    bullet_points
):
    """
    Extract known skills from bullet points.
    """

    skills = []

    combined_text = " ".join(
        bullet_points
    )

    for skill, pattern in SKILL_PATTERNS.items():

        if re.search(
            pattern,
            combined_text,
            re.IGNORECASE
        ):

            skills.append(skill)

    return skills


# ============================================================
# DEPARTMENT
# ============================================================

def extract_department(
    job_data,
    page_text
):
    """
    Extract department.

    JSON-LD is preferred if available.

    Do NOT infer Engineering merely because
    'Engineer' appears in the job title.
    """

    if job_data:

        department = job_data.get(
            "department"
        )

        if isinstance(
            department,
            dict
        ):

            name = department.get(
                "name"
            )

            if name:
                return clean_text(name)

        elif isinstance(
            department,
            str
        ):

            if department.strip():
                return clean_text(
                    department
                )

    # --------------------------------------------------------
    # Explicit department label
    # --------------------------------------------------------

    match = re.search(
        r"Department\s*:\s*([A-Za-z &/-]+)",
        page_text,
        re.IGNORECASE
    )

    if match:

        return clean_text(
            match.group(1)
        )

    # --------------------------------------------------------
    # No reliable department
    # --------------------------------------------------------

    return ""


# ============================================================
# MAIN SCRAPER
# ============================================================

def scrape_job(url):

    # ========================================================
    # FETCH
    # ========================================================

    html = fetch_page(
        url
    )

    # ========================================================
    # PARSE
    # ========================================================

    soup = create_soup(
        html
    )

    # ========================================================
    # JSON-LD
    # ========================================================

    job_data = extract_jobposting_json(
        soup
    )

    # ========================================================
    # CLEAN PAGE TEXT
    # ========================================================

    # Clone soup so JSON-LD/scripts
    # don't contaminate page text.

    clean_soup = BeautifulSoup(
        html,
        "lxml"
    )

    for tag in clean_soup([
        "script",
        "style",
        "noscript",
        "svg"
    ]):
        tag.decompose()

    page_text = clean_text(
        clean_soup.get_text(
            " ",
            strip=True
        )
    )

    # ========================================================
    # BASIC FIELDS
    # ========================================================

    title = extract_title(
        soup,
        job_data
    )

    location = extract_location(
        job_data,
        page_text
    )

    min_exp = extract_experience(
        page_text
    )

    employment_type = extract_employment_type(
        job_data,
        page_text
    )

    notice_period = extract_notice_period(
        page_text
    )

    work_mode = extract_work_mode(
        page_text
    )

    department = extract_department(
        job_data,
        page_text
    )

    # ========================================================
    # DESCRIPTION
    # ========================================================

    description = ""

    if job_data:

        description_html = job_data.get(
            "description"
        )

        if description_html:

            description = clean_description_html(
                description_html
            )

    # HTML fallback
    if not description:

        content = clean_soup.find(
            class_=lambda value:
                value and "prose" in str(value)
        )

        if content:

            description = content.get_text(
                "\n",
                strip=True
            )

    # ========================================================
    # SKILLS
    # ========================================================

    mandatory_bullets = extract_bullet_section(
        soup,
        "Mandatory Skills"
    )

    preferred_bullets = extract_bullet_section(
        soup,
        "Preferred Skills"
    )

    mandatory_skills = extract_skills(
        mandatory_bullets
    )

    preferred_skills = extract_skills(
        preferred_bullets
    )

    # ========================================================
    # REMOVE DUPLICATES
    # ========================================================

    mandatory_lower = {
        skill.lower()
        for skill in mandatory_skills
    }

    preferred_skills = [
        skill
        for skill in preferred_skills
        if skill.lower()
        not in mandatory_lower
    ]

    # ========================================================
    # SALARY
    # ========================================================

    salary = extract_salary(
        job_data,
        page_text
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "title":
            title,

        "department":
            department,

        "location":
            location,

        "description":
            description,

        "mandatorySkills":
            mandatory_skills,

        "requiredSkills":
            preferred_skills,

        "minExp":
            min_exp,

        "minSalary":
            salary["minSalary"],

        "maxSalary":
            salary["maxSalary"],

        "dueDate":
            "",

        "interviewMode":
            "Video Interview (IncVid)",

        # Additional information
        "employmentType":
            employment_type,

        "noticePeriod":
            notice_period,

        "workMode":
            work_mode,

        "sourceUrl":
            url
    }