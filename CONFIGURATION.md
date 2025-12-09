# DiaryMind 配置说明

## 环境变量配置

DiaryMind使用环境变量来管理敏感信息和可配置选项。在项目根目录创建 `.env` 文件来设置这些变量。

### 必需配置

```env
# DashScope API Key (用于TTS功能)
DASHSCOPE_API_KEY=your_api_key_here
```

### 可选配置

```env
# ASR模型目录 (可选)
MODEL_DIR=path/to/models

# 日记文件存储路径 (可选，默认为file_storage)
DIARY_STORAGE_PATH=file_storage

# 音乐文件目录 (可选，默认为server/music)
MUSIC_PATH=server/music

# 日志级别 (可选，默认为INFO)
LOG_LEVEL=INFO

# 服务器主机地址 (可选，默认为127.0.0.1)
HOST=127.0.0.1

# 服务器端口 (可选，默认为8082)
PORT=8082
```

## 后端配置文件

### config.yaml
位于 `server/ALT_pure/config/` 目录下，包含应用的核心配置：

```yaml
# 应用配置
app:
  name: "DiaryMind"
  version: "1.0.0"
  debug: true

# ASR配置
asr:
  model_size: "base"  # 可选: tiny, base, small, medium, large, large-v3
  device: "cpu"       # 可选: cpu, cuda
  compute_type: "int8"

# LLM配置
llm:
  default_role: "心理咨询师"
  temperature: 0.7
  max_tokens: 1000

# TTS配置
tts:
  sample_rate: 24000
  speaker: "zhizhe"  # 可选: zhizhe, zhitian, etc.

# 路径配置
paths:
  diary_storage: "file_storage"
  music: "music"
  logs: "log"
```

## 前端配置

### API地址配置
前端组件中硬编码了后端API的基础地址，默认为：
```
http://localhost:8082/api
```

如需修改，请在以下组件中调整 `API_BASE` 常量：
- `src/components/DiaryList.jsx`
- `src/components/MusicPlayer.jsx`
- `src/App.jsx`

### 样式配置
项目使用Tailwind CSS进行样式管理，配置文件位于 `ui/tailwind.config.js`：

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 自定义主题扩展
    },
  },
  plugins: [],
}
```

## 数据库配置（如有）

如果项目扩展使用数据库，配置信息将位于：
```
server/ALT_pure/config/database.yaml
```

示例配置：
```yaml
database:
  type: "sqlite"  # 可选: sqlite, postgresql, mysql
  path: "data/app.db"
  host: "localhost"
  port: 5432
  username: "diarymind"
  password: "password"
  database_name: "diarymind_db"
```

## 日志配置

日志配置位于 `server/ALT_pure/config/logging.yaml`：

```yaml
version: 1
formatters:
  default:
    format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: default
  file:
    class: logging.FileHandler
    filename: log/app.log
    level: DEBUG
    formatter: default
loggers:
  diarymind:
    level: DEBUG
    handlers: [console, file]
    propagate: false
```

## 部署配置示例

### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/ui/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API请求代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Docker环境变量文件
创建 `docker-compose.env` 文件：

```env
DASHSCOPE_API_KEY=your_api_key_here
MODEL_DIR=/app/models
DIARY_STORAGE_PATH=/app/file_storage
MUSIC_PATH=/app/music
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8082
```

### systemd服务配置（Linux）
创建 `/etc/systemd/system/diarymind.service`：

```ini
[Unit]
Description=DiaryMind Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/diarymind/server
Environment=DASHSCOPE_API_KEY=your_api_key_here
ExecStart=/path/to/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## 配置验证

### 后端配置检查
启动后访问以下URL验证配置：
- http://localhost:8082/health - 健康检查端点
- http://localhost:8082/config - 当前配置信息（开发模式下）

### 前端配置检查
检查浏览器开发者工具中的网络面板，确认API请求正常发送到正确的后端地址。

## 常见配置问题

### 1. API连接失败
检查：
- 后端服务是否正在运行
- 前端API地址配置是否正确
- 防火墙是否阻止了相应端口

### 2. TTS功能不可用
检查：
- 是否设置了有效的DASHSCOPE_API_KEY
- 网络连接是否正常
- 火山引擎服务是否可用

### 3. ASR识别准确率低
检查：
- 是否选择了合适大小的模型
- 音频质量是否良好
- 是否设置了正确的计算类型

### 4. 文件存储问题
检查：
- DIARY_STORAGE_PATH目录是否存在且有写权限
- 磁盘空间是否充足
- 文件系统权限设置是否正确

## 安全配置建议

### 生产环境配置
1. 设置 `debug: false` 在config.yaml中
2. 使用强密码和密钥
3. 限制API访问频率
4. 启用HTTPS
5. 定期更新依赖包

### 敏感信息保护
1. 不要在代码中硬编码API密钥
2. 使用环境变量管理敏感配置
3. 定期轮换API密钥
4. 限制不必要的文件系统访问权限

通过合理配置这些选项，您可以根据实际需求定制DiaryMind的行为，使其更好地适应您的使用场景。