from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pathlib import Path

router = APIRouter()

# Determine the server root directory
# server/ALT_pure/core/api/music_api.py -> server/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MUSIC_DIR = BASE_DIR / "music"

@router.get("/list")
async def get_music_list():
    if not MUSIC_DIR.exists():
        return []
    
    audio_extensions = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}
    music_files = []
    
    for f in MUSIC_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in audio_extensions:
            music_files.append(f.name)
            
    return music_files

@router.get("/stream/{filename}")
async def stream_music(filename: str):
    file_path = MUSIC_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Simple extension to media type mapping
    ext = file_path.suffix.lower()
    media_type = "application/octet-stream"
    if ext == ".mp3":
        media_type = "audio/mpeg"
    elif ext == ".wav":
        media_type = "audio/wav"
    elif ext == ".ogg":
        media_type = "audio/ogg"
    elif ext == ".flac":
        media_type = "audio/flac"
    elif ext == ".m4a":
        media_type = "audio/mp4"
    
    return FileResponse(path=file_path, media_type=media_type, filename=filename)