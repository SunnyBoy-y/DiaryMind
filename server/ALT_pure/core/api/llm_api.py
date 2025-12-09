from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel
from ..llm.qwen import LLM
from typing import Optional
import asyncio

router = APIRouter()

# 初始化LLM实例
llm = LLM()


class ChatRequest(BaseModel):
    role: str = "你是助手"
    message: str
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    response: str


@router.get("/", response_class=HTMLResponse)
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
        response = llm.chat(request.message, request.role)
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
