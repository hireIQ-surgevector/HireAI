# HireAI

HireAI is a recruiter-first applicant tracking and hiring workflow application. It brings job openings, candidate profiles, resume screening, candidate-to-job matching, interview coordination, evaluations, and offer tracking into one place.

The goal is to help recruiting teams move from an open role to an informed hiring decision with less manual resume review and a clearer view of each candidate's progress.

## Who it's for

- Recruiters and talent acquisition teams managing open roles and candidate pipelines.
- Hiring teams reviewing candidate fit, interview feedback, and next steps.
- Developers contributing to the recruiting platform.

The frontend also contains candidate-facing interview, feedback, and offer pages; the product and this guide are organized around the recruiter workflow.

## What the application does

- **Manage jobs:** create, edit, and browse job openings with role requirements and skills.
- **Import job details:** retrieve structured details from a supported job-posting URL.
- **Screen resumes:** upload PDF, DOCX, or TXT resumes and extract candidate contact information, skills, experience, and other available details.
- **Review matches:** compare candidates with a job, see match scores and skill gaps, and record shortlist or other decisions.
- **Track candidates:** review candidate profiles, update hiring stages, and manage the pipeline.
- **Coordinate interviews:** schedule interviews and maintain interview notes and evaluations.
- **Manage offers:** follow offer status and related candidate actions.
- **Secure recruiter workflows:** authenticate users and protect recruiter pages and APIs.

Matching uses sentence-transformer semantic similarity together with experience scoring. Mandatory skills affect the match category, and the application exposes matched and missing skills to help explain the result. Treat AI scores as decision support—not as an automatic hiring decision.

### Resume format support

The parser supports PDF, DOCX, and TXT uploads. It preserves layout clues from PDFs and reads text in DOCX tables, which helps with multi-column resumes. Scanned/image-only PDFs require the external Tesseract OCR executable; install it separately as described below.

## Technology

| Area | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, Tailwind CSS |
| Frontend state and navigation | Redux Toolkit, React Redux, React Router |
| Backend/API | Python, Flask, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS |
| Database | Microsoft SQL Server, accessed through `pyodbc` |
| Matching | Sentence Transformers (`all-MiniLM-L6-v2`), scikit-learn |
| Resume extraction | `pdfplumber`, `python-docx`, `pytesseract`, Pillow |
| Job-page extraction | Requests, BeautifulSoup, Playwright |

## Repository layout

```text
HireAI/
├── README.md
└── HireAI/
    ├── backend/
    │   ├── config/       # Database connection
    │   ├── routes/       # Flask API endpoints
    │   ├── scraper/      # Job-posting extraction
    │   ├── services/     # Matching and application services
    │   ├── tests/        # Backend tests
    │   └── utils/        # Resume parsing, schema, and helpers
    └── frontend/
        └── src/
            ├── components/
            ├── pages/
            ├── store/
            └── utils/
```

## Getting started

### Prerequisites

- Git
- Python 3
- Node.js and npm
- Microsoft SQL Server and a compatible Microsoft ODBC Driver for SQL Server
- Tesseract OCR, if scanned/image-only PDF resumes need to be processed

The matching model is loaded on the first match request. That first run may need internet access to download the model, unless it is already cached.

### 1. Clone the repository

```bash
git clone https://github.com/hireIQ-surgevector/HireAI.git
cd HireAI
```

### 2. Configure the backend

Create and activate a virtual environment from the repository root:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend packages:

```bash
python -m pip install -r HireAI/backend/requirements.txt
python -m pip install requests beautifulsoup4 playwright sentence-transformers scikit-learn numpy torch
python -m playwright install chromium
```

Create `HireAI/backend/.env` with values for your own development database and a private JWT signing key. Do not commit this file:

```dotenv
DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=HireAI;UID=YOUR_DATABASE_USER;PWD=YOUR_DATABASE_PASSWORD;TrustServerCertificate=yes;
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

# Optional: use this when Tesseract is not available on PATH.
# Windows example: TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_CMD=
```

Use a database and credentials authorized for your environment. The application creates or updates its required tables through its schema helper when API routes initialize; a working SQL Server connection and ODBC driver are still required.

If your SQL Server uses Windows/integrated authentication, configure `DB_CONNECTION_STRING` with the authentication options appropriate for your local driver and setup instead of the SQL-authentication example above.

### 3. Configure the frontend

```bash
cd HireAI/frontend
npm install
```

### 4. Run the application

Open two terminals from the repository root.

Terminal 1 — backend:

```bash
cd HireAI/backend
python app.py
```

The Flask development server listens at `http://localhost:5001`.

Terminal 2 — frontend:

```bash
cd HireAI/frontend
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). The frontend currently calls the backend at `http://localhost:5001`.

### OCR setup for scanned PDFs

The Python `pytesseract` package is only a wrapper; the Tesseract executable must also be installed. Install Tesseract for your operating system and either:

1. Add the Tesseract executable to `PATH`, or
2. Set `TESSERACT_CMD` in `HireAI/backend/.env` to the full path to the executable.

Text-based PDFs do not need OCR. If an image-only PDF is uploaded without Tesseract configured, the upload response reports the file-specific error instead of creating an empty candidate.

## Development checks

Run backend tests from the backend directory:

```bash
cd HireAI/backend
python -m unittest discover -s tests -v
```

Run frontend lint and build from the frontend directory:

```bash
npm run lint
npm run build
```

## Contributors

The Git history records contributions under these author names:

- Govardhan
- Harishwar Reddy Jara
- Krishna
- `hireIQ-surgevector`

These are the names recorded in commits; they do not define project roles or represent a complete team roster. Please add or correct contributor details as the team confirms preferred names, profile links, and areas of contribution.

## Contributing

1. Create a feature branch from the current development branch.
2. Keep changes focused and avoid committing credentials, `.env` files, uploaded resumes, or other private data.
3. Run the relevant backend tests, frontend lint, and/or production build.
4. Open a pull request describing the user-facing change and how it was verified.

## Security and candidate data

Candidate resumes and contact information are sensitive personal data. Use only authorized development data, protect database credentials and signing keys, and follow your organization's retention, access-control, and privacy requirements.
