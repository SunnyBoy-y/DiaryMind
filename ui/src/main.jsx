import { StrictMode } from 'react'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
