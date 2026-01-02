from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from . import tts_api, llm_api, asr_api, common_api, music_api, diary_api, process_api, auth_api

app = FastAPI(
    title="ALT系统API",
    description="这是一个ALT系统的API接口",
    version="0.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含各种API路由
app.include_router(llm_api.router, prefix="/api/llm", tags=["LLM接口"])
app.include_router(tts_api.router, prefix="/api/tts", tags=["TTS接口"])
app.include_router(asr_api.router, prefix="/api/asr", tags=["ASR接口"])
app.include_router(common_api.router, prefix="/api/common", tags=["公共功能接口"])
app.include_router(music_api.router, prefix="/api/music", tags=["音乐接口"])
app.include_router(diary_api.router, prefix="/api/diary", tags=["日记接口"])
app.include_router(process_api.router, prefix="/api/process", tags=["流程接口"])
app.include_router(auth_api.router, prefix="/api/auth", tags=["认证接口"])

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>ALT系统API</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; }
            a { text-decoration: none; color: #4CAF50; font-weight: bold; }
            a:hover { text-decoration: underline; }
            pre { background-color: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>欢迎使用ALT系统API</h1>
            <p>API版本: 0.1.0</p>

            <h2>可用的端点:</h2>
            <ul>
                <li><a href="/docs">交互式API文档</a></li>
                <li><a href="/redoc">ReDoc API文档</a></li>
                <li><a href="/api/llm">LLM聊天测试界面</a></li>
            </ul>

            <h2>API端点:</h2>
            <ul>
                <li><strong>LLM接口:</strong></li>
                <li>POST /api/llm/chat - LLM同步聊天接口</li>
                <li>POST /api/llm/stream-chat - LLM流式聊天接口</li>
                
                <li><strong>TTS接口:</strong></li>
                <li>POST /api/tts/text-to-audio - 文本转语音接口</li>
                <li>GET /api/tts/audio/{filename} - 获取生成的音频文件</li>
                <li>POST /api/tts/text-to-audio-direct - 文本转语音并直接返回音频文件</li>
                <li>GET /api/tts/platform - 获取当前使用的TTS平台</li>
                
                <li><strong>ASR接口:</strong></li>
                <li>POST /api/asr/audio-to-text - 音频转文本接口（基于本地文件路径）</li>
                <li>POST /api/asr/upload-and-transcribe - 上传音频文件并进行语音识别</li>
                <li>GET /api/asr/supported-models - 获取支持的模型大小列表</li>
                <li>GET /api/asr/supported-languages - 获取支持的语言代码列表</li>
                
                <li><strong>公共功能接口:</strong></li>
                <li>POST /api/common/text/clean - 文本清洗接口</li>
                <li>POST /api/common/text/cut - 文本切割接口</li>
                <li>POST /api/common/text/merge - 文本合并接口</li>
                <li>GET /api/common/text/max-split-length - 获取文本最大分割长度</li>
            </ul>

            <h2>使用示例:</h2>
            <p>使用curl命令测试API:</p>
            <pre>
# 同步聊天
curl -X POST "http://localhost:8000/api/llm/chat" \\
     -H "Content-Type: application/json" \\
     -d '{"message": "你好，今天天气怎么样？"}'

# 流式聊天
curl -X POST "http://localhost:8000/api/llm/stream-chat" \\
     -H "Content-Type: application/json" \\
     -d '{"message": "请写一首关于春天的诗", "stream": true}'
            </pre>
        </div>
    </body>
    </html>
    """


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    print("正在启动服务器...")
    print("请访问以下地址:")
    print("  主页: http://127.0.0.1:8082")
    print("  LLM测试界面: http://127.0.0.1:8082/api/llm")
    print("  API文档: http://127.0.0.1:8082/docs")
    uvicorn.run(app, host="127.0.0.1", port=8082)