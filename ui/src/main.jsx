import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'

export const LoginWrapper = () => {
  const navigate = useNavigate();
  return <Login onLogin={() => navigate('/')} />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '渲染错误' };
  }
  componentDidCatch(error, info) {
    console.error('UI渲染异常', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>页面加载失败</h1>
          <p style={{ marginTop: 8 }}>错误信息：{this.state.message}</p>
          <p style={{ marginTop: 8 }}>请刷新页面或检查控制台错误。</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoot() {
  const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
  if (isFile) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>请通过开发服务器打开项目</h1>
        <p style={{ marginTop: 8 }}>运行命令：npm run dev（目录：ui）</p>
        <p style={{ marginTop: 8 }}>或使用构建后的预览：npm run build && npm run preview</p>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  </StrictMode>,
)
