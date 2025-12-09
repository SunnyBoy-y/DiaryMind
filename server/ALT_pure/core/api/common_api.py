from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...core.common.text_processor import TextProcessor
from ...core.common.task_manager import TaskManager
from typing import List, Any, Optional
import asyncio

# 创建APIRouter实例
router = APIRouter()

# 初始化模块实例
text_processor = TextProcessor()

# 创建请求模型
class TextCleanRequest(BaseModel):
    """
    文本清洗请求模型
    """
    text: str  # 要清洗的文本

class TextCutterRequest(BaseModel):
    """
    文本切割请求模型
    """
    text: str  # 要切割的文本
    language: str = 'auto'  # 语言代码，默认为自动检测

class TextMergerRequest(BaseModel):
    """
    文本合并请求模型
    """
    texts: List[str]  # 要合并的文本列表

@router.post("/text/clean", response_model=dict)
async def clean_text(request: TextCleanRequest):
    """
    文本清洗API接口
    
    参数:
    - text: 要清洗的文本内容
    
    返回:
    - 成功: {"success": True, "cleaned_text": "清洗后的文本", "message": "文本清洗成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 调用文本清洗功能
        cleaned_text = text_processor.text_clean(request.text)
        
        return {
            "success": True,
            "cleaned_text": cleaned_text,
            "message": "文本清洗成功"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本清洗失败: {str(e)}")

@router.post("/text/cut", response_model=dict)
async def cut_text(request: TextCutterRequest):
    """
    文本切割API接口
    
    参数:
    - text: 要切割的文本内容
    - language: 语言代码，可选值: 'auto', 'zh', 'en', 'fr', 'de', 'ja'（默认: auto）
    
    返回:
    - 成功: {"success": True, "sentences": ["句子1", "句子2", ...], "message": "文本切割成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 调用文本切割功能
        sentences = text_processor.text_cutter_by_language(request.text, request.language)
        
        return {
            "success": True,
            "sentences": sentences,
            "message": "文本切割成功"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本切割失败: {str(e)}")

@router.post("/text/merge", response_model=dict)
async def merge_text(request: TextMergerRequest):
    """
    文本合并API接口
    
    参数:
    - texts: 要合并的文本列表
    
    返回:
    - 成功: {"success": True, "merged_text": "合并后的文本", "message": "文本合并成功"}
    - 失败: {"success": False, "message": "错误信息"}
    """
    try:
        # 调用文本合并功能
        merged_text = text_processor.text_merger(request.texts)
        
        return {
            "success": True,
            "merged_text": merged_text,
            "message": "文本合并成功"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本合并失败: {str(e)}")

@router.get("/text/max-split-length", response_model=dict)
async def get_max_split_length():
    """
    获取文本最大分割长度
    
    返回:
    - {"max_split_length": 最大分割长度值}
    """
    try:
        return {
            "max_split_length": text_processor.max_split_len,
            "message": "获取最大分割长度成功"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取最大分割长度失败: {str(e)}")
