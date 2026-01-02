from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
import os
from pathlib import Path
from pydantic import BaseModel
import docx
from ..llm.qwen import LLM

# 初始化LLM实例
llm = LLM()

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
STORAGE_DIR = BASE_DIR / "file_storage"

class DiaryContent(BaseModel):
    filename: str
    content: str
    format: str = "md" # md or docx

class StructureRequest(BaseModel):
    content: str
    template_type: str = "auto" # auto, timeline, problem-solution, key-points

class KeyPointsRequest(BaseModel):
    content: str

class AssociationRequest(BaseModel):
    current_content: str
    history_content: str = ""

class LearningAssistantRequest(BaseModel):
    content: str
    type: str = "knowledge" # knowledge, plan, review
    subject: str = "general"

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
        # Assume text/md
        try:
            file_path.write_text(diary.content, encoding="utf-8")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
            
    return {"status": "success", "filename": filename}

@router.delete("/delete/{filename}")
async def delete_diary(filename: str):
    file_path = STORAGE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {"status": "success", "message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.post("/structure")
async def structure_diary_content(request: StructureRequest):
    """
    AI辅助的日记内容结构化处理接口
    """
    try:
        template_type = request.template_type
        content = request.content
        
        # 根据不同的模板类型生成不同的prompt
        if template_type == "timeline":
            prompt = f"""
            请将以下日记内容按照时间线的形式进行结构化整理：
            
            {content}
            
            要求：
            1. 提取关键事件和对应的时间点
            2. 按照时间先后顺序排列
            3. 使用清晰的标题和格式
            4. 保留原始内容的核心信息
            5. 返回Markdown格式
            """
        elif template_type == "problem-solution":
            prompt = f"""
            请将以下日记内容按照问题-解决方案的形式进行结构化整理：
            
            {content}
            
            要求：
            1. 识别日记中提到的问题
            2. 提取对应的解决方案或行动项
            3. 使用清晰的标题和格式
            4. 保留原始内容的核心信息
            5. 返回Markdown格式
            """
        elif template_type == "key-points":
            prompt = f"""
            请将以下日记内容按照要点式的形式进行结构化整理：
            
            {content}
            
            要求：
            1. 提取核心要点和关键信息
            2. 使用列表形式呈现
            3. 每个要点简洁明了
            4. 保留原始内容的核心信息
            5. 返回Markdown格式
            """
        else:  # auto
            prompt = f"""
            请将以下日记内容进行智能结构化整理，选择最适合的结构：
            
            {content}
            
            要求：
            1. 分析内容特点，选择合适的结构（如时间线、问题-解决方案、要点式等）
            2. 使用清晰的标题和格式
            3. 保留原始内容的核心信息
            4. 提升内容的可读性和条理性
            5. 返回Markdown格式
            """
        
        # 调用LLM进行结构化处理
        structured_content = await llm.chat(prompt, "你是一位专业的内容结构化整理助手")
        
        if not structured_content:
            raise HTTPException(status_code=500, detail="LLM处理失败，返回空结果")
        
        return {"structured_content": structured_content, "template_type": template_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"结构化处理失败: {str(e)}")

@router.post("/extract-key-points")
async def extract_key_points(request: KeyPointsRequest):
    """
    AI驱动的日记要点智能挖掘系统接口
    """
    try:
        content = request.content
        
        # 构建prompt，让LLM提取关键信息
        prompt = f"""
        请从以下日记内容中提取关键信息，包括：
        1. 核心事件：发生了什么重要的事情
        2. 人物：涉及到哪些主要人物
        3. 时间：关键事件发生的时间
        4. 情感倾向：作者的主要情绪和态度
        5. 可行动项：从日记中提取的可以采取行动的事项
        6. 日记摘要：简洁的总结（不超过50字）
        
        日记内容：
        {content}
        
        要求：
        1. 每个关键信息类别使用清晰的标题
        2. 内容简洁明了，直击要点
        3. 保留原始内容的核心信息
        4. 返回Markdown格式
        """
        
        # 调用LLM进行要点提取
        key_points = await llm.chat(prompt, "你是一位专业的信息提取分析师")
        
        if not key_points:
            raise HTTPException(status_code=500, detail="LLM处理失败，返回空结果")
        
        return {"key_points": key_points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"要点提取失败: {str(e)}")

@router.post("/associate")
async def get_associations(request: AssociationRequest):
    """
    AI智能联想功能接口，基于用户当前输入和历史内容提供相关主题的联想建议
    """
    try:
        current_content = request.current_content
        history_content = request.history_content
        
        # 构建prompt，让LLM生成相关联想
        prompt = f"""
        请基于用户当前的日记输入和历史内容，生成5-8个相关的主题联想建议，帮助用户扩展写作思路。
        
        当前输入内容：
        {current_content}
        
        历史内容摘要：
        {history_content}
        
        要求：
        1. 联想建议要与当前内容相关，但又能拓展用户的写作思路
        2. 每个联想建议要简洁明了，10-20字左右
        3. 建议类型可以包括相关事件、情感延伸、关联主题、深入思考方向等
        4. 以列表形式返回，每个建议前加上序号
        5. 只返回联想建议列表，不要其他内容
        """
        
        # 调用LLM生成联想建议
        associations = await llm.chat(prompt, "你是一位创意写作助手，擅长提供富有启发性的思路建议")
        
        if not associations:
            raise HTTPException(status_code=500, detail="LLM处理失败，返回空结果")
        
        return {"associations": associations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"联想生成失败: {str(e)}")

@router.get("/time-machine")
async def get_time_machine_data():
    """
    日记时光机功能接口，返回按时间线组织的日记数据
    """
    try:
        if not STORAGE_DIR.exists():
            return {
                "timeline": [],
                "stats": {
                    "total_diaries": 0,
                    "recent_diaries": 0,
                    "average_length": 0
                }
            }
        
        # 获取所有日记文件
        files = []
        for f in STORAGE_DIR.iterdir():
            if f.is_file() and f.suffix.lower() in {'.md', '.docx', '.txt'}:
                files.append(f)
        
        # 按时间排序（文件名格式：Diary_YYYY-MM-DD_HHMMSS.ext）
        files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        # 组织成时间线数据
        timeline = []
        total_words = 0
        recent_diaries = 0
        recent_date = None
        
        for file in files:
            # 解析文件名获取日期
            file_name = file.name
            date_str = ""
            
            # 尝试从文件名中提取日期
            if file_name.startswith("Diary_"):
                # 格式：Diary_YYYY-MM-DD_HHMMSS.ext
                date_part = file_name[6:22]  # 提取 YYYY-MM-DD_HHMMSS 部分
                if len(date_part) >= 10:
                    date_str = date_part[:10]  # 提取 YYYY-MM-DD 部分
            
            # 获取文件内容和基本信息
            ext = file.suffix.lower()
            content = ""
            
            if ext == ".docx":
                try:
                    doc = docx.Document(file)
                    for para in doc.paragraphs:
                        content += para.text + "\n"
                except Exception:
                    content = "无法读取DOCX文件内容"
            else:
                try:
                    content = file.read_text(encoding="utf-8")
                except Exception:
                    content = "无法读取文件内容"
            
            # 计算字数
            word_count = len(content.replace("\n", " ").split())
            total_words += word_count
            
            # 统计最近7天的日记数量
            if recent_date is None:
                recent_date = file.stat().st_mtime
            else:
                # 计算天数差
                days_diff = (recent_date - file.stat().st_mtime) / (60 * 60 * 24)
                if days_diff <= 7:
                    recent_diaries += 1
            
            # 提取日记标题（如果有的话）
            title = file_name
            if content.strip():
                # 尝试从内容中提取标题
                lines = content.strip().split("\n")
                for line in lines:
                    if line.strip().startswith("# "):
                        title = line.strip()[2:]
                        break
            
            # 添加到时间线
            timeline.append({
                "filename": file_name,
                "date": date_str,
                "title": title,
                "word_count": word_count,
                "last_modified": file.stat().st_mtime,
                "format": ext.lstrip("."),
                "preview": content[:100] + ("..." if len(content) > 100 else "")
            })
        
        # 计算统计信息
        total_diaries = len(timeline)
        average_length = round(total_words / total_diaries) if total_diaries > 0 else 0
        
        # 返回时间线数据和统计信息
        return {
            "timeline": timeline,
            "stats": {
                "total_diaries": total_diaries,
                "recent_diaries": recent_diaries,
                "average_length": average_length
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取时光机数据失败: {str(e)}")

@router.post("/learn")
async def learning_assistant(request: LearningAssistantRequest):
    """
    AI学习助手功能接口，用于知识点整理、学习计划生成和复习提醒
    """
    try:
        content = request.content
        type = request.type
        subject = request.subject
        
        prompt = ""
        role = "你是一位专业的学习助手"
        
        if type == "knowledge":
            # 知识点整理
            prompt = f"""
            请将以下内容整理为结构化的知识点，帮助用户更好地理解和记忆。
            
            学科：{subject}
            内容：
            {content}
            
            要求：
            1. 提取核心概念和关键知识点
            2. 用层级结构组织知识点（主知识点、子知识点）
            3. 每个知识点简洁明了，突出重点
            4. 可以添加示例或记忆技巧
            5. 返回Markdown格式
            """
            role = "你是一位专业的知识整理专家，擅长将复杂内容结构化"
        elif type == "plan":
            # 学习计划生成
            prompt = f"""
            请根据用户提供的学习内容和目标，生成一份合理的学习计划。
            
            学科：{subject}
            学习内容：
            {content}
            
            要求：
            1. 制定详细的学习时间表，包括每天的学习内容和时间分配
            2. 考虑学习曲线，从基础到进阶
            3. 包含复习和练习环节
            4. 给出学习建议和方法
            5. 返回Markdown格式
            """
            role = "你是一位专业的学习规划师，擅长制定高效的学习计划"
        elif type == "review":
            # 复习提醒生成
            prompt = f"""
            请根据用户提供的学习内容，生成一份复习计划和提醒。
            
            学科：{subject}
            学习内容：
            {content}
            
            要求：
            1. 按照遗忘曲线制定复习时间表
            2. 每次复习的重点和方法
            3. 复习效果检测建议
            4. 记忆技巧和巩固方法
            5. 返回Markdown格式
            """
            role = "你是一位专业的记忆专家，擅长制定科学的复习计划"
        
        # 调用LLM进行处理
        result = await llm.chat(prompt, role)
        
        if not result:
            raise HTTPException(status_code=500, detail="LLM处理失败，返回空结果")
        
        return {"result": result, "type": type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"学习助手处理失败: {str(e)}")
