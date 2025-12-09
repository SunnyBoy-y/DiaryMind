from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from ...core.asr.whisper_asr import audio_to_text
import os
import uuid
import tempfile

# 创建APIRouter实例
router = APIRouter()

# 创建请求模型
class AudioToTextRequest(BaseModel):
    """
    音频转文本请求模型（用于本地文件路径）
    """
    audio_path: str  # 音频文件路径
    model_size: str = "medium"  # 模型大小，默认为medium
    language: str = None  # 语言代码，默认为自动检测
    device: str = "auto"  # 运行设备，默认为auto

@router.post("/audio-to-text", response_model=dict)
async def audio_to_text_api(request: AudioToTextRequest):
    """
    音频转文本API接口（基于本地文件路径）
    
    参数:
    - audio_path: 音频文件路径
    - model_size: 模型大小，可选: 'tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3'（默认: medium）
    - language: 语言代码，如 'zh' 中文, 'en' 英文，设为 None 可自动检测（默认: None）
    - device: 运行设备，'cuda'（GPU）、'cpu'，'auto' 自动选择（默认: auto）
    
    返回:
    - 成功: {"success": True, "text": "识别出的文本", "message": "音频识别成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 调用ASR模块进行音频转文本
        text = audio_to_text(
            audio_path=request.audio_path,
            model_size=request.model_size,
            language=request.language,
            device=request.device
        )
        
        return {
            "success": True,
            "text": text,
            "message": "音频识别成功"
        }
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"文件未找到: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"音频识别失败: {str(e)}")

@router.post("/upload-and-transcribe", response_model=dict)
async def upload_and_transcribe(
    file: UploadFile = File(...),
    model_size: str = "medium",
    language: str = None,
    device: str = "auto"
):
    """
    上传音频文件并进行语音识别API接口
    
    参数:
    - file: 要上传的音频文件
    - model_size: 模型大小，可选: 'tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3'（默认: medium）
    - language: 语言代码，如 'zh' 中文, 'en' 英文，设为 None 可自动检测（默认: None）
    - device: 运行设备，'cuda'（GPU）、'cpu'，'auto' 自动选择（默认: auto）
    
    返回:
    - 成功: {"success": True, "text": "识别出的文本", "message": "音频识别成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 检查文件类型是否为音频文件
        allowed_extensions = [".wav", ".mp3", ".m4a", ".ogg", ".flac"]
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="不支持的文件类型，请上传音频文件（wav, mp3, m4a, ogg, flac）")
        
        # 创建临时文件来保存上传的音频
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        
        try:
            # 调用ASR模块进行音频转文本
            text = audio_to_text(
                audio_path=temp_file_path,
                model_size=model_size,
                language=language,
                device=device
            )
            
            return {
                "success": True,
                "text": text,
                "message": "音频识别成功"
            }
        
        finally:
            # 无论成功还是失败，都删除临时文件
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        # 重新抛出HTTPException，保持原始状态码和消息
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"音频识别失败: {str(e)}")

@router.get("/supported-models", response_model=dict)
async def supported_models():
    """
    获取支持的模型大小列表
    
    返回:
    - {"models": ["tiny", "base", "small", "medium", "large-v2", "large-v3"]}
    """
    return {
        "models": ["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        "message": "获取支持的模型列表成功"
    }

@router.get("/supported-languages", response_model=dict)
async def supported_languages():
    """
    获取支持的语言代码列表
    
    返回:
    - {"languages": ["zh", "en", "ja", "ko", "fr", "de", ...]}
    """
    return {
        "languages": [
            "zh", "en", "ja", "ko", "fr", "de", "es", "ru", "it", "pt",
            "nl", "pl", "tr", "ar", "hi", "th", "vi", "id", "ms", "tl"
        ],
        "message": "获取支持的语言列表成功"
    }
