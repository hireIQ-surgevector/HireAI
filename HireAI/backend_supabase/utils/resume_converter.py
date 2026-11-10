import os
import shutil
import subprocess
import tempfile
from pathlib import Path


SUPPORTED_RESUME_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}
CONVERSION_TIMEOUT_SECONDS = 120


def _find_libreoffice():
    configured_path = os.environ.get("LIBREOFFICE_PATH")
    if configured_path:
        if os.path.isfile(configured_path):
            return configured_path
        executable = shutil.which(configured_path)
        if executable:
            return executable
        raise RuntimeError(
            "LIBREOFFICE_PATH is set but does not point to a LibreOffice "
            "executable."
        )

    executable = shutil.which("soffice") or shutil.which("libreoffice")
    if executable:
        return executable

    if os.name == "nt":
        program_directories = (
            os.environ.get("PROGRAMFILES"),
            os.environ.get("PROGRAMFILES(X86)"),
        )
        for directory in program_directories:
            if directory:
                candidate = os.path.join(
                    directory, "LibreOffice", "program", "soffice.exe"
                )
                if os.path.isfile(candidate):
                    return candidate

    raise RuntimeError(
        "LibreOffice is required to convert non-PDF resumes. Install "
        "LibreOffice or set LIBREOFFICE_PATH to its soffice executable."
    )


def convert_resume_to_pdf(source_path, output_directory=None):
    """Convert a supported non-PDF resume to PDF using headless LibreOffice."""
    extension = os.path.splitext(source_path)[1].lower()
    if extension not in SUPPORTED_RESUME_EXTENSIONS:
        raise ValueError(f"Unsupported resume file type: {extension or 'unknown'}")
    if extension == ".pdf":
        return source_path

    output_directory = os.path.abspath(
        output_directory or os.path.dirname(source_path)
    )
    os.makedirs(output_directory, exist_ok=True)
    output_path = os.path.join(
        output_directory, f"{os.path.splitext(os.path.basename(source_path))[0]}.pdf"
    )

    executable = _find_libreoffice()
    try:
        with tempfile.TemporaryDirectory(prefix="hireai-libreoffice-profile-") as profile:
            subprocess.run(
                [
                    executable,
                    "--headless",
                    f"-env:UserInstallation={Path(profile).as_uri()}",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    output_directory,
                    source_path,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=CONVERSION_TIMEOUT_SECONDS,
            )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(
            f"Resume conversion timed out after "
            f"{CONVERSION_TIMEOUT_SECONDS} seconds."
        ) from error
    except subprocess.CalledProcessError as error:
        details = (error.stderr or error.stdout or "").strip()
        message = f"LibreOffice could not convert the resume to PDF."
        if details:
            message = f"{message} {details}"
        raise RuntimeError(message) from error
    except OSError as error:
        raise RuntimeError(
            "Unable to start LibreOffice for resume conversion. Check "
            "LIBREOFFICE_PATH and the backend host's LibreOffice installation."
        ) from error

    if not os.path.isfile(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError("LibreOffice did not produce a valid PDF.")

    return output_path
