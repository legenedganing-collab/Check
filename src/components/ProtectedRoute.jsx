import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Wraps components that require authentication
 * Automatically redirects to login if user is not authenticated
 * 
 * Usage:
 * <Route 
 *   path="/dashboard" 
 *   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
 * />
 */

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand.darker">
        <div className="text-white text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent border-opacity-75 mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;
