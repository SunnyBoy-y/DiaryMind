from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from ...core.tts.huoshan import TTS
import os
import uuid

# 创建APIRouter实例
router = APIRouter()

# 初始化TTS实例
tts = TTS()

# 创建请求模型
class TextToAudioRequest(BaseModel):
    """
    文本转语音请求模型
    """
    text: str  # 要转换的文本
    filename: str = "output.wav"  # 输出文件名，默认为output.wav

@router.post("/text-to-audio", response_model=dict)
async def text_to_audio(request: TextToAudioRequest):
    """
    文本转语音API接口
    
    参数:
    - text: 要转换的文本内容
    - filename: 输出音频文件名（可选，默认为output.wav）
    
    返回:
    - 成功: {"success": True, "filename": "生成的音频文件名", "message": "音频生成成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 生成唯一的文件名，避免冲突
        unique_filename = f"{uuid.uuid4().hex}_{request.filename}"
        
        # 调用TTS模块进行文本转语音
        success = tts.text_to_audio(request.text, unique_filename)
        
        if success:
            # 构建音频文件的完整路径
            audio_path = os.path.join(tts.TEMP_PATH, unique_filename)
            
            if os.path.exists(audio_path):
                return {
                    "success": True,
                    "filename": unique_filename,
                    "message": "音频生成成功"
                }
            else:
                raise FileNotFoundError("生成的音频文件未找到")
        else:
            raise HTTPException(status_code=500, detail="音频生成失败")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本转语音失败: {str(e)}")

@router.get("/audio/{filename}", response_class=FileResponse)
async def get_audio(filename: str):
    """
    获取生成的音频文件
    
    参数:
    - filename: 音频文件名
    
    返回:
    - 音频文件
    """
    try:
        # 构建音频文件的完整路径
        audio_path = os.path.join(tts.TEMP_PATH, filename)
        
        # 检查文件是否存在
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="音频文件未找到")
        
        # 返回音频文件
        return FileResponse(audio_path, media_type="audio/wav", filename=filename)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取音频文件失败: {str(e)}")

@router.post("/text-to-audio-direct", response_class=FileResponse)
async def text_to_audio_direct(request: TextToAudioRequest):
    """
    文本转语音并直接返回音频文件
    
    参数:
    - text: 要转换的文本内容
    - filename: 输出音频文件名（可选，默认为output.wav）
    
    返回:
    - 生成的音频文件
    """
    try:
        # 生成唯一的文件名
        unique_filename = f"{uuid.uuid4().hex}_{request.filename}"
        
        # 调用TTS模块进行文本转语音
        success = tts.text_to_audio(request.text, unique_filename)
        
        if success:
            # 构建音频文件的完整路径
            audio_path = os.path.join(tts.TEMP_PATH, unique_filename)
            
            if os.path.exists(audio_path):
                # 返回音频文件
                return FileResponse(audio_path, media_type="audio/wav", filename=request.filename)
            else:
                raise FileNotFoundError("生成的音频文件未找到")
        else:
            raise HTTPException(status_code=500, detail="音频生成失败")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本转语音失败: {str(e)}")

@router.get("/platform")
async def get_tts_platform():
    """
    获取当前使用的TTS平台
    
    返回:
    - 当前使用的TTS平台名称
    """
    try:
        return {
            "platform": tts.platform,
            "message": "获取TTS平台成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取TTS平台失败: {str(e)}")
