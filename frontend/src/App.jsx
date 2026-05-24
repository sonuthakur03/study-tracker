import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DSATracker from './pages/DSATracker';
import Roadmap from './pages/Roadmap';
import Projects from './pages/Projects';
import College from './pages/College';
import Settings from './pages/Settings';
import Subjects from './pages/Subjects';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDSA from './pages/admin/ManageDSA';
import ManageRoadmap from './pages/admin/ManageRoadmap';
import ManageUsers from './pages/admin/ManageUsers';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTasks from './pages/admin/ManageTasks';
import EmailSettingsPage from './pages/admin/EmailSettings';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dsa" element={<DSATracker />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="projects" element={<Projects />} />
            <Route path="college" element={<College />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subjects" element={<Subjects />} />

            {/* Admin */}
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/dsa" element={<ProtectedRoute adminOnly><ManageDSA /></ProtectedRoute>} />
            <Route path="admin/roadmap" element={<ProtectedRoute adminOnly><ManageRoadmap /></ProtectedRoute>} />
            <Route path="admin/users"     element={<ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>} />
            <Route path="admin/subjects"  element={<ProtectedRoute adminOnly><ManageSubjects /></ProtectedRoute>} />
            <Route path="admin/tasks"     element={<ProtectedRoute adminOnly><ManageTasks /></ProtectedRoute>} />
            <Route path="admin/email"     element={<ProtectedRoute adminOnly><EmailSettingsPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
