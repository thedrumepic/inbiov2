import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api, isAuthenticated } from '../utils/api';
import PageEditor from '../components/PageEditor';
import { toast } from '../utils/toast';

const EditLink = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    const welcomeShownRef = React.useRef(false);

    useEffect(() => {
        // ProtectedRoute handles auth, just handle welcome state
        if (location.state?.showWelcome && !welcomeShownRef.current) {
            welcomeShownRef.current = true;
            // Use toast.dismiss() to clear any pending toasts
            toast.dismiss();
            toast.success('Добро пожаловать! Ваша страница готова, начните добавлять блоки');

            // Clear location state immediately to prevent re-triggering on re-renders
            navigate(location.pathname, { replace: true, state: {} });
        }

        loadPage();
    }, [username]); // location is omitted to avoid re-triggering when we clear state

    const loadPage = async () => {
        try {
            const response = await api.getPageByUsername(username);
            if (response.ok) {
                const data = await response.json();
                setPage(data.page);
            } else {
                navigate('/404');
            }
        } catch (error) {
            toast.error('Ошибка загрузки');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!page) return null;

    return (
        <PageEditor
            page={page}
            onClose={() => navigate('/dashboard')}
        />
    );
};

export default EditLink;
