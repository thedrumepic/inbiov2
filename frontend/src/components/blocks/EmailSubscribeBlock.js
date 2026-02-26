import React, { useState } from 'react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, Mail, CheckCircle } from 'lucide-react';

export const EmailSubscribeBlockRenderer = ({ block }) => {
  const { title, subtitle, button_text, placeholder, success_text } = block.content || {};
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    try {
      const pageId = block?.page_id || block?.pageId;
      if (!pageId) { setSubmitted(true); setEmail(''); setLoading(false); return; }
      const res = await api.submitLead({
        page_id: pageId,
        email,
        contact: email,
        name: 'Email подписка',
        message: '',
        form_type: 'email_subscribe',
      });
      if (res.ok) {
        setSubmitted(true);
        setEmail('');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-secondary/30 border border-border/50 rounded-xl p-5 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        {title && <h3 className="font-bold text-base text-foreground">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-green-500 font-medium text-sm py-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success_text || 'Вы подписались!'}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={placeholder || 'Ваш email'}
              className="input flex-1 text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-4 py-2 text-sm whitespace-nowrap flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {button_text || 'Подписаться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const EmailSubscribeBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
  const [title, setTitle] = useState(block?.content?.title || 'Подпишитесь на обновления');
  const [subtitle, setSubtitle] = useState(block?.content?.subtitle || '');
  const [placeholder, setPlaceholder] = useState(block?.content?.placeholder || 'Ваш email');
  const [buttonText, setButtonText] = useState(block?.content?.button_text || 'Подписаться');
  const [successText, setSuccessText] = useState(block?.content?.success_text || 'Спасибо за подписку!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Укажите заголовок'); return; }
    setLoading(true);
    try {
      const content = { title, subtitle, placeholder, button_text: buttonText, success_text: successText };
      let res;
      if (block) {
        res = await api.updateBlock(block.id, { content });
      } else {
        res = await api.createBlock({ page_id: pageId, block_type: 'email_subscribe', content, order: blocksCount });
      }
      if (res.ok) {
        toast.success(block ? 'Блок обновлён' : 'Блок подписки добавлен');
        onSuccess();
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base flex-1 text-center">{block ? 'Редактировать подписку' : 'Блок подписки на email'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-[440px] mx-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Подпишитесь на обновления" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Подзаголовок (необязательно)</label>
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="input" placeholder="Будьте в курсе последних новостей" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Placeholder поля email</label>
          <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)} className="input" placeholder="Ваш email" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Текст кнопки</label>
          <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} className="input" placeholder="Подписаться" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Сообщение после подписки</label>
          <input type="text" value={successText} onChange={e => setSuccessText(e.target.value)} className="input" placeholder="Спасибо за подписку!" />
        </div>

        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground">
          Email-адреса сохраняются в разделе <strong>Данные с формы</strong> в настройках.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-4">
        <div className="max-w-[440px] mx-auto">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {block ? 'Сохранить' : 'Добавить блок'}
          </button>
        </div>
      </div>
    </div>
  );
};
