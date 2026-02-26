import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken, isAuthenticated } from '../utils/api';
import { toast } from '../utils/toast';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import SocialAuth from '../components/SocialAuth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, []);


  const handleOAuthSuccess = useCallback((data) => {
    setAuthToken(data.access_token);
    toast.success('Вход выполнен');
    navigate('/dashboard');
  }, [navigate]);

  const handleOAuthError = useCallback((message) => {
    toast.error(message);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login({ email, password });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access_token);
        toast.success('Вход выполнен');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка входа');
      }
    } catch (error) {
      toast.error('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-md space-y-8 fade-in">
        <button
          onClick={() => navigate('/')}
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
          <h1 className="text-3xl font-bold">Вход в аккаунт</h1>
          <p className="text-muted-foreground text-sm">Войдите, чтобы управлять страницами</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
              disabled={loading}
              data-testid="email-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              disabled={loading}
              data-testid="password-input"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-muted-foreground hover:text-foreground"
            data-testid="forgot-password"
          >
            Забыли пароль?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            data-testid="submit-button"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-gray-500">Или</span>
          </div>
        </div>

        <SocialAuth
          mode="login"
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />

        <div className="text-center space-y-4">
          <div>
            <span className="text-muted-foreground text-sm">Нет аккаунта? </span>
            <button
              onClick={() => navigate('/')}
              className="text-foreground hover:underline text-sm font-medium"
              data-testid="register-link"
            >
              Создать
            </button>
          </div>
          <div className="flex justify-center pt-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;