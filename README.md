# DiaryMind - 智能日记助手

<p align="center">
  <img src="ui/src/assets/logo.png" alt="DiaryMind Logo" width="200"/>
</p>

<p align="center">
  <strong>一款融合AI技术的智能日记应用，让记录生活变得更简单、更有趣</strong>
</p>

<p align="center">
  <a href="https://github.com/your-username/DiaryMind/issues">
    <img src="https://img.shields.io/github/issues/your-username/DiaryMind" alt="GitHub Issues">
  </a>
  <a href="https://github.com/your-username/DiaryMind/stargazers">
    <img src="https://img.shields.io/github/stars/your-username/DiaryMind" alt="GitHub Stars">
  </a>
  <a href="https://github.com/your-username/DiaryMind/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/your-username/DiaryMind" alt="GitHub License">
  </a>
</p>

## 项目简介

DiaryMind是一款创新的智能日记应用，结合了现代Web技术和人工智能，为用户提供全方位的生活记录和情感陪伴体验。通过整合语音识别、文本转语音、AI对话等先进技术，DiaryMind让日记记录变得更加智能化和个性化。

### 核心特色

- 📝 **多格式日记管理** - 支持Markdown、DOCX、TXT等多种文档格式
- 🤖 **AI智能助手** - 与AI进行自然语言对话，获得个性化建议和鼓励
- 🎵 **音乐娱乐系统** - 内置音乐播放器，提供沉浸式写作环境
- 🎤 **语音日记功能** - 语音转文字，随时随地记录灵感
- 🎨 **手绘风格界面** - 简约清新的手绘风格设计，带来舒适视觉体验
- � **响应式布局** - 适配不同设备，随时随地记录生活

## 功能预览

| 功能 | 预览 |
|------|------|
| 主界面 | ![主界面](ui/src/assets/home-preview.png) |
| 日记列表 | ![日记列表](ui/src/assets/list-preview.png) |
| 全屏写作 | ![全屏写作](ui/src/assets/fullscreen-preview.png) |
| 音乐播放 | ![音乐播放](ui/src/assets/music-preview.png) |

## 技术架构

### 前端技术栈
- **React 18** - 现代JavaScript库，用于构建用户界面
- **Vite** - 新一代前端构建工具，极速启动
- **TailwindCSS** - 实用优先的CSS框架
- **Lucide React** - 精美的开源图标库

### 后端技术栈
- **FastAPI** - 现代、快速（高性能）的Python Web框架
- **Python 3.8+** - 强大的编程语言
- **Whisper ASR** - 语音识别库
- **DashScope** - 火山引擎AI服务平台

### 核心功能模块
1. **日记管理系统** - 多格式支持的日记存储和检索
2. **AI对话系统** - 基于大语言模型的智能对话
3. **语音处理系统** - 语音识别和文本转语音
4. **音乐播放系统** - 本地音乐管理和播放
5. **生活工具集** - 时钟、待办事项、日历等功能

## 目录结构

```
DiaryMind/
├── server/                 # 后端服务
│   ├── ALT_pure/           # 核心模块
│   │   ├── config/         # 配置文件
│   │   ├── core/           # 核心功能
│   │   │   ├── api/        # API接口
│   │   │   ├── llm/        # 大语言模型
│   │   │   ├── tts/        # 文本转语音
│   │   │   ├── asr/        # 语音识别
│   │   │   └── common/     # 公共功能
│   │   └── utils/          # 工具函数
│   ├── main.py             # 应用入口
│   ├── requirements.txt    # Python依赖
│   └── README.md           # 后端部署指南
├── ui/                     # 前端界面
│   ├── src/                # 源代码
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # React组件
│   │   ├── App.jsx         # 主应用组件
│   │   └── main.jsx        # 应用入口
│   ├── package.json        # Node.js依赖
│   └── README.md           # 前端部署指南
├── FEATURES.md             # 功能特性详解
├── CONFIGURATION.md        # 配置说明
├── CONTRIBUTING.md         # 贡献指南
├── LICENSE                 # 许可证
└── README.md               # 项目主文档
```

## 快速开始

### 环境要求
- Node.js 16+
- Python 3.8+
- Git

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/DiaryMind.git
cd DiaryMind
```

#### 2. 启动后端服务
```bash
# 进入后端目录
cd server

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
echo "DASHSCOPE_API_KEY=your_api_key_here" > .env

# 启动服务
python main.py
```

#### 3. 启动前端界面
```bash
# 在新终端中进入前端目录
cd ui

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可使用DiaryMind！

## 详细文档

为了更好地理解和使用DiaryMind，我们准备了详细的文档：

- 📖 [功能特性详解](FEATURES.md) - 了解DiaryMind的所有功能和特色
- ⚙️ [配置说明](CONFIGURATION.md) - 学习如何配置和定制DiaryMind
- 🚀 [后端部署指南](server/README.md) - 部署后端服务的详细步骤
- 💻 [前端部署指南](ui/README.md) - 部署前端界面的详细步骤
- 🤝 [贡献指南](CONTRIBUTING.md) - 了解如何为项目做贡献

## 使用场景

### 个人日记记录
记录日常生活点滴，保存珍贵回忆，通过AI助手获得情感支持和建议。

### 学习笔记整理
将课堂笔记、学习心得数字化管理，利用语音功能快速录入内容。

### 工作事务管理
记录工作日志，管理待办事项，通过日历视图统筹安排工作计划。

### 创意写作辅助
捕捉灵感瞬间，全屏写作模式让您专注于创作过程。

## 贡献与支持

我们欢迎任何形式的贡献！如果您想为DiaryMind添加新功能、修复bug或改进文档，请查看我们的[贡献指南](CONTRIBUTING.md)。

如果您喜欢这个项目，请给我们一个⭐Star！

## 许可证

本项目采用MIT许可证，详情请查看[LICENSE](LICENSE)文件。

## 联系方式

如有任何问题或建议，欢迎通过以下方式联系我们：
- 提交[GitHub Issue](https://github.com/your-username/DiaryMind/issues)
- 发送邮件至：[your-email@example.com](mailto:your-email@example.com)

---

<p align="center">Made with ❤️ by the DiaryMind Team</p>