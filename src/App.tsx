import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Planner from './pages/Planner';
import Files from './pages/Files';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminGuard from './components/AdminGuard';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { checkSession, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      checkSession();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="planner" element={<Planner />} />
          <Route path="files" element={<Files />} />
          <Route path="notes" element={<Notes />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Rota Admin Protegida no Frontend */}
          <Route element={<AdminGuard />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

