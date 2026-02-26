import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { api } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Введите email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.forgotPassword({ email });

      if (response.ok) {
        toast.success('Инструкции отправлены на email');
        setSent(true);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="forgot-password-page">
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary backdrop-blur-xl mb-2">
            <Mail className="w-7 h-7 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Забыли пароль?</h1>
          <p className="text-muted-foreground text-sm">
            {sent
              ? 'Проверьте вашу почту для инструкций по восстановлению'
              : 'Введите email для восстановления доступа'
            }
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="forgot-password-form">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                data-testid="email-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? 'Отправка...' : 'Отправить инструкции'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
              data-testid="login-button"
            >
              Вернуться к входу
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
