import os
import re

import pdfplumber
import pytesseract
from docx import Document
from docx.table import Table

from .resume_skills import clean_text, preserve_text_lines


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

