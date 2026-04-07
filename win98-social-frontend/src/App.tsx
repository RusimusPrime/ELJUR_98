import { Navigate, Route, Routes } from 'react-router-dom';
import type React from 'react';
import { AppLayout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { FeedPage } from './pages/FeedPage';
import { GroupDetailPage, GroupEditorPage, GroupsPage } from './pages/GroupsPages';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { MessagesPage } from './pages/MessagesPage';
import { PostPage } from './pages/PostPage';
import { AdminPage, ProfilePage, SearchPage } from './pages/ProfileSearchAdminPages';

function Protected({ children }: { children: React.ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="boot-screen">Loading ELJUR 98...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<FeedPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/new" element={<GroupEditorPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="groups/:id/edit" element={<GroupEditorPage />} />
        <Route path="posts/:id" element={<PostPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
