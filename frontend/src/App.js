import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import BusinessRegistration from './components/BusinessRegistration';
import BusinessList from './components/BusinessList';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import MyBusiness from './components/MyBusiness';
import AdminDashboard from './components/AdminDashboard';
import PasswordReset from './components/PasswordReset';
import './App.css';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

// Admin Route component
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !user.is_superuser) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// Business Owner Route component
function BusinessOwnerRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || (!user.is_business_owner && !user.is_superuser)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// Layout with Navbar
function Layout() {
  return (
    <>
      <Navbar />
      <div className="content-container">
        <Outlet />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            
            {/* Protected routes with navbar layout */}
            <Route 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<BusinessRegistration />} />
              <Route 
                path="/businesses" 
                element={
                  <AdminRoute>
                    <BusinessList />
                  </AdminRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
              <Route 
                path="/my-business" 
                element={
                  <BusinessOwnerRoute>
                    <MyBusiness />
                  </BusinessOwnerRoute>
                }
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
            </Route>
            
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
