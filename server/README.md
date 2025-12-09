# DiaryMind 后端服务部署指南

## 环境要求

- Python 3.8 或更高版本
- Windows/Linux/macOS 操作系统
- 至少4GB RAM（推荐8GB以上）
- GPU支持（可选，但推荐用于语音识别功能）

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd DiaryMind/server
```

### 2. 创建虚拟环境

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

创建 `.env` 文件并设置必要的API密钥：

```env
# DashScope API Key (用于TTS功能)
DASHSCOPE_API_KEY=your_api_key_here

# 其他可选配置
MODEL_DIR=path/to/models  # ASR模型目录
```

### 5. 准备音乐文件

将MP3、WAV等音频文件放入 `music/` 目录中。

### 6. 启动服务

```bash
python main.py
```

服务将在 `http://127.0.0.1:8082` 上运行。

## API文档

启动服务后，可以访问以下URL查看API文档：

- Swagger UI: http://127.0.0.1:8082/docs
- ReDoc: http://127.0.0.1:8082/redoc

## API端点概览

### 日记相关
- `GET /api/diary/list` - 获取日记列表
- `GET /api/diary/content/{filename}` - 获取日记内容
- `POST /api/diary/save` - 保存日记

### AI大语言模型
- `POST /api/llm/chat` - 同步聊天接口
- `POST /api/llm/stream-chat` - 流式聊天接口

### 文本转语音(TTS)
- `POST /api/tts/text-to-audio` - 文本转语音
- `GET /api/tts/audio/{filename}` - 获取生成的音频文件
- `POST /api/tts/text-to-audio-direct` - 直接返回音频文件

### 语音识别(ASR)
- `POST /api/asr/audio-to-text` - 音频转文本
- `POST /api/asr/upload-and-transcribe` - 上传并转录音频

### 音乐播放
- `GET /api/music/list` - 获取音乐列表
- `GET /api/music/stream/{filename}` - 流式播放音乐

### 公共功能
- `POST /api/common/text/clean` - 文本清洗
- `POST /api/common/text/cut` - 文本切割
- `POST /api/common/text/merge` - 文本合并

## 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt --no-cache-dir
   ```

2. **CUDA相关错误**
   如果没有NVIDIA GPU，确保在ASR配置中使用CPU设备。

3. **端口被占用**
   修改 `main.py` 中的端口号：
   ```python
   uvicorn.run(
       "ALT_pure.core.api.api_utli:app", 
       host="127.0.0.1", 
       port=8083,  # 更改端口号
       reload=True
   )
   ```

### 日志查看

日志文件位于 `log/` 目录中，可以查看详细的运行信息和错误追踪。

## 性能优化建议

1. **模型加载**: 首次运行时会下载ASR模型，需要网络连接和存储空间
2. **内存管理**: 对于大型音频文件，建议分段处理
3. **并发处理**: 生产环境建议使用Gunicorn或Uvicorn多进程部署

## 开发者指南

### 项目结构

```
server/
├── main.py                 # 应用入口
├── requirements.txt         # Python依赖
├── music/                  # 音乐文件目录
├── file_storage/           # 日记存储目录
├── log/                    # 日志目录
└── ALT_pure/               # 核心模块
    ├── config/             # 配置文件
    ├── core/               # 核心功能
    │   ├── api/            # API接口
    │   ├── llm/            # 大语言模型
    │   ├── tts/            # 文本转语音
    │   ├── asr/            # 语音识别
    │   └── common/         # 公共功能
    └── utils/              # 工具函数
```

### 添加新功能

1. 在 `ALT_pure/core/api/` 中创建新的API模块
2. 在 `api_utli.py` 中注册路由
3. 更新Swagger文档说明

## 许可证

该项目采用MIT许可证 - 查看[LICENSE](../LICENSE)文件了解详情