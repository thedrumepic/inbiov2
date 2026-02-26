import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        // Only manage admin theme for admin routes
        // (PublicPage handles its own theme)
        const isAdminRoute = !['/404'].includes(location.pathname) &&
            !location.pathname.match(/^\/[^/]+$/) ||
            ['/dashboard', '/settings', '/secretroom', '/analytics', '/login', '/register', '/forgot-password', '/reset-password', '/edit'].some(path => location.pathname.startsWith(path)) ||
            location.pathname === '/';

        if (isAdminRoute) {
            const savedTheme = localStorage.getItem('admin_theme') || 'dark';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            // When leaving admin area, ensure we don't leak the admin theme
            // PublicPage will set its own theme based on page settings
            document.documentElement.classList.remove('dark');
        }
    }, [location.pathname]);

    return <>{children}</>;
};

export default AdminLayout;
