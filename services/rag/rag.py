"""Retrieval-augmented Q&A over an indexed codebase using Groq API."""

from typing import Optional
from groq import Groq
from sentence_transformers import SentenceTransformer

from config import settings

SYSTEM_PROMPT = """You are a senior software architect helping a developer understand an \
unfamiliar codebase. Answer questions using ONLY the provided code context.

Guidelines:
- Reference specific files and line numbers when you make a claim (e.g. "in app.py:42-60").
- Explain architecture, data flow, and design decisions, not just what a snippet does.
- If the provided context is insufficient to answer confidently, say so plainly and \
suggest what part of the codebase to look at next instead of guessing.
- Be precise and technical. Prefer structured explanations (short paragraphs or bullet \
points) over long unbroken prose.
"""


class CodebaseQA:
    def __init__(
        self,
        chroma_client,
        collection_name: str,
        embed_model: str = settings.DEFAULT_EMBED_MODEL,
        chat_model: str = settings.DEFAULT_CHAT_MODEL,
        api_key: Optional[str] = None,
    ):
        self.client = chroma_client
        self.collection_name = collection_name
        
        # Smart Collection Match: Find best collection with documents
        target_col = None
        try:
            col = chroma_client.get_collection(collection_name)
            if col.count() > 0:
                target_col = col
        except Exception:
            pass

        if target_col is None:
            # Search among all collections for partial string match or any collection with documents
            all_cols = chroma_client.list_collections()
            for c in all_cols:
                if (collection_name in c.name or c.name in collection_name) and c.count() > 0:
                    target_col = c
                    break
            # Fallback to any non-empty collection if only 1 exists
            if target_col is None:
                non_empty = [c for c in all_cols if c.count() > 0]
                if len(non_empty) == 1:
                    target_col = non_empty[0]

        if target_col is None:
            target_col = chroma_client.get_or_create_collection(
                name=collection_name, metadata={"hnsw:space": "cosine"}
            )
            
        self.collection = target_col
        self.embed_model_name = embed_model
        self.chat_model = chat_model
        self._embedder = None
        
        # Initialize Groq client
        groq_api_key = api_key or settings.GROQ_API_KEY
        self.groq_client = Groq(api_key=groq_api_key)

    @property
    def embedder(self):
        if self._embedder is None:
            self._embedder = SentenceTransformer(self.embed_model_name)
        return self._embedder

    def retrieve(self, question: str, n_results: int = settings.DEFAULT_N_RESULTS) -> list:
        q_embedding = self.embedder.encode(question).tolist()

        count = self.collection.count()
        if count == 0:
            return []
        n_results = min(n_results, count)

        results = self.collection.query(query_embeddings=[q_embedding], n_results=n_results)

        chunks = []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        for doc, meta, dist in zip(docs, metas, dists):
            chunks.append(
                {
                    "text": doc,
                    "file": meta.get("file", "unknown"),
                    "start_line": meta.get("start_line"),
                    "end_line": meta.get("end_line"),
                    "score": round(1 - dist, 4),
                }
            )
        return chunks

    @staticmethod
    def build_context(chunks: list) -> str:
        parts = []
        for c in chunks:
            header = f"### {c['file']} (lines {c['start_line']}-{c['end_line']})"
            parts.append(f"{header}\n```\n{c['text']}\n```")
        return "\n\n".join(parts)

    def ask(self, question: str, n_results: int = settings.DEFAULT_N_RESULTS,
             history: Optional[list] = None):
        """Retrieve relevant chunks and stream a Groq chat completion.

        Returns (stream_iterator, retrieved_chunks). Iterate the stream for
        incremental response text; each item yields tokens via delta.content or dict format.
        """
        chunks = self.retrieve(question, n_results)
        context = self.build_context(chunks) if chunks else "(no relevant code found)"

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history)

        user_msg = f"Codebase context:\n\n{context}\n\nQuestion: {question}"
        messages.append({"role": "user", "content": user_msg})

        completion_stream = self.groq_client.chat.completions.create(
            model=self.chat_model,
            messages=messages,
            stream=True
        )

        def stream_generator():
            for chunk in completion_stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    yield {"message": {"content": token}}

        return stream_generator(), chunks
