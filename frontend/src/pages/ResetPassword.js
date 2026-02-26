import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '../utils/toast';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { api } from '../utils/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Неверная ссылка для сброса пароля');
            return;
        }

        if (!newPassword || !confirmPassword) {
            toast.error('Заполните все поля');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Пароль должен быть не менее 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            const response = await api.resetPasswordConfirm({
                token,
                new_password: newPassword
            });

            if (response.ok) {
                toast.success('Пароль успешно изменён!');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Ошибка сброса пароля');
            }
        } catch (error) {
          toast.error('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8 fade-in text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 backdrop-blur-xl mb-2">
                        <Lock className="w-7 h-7 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-bold">Неверная ссылка</h1>
                    <p className="text-muted-foreground text-sm">
                        Ссылка для сброса пароля недействительна или истекла
                    </p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="btn-primary w-full"
                    >
                        Запросить новую ссылку
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6" data-testid="reset-password-page">
            <div className="w-full max-w-md space-y-8 fade-in">
                <button
                    onClick={() => navigate('/login')}
                    className="btn-ghost flex items-center gap-2"
                    data-testid="back-button"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                </button>

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold">Новый пароль</h1>
                    <p className="text-muted-foreground text-sm">
                        Введите новый пароль для вашего аккаунта
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" data-testid="reset-password-form">
                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Новый пароль</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input pr-10"
                                placeholder="Не менее 6 символов"
                                disabled={loading}
                                data-testid="password-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Подтвердите пароль</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input pr-10"
                                placeholder="Повторите пароль"
                                disabled={loading}
                                data-testid="confirm-password-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                        data-testid="submit-button"
                    >
                        {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
