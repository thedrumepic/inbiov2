import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getCurrentUser, getAuthToken } from '../utils/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const location = useLocation();

    const checkAuth = useCallback(() => {
        const currentUser = getAuthToken() ? getCurrentUser() : null;
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth, location.pathname]);

    // Also listen to storage changes (in case token is set from another tab/component)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token') {
                checkAuth();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'user') {
            return <Navigate to="/dashboard" replace />;
        }
        return <Navigate to="/404" replace />;
    }

    return children;
};

export default ProtectedRoute;
