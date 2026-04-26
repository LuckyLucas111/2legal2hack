import asyncio
import logging
from pathlib import Path

import pypdf
import docx

from app.config import settings
from app.services.mock_responses import MOCK_RESPONSES

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


def extract_text(filepath: str) -> str:
    path = Path(filepath)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        reader = pypdf.PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if suffix == ".docx":
        doc = docx.Document(str(path))
        return "\n".join(p.text for p in doc.paragraphs)

    if suffix in (".txt", ".md", ".csv", ".log"):
        return path.read_text(encoding="utf-8", errors="replace")

    return path.read_text(encoding="utf-8", errors="replace")


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


async def embed_document(incident_id: int, doc_id: int, filename: str, filepath: str, role: str) -> int:
    text = extract_text(filepath)
    if not text.strip():
        return 0
    chunks = chunk_text(text)
    return len(chunks)


async def embed_task_response(
    incident_id: int,
    task_id: int,
    task_title: str,
    task_description: str,
    response_text: str,
    responding_role: str,
    created_by_role: str,
) -> int:
    return 1


async def query_kb(
    incident_id: int, query: str, role: str, n_results: int = 5
) -> dict:
    await asyncio.sleep(1.5)

    return {
        "response": MOCK_RESPONSES["kb_chat"],
        "sources": [],
    }
