import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from groq import Groq

from config import settings
from services.rag import CodebaseIndexer, CodebaseQA
from auth.routes import get_current_user
from services.chat_db_service import create_chat_session, add_chat_message

router = APIRouter(prefix="/api/rag", tags=["rag"])

# Lazy indexer instance
_indexer = None
def get_indexer():
    global _indexer
    if _indexer is None:
        _indexer = CodebaseIndexer(persist_dir=settings.PERSIST_DIR)
    return _indexer

# ----------------------------------------------------
# Request Schemas
# ----------------------------------------------------
class IndexRepoRequest(BaseModel):
    repo_url: Optional[str] = None
    url: Optional[str] = None
    github_url: Optional[str] = None

class QueryRAGRequest(BaseModel):
    repo_name: Optional[str] = None
    question: Optional[str] = None
    message: Optional[str] = None
    image_base64: Optional[str] = None
    n_results: Optional[int] = 6
    session_id: Optional[str] = None

def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9_-]+", "_", text.strip())
    return text.strip("_").lower() or "repo"

# ----------------------------------------------------
# RAG Endpoints
# ----------------------------------------------------
@router.post("/index")
def index_github_repo(request: IndexRepoRequest):
    """Index a public GitHub repository locally."""
    try:
        raw_url = request.repo_url or request.url or request.github_url or ""
        repo_url = raw_url.strip()
        if not repo_url:
            raise HTTPException(status_code=400, detail="Missing repository URL. Pass 'repo_url' in JSON body.")
            
        repo_name = slugify(repo_url.split("/")[-1].replace(".git", ""))
        dest_dir = os.path.join(settings.REPOS_DIR, repo_name)
        
        idx = get_indexer()
        idx.clone_repo(repo_url, dest_dir)
        
        collection, num_chunks, num_files = idx.index_repo(
            repo_path=dest_dir,
            collection_name=repo_name,
            chunk_size=settings.DEFAULT_CHUNK_SIZE,
            overlap=settings.DEFAULT_CHUNK_OVERLAP
        )
        
        return {
            "success": True,
            "message": f"Successfully indexed repository: {repo_name}",
            "repo_name": repo_name,
            "num_files": num_files,
            "num_chunks": num_chunks
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Indexing failed: {str(e)}")

@router.get("/repos")
def list_indexed_repos():
    """List all indexed repositories in Chroma DB."""
    try:
        repos = get_indexer().list_collections()
        return {"success": True, "repositories": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list repositories: {str(e)}")

@router.post("/query")
def query_codebase_rag(request: QueryRAGRequest, user: dict = Depends(get_current_user)):
    """Multimodal Q&A query over an indexed codebase using Groq API."""
    try:
        user_id = user.get("google_id") or user.get("sub")
        
        query_text = (request.question or request.message or "").strip()
        if not query_text:
            raise HTTPException(status_code=400, detail="Question is required. Pass 'question' or 'message' field.")

        target_repo = request.repo_name or ""
        if not target_repo:
            avail_repos = get_indexer().list_collections()
            if avail_repos:
                target_repo = avail_repos[0]
            else:
                raise HTTPException(status_code=400, detail="No indexed repositories found. Please index a repository first using /api/rag/index.")
                
        repo_name = slugify(target_repo)
        
        session_id = request.session_id
        if not session_id:
            session_id = create_chat_session(user_id=user_id, chat_type="repo", repo_name=repo_name)
            
        # Log user message to database
        add_chat_message(session_id=session_id, role="user", text=query_text, user_id=user_id, chat_type="repo")
        
        if not settings.GROQ_API_KEY:
            raise HTTPException(status_code=400, detail="GROQ_API_KEY is missing in .env")
            
        qa = CodebaseQA(
            chroma_client=get_indexer().client,
            collection_name=repo_name,
            api_key=settings.GROQ_API_KEY
        )
        
        chunks = qa.retrieve(query_text, n_results=request.n_results or 6)
        context = qa.build_context(chunks) if chunks else "(no relevant code found)"
        
        if request.image_base64:
            groq_client = Groq(api_key=settings.GROQ_API_KEY)
            image_data = request.image_base64
            if not image_data.startswith("data:image"):
                image_data = f"data:image/png;base64,{image_data}"
                
            messages = [
                {"role": "system", "content": "You are a senior software architect analyzing screenshots alongside relevant code context."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Codebase Context:\n\n{context}\n\nQuestion: {query_text}"},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                }
            ]
            
            response = groq_client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=messages
            )
            answer_text = response.choices[0].message.content
        else:
            stream_gen, _ = qa.ask(question=query_text, n_results=request.n_results or 6)
            answer_text = "".join([chunk["message"]["content"] for chunk in stream_gen])
            
        # Log bot response to database
        add_chat_message(session_id=session_id, role="bot", text=answer_text, user_id=user_id, chat_type="repo")
            
        return {
            "success": True,
            "repo_name": repo_name,
            "session_id": session_id,
            "answer": answer_text,
            "sources": chunks
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"RAG Query error: {str(e)}")
