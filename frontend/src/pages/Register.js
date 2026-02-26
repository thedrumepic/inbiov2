import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setAuthToken, isAuthenticated } from '../utils/api';
import { toast } from '../utils/toast';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import SocialAuth from '../components/SocialAuth';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(() => {
    return searchParams.get('username') || localStorage.getItem('onboarding_username') || '';
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    // If username in search, sync to localStorage just in case
    const searchUsername = searchParams.get('username');
    if (searchUsername) {
      localStorage.setItem('onboarding_username', searchUsername);
    }
  }, [navigate, searchParams]);


  const handleOAuthSuccess = useCallback((data) => {
    setAuthToken(data.access_token);
    localStorage.removeItem('onboarding_username');
    toast.success('Аккаунт создан');
    if (data.username) {
      navigate(`/edit/${data.username}`, { state: { showWelcome: true } });
    } else {
      navigate('/dashboard');
    }
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

    if (password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register({ email, password, username: username || null });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access_token);
        localStorage.removeItem('onboarding_username');


        if (data.username) {
          navigate(`/edit/${data.username}`, { state: { showWelcome: true } });
        } else {
          navigate('/dashboard');
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка регистрации');
      }
    } catch (error) {
      toast.error('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="register-page">
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
          <h1 className="text-3xl font-bold">Создать аккаунт</h1>
          <p className="text-muted-foreground text-sm">Начните создавать свои страницы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
          {username && (
            <div className="card-glass">
              <div className="text-sm text-muted-foreground mb-1">Ваше имя пользователя</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">inbio.one/</span>
                <span className="text-foreground font-medium">{username}</span>
              </div>
            </div>
          )}

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
              placeholder="Минимум 6 символов"
              disabled={loading}
              data-testid="password-input"
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            data-testid="submit-button"
          >
            {loading ? 'Создание...' : 'Создать аккаунт'}
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
          mode="register"
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />

        <div className="text-center space-y-4">
          <div>
            <span className="text-muted-foreground text-sm">Уже есть аккаунт? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-foreground hover:underline text-sm font-medium"
              data-testid="login-link"
            >
              Войти
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

export default Register;