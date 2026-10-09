import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import PresentPage from './pages/PresentPage';
import PresenterPage from './pages/PresenterPage';
import AdminPage from './pages/AdminPage';
import PreviewPage from './pages/PreviewPage';
import PublicIndexPage from './pages/PublicIndexPage';
import PublicViewPage from './pages/PublicViewPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
          <Route path="/public" element={<PublicIndexPage />} />
          <Route path="/view/:slug" element={<PublicViewPage />} />
          <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/present/:id" element={<ProtectedRoute><PresentPage /></ProtectedRoute>} />
          <Route path="/presenter/:id" element={<ProtectedRoute><PresenterPage /></ProtectedRoute>} />
          <Route path="/preview/:id" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><AdminPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
