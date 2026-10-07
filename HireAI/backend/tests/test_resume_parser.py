import io
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytesseract
from flask import Flask
from docx import Document

from routes.candidates import candidates
from utils.resume_parser import (
    extract_name,
    extract_text_from_docx,
    extract_text_from_pdf,
)


class FakeCursor:
    def __init__(self):
        self.executed = []
        self.results = iter([(1, "Data Engineer"), ("Python", "SQL")])
        self.parameters = []

    def execute(self, query, parameters=None):
        self.executed.append(query)
        self.parameters.append(parameters)

    def fetchone(self):
        return next(self.results)


class FakeConnection:
    def __init__(self):
        self.fake_cursor = FakeCursor()

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        pass

    def close(self):
        pass


class ResumeTextExtractionTests(unittest.TestCase):
    def _mock_pdf(self, page):
        pdf = MagicMock()
        pdf.__enter__.return_value.pages = [page]
        return pdf

    @patch("utils.resume_parser.pdfplumber.open")
    def test_pdf_extraction_preserves_columns(self, open_pdf):
        layout = (
            "Jane Example\n"
            "Experience                              Skills\n"
            "Senior Data Engineer                    Python SQL Airflow"
        )
        page = MagicMock()
        page.extract_text.return_value = layout
        page.images = []
        open_pdf.return_value = self._mock_pdf(page)

        text = extract_text_from_pdf("two-column.pdf")

        self.assertEqual(
            text,
            "Jane Example\nExperience | Skills\n"
            "Senior Data Engineer | Python SQL Airflow",
        )
        self.assertEqual(extract_name(text), "Jane Example")
        page.extract_text.assert_called_once_with(layout=True)
        page.to_image.assert_not_called()

    @patch("utils.resume_parser.pytesseract.image_to_string")
    @patch("utils.resume_parser.pdfplumber.open")
    def test_image_only_pdf_uses_ocr(self, open_pdf, image_to_string):
        page = MagicMock()
        page.extract_text.return_value = None
        page.images = [{"name": "scanned-page"}]
        page.to_image.return_value = SimpleNamespace(original=object())
        open_pdf.return_value = self._mock_pdf(page)
        image_to_string.return_value = "Morgan Lee morgan@example.com"

        text = extract_text_from_pdf("scanned.pdf")

        self.assertEqual(text, "Morgan Lee morgan@example.com")
        page.to_image.assert_called_once_with(resolution=300)
        image_to_string.assert_called_once_with(page.to_image.return_value.original)

    @patch("utils.resume_parser.pytesseract.image_to_string")
    @patch("utils.resume_parser.pdfplumber.open")
    def test_sparse_text_on_image_page_is_supplemented_with_ocr(
        self, open_pdf, image_to_string
    ):
        page = MagicMock()
        page.extract_text.return_value = "Morgan Lee"
        page.images = [{"name": "resume-image"}]
        page.to_image.return_value = SimpleNamespace(original=object())
        open_pdf.return_value = self._mock_pdf(page)
        image_to_string.return_value = "Morgan Lee Experience Python SQL"

        text = extract_text_from_pdf("photo-resume.pdf")

        self.assertIn("Morgan Lee", text)
        self.assertIn("Experience Python SQL", text)
        image_to_string.assert_called_once_with(page.to_image.return_value.original)

    @patch("utils.resume_parser.pytesseract.image_to_string")
    @patch("utils.resume_parser.pdfplumber.open")
    def test_image_only_pdf_explains_missing_tesseract(
        self, open_pdf, image_to_string
    ):
        page = MagicMock()
        page.extract_text.return_value = None
        page.images = [{"name": "scanned-page"}]
        open_pdf.return_value = self._mock_pdf(page)
        image_to_string.side_effect = pytesseract.TesseractNotFoundError()

        with self.assertRaisesRegex(RuntimeError, "Install Tesseract OCR"):
            extract_text_from_pdf("scanned.pdf")

    def test_docx_extraction_includes_table_columns(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "two-column.docx"
            document = Document()
            document.add_paragraph("Morgan Lee")
            table = document.add_table(rows=1, cols=2)
            table.cell(0, 0).text = "Experience"
            table.cell(0, 1).text = "Python SQL"
            document.save(path)

            text = extract_text_from_docx(str(path))

        self.assertIn("Morgan Lee", text)
        self.assertIn("Experience | Python SQL", text)

    @patch("routes.candidates.parse_resume")
    @patch("routes.candidates.get_connection")
    @patch("routes.candidates.ensure_schema")
    def test_failed_parse_is_not_inserted_as_a_candidate(
        self, ensure_schema, get_connection, parse_resume
    ):
        connection = FakeConnection()
        get_connection.return_value = connection
        parse_resume.return_value = {
            "status": "failed",
            "error": "OCR is not configured",
        }
        app = Flask(__name__)
        app.register_blueprint(candidates)

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("routes.candidates.os.getcwd", return_value=temp_dir):
                response = app.test_client().post(
                    "/api/candidates/upload",
                    data={
                        "job_id": "1",
                        "resumes": (io.BytesIO(b"resume"), "scanned.pdf"),
                    },
                    content_type="multipart/form-data",
                )

        self.assertEqual(response.status_code, 201)
        result = response.get_json()
        self.assertEqual(result["created_count"], 0)
        self.assertEqual(result["failed"][0]["fileName"], "scanned.pdf")
        ensure_schema.assert_called_once()
        self.assertEqual(len(connection.fake_cursor.executed), 2)
        self.assertFalse(
            any(
                "INSERT INTO dbo.Candidates" in query
                for query in connection.fake_cursor.executed
            )
        )


if __name__ == "__main__":
    unittest.main()
