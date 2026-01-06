# DiaryMind - 智能日记助手

<p align="center">
  <img src="ui/src/assets/logo.png" alt="DiaryMind Logo" width="200"/>
</p>

<p align="center">
  <strong>隐私优先 · 沉浸体验 · AI 赋能</strong>
  <br>
  <em>一款真正属于你的本地化智能日记空间</em>
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

## 🌟 为什么选择 DiaryMind？

在 AI 时代，我们发现市面上的日记应用要么**价格昂贵**（订阅制），要么**隐私存疑**（云端存储）。DiaryMind 专为解决这些痛点而生：

*   🔒 **数据主权**: 坚持 **Local First**（本地优先），所有日记以 Markdown/DOCX 格式存储在你自己的硬盘上，没有任何云端厂商能偷看你的秘密。
*   🧘 **心流体验**: 独创 **"日记 + 音乐 + AI"** 沉浸式工作台，拒绝枯燥的输入框，让写作成为一种享受。
*   🤖 **AI 伙伴**: 即使离线也能获得情感支持（支持接入本地大模型），它是你的私人心理教练，而不是数据收集器。

## ✨ 核心功能 (v2.0 全新升级)

### 🚀 效率与管理
- **高级检索系统**: 支持按关键词、心情（6种）、天气、标签组合搜索，找回记忆只需一秒。
- **数据可视化**: 自动生成写作习惯图表、心情分布图和热门标签云，看见你的成长轨迹。
- **智能标签管理**: 自动提取日记标签，支持自定义颜色分类，构建个人知识库。
- **多格式导出**: 一键导出 Markdown、HTML 或纯文本，支持打印预览，方便物理备份。

### 🎨 个性与体验
- **沉浸式编辑器**: 支持分屏实时预览、快捷键操作、Markdown 工具栏，专为长文写作打造。
- **音乐娱乐系统**: 内置专业级音乐播放器，支持歌单管理、循环模式和可视化频谱，以乐伴文。
- **多主题定制**: 内置 4 套精美主题（浅色/暖色/清爽/自然）及深色模式，随心切换。

### 🤖 AI 智能特性
- **情感陪伴**: AI 能够理解上下文，提供基于 CBT（认知行为疗法）的情绪疏导。
- **语音转文字**: 集成 Whisper 模型，高精度识别语音日记，释放双手。
- **智能洞察**: 根据你的写作内容生成每日洞察建议。

## 📸 功能预览

| 沉浸写作 | 数据分析 |
|:---:|:---:|
| ![全屏写作](ui/src/assets/fullscreen-preview.png) | ![数据分析](ui/src/assets/analytics-preview.png) |
| **高级检索** | **主题切换** |
| ![高级检索](ui/src/assets/search-preview.png) | ![主题切换](ui/src/assets/theme-preview.png) |

*(注：以上截图需替换为最新 v2.0 版本截图)*

## 🛠 技术架构

- **前端**: React 19, Vite, TailwindCSS, Lucide Icons
- **后端**: FastAPI, Python 3.8+, Whisper (ASR), DashScope (LLM)
- **存储**: 本地文件系统 (Markdown/DOCX/JSON)

## 🗺️ 发展路线图 (Roadmap)

### ✅ 已完成 (v2.0)
- [x] 前端 UI/UX 全面重构
- [x] 高级搜索与过滤系统
- [x] 数据统计与可视化看板
- [x] 多主题与深色模式支持
- [x] 增强型 Markdown 编辑器

### 🚧 进行中 (v2.1 - v2.2)
- [ ] **Docker 一键部署**: 降低安装门槛，让非技术用户也能轻松使用。
- [ ] **本地大模型支持**: 接入 Ollama/LocalAI，实现完全离线的 AI 对话体验。
- [ ] **移动端适配优化**: 开发 PWA 版本，提供接近原生的手机端体验。

### 📅 未来规划 (v3.0+)
- [ ] **云同步 (可选)**: 基于 WebDAV/S3 的私有云同步方案。
- [ ] **社交分享**: 生成精美的日记分享卡片。
- [ ] **语音日记 2.0**: 实时语音识别与情感分析。

## 🚀 快速开始

### 1. 启动后端
```bash
cd server
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. 启动前端
```bash
cd ui
npm install
npm run dev
```

访问 `http://localhost:5173` 开启你的智能日记之旅！

## 📄 详细文档

- 📖 [功能特性详解](FEATURES.md)
- ⚙️ [配置说明](CONFIGURATION.md)
- 📊 [竞品分析报告](竞品分析_DiaryMind_2026-01-06.md) *(New)*
- 📝 [前端优化日志](FRONTEND_OPTIMIZATION_SUMMARY.md) *(New)*

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！让我们一起打造最懂你的日记应用。

---

<p align="center">Made with ❤️ by the DiaryMind Team</p>
