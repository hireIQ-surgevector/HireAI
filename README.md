# HireAI

HireAI is a recruiter-first applicant tracking system for managing job openings, candidates, resume screening, interviews, evaluations, and offers. It includes a candidate-facing interview and offer workflow.

## Choose how to run HireAI

| Goal | Start here |
| --- | --- |
| Use the ready-to-run Windows distribution | [Run the application](#run-the-windows-distribution) |
| Develop the application | [Development setup](#development-setup) |
| Build a distributable Docker bundle | [Build an offline distribution](#build-an-offline-distribution) |

## What HireAI does

- Manage job openings, role descriptions, salary and experience ranges, and required skills.
- Upload PDF, DOC, DOCX, or TXT resumes and extract candidate details.
- Review candidate profiles and resumes, and track hiring stages.
- Compare candidates with jobs using semantic similarity, experience, and skill information.
- Schedule interviews, record evaluations, and manage offer status.
- Provide candidate-facing interview, feedback, and offer pages.

Match scores are decision-support information, not automatic hiring decisions. Review the underlying experience and matched or missing skills before making decisions.

## Run the Windows distribution

### Requirements

- Windows with Docker Desktop installed and running, using Linux containers.
- The `HireAI` application folder and the matching `hireai-images-optimized.tar` archive.
- Docker needs enough free disk space for the SQL Server image, database, and application.

### Start

The default Docker stack uses Supabase for the backend and frontend:

```powershell
cd HireAI
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Configure the Supabase connection in
`HireAI/backend_supabase/.env` before starting the stack.

The API is available at [http://localhost:5001](http://localhost:5001).

### Legacy SQL Server environment files

`backend/.env.docker` configures the API’s SQL Server connection and token signing key:

```dotenv
DB_SERVER=sqlserver,1433
DB_NAME=TalentSyncDB
DB_USER=sa
DB_PASSWORD=REPLACE_WITH_THE_SAME_SQL_SERVER_PASSWORD
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
```

`database/sqlserver.env` configures the SQL Server container and database initializer:

```dotenv
ACCEPT_EULA=Y
MSSQL_PID=Developer
MSSQL_SA_PASSWORD=REPLACE_WITH_A_STRONG_SQL_SERVER_PASSWORD
```

The password values in the two files must match. SQL Server requires a strong password that meets its complexity rules. These files contain secrets, are excluded from source control, and must be configured separately on every machine.

### Resume and database storage

- SQL Server data is stored in the Docker named volume `sqlserver_data`.
- Uploaded resumes are stored in `HireAI/backend/uploads` on the host and mounted into the API container. Stored PDF names use the candidate name, upload date, and job ID (for example, `Jane_Doe_2026-10-21_Job-12.pdf`); a numeric suffix is added if that name already exists.
- Database backups and resume files are separate. When moving an existing installation, securely transfer both the SQL Server database and the corresponding upload folder. The database stores resume filenames, not the resume contents.
- Resumes and candidate contact details are sensitive personal data. Limit access, store backups securely, and follow your organization’s retention policy.

### Useful Docker commands

Run these from the repository root:

```powershell
docker compose -f HireAI/compose.yaml ps
docker compose -f HireAI/compose.yaml logs -f backend
docker compose -f HireAI/compose.yaml logs -f sqlserver
docker compose -f HireAI/compose.yaml down
```

`down` stops and removes the containers but keeps the SQL Server named volume and uploaded resumes. Do not remove volumes unless you intend to delete the local database.

## Development setup

### Prerequisites

- Git
- Python 3.12
- Node.js and npm (use the version supported by the installed Vite release)
- Microsoft SQL Server and the matching Microsoft ODBC Driver. For Docker SQL Server, also install Docker Desktop.
- LibreOffice for converting DOC/DOCX resumes to PDF when running the API outside Docker.
- Tesseract OCR for scanned/image-only PDF resumes when running the API outside Docker.

Docker is the simplest way to start the complete stack. The commands below are for developing the frontend and API with hot reload; they require a reachable SQL Server.

### 1. Get the project

```powershell
git clone https://github.com/hireIQ-surgevector/HireAI.git
cd HireAI
```

The application lives in the nested `HireAI` folder.

### 2. Configure the API

Create and activate a Python virtual environment from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend runtime packages and the CPU-only PyTorch build:

```powershell
python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu -r HireAI/backend/requirements-runtime.txt
python -m playwright install chromium
```

Create `HireAI/backend/.env` with settings for your own SQL Server and a private signing key:

```dotenv
DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=TalentSyncDB;UID=YOUR_DATABASE_USER;PWD=YOUR_DATABASE_PASSWORD;TrustServerCertificate=yes;
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
TESSERACT_CMD=
```

For SQL Server Express, replace `SERVER=localhost` with your authorized server and instance name. The ODBC driver name in the connection string must match the driver installed on your machine. If Tesseract is not on `PATH`, set `TESSERACT_CMD` to its full executable path. DOC/DOCX conversion requires LibreOffice to be installed and available as `soffice`.

Run the API from its directory:

```powershell
cd HireAI/backend
python app.py
```

The development API listens on [http://localhost:5001](http://localhost:5001). Keep this terminal open.

### 3. Start the frontend

In a second terminal, from the repository root:

```powershell
cd HireAI/frontend
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal (usually [http://localhost:5173](http://localhost:5173)). The development frontend calls the API at `http://localhost:5001`.

### 4. Sign in

Use an account configured for your environment. Never add real production credentials, database passwords, JWT signing keys, resumes, or other candidate data to source control. If you do not have a development account, ask the project maintainer to provision one.

## Typical recruiter workflow

1. **Create a job** with a clear description, experience and salary ranges, and mandatory/required skills.
2. **Upload resumes** from the Candidates area. Select a job first. Supported formats are PDF, DOC, DOCX, and TXT. Check the per-file results after upload. A candidate name must be readable near the top of the resume; if extraction misses it, correct the resume or use a descriptive filename such as `Jane_Doe.pdf`.
3. **Review candidate profiles** and open resumes from candidate details. Keep the `backend/uploads` folder intact so stored resume links continue to work.
4. **Compare candidates** to a job in Candidate Matcher. Review the score and skill details; matching loads its model on first use and may need internet access.
5. **Schedule interviews** and record evaluations after the interview.
6. **Manage offers** after the hiring decision, and update status as the candidate responds.

The sidebar’s **How to use HireIQ** tour is available after signing in. The tour is tailored to the user's role; it can be opened again at any time.

## Resume processing notes

- Text-based PDFs do not require OCR. Scanned PDFs need Tesseract.
- DOC and DOCX files are converted to PDF using LibreOffice before parsing.
- Name extraction may not recognize every resume layout. Review upload failures and correct the source file rather than creating records with missing names.
- The Docker backend includes Tesseract, LibreOffice, Chromium, and the Microsoft SQL Server ODBC driver.

## Development checks

Run the backend tests from the repository root:

```powershell
cd HireAI/backend
python -m unittest discover -s tests -v
```

Run frontend lint and a production build:

```powershell
cd HireAI/frontend
npm run lint
npm run build
```

Run the Docker configuration check from the repository root:

```powershell
docker compose -f HireAI/compose.yaml config --quiet
```

## Build an offline distribution

Run these commands from the repository root on a machine with Docker Desktop and internet access:

```powershell
docker compose -f HireAI/compose.yaml build
docker compose -f HireAI/compose.yaml pull sqlserver
docker save -o HireAI/hireai-images-optimized.tar hireai-backend:1.0 hireai-frontend:1.0 mcr.microsoft.com/mssql/server:2022-latest
```

Distribute the `HireAI` application folder and `HireAI/hireai-images-optimized.tar` together. Provide the receiving machine with its own configured environment files. On Windows, `Run_HireAI.bat` loads the archive and starts the services without rebuilding.

The archive contains the backend, frontend, and SQL Server images. It does not contain the SQL Server data volume, uploaded resumes, environment files, or downloaded matching model. Transfer and protect data separately when needed. Rebuild the archive after changing application code or Docker configuration; ensure the archive contains all image tags referenced by Compose.

## Project layout

```text
HireAI/
├── README.md
└── HireAI/
    ├── compose.yaml
    ├── Run_HireAI.bat
    ├── backend/
    │   ├── app.py
    │   ├── routes/          # API endpoints
    │   ├── services/        # Matching and application services
    │   ├── scraper/         # Job-page extraction
    │   ├── utils/           # Resume parsing, schema, and helpers
    │   ├── tests/           # Backend tests
    │   └── uploads/resumes/ # Local resume storage (sensitive; not source controlled)
    ├── database/
    │   └── init/            # Database and schema initialization
    └── frontend/
        └── src/
            ├── components/
            ├── pages/
            ├── store/
            └── utils/
```

## Contributing

1. Create a feature branch.
2. Keep changes focused and do not commit environment files, credentials, image archives, database backups, or candidate data.
3. Add or update tests for behavior changes.
4. Run the relevant backend tests, frontend lint/build, and Docker configuration check.
5. Open a pull request describing the change, tests run, and any setup or migration impact.

## Candidate data and security

Candidate resumes and contact information are sensitive personal data. Use authorized development data, restrict access to the database and upload folder, protect secrets, and follow applicable privacy and retention requirements. Treat match scores only as decision support.
