# HireAI Application Setup Guide

## 1. Prerequisites

Before starting the project setup, make sure the following software is installed on your system:

* Git
* Python
* Node.js and npm
* SQL Server
* Visual Studio Code (recommended)

---

# 2. Clone the Repository

Do **not** directly download the project files from the GitHub link.

First, install Git on your system.

After installing Git:

1. Open the GitHub repository.
2. Click the **Code** button.
3. Copy the repository URL.
4. Create or navigate to an empty folder where you want to store the project.
5. Open a terminal in that folder.
6. Clone the repository using:

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the URL copied from GitHub.

---

# 3. Create Your GitHub Profile

Before making any changes to the project:

1. Create your own GitHub profile.
2. Use your organization email address while creating the GitHub account.
3. Configure your Git environment using the following commands:

```bash
git config --global user.name "Your Name"
```

```bash
git config --global user.email "Your GitHub Email"
```

Replace:

* `Your Name` with your name.
* `Your GitHub Email` with the email address used for your GitHub account.

---

# 4. Create a Python Virtual Environment

After cloning the repository, navigate to the first `HireAI` folder.

Create a virtual environment using:

```bash
python -m venv venv
```

---

# 5. Activate the Virtual Environment

After creating the virtual environment, activate it.

When the environment is activated, you should see the virtual environment name at the beginning of the terminal path.

For PowerShell, the command can be similar to:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then activate the environment:

```powershell
& "C:\Users\<YourUsername>\<ProjectPath>\HireAI\venv\Scripts\Activate.ps1"
```

The folder path should be changed according to your system and project location.

Once activated, the terminal should display something similar to:

```text
(venv)
```

or

```text
(.venv)
```

at the beginning of the terminal path.

---

# 6. Install Required Python Packages

After activating the virtual environment, install the required Python packages using:

```bash
pip install bcrypt beautifulsoup4 blinker certifi cffi charset-normalizer click \
colorama cryptography Flask Flask-Bcrypt Flask-Cors Flask-JWT-Extended \
greenlet idna itsdangerous Jinja2 lxml MarkupSafe pdfminer.six pdfplumber \
pillow playwright pycparser pyee PyJWT pyodbc pypdfium2 python-docx \
python-dotenv requests soupsieve typing_extensions urllib3 Werkzeug
```


---

# 7. Install Frontend Dependencies

Navigate to the frontend folder:

```bash
cd .\HireAI\frontend
```

Install the required Node.js packages:

```bash
npm i
```

Wait until all frontend dependencies are installed successfully.

---

# 8. Create Required Terminals

Once all installations are complete:

1. Create two additional CMD/terminal windows using the **+ button** in the VS Code terminal section.
2. Use one terminal for running the backend.
3. Keep another terminal available for installing additional packages or running project-level commands.

Navigate to the backend folder in the backend terminal:

```bash
cd .\HireAI\backend
```

---

# 9. Configure the Environment File

Inside the backend folder, create a new file named:

```text
.env
```

Add the following configuration:

```env
DB_SERVER=AIPLLTH441\SQLEXPRESS_2019

DB_NAME=TalentSyncDB

DB_USER=sa

DB_PASSWORD=sa@12345

DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=AIPLLTH441\SQLEXPRESS_2019;DATABASE=TalentSyncDB;UID=sa;PWD=sa@12345;Encrypt=no;TrustServerCertificate=yes;Connection Timeout=30;

JWT_SECRET=talentsync_secret_key_2024
```

## Important

The database connection details may be different on your system.

To obtain your SQL Server connection details:

1. Open SQL Server Management Studio.
2. Go to **File**.
3. Select **Connect Object Explorer**.
4. Navigate to the connection string option and copy the connection details.

You can then use ChatGPT to modify the `.env` configuration based on your SQL Server connection.

Provide the connection details and ask for the `.env` file values to be updated according to your SQL Server configuration.

---

# 10. Restore the TalentSync Database

Download the following database backup file from the group:

```text
TalentSyncDB.bak
```

## Restore Process

Before restoring the database:

1. Open SQL Server Management Studio.
2. Check whether a database named `TalentSyncDB` already exists.
3. If it exists and is no longer required, delete the existing database.

To restore the database:

1. Right-click on **Databases** in SQL Server Management Studio.
2. Select **Restore Database**.
3. Select the **Device** option.
4. Browse for the downloaded `.bak` file.

The file will usually be located at:

```text
C:\Users\<YourUsername>\Downloads
```

Select the `TalentSyncDB.bak` file and restore the database.

After restoration, the required tables and data should be available for the application.

---

# 11. Git Branching Guidelines

Do not commit changes directly to the main branch.

Whenever you make changes to the project, first create your own branch.

Use the following command:

```bash
git checkout -b your_name
```

Replace `your_name` with your name.

For example:

```bash
git checkout -b john
```

After creating your branch:

1. Make the required changes.
2. Open the **Source Control** section in Visual Studio Code.
3. Review your changes.
4. Commit the changes.
5. Make sure that your commits are pushed only to your own branch.

---

# 12. Important Guidelines

* Do not download project files directly from GitHub.
* Always clone the repository using Git.
* Create and configure your own GitHub profile before making changes.
* Use your organization email for your GitHub account.
* Configure your Git username and email.
* Create and activate a Python virtual environment before installing Python packages.
* Install all required Python and frontend dependencies.
* Configure the `.env` file according to your local SQL Server configuration.
* Restore the `TalentSyncDB` database using the provided `.bak` file.
* Do not commit changes directly to the main branch.
* Always create and work on your own branch.
* Commit and push only to your assigned branch.
