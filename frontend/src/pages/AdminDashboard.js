import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl, getCurrentUser } from '../utils/api';
import { toast } from '../utils/toast';
import {
    ShieldCheck,
    Users,
    FileCode,
    Trash2,
    ArrowLeft,
    Search,
    UserPlus,
    Calendar,
    ExternalLink,
    ChevronRight,
    Check,
    X,
    Lock,
    Mail,
    Send,
    Bell,
    Globe,
    Share2,
    Link2,
    Eye,
    Clock,
    CheckCheck,
    BadgeCheck,
    Pencil,
    Settings,
    User,
    MessageCircle
} from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { SOCIAL_PLATFORMS } from '../components/blocks/LinkBlock';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [verificationFilter, setVerificationFilter] = useState('all'); // all, pending, approved, cancelled

    const [password, setPassword] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Подтвердить',
        variant: 'primary',
        onConfirm: () => { }
    });

    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedPageSettings, setSelectedPageSettings] = useState(null);
    const [rejectionModal, setRejectionModal] = useState({
        isOpen: false,
        requestId: null,
        reason: '',
        type: 'reject' // 'reject' or 'cancel'
    });
    // Settings
    const [settings, setSettings] = useState({ welcome_modal_duration: 10 });
    const [savingSettings, setSavingSettings] = useState(false);

    const [notificationForm, setNotificationForm] = useState({
        message: '',
        targetType: 'all', // all, selected, single
        singleUserEmail: ''
    });
    const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);

    // Notification History State
    const [notificationTab, setNotificationTab] = useState('new'); // 'new', 'history'
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null); // Full details
    const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);

    // Reserved Usernames State
    const [reservedUsernames, setReservedUsernames] = useState([]);
    const [newReservedUsername, setNewReservedUsername] = useState('');
    const [reservedUsernameComment, setReservedUsernameComment] = useState('');

    // Support Bot State
    const [supportItems, setSupportItems] = useState([]);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [editingSupportItem, setEditingSupportItem] = useState(null);

    useEffect(() => {
        const savedPassword = sessionStorage.getItem('adminPassword');
        if (savedPassword) {
            fetchData(savedPassword);
        } else {
            fetchData();
        }

        // Set up polling (every 5 seconds), silent mode — без тостов
        const intervalId = setInterval(() => {
            fetchData(null, true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async (pwd = null, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const options = {};
            const currentPassword = pwd || sessionStorage.getItem('adminPassword');

            if (currentPassword) {
                options.headers = { 'X-Admin-Password': currentPassword };
            }

            const statsRes = await api.getAdminStats(options);

            if (statsRes.status === 403 || statsRes.status === 401) {
                setIsLocked(true);
                if (!silent) setLoading(false);
                return;
            }

            const usersRes = await api.getAdminUsers(options);
            const requestsRes = await api.getVerificationRequests(options);
            const campaignsRes = await api.getAdminCampaigns(options);
            const settingsRes = await api.getAdminSettings(options);
            const supportRes = await api.getAdminSupport(options);

            if (statsRes.ok) {
                setStats(await statsRes.json());
                setIsLocked(false);
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    if (Array.isArray(usersData)) setUsers(usersData);
                }
                if (requestsRes.ok) {
                    const requestsData = await requestsRes.json();
                    if (Array.isArray(requestsData)) setRequests(requestsData);
                }
                if (campaignsRes && campaignsRes.ok) {
                    const campaignsData = await campaignsRes.json();
                    if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
                }
                if (settingsRes && settingsRes.ok) {
                    setSettings(await settingsRes.json());
                }
                if (supportRes && supportRes.ok) {
                    setSupportItems(await supportRes.json());
                }
            } else if (!silent) {
                toast.error('Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (!silent) setIsLocked(true);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchReservedUsernames = async () => {
        try {
            const res = await api.getReservedUsernames();
            if (res.ok) {
                const data = await res.json();
                setReservedUsernames(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddReservedUsername = async (e) => {
        e.preventDefault();
        if (!newReservedUsername.trim()) return;

        try {
            const res = await api.addReservedUsername({
                username: newReservedUsername,
                comment: reservedUsernameComment
            });
            if (res.ok) {
                toast.success('Имя добавлено в резерв');
                setNewReservedUsername('');
                setReservedUsernameComment('');
                fetchReservedUsernames();
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Ошибка');
            }
        } catch (e) {
            toast.error('Ошибка сети');
        }
    };

    const handleDeleteReservedUsername = async (username) => {
        if (!window.confirm(`Удалить ${username} из резерва?`)) return;
        try {
            const res = await api.deleteReservedUsername(username);
            if (res.ok) {
                toast.success('Имя удалено из резерва');
                fetchReservedUsernames();
            } else {
                toast.error('Ошибка');
            }
        } catch (e) {
            toast.error('Ошибка сети');
        }
    };

    // Подгрузка списка при переключении на вкладку настроек
    useEffect(() => {
        if (activeTab === 'settings') {
            fetchReservedUsernames();
        }
    }, [activeTab]);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setUnlocking(true);
        sessionStorage.setItem('adminPassword', password);
        // Пробуем загрузить с новым паролем
        await fetchData(password);
        setUnlocking(false);
    };

    const getAuthOptions = () => {
        const pwd = sessionStorage.getItem('adminPassword');
        return pwd ? { headers: { 'X-Admin-Password': pwd } } : {};
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const openConfirm = ({ title, message, confirmText, variant, onConfirm }) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            confirmText,
            variant,
            onConfirm
        });
    };

    const handleDeleteUser = (userId) => {
        openConfirm({
            title: "Удалить пользователя?",
            message: "Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.",
            confirmText: "Удалить",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const response = await api.deleteUser(userId, getAuthOptions());
                    if (response.ok) {
                        toast.success('Пользователь удален');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка удаления');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };

    const handleMakeOwner = (userId) => {
        openConfirm({
            title: "Выдать права владельца?",
            message: "Этот пользователь получит полный доступ к админ-панели. Вы уверены?",
            confirmText: "Выдать права",
            variant: "primary",
            onConfirm: async () => {
                try {
                    const response = await api.makeAdmin(userId, getAuthOptions());
                    if (response.ok) {
                        toast.success('Права владельца выданы');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка изменения роли');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };

    const handleApprove = (req) => {
        const isBrand = req.req_type === 'brand';
        openConfirm({
            title: isBrand ? "Одобрить статус бренда?" : "Одобрить верификацию?",
            message: isBrand
                ? `Страница "${req.full_name}" получит статус подтвержденного бренда.`
                : "Пользователь получит галочку верификации.",
            confirmText: "Одобрить",
            variant: "success",
            onConfirm: async () => {
                try {
                    const response = await api.approveVerification(req.id, getAuthOptions());
                    if (response.ok) {
                        toast.success('Заявка одобрена');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };

    const handleReject = (req) => {
        setRejectionModal({
            isOpen: true,
            requestId: req.id,
            reason: '',
            type: 'reject'
        });
    };

    const confirmRejection = async () => {
        if (rejectionModal.type === 'reject' && !rejectionModal.reason.trim()) {
            toast.error('Укажите причину');
            return;
        }

        const currentId = rejectionModal.requestId;
        const currentReason = rejectionModal.reason;
        const currentType = rejectionModal.type;

        try {
            const isCancel = currentType === 'cancel';
            // We set modal to closed immediately to satisfy the user's need for responsiveness
            setRejectionModal({ isOpen: false, requestId: null, reason: '', type: 'reject' });

            const response = isCancel
                ? await api.cancelVerification(currentId, currentReason, getAuthOptions())
                : await api.rejectVerification(currentId, currentReason, getAuthOptions());

            if (response.ok) {
                toast.success(isCancel ? 'Верификация отменена' : 'Заявка отклонена');
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Ошибка');
                // If it really failed, we might want to let user know, but they said it works,
                // so the success toast above handles the "good" case.
            }
        } catch (error) {
            console.error('Rejection error:', error);
            // Only show connection error if we haven't already shown success
            // But since this is a catch, success hasn't been shown.
            // If the user says it "works", then the request reached the server.
            toast.error('Ошибка соединения');
        }
    };

    const handleCancelVerification = (req) => {
        setRejectionModal({
            isOpen: true,
            requestId: req.id,
            reason: '',
            type: 'cancel'
        });
    };

    const handleGrantVerification = (userId) => {
        openConfirm({
            title: "Выдать верификацию?",
            message: "Выдать верификацию этому пользователю вручную?",
            confirmText: "Выдать",
            variant: "success",
            onConfirm: async () => {
                try {
                    const response = await api.grantDirectVerification(userId, getAuthOptions());
                    if (response.ok) {
                        toast.success('Верификация выдана');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };
    const handleDeleteVerificationRequest = (requestId) => {
        openConfirm({
            title: "Удалить заявку?",
            message: "Вы действительно хотите безвозвратно удалить эту запись из истории заявок?",
            confirmText: "Удалить",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const response = await api.deleteVerification(requestId, getAuthOptions());
                    if (response.ok) {
                        toast.success('Заявка удалена');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };

    const handleResume = (req) => {
        openConfirm({
            title: "Возобновить заявку?",
            message: "Заявка снова перейдет в статус ожидания. Вы сможете пересмотреть решение.",
            confirmText: "Возобновить",
            variant: "primary",
            onConfirm: async () => {
                try {
                    const response = await api.resumeVerification(req.id, getAuthOptions());
                    if (response.ok) {
                        toast.success('Заявка возобновлена');
                        fetchData();
                    } else {
                        const error = await response.json();
                        toast.error(error.detail || 'Ошибка');
                    }
                } catch (error) {
                    toast.error('Ошибка соединения');
                }
            }
        });
    };

    const handleSendNotification = async () => {
        if (!notificationForm.message.trim()) {
            toast.error('Введите текст уведомления');
            return;
        }

        const data = {
            message: notificationForm.message,
            all_users: notificationForm.targetType === 'all'
        };

        if (notificationForm.targetType === 'selected') {
            if (selectedUserIds.length === 0) {
                toast.error('Выберите пользователей');
                return;
            }
            data.user_ids = selectedUserIds;
        } else if (notificationForm.targetType === 'single') {
            if (!notificationForm.singleUserEmail.trim()) {
                toast.error('Укажите Email пользователя');
                return;
            }
            data.emails = [notificationForm.singleUserEmail.trim()];
        }

        setIsSubmittingNotification(true);
        try {
            const response = await api.sendAdminNotification(data, getAuthOptions());
            if (response.ok) {
                const result = await response.json();
                toast.success(`Отправлено уведомлений: ${result.count}`);
                setNotificationForm({ ...notificationForm, message: '', singleUserEmail: '' });
                if (notificationForm.targetType === 'selected') setSelectedUserIds([]);
            } else {
                toast.error('Ошибка при отправке');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setIsSubmittingNotification(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const response = await api.updateAdminSettings(settings, getAuthOptions());
            if (response.ok) {
                toast.success('Настройки сохранены');
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Ошибка сохранения');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleViewCampaign = async (campaign) => {
        setIsLoadingCampaign(true);
        setSelectedCampaign(null);
        try {
            const response = await api.getAdminCampaignDetails(campaign.id, getAuthOptions());
            if (response.ok) {
                const data = await response.json();
                setSelectedCampaign(data);
            } else {
                toast.error('Ошибка загрузки деталей');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setIsLoadingCampaign(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleAllUsers = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        }
    };

    const CustomCheckbox = ({ checked, onChange, indeterminate = false }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${checked || indeterminate
                ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                : 'bg-secondary border-border hover:border-primary/50'
                }`}
        >
            {checked && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />}
            {!checked && indeterminate && <div className="w-2 h-0.5 bg-primary-foreground rounded-full" />}
        </button>
    );

    const handleSaveSupportItem = async (data) => {
        try {
            let res;
            if (editingSupportItem) {
                res = await api.updateAdminSupport(editingSupportItem.id, data, getAuthOptions());
            } else {
                res = await api.createAdminSupport(data, getAuthOptions());
            }
            if (res.ok) {
                toast.success('Сохранено');
                setIsSupportModalOpen(false);
                setEditingSupportItem(null);
                fetchData(null, true);
            } else {
                toast.error('Ошибка сохранения');
            }
        } catch (e) {
            toast.error('Ошибка сети');
        }
    };

    const handleDeleteSupportItem = async (id) => {
        if (!window.confirm('Удалить этот вопрос?')) return;
        try {
            const res = await api.deleteAdminSupport(id, getAuthOptions());
            if (res.ok) {
                toast.success('Удалено');
                fetchData(null, true);
            } else {
                toast.error('Ошибка удаления');
            }
        } catch (e) {
            toast.error('Ошибка сети');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !stats && !isLocked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center font-mono">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin" />
                    <p className="text-[#10b981] animate-pulse">ЗАГРУЗКА...</p>
                </div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-sm p-8 rounded-xl border border-border shadow-lg">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">SECRET ROOM</h1>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={unlocking}
                            className={`w-full py-2 rounded-lg font-medium transition-colors ${unlocking
                                ? 'bg-muted text-muted-foreground cursor-wait'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {unlocking ? 'Проверка...' : 'Войти'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-6">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">SECRET ROOM</h1>
                        <p className="text-sm text-muted-foreground">
                            Управление пользователями и контентом
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> На страницу пользователя
                </button>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 text-muted-foreground mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Всего пользователей</span>
                        </div>
                        <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
                    </div>
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 text-muted-foreground mb-2">
                            <FileCode className="w-4 h-4" />
                            <span className="text-sm font-medium">Всего страниц</span>
                        </div>
                        <div className="text-3xl font-bold">{stats?.total_pages || 0}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Пользователи
                    </button>
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'verification' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Верификация ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Рассылка
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Функции сайта
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'support' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Bot Support
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold">Все пользователи</h2>
                                {selectedUserIds.length > 0 && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                        Выбрано: {selectedUserIds.length}
                                    </span>
                                )}
                            </div>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Поиск по email или нику..."
                                    className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium w-10">
                                            <CustomCheckbox
                                                checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                                                indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length}
                                                onChange={toggleAllUsers}
                                            />
                                        </th>
                                        <th className="px-6 py-3 font-medium">Пользователь</th>
                                        <th className="px-6 py-3 font-medium">Никнейм</th>
                                        <th className="px-6 py-3 font-medium text-center">Верификация</th>
                                        <th className="px-6 py-3 font-medium">Роль</th>
                                        <th className="px-6 py-3 font-medium">Дата регистрации</th>
                                        <th className="px-6 py-3 font-medium text-right">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                        <tr key={user.id} className={`hover:bg-accent/50 transition-colors cursor-default ${selectedUserIds.includes(user.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <CustomCheckbox
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-secondary shrink-0">
                                                        {user.avatar ? (
                                                            <img src={getImageUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                                                                <User className="w-4 h-4 opacity-50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {user.pages && user.pages.length > 0 ? (
                                                        user.pages.map(page => (
                                                            <div key={page.id} className="flex items-center gap-2 text-sm bg-secondary/30 p-1.5 rounded-[6px] group">
                                                                {page.is_brand ? (
                                                                    <Tooltip content="Бренд">
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip content="Личная">
                                                                        <User className="w-3.5 h-3.5 text-blue-400" />
                                                                    </Tooltip>
                                                                )}
                                                                <a href={`/${page.username}`} target="_blank" className="hover:underline truncate max-w-[100px] sm:max-w-[150px] font-mono text-xs">
                                                                    /{page.username}
                                                                </a>
                                                                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                                                                    <Tooltip content="Изменить ссылку">
                                                                        <button
                                                                            onClick={() => setSelectedPageSettings(page)}
                                                                            className="p-1 hover:bg-background rounded text-muted-foreground hover:text-orange-400"
                                                                        >
                                                                            <Settings className="w-3 h-3" />
                                                                        </button>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-xs">Нет страниц</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    {user.is_verified ? (
                                                        <BadgeCheck className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGrantVerification(user.id)}
                                                            className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all border border-green-500/20 active:scale-95"
                                                        >
                                                            Выдать
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'owner'
                                                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                    : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {user.role === 'owner' ? 'Владелец' : 'Пользователь'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => window.open(`/edit/${user.username}`, '_blank')}
                                                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-blue-500"
                                                        title="Редактировать страницу"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setNotificationForm({
                                                                ...notificationForm,
                                                                targetType: 'single',
                                                                singleUserEmail: user.email
                                                            });
                                                            setActiveTab('notifications');
                                                        }}
                                                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                                        title="Отправить уведомление"
                                                    >
                                                        <Bell className="w-4 h-4" />
                                                    </button>
                                                    {user.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleMakeOwner(user.id)}
                                                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                            title="Сделать владельцем"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                                                            title="Удалить пользователя"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                                                Пользователи не найдены
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'verification' && (
                    <div className="space-y-4">
                        {/* Sub-filters for Verification */}
                        <div className="flex gap-2 p-1 bg-secondary w-fit rounded-lg border border-border">
                            {[
                                { id: 'all', label: 'Все', count: requests.length },
                                { id: 'pending', label: 'Заявки', count: requests.filter(r => r.status === 'pending').length, color: 'text-blue-500' },
                                { id: 'approved', label: 'Верифицированы', count: requests.filter(r => r.status === 'approved').length, color: 'text-green-500' },
                                { id: 'cancelled', label: 'Отмененные', count: requests.filter(r => r.status === 'cancelled').length, color: 'text-red-500' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setVerificationFilter(filter.id)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${verificationFilter === filter.id
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {filter.label}
                                    <span className={`px-1.5 py-0.5 rounded-full bg-secondary text-[10px] ${filter.color || 'text-muted-foreground'}`}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border">
                                <h2 className="text-lg font-semibold">
                                    {verificationFilter === 'all' ? 'Все запросы' :
                                        verificationFilter === 'pending' ? 'Новые заявки' :
                                            verificationFilter === 'approved' ? 'Верифицированные' : 'Отмененные заявки'}
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium w-32">Заявитель / Тип</th>
                                            <th className="px-6 py-3 font-medium">Детали</th>
                                            <th className="px-6 py-3 font-medium">Контакты / Ссылки</th>
                                            <th className="px-6 py-3 font-medium">Комментарий / Причина</th>
                                            <th className="px-6 py-3 font-medium w-24 text-center">Статус</th>
                                            <th className="px-6 py-3 font-medium text-right">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(() => {
                                            const filteredRequests = requests.filter(req => {
                                                if (verificationFilter === 'all') return true;
                                                if (verificationFilter === 'pending') return req.status === 'pending' || req.status === 'rejected';
                                                if (verificationFilter === 'approved') return req.status === 'approved';
                                                if (verificationFilter === 'cancelled') return req.status === 'cancelled';
                                                return false;
                                            });

                                            if (filteredRequests.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                                                            Нет данных для отображения
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filteredRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-accent/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span className={`w-fit px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${req.req_type === 'brand'
                                                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                                }`}>
                                                                {req.req_type === 'brand' ? 'Бренд' : 'Личная'}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground truncate max-w-[140px]">{req.full_name}</span>
                                                                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{req.user_email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {req.page_username && (
                                                                <a
                                                                    href={`/${req.page_username}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" /> /{req.page_username}
                                                                </a>
                                                            )}
                                                            {req.category && <span className="text-[11px] text-muted-foreground">{req.category}</span>}
                                                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">{req.document_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            {req.social_links && req.social_links.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {req.social_links.map((link, idx) => {
                                                                        const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                                                                        return (
                                                                            <a
                                                                                key={idx}
                                                                                href={link.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="w-7 h-7 flex items-center justify-center bg-secondary border border-border rounded-md hover:border-primary/50 transition-colors"
                                                                                title={link.url}
                                                                            >
                                                                                {platform?.icon ? (
                                                                                    <img src={getImageUrl(platform.icon)} className="w-4 h-4 object-contain opacity-70" alt="" />
                                                                                ) : (
                                                                                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                                                )}
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">Без ссылок</span>
                                                            )}
                                                            <span className="text-xs font-semibold text-foreground/80 break-all">{req.contact_info}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-[200px]">
                                                            {req.bio && (
                                                                <div className="mb-2">
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">О себе:</span>
                                                                    <p className="text-xs text-foreground line-clamp-3 leading-relaxed" title={req.bio}>
                                                                        {req.bio}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {req.comment && (
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Комментарий:</span>
                                                                    <p className="text-xs text-muted-foreground italic line-clamp-2" title={req.comment}>
                                                                        "{req.comment}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {!req.bio && !req.comment && <span className="text-muted-foreground">-</span>}
                                                            {req.rejection_reason && (
                                                                <div className="text-[10px] text-red-500 font-medium mt-2 p-1 bg-red-500/5 rounded border border-red-500/10">
                                                                    ОТКАЗ: {req.rejection_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                            req.status === 'rejected' || req.status === 'revoked' || req.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                            {req.status === 'pending' ? 'Ожидание' :
                                                                req.status === 'approved' ? 'Одобрено' :
                                                                    req.status === 'revoked' ? 'Отозвано' :
                                                                        req.status === 'cancelled' ? 'Отменено' : 'Отказ'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {!req.page_is_verified && req.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(req)}
                                                                        className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                                                                        title="Одобрить"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(req)}
                                                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                                                        title="Отклонить"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {(req.status === 'rejected' || req.status === 'cancelled') && (
                                                                <button
                                                                    onClick={() => handleResume(req)}
                                                                    className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                                                    title="Возобновить рассмотрение"
                                                                >
                                                                    Возобновить
                                                                </button>
                                                            )}

                                                            {req.page_is_verified && (
                                                                <button
                                                                    onClick={() => handleCancelVerification(req)}
                                                                    className="p-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                                                    title="Отменить верификацию"
                                                                >
                                                                    Отозвать
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleDeleteVerificationRequest(req.id)}
                                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                                                                title="Удалить запись"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Рассылка уведомлений</h2>
                                    <p className="text-sm text-muted-foreground">Отправка сообщений и история рассылок</p>
                                </div>
                            </div>
                            <div className="flex bg-secondary p-1 rounded-lg">
                                <button
                                    onClick={() => setNotificationTab('new')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${notificationTab === 'new'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Новая рассылка
                                </button>
                                <button
                                    onClick={() => setNotificationTab('history')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${notificationTab === 'history'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    История
                                </button>
                            </div>
                        </div>

                        {notificationTab === 'new' ? (
                            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium mb-3">Кому отправить:</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setNotificationForm({ ...notificationForm, targetType: 'all' })}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${notificationForm.targetType === 'all'
                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                                : 'bg-secondary border-border text-foreground hover:border-primary/50'
                                                }`}
                                        >
                                            Всем пользователям
                                        </button>
                                        <button
                                            onClick={() => setNotificationForm({ ...notificationForm, targetType: 'selected' })}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${notificationForm.targetType === 'selected'
                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                                : 'bg-secondary border-border text-foreground hover:border-primary/50'
                                                }`}
                                        >
                                            Выбранным ({selectedUserIds.length})
                                        </button>
                                        <button
                                            onClick={() => setNotificationForm({ ...notificationForm, targetType: 'single' })}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${notificationForm.targetType === 'single'
                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                                : 'bg-secondary border-border text-foreground hover:border-primary/50'
                                                }`}
                                        >
                                            Конкретному (Email)
                                        </button>
                                    </div>
                                </div>

                                {notificationForm.targetType === 'single' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Email Пользователя</label>
                                        <input
                                            type="email"
                                            list="user-emails"
                                            value={notificationForm.singleUserEmail}
                                            onChange={(e) => setNotificationForm({ ...notificationForm, singleUserEmail: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                            placeholder="Напр: user@example.com"
                                        />
                                        <datalist id="user-emails">
                                            {users.map(u => (
                                                <option key={u.id} value={u.email}>{u.username ? `@${u.username}` : ''}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                )}

                                {notificationForm.targetType === 'selected' && selectedUserIds.length === 0 && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-xl text-sm flex items-start gap-3">
                                        <div className="shrink-0 mt-0.5">⚠️</div>
                                        <p>Вы не выбрали ни одного пользователя. Перейдите во вкладку <b>Пользователи</b> и отметьте нужных галочками или используйте другой режим.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Текст сообщения</label>
                                    <textarea
                                        value={notificationForm.message}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none min-h-[120px] transition-all resize-none"
                                        placeholder="Введите текст сообщения..."
                                    />
                                </div>

                                <button
                                    onClick={handleSendNotification}
                                    disabled={isSubmittingNotification}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSubmittingNotification
                                        ? 'bg-muted text-muted-foreground cursor-wait'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                                        }`}
                                >
                                    <Send className={`w-5 h-5 ${isSubmittingNotification ? 'animate-bounce' : ''}`} />
                                    {isSubmittingNotification ? 'Отправка...' : 'Отправить уведомления'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                {campaigns.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>История рассылок пуста</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-border rounded-xl">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted text-muted-foreground">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Дата</th>
                                                    <th className="px-6 py-3 font-medium">Сообщение</th>
                                                    <th className="px-6 py-3 font-medium">Тип</th>
                                                    <th className="px-6 py-3 font-medium text-center">Получатели</th>
                                                    <th className="px-6 py-3 font-medium text-center">Прочитано</th>
                                                    <th className="px-6 py-3 font-medium text-right">Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {campaigns.map((camp) => (
                                                    <tr key={camp.id} className="hover:bg-accent/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                {new Date(camp.created_at).toLocaleString('ru-RU')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="line-clamp-2 max-w-sm" title={camp.message}>{camp.message}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${camp.target_type === 'all' ? 'bg-blue-500/10 text-blue-500' :
                                                                camp.target_type === 'selected' ? 'bg-purple-500/10 text-purple-500' :
                                                                    'bg-orange-500/10 text-orange-500'
                                                                }`}>
                                                                {camp.target_type === 'all' ? 'Всем' :
                                                                    camp.target_type === 'selected' ? 'Выбранным' : 'Личное'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold">
                                                            {camp.total_recipients}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className={camp.read_count > 0 ? "text-green-500 font-bold" : "text-muted-foreground"}>
                                                                    {camp.read_count}
                                                                </span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    ({Math.round((camp.read_count / (camp.total_recipients || 1)) * 100)}%)
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleViewCampaign(camp)}
                                                                className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary hover:text-primary/80"
                                                                title="Детальная аналитика"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold">Функции сайта</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium w-64">Настройка</th>
                                            <th className="px-6 py-3 font-medium">Значение</th>
                                            <th className="px-6 py-3 font-medium">Описание</th>
                                            <th className="px-6 py-3 font-medium text-right w-32">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        <tr className="hover:bg-accent/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                    </div>
                                                    Длительность приветствия
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4 max-w-sm">
                                                    <span className="text-sm font-mono bg-secondary px-2 py-1 rounded min-w-[3rem] text-center border border-border">
                                                        {settings.welcome_modal_duration}s
                                                    </span>
                                                    <div className="flex-1">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="60"
                                                            value={settings.welcome_modal_duration}
                                                            onChange={(e) => setSettings({ ...settings, welcome_modal_duration: parseInt(e.target.value) })}
                                                            className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="60"
                                                        value={settings.welcome_modal_duration}
                                                        onChange={(e) => setSettings({ ...settings, welcome_modal_duration: parseInt(e.target.value) || 10 })}
                                                        className="w-16 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-center focus:border-primary outline-none transition-all hidden sm:block"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-xs leading-relaxed">
                                                Время, которое новый пользователь проводит на приветственном экране перед началом работы.
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={handleSaveSettings}
                                                    disabled={savingSettings}
                                                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border active:scale-95 ${savingSettings
                                                        ? 'bg-muted text-muted-foreground border-transparent cursor-wait'
                                                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 active:bg-primary/30 shadow-sm'
                                                        }`}
                                                    title="Сохранить"
                                                >
                                                    <div className="flex items-center gap-2 px-2">
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Сохранить</span>
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Reserved Usernames Section */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" />
                                    Резерв имен
                                </h2>
                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{reservedUsernames.length} зарезервировано</span>
                            </div>

                            <div className="p-6 border-b border-border bg-accent/20">
                                <form onSubmit={handleAddReservedUsername} className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Имя пользователя (например: admin)"
                                            value={newReservedUsername}
                                            onChange={(e) => setNewReservedUsername(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <div className="flex-[2]">
                                        <input
                                            type="text"
                                            placeholder="Комментарий (необязательно)"
                                            value={reservedUsernameComment}
                                            onChange={(e) => setReservedUsernameComment(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newReservedUsername.trim()}
                                        className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        Добавить
                                    </button>
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Username</th>
                                            <th className="px-6 py-3 font-medium">Комментарий</th>
                                            <th className="px-6 py-3 font-medium">Дата создания</th>
                                            <th className="px-6 py-3 font-medium text-right">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {reservedUsernames.length > 0 ? (
                                            reservedUsernames.map((item) => (
                                                <tr key={item.username} className="hover:bg-accent/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-medium text-primary">
                                                        @{item.username}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {item.comment || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteReservedUsername(item.username)}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                            title="Удалить из резерва"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                    Список резерва пуст
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'support' && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-primary" />
                                База знаний бота
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingSupportItem(null);
                                    setIsSupportModalOpen(true);
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                            >
                                + Добавить вопрос
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Категория</th>
                                        <th className="px-6 py-3 font-medium">Вопрос</th>
                                        <th className="px-6 py-3 font-medium">Ответ</th>
                                        <th className="px-6 py-3 font-medium">Ключевые слова</th>
                                        <th className="px-6 py-3 font-medium text-right">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {supportItems.map(item => (
                                        <tr key={item.id} className="hover:bg-accent/50">
                                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground uppercase">{item.category}</td>
                                            <td className="px-6 py-4 font-medium">{item.question}</td>
                                            <td className="px-6 py-4 text-muted-foreground line-clamp-2 max-w-xs" title={item.answer}>{item.answer}</td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">{item.keywords?.join(', ')}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setEditingSupportItem(item); setIsSupportModalOpen(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg mr-2"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSupportItem(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {supportItems.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">База знаний пуста</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main >

            {/* Rejection Modal */}
            {
                rejectionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-card w-full max-w-md border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">
                                    {rejectionModal.type === 'cancel' ? 'Причина отмены' : 'Укажите причину отказа'}
                                </h3>
                                <button onClick={() => setRejectionModal({ isOpen: false, requestId: null, reason: '', type: 'reject' })} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {rejectionModal.type === 'cancel'
                                    ? 'Причина (необязательно). Если оставить поле пустым, пользователь получит стандартное уведомление.'
                                    : 'Причина будет отправлена пользователю в уведомлении.'}
                            </p>
                            <textarea
                                className="w-full bg-secondary border border-border rounded-xl p-4 text-sm focus:border-primary outline-none min-h-[100px] mb-6"
                                placeholder={rejectionModal.type === 'cancel' ? "Например: Нарушение условий использования или Изменение статуса..." : "Например: Недостаточно данных для подтверждения..."}
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRejectionModal({ isOpen: false, requestId: null, reason: '', type: 'reject' })}
                                    className="flex-1 py-3 bg-secondary hover:bg-muted font-medium rounded-xl transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmRejection}
                                    className={`flex-1 py-3 text-white font-medium rounded-xl transition-colors shadow-lg ${rejectionModal.type === 'cancel'
                                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                        : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                        }`}
                                >
                                    {rejectionModal.type === 'cancel' ? 'Отменить статус' : 'Отклонить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Campaign Details Modal */}
            {
                selectedCampaign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-card w-full max-w-2xl border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold">Детали рассылки</h3>
                                    <p className="text-sm text-muted-foreground">Отправлено: {new Date(selectedCampaign.campaign.created_at).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedCampaign(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-secondary/50 rounded-xl shrink-0">
                                <p className="text-sm font-medium mb-1 text-muted-foreground uppercase text-xs">Сообщение:</p>
                                <p className="text-sm">{selectedCampaign.campaign.message}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 border border-border rounded-xl">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-muted-foreground sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Пользователь</th>
                                            <th className="px-4 py-2 font-medium">Email</th>
                                            <th className="px-4 py-2 font-medium text-center">Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {selectedCampaign.recipients.map((user) => (
                                            <tr key={user.id} className="hover:bg-accent/50">
                                                <td className="px-4 py-3 font-medium">
                                                    {user.username ? `@${user.username}` : 'Без имени'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                    {user.email}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {user.read ? (
                                                        <span className="inline-flex items-center gap-1 text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-full text-xs">
                                                            <CheckCheck className="w-3 h-3" /> Прочитано
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary px-2 py-1 rounded-full text-xs">
                                                            <Clock className="w-3 h-3" /> Отправлено
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedCampaign.recipients.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                    Список получателей пуст
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end shrink-0">
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
            {
                selectedPageSettings && (
                    <AdminPageSettingsModal
                        page={selectedPageSettings}
                        onClose={() => setSelectedPageSettings(null)}
                        onSuccess={() => {
                            setSelectedPageSettings(null);
                            fetchData(null, true);
                        }}
                    />
                )
            }

            {
                isSupportModalOpen && (
                    <SupportItemModal
                        item={editingSupportItem}
                        onClose={() => setIsSupportModalOpen(false)}
                        onSave={handleSaveSupportItem}
                    />
                )
            }
        </div >
    );
};

// New Admin Page Settings Modal
const AdminPageSettingsModal = ({ page, onClose, onSuccess }) => {
    const [newUsername, setNewUsername] = useState(page.username);
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newUsername.trim()) {
            toast.error('Введите ник');
            return;
        }

        setSaving(true);
        try {
            // Admin bypasses reserved checks automatically on backend
            // We use the same updateUsername endpoint
            const response = await api.updateUsername(page.id, newUsername);
            if (response.ok) {
                toast.success('Ссылка успешно обновлена (Admin Override)!');
                onSuccess();
            } else {
                const errorData = await response.json();
                toast.error(errorData.detail || 'Ошибка обновления');
            }
        } catch (error) {
            toast.error('Ошибка сети');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={onClose}>
            <div className="bg-card border border-border rounded-[12px] p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Изменить ссылку (Admin)</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1">Новый username</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-[8px]">
                            <span className="text-muted-foreground text-sm">inbio.one/</span>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="flex-1 bg-transparent border-none outline-none text-foreground text-sm"
                                placeholder="username"
                            />
                        </div>
                        <p className="text-[10px] text-yellow-500 mt-1">
                            * Внимание: Вы меняете ссылку от имени администратора. Проверка на резерв будет проигнорирована.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-secondary rounded-[8px] text-sm transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-[8px] text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const SupportItemModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        question: item?.question || '',
        answer: item?.answer || '',
        keywords: item?.keywords ? item.keywords.join(', ') : '',
        category: item?.category || 'general'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        });
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={onClose}>
            <div className="bg-card border border-border rounded-[12px] p-6 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{item ? 'Редактировать вопрос' : 'Новый вопрос'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1">Вопрос / Триггер</label>
                        <input
                            type="text"
                            required
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-[8px] px-3 py-2 outline-none focus:border-primary"
                            placeholder="Как стать популярным?"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1">Ответ</label>
                        <textarea
                            required
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-[8px] px-3 py-2 outline-none focus:border-primary min-h-[100px]"
                            placeholder="Markdown поддерживается..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Категория</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-[8px] px-3 py-2 outline-none focus:border-primary"
                            >
                                <option value="general">Общее</option>
                                <option value="profile">Профиль и Аккаунт</option>
                                <option value="blocks">Типы Блоков</option>
                                <option value="sort">Сортировка и Публикация</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Ключевые слова</label>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full bg-secondary border border-border rounded-[8px] px-3 py-2 outline-none focus:border-primary"
                                placeholder="через запятую"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-secondary rounded-[8px] text-sm transition-colors">Отмена</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-[8px] text-sm font-medium hover:opacity-90">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
