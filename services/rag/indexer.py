"""Index a codebase into a local Chroma vector store using SentenceTransformers embeddings."""

import os
import shutil
import subprocess
from typing import Callable, Optional

import chromadb
from sentence_transformers import SentenceTransformer

from config import settings
from .chunker import chunk_file, load_repo_files


class CodebaseIndexer:
    def __init__(
        self,
        persist_dir: str = settings.PERSIST_DIR,
        embed_model: str = settings.DEFAULT_EMBED_MODEL,
    ):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.embed_model_name = embed_model
        self._embedder = None

    @property
    def embedder(self):
        if self._embedder is None:
            self._embedder = SentenceTransformer(self.embed_model_name)
        return self._embedder

    # ------------------------------------------------------------------ #
    # Repo acquisition
    # ------------------------------------------------------------------ #
    def clone_repo(self, github_url: str, dest_dir: str) -> str:
        """Shallow-clone a GitHub repo, replacing any existing copy at dest_dir."""
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir, ignore_errors=True)
        os.makedirs(os.path.dirname(dest_dir) or ".", exist_ok=True)
        result = subprocess.run(
            ["git", "clone", "--depth", "1", github_url, dest_dir],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"git clone failed: {result.stderr.strip()}")
        return dest_dir

    # ------------------------------------------------------------------ #
    # Indexing
    # ------------------------------------------------------------------ #
    def get_or_create_collection(self, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name, metadata={"hnsw:space": "cosine"}
        )

    def index_repo(
        self,
        repo_path: str,
        collection_name: str,
        chunk_size: int = settings.DEFAULT_CHUNK_SIZE,
        overlap: int = settings.DEFAULT_CHUNK_OVERLAP,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ):
        """Chunk + embed every code file under repo_path, storing vectors in Chroma.

        Returns (collection, num_chunks_indexed, num_files_processed).
        """
        collection = self.get_or_create_collection(collection_name)

        # Clear out any previous index for this collection so re-indexing is clean.
        existing = collection.get()
        if existing["ids"]:
            collection.delete(ids=existing["ids"])

        files = list(load_repo_files(repo_path))
        total_files = len(files)
        doc_id = 0

        for idx, (path, content) in enumerate(files):
            rel_path = os.path.relpath(path, repo_path)
            chunks = chunk_file(content, chunk_size, overlap)

            for chunk in chunks:
                try:
                    embedding = self.embedder.encode(chunk["text"]).tolist()
                except Exception:
                    # Skip chunks that fail to embed rather than aborting the run.
                    continue

                collection.add(
                    ids=[f"{collection_name}_doc_{doc_id}"],
                    embeddings=[embedding],
                    documents=[chunk["text"]],
                    metadatas=[
                        {
                            "file": rel_path,
                            "start_line": chunk["start_line"],
                            "end_line": chunk["end_line"],
                        }
                    ],
                )
                doc_id += 1

            if progress_callback:
                progress_callback(idx + 1, total_files, rel_path)

        return collection, doc_id, total_files

    def list_collections(self):
        return [c.name for c in self.client.list_collections()]

    def delete_collection(self, collection_name: str):
        try:
            self.client.delete_collection(collection_name)
        except Exception:
            pass
