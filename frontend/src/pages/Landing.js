import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isAuthenticated } from '../utils/api';
import { toast } from '../utils/toast';
import { ArrowRight, CircleCheck, CircleX } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useDebounce } from '../hooks/useDebounce';
import { ThemeToggle } from '../components/ThemeToggle';

const Landing = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const debouncedUsername = useDebounce(username, 400);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername) {
        setIsAvailable(null);
        setIsValid(false);
        return;
      }

      if (debouncedUsername.length < 4) {
        setIsValid(false);
        setIsAvailable(null);
        setErrorMsg('Минимум 4 символа');
        return;
      }

      const validRegex = /^[a-zA-Z0-9_-]+$/;
      if (!validRegex.test(debouncedUsername)) {
        setIsValid(false);
        setIsAvailable(null);
        setErrorMsg('Только буквы, цифры, - и _');
        return;
      }

      setErrorMsg('');
      setIsValid(true);
      setChecking(true);
      try {
        const response = await api.checkUsername(debouncedUsername);
        const data = await response.json();
        setIsAvailable(data.available);
        if (!data.available) {
          if (data.reason === 'reserved') {
            setErrorMsg('Зарезервировано системой. Свяжитесь с поддержкой для получения доступа.');
          } else if (data.reason === 'taken') {
            setErrorMsg('Данная ссылка уже используется. Пожалуйста, выберите другую.');
          } else {
            setErrorMsg('Данный username занят');
          }
        }
      } catch (error) {
        console.error('Check error:', error);
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!username || !isAvailable || !isValid) return;

    localStorage.setItem('onboarding_username', username);
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="landing-page">
      <div className="w-full max-w-md space-y-8 fade-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Ссылка в био для<br />любых целей
          </h1>
          <p className="text-muted-foreground text-base">
            Создайте свою персональную страницу за минуту
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4" data-testid="username-form">
          <div className="space-y-2">
            <div className={`card-glass relative transition-colors ${errorMsg ? 'border-red-500/50' : ''
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">inbio.one/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="link"
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  data-testid="username-input"
                />

                {checking && (
                  <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
                )}

                {!checking && username && !errorMsg && isAvailable === true && (
                  <CircleCheck className="w-5 h-5 text-green-400 fill-green-400/10" />
                )}

                {!checking && username && errorMsg && (
                  <CircleX className="w-5 h-5 text-red-400 fill-red-400/10" />
                )}
              </div>
            </div>

            {!checking && errorMsg && (
              <p className="text-red-400 text-xs pl-2">
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!username || checking || isAvailable !== true}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="create-button"
          >
            Создать
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center space-y-4">
          <div>
            <span className="text-muted-foreground text-sm">Уже есть профиль? </span>
            <button
              type="button"
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

export default Landing;
