"""
pipeline.py

Main resume processing pipeline.

Flow:
    Resume
      ↓
    Text extraction
      ↓
    Regex extraction
      ↓
    LLM extraction
      ↓
    Combine fields
      ↓
    Validate
      ↓
    Insert into TalentSyncDB

The JSON file is also created for debugging/testing.
The database is the actual destination.

Usage:
    python pipeline.py path/to/resume.pdf
    python pipeline.py path/to/folder/
"""


import sys
from pathlib import Path

from text_extractor import extract_text
from regex import extract_regex_fields
from llm import extract_llm_fields
from db_loader import insert_candidate


# ============================================================
# FIELDS PRODUCED BY THE RESUME PARSER
# ============================================================

DB_COLUMNS = [
    "name",
    "email",
    "phone",
    "location",
    "experience",
    "current_role",
    "notice_period",
    "current_ctc",
    "skills",
]


# ============================================================
# PROCESS ONE RESUME
# ============================================================

def process_resume(path: Path) -> dict:

    print("\n" + "=" * 60)
    print(f"Processing: {path.name}")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. Extract text
    # --------------------------------------------------------

    try:
        text = extract_text(path)

    except Exception as e:

        print(f"✗ Text extraction failed: {e}")

        record = {column: None for column in DB_COLUMNS}
        record["skills"] = []
        record["_status"] = "EXTRACTION_FAILED"
        record["_file"] = str(path)
        record["_error"] = str(e)

        return record

    if len(text.strip()) < 20:

        print("✗ Not enough text extracted from resume")

        record = {column: None for column in DB_COLUMNS}
        record["skills"] = []
        record["_status"] = "EXTRACTION_FAILED_NO_TEXT"
        record["_file"] = str(path)

        return record

    print(f"✓ Text extracted ({len(text)} characters)")


    # --------------------------------------------------------
    # 2. Regex extraction
    # --------------------------------------------------------

    try:

        regex_result = extract_regex_fields(text)

        print("✓ Regex extraction completed")

    except Exception as e:

        print(f"✗ Regex extraction failed: {e}")

        regex_result = {
            "email": None,
            "phone": None,
            "skills": [],
        }


    # --------------------------------------------------------
    # 3. LLM extraction
    # --------------------------------------------------------

    try:

        llm_result = extract_llm_fields(text)

        print("✓ LLM extraction completed")

    except Exception as e:

        print(f"✗ LLM extraction failed: {e}")

        llm_result = {
            "name": None,
            "location": None,
            "experience": None,
            "current_role": None,
            "_llm_error": str(e),
        }


    # --------------------------------------------------------
    # 4. Combine parser results
    # --------------------------------------------------------

    record = {
        "name": llm_result.get("name"),
        "email": regex_result.get("email"),
        "phone": regex_result.get("phone"),
        "location": llm_result.get("location"),
        "experience": llm_result.get("experience"),
        "current_role": llm_result.get("current_role"),

        # These are NOT extracted from resume
        "notice_period": None,
        "current_ctc": None,

        "skills": regex_result.get("skills", []),
    }


    # --------------------------------------------------------
    # 5. Preserve LLM error if present
    # --------------------------------------------------------

    if llm_result.get("_llm_error"):
        record["_llm_error"] = llm_result["_llm_error"]


    # --------------------------------------------------------
    # 6. Validate important fields
    # --------------------------------------------------------

    important_fields = [
        "name",
        "email",
    ]

    missing = [
        field
        for field in important_fields
        if not record.get(field)
    ]


    if missing:

        record["_status"] = (
            "NEEDS_REVIEW_MISSING:"
            + ",".join(missing)
        )

        print(
            f"⚠ Missing important fields: "
            f"{', '.join(missing)}"
        )

        # IMPORTANT:
        # We don't insert incomplete records automatically.
        record["_file"] = str(path)

        return record


    # --------------------------------------------------------
    # 7. Display extracted data
    # --------------------------------------------------------

    print("\nExtracted candidate:")

    print(f"  Name         : {record['name']}")
    print(f"  Email        : {record['email']}")
    print(f"  Phone        : {record['phone']}")
    print(f"  Location     : {record['location']}")
    print(f"  Experience   : {record['experience']}")
    print(f"  Current Role : {record['current_role']}")
    print(f"  Skills       : {record['skills']}")


    # --------------------------------------------------------
    # 8. INSERT DIRECTLY INTO DATABASE
    # --------------------------------------------------------

    try:

        candidate_id = insert_candidate(record)

        record["_candidate_id"] = candidate_id
        record["_status"] = "INSERTED"

        print(
            f"✓ Resume successfully loaded into database "
            f"(Candidate ID: {candidate_id})"
        )

    except Exception as e:

        record["_status"] = "DATABASE_INSERT_FAILED"
        record["_db_error"] = str(e)

        print(f"✗ Database insert failed: {e}")


    record["_file"] = str(path)

    return record


# ============================================================
# MAIN
# ============================================================

def main():

    if len(sys.argv) < 2:

        print(
            "Usage:\n"
            "  python pipeline.py <resume.pdf>\n"
            "  python pipeline.py <resume_folder>"
        )

        sys.exit(1)


    target = Path(sys.argv[1])


    # --------------------------------------------------------
    # Single resume
    # --------------------------------------------------------

    if target.is_file():

        files = [target]


    # --------------------------------------------------------
    # Folder of resumes
    # --------------------------------------------------------

    elif target.is_dir():

        files = (
            list(target.glob("*.pdf"))
            + list(target.glob("*.docx"))
        )

        if not files:

            print("✗ No PDF or DOCX resumes found in folder.")
            sys.exit(1)


    else:

        print(f"✗ File/folder not found: {target}")
        sys.exit(1)


    # --------------------------------------------------------
    # Process resumes
    # --------------------------------------------------------

    results = []

    for file in files:

        result = process_resume(file)

        results.append(result)


   

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    inserted = sum(
        1
        for result in results
        if result.get("_status") == "INSERTED"
    )

    failed = len(results) - inserted


    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)

    print(f"Total resumes : {len(results)}")
    print(f"Inserted      : {inserted}")
    print(f"Not inserted  : {failed}")

   


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()