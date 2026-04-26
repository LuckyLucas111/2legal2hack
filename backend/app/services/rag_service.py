import asyncio
import logging
import os
from pathlib import Path

import chromadb
import httpx
from openai import AsyncOpenAI
import pypdf
import docx

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None
_chroma: chromadb.ClientAPI | None = None
_st_model = None
_hf_client: httpx.AsyncClient | None = None

HF_API_URL = f"https://router.huggingface.co/hf-inference/models/sentence-transformers/{settings.embedding_model}/pipeline/feature-extraction"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


def get_openai() -> AsyncOpenAI:
    global _client
    if _client is None:
        http_client = httpx.AsyncClient(verify=False)
        _client = AsyncOpenAI(api_key=settings.openai_api_key, http_client=http_client)
    return _client


def get_chroma() -> chromadb.ClientAPI:
    global _chroma
    if _chroma is None:
        persist_dir = settings.chroma_persist_dir
        os.makedirs(persist_dir, exist_ok=True)
        _chroma = chromadb.PersistentClient(path=persist_dir)
    return _chroma


def collection_name(incident_id: int) -> str:
    return f"incident_{incident_id}"


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


def _get_hf_client() -> httpx.AsyncClient:
    global _hf_client
    if _hf_client is None:
        _hf_client = httpx.AsyncClient(timeout=60.0, verify=False)
    return _hf_client


async def _embed_via_hf_api(texts: list[str]) -> list[list[float]]:
    client = _get_hf_client()
    resp = await client.post(
        HF_API_URL,
        headers={"Authorization": f"Bearer {settings.hf_api_key}"},
        json={"inputs": texts, "options": {"wait_for_model": True}},
    )
    resp.raise_for_status()
    return resp.json()


def get_st_model():
    global _st_model
    if _st_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model: %s", settings.embedding_model)
        _st_model = SentenceTransformer(settings.embedding_model)
        logger.info("Model loaded successfully")
    return _st_model


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if settings.hf_api_key:
        logger.debug("Using HF Inference API for %d texts", len(texts))
        return await _embed_via_hf_api(texts)
    model = get_st_model()
    embeddings = await asyncio.to_thread(model.encode, texts, normalize_embeddings=True)
    return embeddings.tolist()


async def embed_document(incident_id: int, doc_id: int, filename: str, filepath: str, role: str) -> int:
    text = extract_text(filepath)
    if not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = await embed_texts(chunks)

    chroma = get_chroma()
    col = chroma.get_or_create_collection(collection_name(incident_id))

    ids = [f"doc_{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {"doc_id": doc_id, "filename": filename, "role": role, "chunk_idx": i}
        for i in range(len(chunks))
    ]

    col.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

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
    document = (
        f"Task: {task_title}\n"
        f"Auftraggeber: {created_by_role}\n"
        f"Auftrag: {task_description}\n"
        f"Antwort von {responding_role}:\n"
        f"{response_text}"
    )

    chunks = chunk_text(document)
    if not chunks:
        return 0

    embeddings = await embed_texts(chunks)

    chroma = get_chroma()
    col = chroma.get_or_create_collection(collection_name(incident_id))

    ids = [f"task_{task_id}_response_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "task_id": task_id,
            "source_type": "task_response",
            "responding_role": responding_role,
            "created_by_role": created_by_role,
            "task_title": task_title,
            "chunk_idx": i,
        }
        for i in range(len(chunks))
    ]

    col.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    return len(chunks)


async def query_kb(
    incident_id: int, query: str, role: str, n_results: int = 5
) -> dict:
    chroma = get_chroma()
    col_name = collection_name(incident_id)

    try:
        col = chroma.get_collection(col_name)
    except Exception:
        return {
            "response": "No documents have been uploaded for this incident yet. Please upload relevant documents first.",
            "sources": [],
        }

    query_embedding = (await embed_texts([query]))[0]

    results = col.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, col.count()),
    )

    if not results["documents"] or not results["documents"][0]:
        return {
            "response": "No relevant content found in the uploaded documents.",
            "sources": [],
        }

    context_chunks = results["documents"][0]
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    context = "\n\n---\n\n".join(context_chunks)

    role_instructions = {
        "legal": "You are assisting a Legal Counsel. Use precise legal terminology. Reference specific GDPR articles and NIS2 provisions where applicable. Focus on legal obligations, liabilities, and regulatory requirements.",
        "dpo": "You are assisting a Data Protection Officer. Focus on data protection impact, affected data subjects, data categories, and GDPR compliance requirements. Be specific about notification obligations.",
        "itsec": "You are assisting an IT Security specialist. Use technical security terminology. Focus on attack vectors, indicators of compromise, containment measures, and forensic findings.",
        "iso": "You are assisting an Information Security Officer coordinating the incident response. Provide a balanced overview covering technical, legal, and organizational aspects. Suggest next steps.",
        "ciso": "You are assisting the CISO making strategic decisions. Summarize the key facts concisely, highlight business impact, and present decision options with their risk implications.",
        "communications": "You are assisting the Communications team. Focus on messaging, stakeholder communication, and public relations aspects. Suggest appropriate wording for different audiences.",
        "compliance": "You are assisting a Compliance Officer. Focus on regulatory requirements, compliance gaps, documentation completeness, and audit trail considerations.",
        "sysadmin": "You are assisting a System Administrator. Focus on technical details, affected systems, remediation steps, and operational continuity measures.",
    }

    system_prompt = f"""You are a knowledgeable incident response assistant for a GDPR/NIS2 compliance tool.

{role_instructions.get(role, role_instructions["iso"])}

Answer the user's question based ONLY on the provided context from uploaded incident documents. If the context doesn't contain enough information, say so clearly. Always be factual and precise.

Context from incident documents:
{context}"""

    client = get_openai()
    completion = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    sources = []
    seen = set()
    for meta in metadatas:
        fn = meta.get("filename", "unknown")
        if fn not in seen:
            seen.add(fn)
            sources.append({"doc_id": meta.get("doc_id"), "filename": fn})

    return {
        "response": completion.choices[0].message.content,
        "sources": sources,
    }
