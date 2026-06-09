import re
from dataclasses import dataclass
from pathlib import Path

@dataclass
class Chunk:
    text: str
    paragraph: str
    title: str
    page: int

PARAGRAPH_RE = re.compile(r'(§\s*\d+[a-z]?|Art\.\s*\d+|Rozdział\s+\w+|Artykuł\s+\d+)', re.IGNORECASE)

def _split_into_chunks(text: str, page: int) -> list[Chunk]:
    parts = PARAGRAPH_RE.split(text)
    chunks: list[Chunk] = []
    current_para = '—'
    current_title = ''

    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        if PARAGRAPH_RE.match(part):
            current_para = part.strip()
            current_title = parts[i + 1].strip()[:60] if i + 1 < len(parts) else ''
        else:
            if len(part) > 50:
                chunks.append(Chunk(text=part, paragraph=current_para, title=current_title, page=page))

    if not chunks and len(text.strip()) > 50:
        chunks.append(Chunk(text=text.strip(), paragraph='—', title='', page=page))

    return chunks

def process_pdf(path: Path) -> list[Chunk]:
    import fitz
    chunks: list[Chunk] = []
    doc = fitz.open(str(path))
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if not text.strip():
            text = _ocr_page(page)
        chunks.extend(_split_into_chunks(text, page_num))
    doc.close()
    return chunks

def process_docx(path: Path) -> list[Chunk]:
    from docx import Document
    doc = Document(str(path))
    full_text = '\n'.join(p.text for p in doc.paragraphs)
    return _split_into_chunks(full_text, page=1)

def _ocr_page(page) -> str:
    try:
        import pytesseract
        from PIL import Image
        import io
        pix = page.get_pixmap(dpi=200)
        img = Image.open(io.BytesIO(pix.tobytes('png')))
        return pytesseract.image_to_string(img, lang='pol')
    except Exception:
        return ''

def process_document(path: Path, file_type: str) -> list[Chunk]:
    if file_type == 'pdf':
        return process_pdf(path)
    elif file_type == 'docx':
        return process_docx(path)
    raise ValueError(f'Nieobsługiwany typ pliku: {file_type}')
