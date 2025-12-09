from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
import os
from pathlib import Path
from pydantic import BaseModel
import docx

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
STORAGE_DIR = BASE_DIR / "file_storage"

class DiaryContent(BaseModel):
    filename: str
    content: str
    format: str = "md" # md or docx

@router.get("/list")
async def get_diary_list():
    if not STORAGE_DIR.exists():
        return []
    
    files = []
    for f in STORAGE_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in {'.md', '.docx', '.txt'}:
            files.append(f.name)
    return files

@router.get("/content/{filename}")
async def get_diary_content(filename: str):
    file_path = STORAGE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = file_path.suffix.lower()
    
    if ext == ".docx":
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return {"content": "\n".join(full_text), "format": "docx"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading docx: {str(e)}")
    else:
        # Assume text/md
        try:
            content = file_path.read_text(encoding="utf-8")
            return {"content": content, "format": ext.lstrip(".")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.post("/save")
async def save_diary(diary: DiaryContent):
    if not STORAGE_DIR.exists():
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        
    filename = diary.filename
    # Ensure extension matches format
    if not filename.lower().endswith(f".{diary.format}"):
        filename += f".{diary.format}"
        
    file_path = STORAGE_DIR / filename
    
    if diary.format == "docx":
        try:
            doc = docx.Document()
            # Simple splitting by newlines for paragraphs
            for line in diary.content.split("\n"):
                doc.add_paragraph(line)
            doc.save(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving docx: {str(e)}")
    else:
        try:
            file_path.write_text(diary.content, encoding="utf-8")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
            
    return {"status": "success", "filename": filename}
