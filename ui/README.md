# DiaryMind 前端界面

本项目是DiaryMind应用的前端界面，基于React和Vite构建，采用现代化的前端技术栈。

## 环境要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd DiaryMind/ui
```

### 2. 安装依赖

```bash
npm install
```

或者使用 yarn：

```bash
yarn install
```

### 3. 配置后端API地址

确认 `src/components` 中的组件指向正确的后端API地址。默认情况下，前端假设后端运行在 `http://localhost:8082`。

如果需要更改，请修改各组件中的 `API_BASE` 常量：

```javascript
const API_BASE = "http://your-backend-address:port/api";
```

### 4. 开发模式运行

```bash
npm run dev
```

这将启动开发服务器，通常在 `http://localhost:5173` 上访问。

### 5. 构建生产版本

```bash
npm run build
```

构建后的文件将位于 `dist/` 目录中，可以部署到任何静态文件服务器上。

### 6. 预览生产构建

```bash
npm run preview
```

## 项目结构

```
ui/
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── assets/             # 图片等资源
│   ├── components/         # React组件
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 应用入口
│   └── index.css           # 全局样式
├── index.html              # HTML模板
├── package.json            # 项目配置和依赖
├── vite.config.js          # Vite配置
└── README.md               # 本文档
```

## 核心组件

### App.jsx
主应用组件，包含整体布局和状态管理。

### 主要功能组件

1. **Clock.jsx** - 数字时钟显示
2. **DiaryList.jsx** - 日记列表展示
3. **TodoList.jsx** - 待办事项管理
4. **Calendar.jsx** - 日历视图
5. **InputBar.jsx** - 输入区域
6. **MusicPlayer.jsx** - 音乐播放器
7. **DiaryCollection.jsx** - 日记集合视图
8. **FullScreenDiary.jsx** - 全屏日记编辑器

### UI组件

1. **InteractiveCard.jsx** - 交互式卡片容器
2. **SidebarMenu.jsx** - 侧边栏菜单
3. **SidebarButton.jsx** - 侧边栏按钮

## 自定义配置

### 样式定制

项目使用TailwindCSS进行样式设计。可以通过修改以下文件来自定义外观：

- `src/index.css` - 全局样式
- 各组件中的className属性

### 颜色主题

默认使用黑白手绘风格，可通过修改Tailwind配置或CSS类来自定义颜色。

## 开发指南

### 添加新功能

1. 在 `src/components/` 中创建新的React组件
2. 在 `App.jsx` 中导入并使用新组件
3. 如需与后端交互，在组件中添加相应的API调用

### 组件开发规范

1. 使用函数式组件和Hooks
2. 遵循单一职责原则
3. 使用PropTypes或TypeScript进行类型检查（推荐）

### 状态管理

项目目前使用React内置状态管理。对于复杂应用，可考虑引入Redux或Context API。

## 部署到不同平台

### 静态网站托管

构建后，将 `dist/` 目录中的内容部署到以下平台：

- Vercel
- Netlify
- GitHub Pages
- 任何支持静态文件托管的服务

### Docker部署

创建Dockerfile：

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 代理API请求到后端
    location /api/ {
        proxy_pass http://localhost:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 故障排除

### 常见问题

1. **API连接失败**
   - 检查后端服务是否正在运行
   - 确认API地址配置正确
   - 检查防火墙设置

2. **构建失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npm run build
   ```

3. **开发服务器启动缓慢**
   - 检查系统资源使用情况
   - 关闭不必要的应用程序

### 浏览器兼容性

应用支持所有现代浏览器。对于IE浏览器，需要额外的polyfill支持。

## 性能优化

1. **图片优化**: 使用适当尺寸和格式的图片
2. **代码分割**: 利用Vite的动态导入功能
3. **懒加载**: 对非关键组件实施懒加载
4. **缓存策略**: 合理配置HTTP缓存头

## 技术栈说明

这个模板提供了在Vite中使用React的最小设置，包含HMR（热模块替换）和一些ESLint规则。

目前，有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Babel](https://babeljs.io/)（或在[rolldown-vite](https://vite.dev/guide/rolldown)中使用[oxc](https://oxc.rs)）进行快速刷新
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/) 进行快速刷新

### React Compiler

此模板未启用React Compiler，因为它会影响开发和构建性能。要添加它，请参阅[此文档](https://react.dev/learn/react-compiler/installation)。

### 扩展ESLint配置

如果您正在开发生产应用程序，我们建议使用TypeScript并启用类型感知的lint规则。查看[TS模板](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)了解如何在项目中集成TypeScript和[`typescript-eslint`](https://typescript-eslint.io)。

## 许可证

该项目采用MIT许可证 - 查看[LICENSE](../LICENSE)文件了解详情