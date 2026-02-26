import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="#29B6F6"/>
  </svg>
);

// Separate component so useGoogleLogin hook is only called inside GoogleOAuthProvider
const GoogleAuthButton = ({ onSuccess, onError, mode }) => {
  const { useGoogleLogin } = require('@react-oauth/google');
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const apiRes = await api.googleAuth(tokenResponse.access_token);
        if (apiRes.ok) {
          const data = await apiRes.json();
          onSuccess(data);
        } else {
          const err = await apiRes.json();
          onError(err.detail || 'Ошибка авторизации через Google');
        }
      } catch (e) {
        onError('Ошибка авторизации через Google');
      } finally {
        setLoading(false);
      }
    },
    onError: () => onError('Google авторизация отменена'),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
    >
      <GoogleIcon />
      {loading ? 'Подключение...' : (mode === 'login' ? 'Войти через Google' : 'Регистрация через Google')}
    </button>
  );
};

const SocialAuth = ({ onSuccess, onError, mode = 'login' }) => {
  const [tgBotUsername, setTgBotUsername] = useState(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  useEffect(() => {
    api.getTelegramBotUsername()
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setTgBotUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  const handleTelegramAuth = useCallback(async (tgData) => {
    setLoadingTelegram(true);
    try {
      const apiResponse = await api.telegramAuth(tgData);
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        onSuccess(data);
      } else {
        const err = await apiResponse.json();
        onError(err.detail || 'Ошибка авторизации через Telegram');
      }
    } catch (e) {
      onError('Ошибка соединения');
    } finally {
      setLoadingTelegram(false);
    }
  }, [onSuccess, onError]);

  const handleTelegramClick = () => {
    if (!tgBotUsername) {
      onError('Telegram бот не настроен');
      return;
    }
    const origin = window.location.origin;
    const width = 550;
    const height = 470;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

    setLoadingTelegram(true);

    const popup = window.open(
      `https://oauth.telegram.org/auth?bot_id=${tgBotUsername}&origin=${encodeURIComponent(origin)}&request_access=write`,
      'telegram_auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const handleMessage = (event) => {
      if (event.origin === 'https://oauth.telegram.org') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'auth_result' && data.result) {
            handleTelegramAuth(data.result);
          } else {
            setLoadingTelegram(false);
          }
        } catch {
          setLoadingTelegram(false);
        }
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);

    const checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkClosed);
        setLoadingTelegram(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  };

  const hasGoogle = !!GOOGLE_CLIENT_ID;
  const hasTelegram = !!tgBotUsername;

  if (!hasGoogle && !hasTelegram) return null;

  return (
    <div className="flex flex-col gap-3">
      {hasGoogle && (
        <GoogleAuthButton onSuccess={onSuccess} onError={onError} mode={mode} />
      )}

      {hasTelegram && (
        <button
          type="button"
          onClick={handleTelegramClick}
          disabled={loadingTelegram}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-[#2AABEE]/5 dark:bg-[#2AABEE]/10 hover:bg-[#2AABEE]/15 dark:hover:bg-[#2AABEE]/20 transition-all duration-200 text-sm font-medium text-[#2AABEE] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          <TelegramIcon />
          {loadingTelegram ? 'Подключение...' : (mode === 'login' ? 'Войти через Telegram' : 'Регистрация через Telegram')}
        </button>
      )}
    </div>
  );
};

export default SocialAuth;
