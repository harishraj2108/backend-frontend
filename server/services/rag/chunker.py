"""Walk a repository and split source files into overlapping, embeddable chunks."""

import os
from typing import Iterator, Optional

from config import settings


def _is_code_file(filename: str, extensions: set) -> bool:
    if filename in extensions:  # e.g. "Dockerfile", "Makefile"
        return True
    ext = os.path.splitext(filename)[1].lower()
    return ext in extensions


def load_repo_files(
    repo_path: str,
    extensions: Optional[set] = None,
    max_file_size: int = settings.MAX_FILE_SIZE_BYTES,
    ignore_dirs: Optional[set] = None,
) -> Iterator[tuple]:
    """Yield (absolute_path, content) for every text/code file under repo_path."""
    extensions = extensions or settings.CODE_EXTENSIONS
    ignore_dirs = ignore_dirs or settings.IGNORE_DIRS

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith(".")]
        for fname in files:
            if not _is_code_file(fname, extensions):
                continue
            path = os.path.join(root, fname)
            try:
                if os.path.getsize(path) > max_file_size:
                    continue
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except (OSError, UnicodeDecodeError):
                continue
            if not content.strip():
                continue
            yield path, content


def chunk_file(
    content: str,
    chunk_size: int = settings.DEFAULT_CHUNK_SIZE,
    overlap: int = settings.DEFAULT_CHUNK_OVERLAP,
) -> list:
    """Split file content into overlapping chunks of `chunk_size` lines.

    Returns a list of dicts: {"text": str, "start_line": int, "end_line": int}
    """
    lines = content.splitlines()
    if not lines:
        return []

    step = max(chunk_size - overlap, 1)
    chunks = []
    i = 0
    while i < len(lines):
        window = lines[i : i + chunk_size]
        text = "\n".join(window)
        if text.strip():
            chunks.append(
                {
                    "text": text,
                    "start_line": i + 1,
                    "end_line": i + len(window),
                }
            )
        if i + chunk_size >= len(lines):
            break
        i += step
    return chunks
