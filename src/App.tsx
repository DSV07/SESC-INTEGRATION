import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Planner from './pages/Planner';
import Files from './pages/Files';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
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
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="planner" element={<Planner />} />
          <Route path="files" element={<Files />} />
          <Route path="notes" element={<Notes />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

