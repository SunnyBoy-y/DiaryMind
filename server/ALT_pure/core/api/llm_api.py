from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel
from ..llm.qwen import LLM
from typing import Optional, List
import asyncio
import json
import re
from datetime import datetime, timedelta

router = APIRouter()

# 初始化LLM实例
llm = LLM()


class ChatRequest(BaseModel):
    role: str = "你是助手"
    message: str
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    response: str

class TaskScheduleItem(BaseModel):
    time: str
    task: str

class TaskPlanRequest(BaseModel):
    message: str

class TaskPlanResponse(BaseModel):
    suggestion: str
    schedule: List[TaskScheduleItem]
    error: Optional[str] = None


class MoodAlchemyResponse(BaseModel):
    mood_color: str
    mood_keyword: str
    soul_insight: str

@router.post("/mood-alchemy", response_model=MoodAlchemyResponse)
async def mood_alchemy(request: TaskPlanRequest):
    """
    情绪炼金术接口
    """
    try:
        prompt = f"""
        用户输入: "{request.message}"
        
        请分析用户的情绪，并生成以下内容：
        1. 情绪颜色 (Hex代码，要符合情绪氛围)
        2. 情绪关键词 (例如：雷雨、阳光、迷雾、花火)
        3. 灵魂洞察 (一句简短、深刻、治愈或幽默的总结，不超过30字)
        
        要求:
        1. 返回纯JSON格式。
        2. JSON结构:
        {{
            "mood_color": "#HexCode",
            "mood_keyword": "关键词",
            "soul_insight": "洞察语录"
        }}
        """
        
        response_text = await llm.chat(prompt, "你是情绪炼金术师")
        
        if not response_text:
             return MoodAlchemyResponse(
                mood_color="#cccccc",
                mood_keyword="未知",
                soul_insight="情绪如雾，暂时无法看清。"
            )

        # Clean up response
        clean_text = response_text.strip()
        if clean_text.startswith("```"):
            newline_idx = clean_text.find("\n")
            if newline_idx != -1:
                clean_text = clean_text[newline_idx+1:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()
        
        try:
            data = json.loads(clean_text)
            return MoodAlchemyResponse(**data)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    return MoodAlchemyResponse(**data)
                except Exception:
                    pass
            return MoodAlchemyResponse(
                mood_color="#ff9b9b",
                mood_keyword="复杂",
                soul_insight="你的情绪丰富多彩，难以言喻。"
            )
            
    except Exception as e:
        print(f"Mood alchemy error: {e}")
        return MoodAlchemyResponse(
            mood_color="#000000",
            mood_keyword="错误",
            soul_insight="系统暂时无法炼制情绪。"
        )

async def llm_ui():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>LLM聊天测试</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            textarea { width: 100%; height: 100px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; }
            button:hover { background: #45a049; }
            #response { margin-top: 20px; padding: 10px; background: #f0f0f0; min-height: 50px; border-radius: 5px; }
            .streaming { color: #0066cc; }
            h1 { color: #333; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>LLM聊天测试界面</h1>
            <form id="chatForm">
                <label for="message">输入消息:</label>
                <textarea id="message" placeholder="请输入您的问题..."></textarea>
                <button type="submit">发送消息</button>
                <button type="button" id="streamBtn">流式发送</button>
                <button type="button" id="clearBtn">清空对话</button>
            </form>
            <div id="response"></div>
        </div>

        <script>
            const form = document.getElementById('chatForm');
            const messageInput = document.getElementById('message');
            const responseDiv = document.getElementById('response');
            const streamBtn = document.getElementById('streamBtn');
            const clearBtn = document.getElementById('clearBtn');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = messageInput.value;
                if (!message) return;

                responseDiv.innerHTML = '<div>处理中...</div>';

                try {
                    const response = await fetch('/api/llm/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ message: message }),
                    });

                    const data = await response.json();
                    responseDiv.innerHTML = `<div><strong>回答:</strong></div><div>${data.response}</div>`;
                } catch (error) {
                    responseDiv.innerHTML = `<div><strong>错误:</strong> ${error.message}</div>`;
                }
            });

            streamBtn.addEventListener('click', async () => {
                const message = messageInput.value;
                if (!message) return;

                responseDiv.innerHTML = '<div class="streaming">流式响应中...</div><div id="streamContent"></div>';
                const streamContent = document.getElementById('streamContent');

                try {
                    const response = await fetch('/api/llm/stream-chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            message: message,
                            stream: true
                        }),
                    });

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const text = decoder.decode(value);
                        streamContent.innerHTML += text;
                    }
                } catch (error) {
                    streamContent.innerHTML += `<br><strong>错误:</strong> ${error.message}`;
                }
            });

            clearBtn.addEventListener('click', () => {
                messageInput.value = '';
                responseDiv.innerHTML = '';
            });
        </script>
    </body>
    </html>
    """


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    同步聊天接口
    """
    try:
        response = await llm.chat(request.message, request.role)
        if response is None:
            raise HTTPException(status_code=500, detail="LLM未正确配置或返回空响应")
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream-chat")
async def stream_chat(request: ChatRequest):
    """
    流式聊天接口
    """
    try:
        return StreamingResponse(stream_generator(request.role, request.message),
                                 media_type="text/plain; charset=utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def stream_generator(role: str, message: str):
    """
    流式响应生成器
    """
    try:
        for text in llm.request(role, message):
            yield text
            # 添加小延迟以模拟流式效果
            await asyncio.sleep(0.01)
    except Exception as e:
        yield f"Error: {str(e)}"


@router.post("/plan-tasks", response_model=TaskPlanResponse)
async def plan_tasks(request: TaskPlanRequest):
    """
    任务规划接口
    """
    try:
        current_time = datetime.now().strftime("%H:%M")
        prompt = f"""
        用户想要做的事情: "{request.message}"
        当前时间: {current_time}
        
        请你作为一位贴心的任务规划助手，为用户安排合理的时间表，并给出一句简短的建议或鼓励。
        
        要求:
        1. 返回格式必须是纯JSON，不要包含markdown代码块标记。
        2. JSON结构如下:
        {{
            "suggestion": "简短的建议或鼓励",
            "schedule": [
                {{"time": "开始时间", "task": "任务简述"}},
                ...
            ]
        }}
        3. 时间安排要合理，基于当前时间往后规划。
        """
        
        response_text = await llm.chat(prompt, "你是任务规划助手")
        if not response_text:
            now = datetime.now()
            hour = now.hour
            if hour >= 22 or hour <= 5:
                suggestion = "深夜里还在学习的宝最棒了！"
            elif hour < 9:
                suggestion = "清晨开始，效率加倍！"
            elif hour < 18:
                suggestion = "坚持不懈，马上见到成效！"
            else:
                suggestion = "晚间也要照顾好自己，适度休息～"
            parts = [p.strip() for p in re.split(r"[，,；;。.\n]+", request.message) if p.strip()]
            if not parts:
                parts = [request.message.strip()]
            base = now
            step = 45
            schedule = []
            for i, p in enumerate(parts[:4]):
                t = (base + timedelta(minutes=i * step)).strftime("%H:%M")
                schedule.append(TaskScheduleItem(time=t, task=p))
            return TaskPlanResponse(suggestion=suggestion, schedule=schedule)

        # Clean up response if it contains markdown code blocks
        clean_text = response_text.strip()
        # Remove ```json or ``` at start
        if clean_text.startswith("```"):
            # Find first newline
            newline_idx = clean_text.find("\n")
            if newline_idx != -1:
                clean_text = clean_text[newline_idx+1:]
        # Remove ``` at end
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
             
        clean_text = clean_text.strip()
        
        try:
            data = json.loads(clean_text)
            return TaskPlanResponse(**data)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    return TaskPlanResponse(**data)
                except Exception:
                    pass
            now = datetime.now()
            hour = now.hour
            if hour >= 22 or hour <= 5:
                suggestion = "深夜里还在学习的宝最棒了！"
            elif hour < 9:
                suggestion = "清晨开始，效率加倍！"
            elif hour < 18:
                suggestion = "坚持不懈，马上见到成效！"
            else:
                suggestion = "晚间也要照顾好自己，适度休息～"
            parts = [p.strip() for p in re.split(r"[，,；;。.\n]+", request.message) if p.strip()]
            if not parts:
                parts = [request.message.strip()]
            base = now
            step = 45
            schedule = []
            for i, p in enumerate(parts[:4]):
                t = (base + timedelta(minutes=i * step)).strftime("%H:%M")
                schedule.append(TaskScheduleItem(time=t, task=p))
            return TaskPlanResponse(suggestion=suggestion, schedule=schedule)
            
    except Exception as e:
        print(f"Plan tasks error: {e}")
        return TaskPlanResponse(
            suggestion="系统错误", 
            schedule=[], 
            error=str(e)
        )
