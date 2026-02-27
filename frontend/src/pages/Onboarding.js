import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken, isAuthenticated } from '../utils/api';
import { toast } from '../utils/toast';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import SocialAuth from '../components/SocialAuth';
import {
  Music, Scissors, Camera, Video, ShoppingBag,
  Briefcase, Stethoscope, UtensilsCrossed, ArrowRight,
  ArrowLeft, Check, User, Link2, Image, Calendar,
  MessageSquare, MapPin, Heart, Youtube, DollarSign,
  Sparkles,
} from 'lucide-react';

// ===================== TEMPLATES =====================
const TEMPLATES = [
  {
    id: 'musician',
    icon: Music,
    title: 'Музыкант / Артист',
    description: 'Для исполнителей, диджеев и музыкальных проектов',
    accent: '#a855f7',
    previewName: 'Артём Волков',
    previewBio: 'Электронная музыка · DJ · Продюсер',
    blocks: [
      { icon: User, label: 'Аватар + имя + bio' },
      { icon: Link2, label: 'Соцсети (Instagram, TikTok, YouTube)' },
      { icon: Music, label: 'Музыкальный блок (последний релиз)' },
      { icon: Link2, label: 'Ссылки (Spotify, Apple Music)' },
      { icon: Calendar, label: 'Афиша событий' },
      { icon: Image, label: 'Галерея фото' },
    ],
    previewBlocks: [
      { type: 'socials', labels: ['Instagram', 'TikTok', 'YouTube'] },
      { type: 'music', label: 'Новый трек — «Neon Lights»' },
      { type: 'link', label: 'Spotify' },
      { type: 'link', label: 'Apple Music' },
      { type: 'events', label: 'Афиша: Москва, 15 марта' },
    ],
  },
  {
    id: 'barber',
    icon: Scissors,
    title: 'Барбер / Мастер красоты',
    description: 'Для мастеров, барберов и салонов красоты',
    accent: '#f59e0b',
    previewName: 'Алексей Стрижов',
    previewBio: 'Барбер · Москва · 5 лет опыта',
    blocks: [
      { icon: User, label: 'Аватар + имя + bio' },
      { icon: Link2, label: 'Ссылка на запись (Yclients, Dikidi)' },
      { icon: Image, label: 'Галерея работ' },
      { icon: Calendar, label: 'Расписание' },
      { icon: Link2, label: 'Соцсети' },
      { icon: MessageSquare, label: 'Контактная форма' },
    ],
    previewBlocks: [
      { type: 'link', label: 'Записаться онлайн' },
      { type: 'gallery', label: 'Галерея работ' },
      { type: 'schedule', label: 'Пн–Сб: 10:00–20:00' },
      { type: 'socials', labels: ['Instagram', 'TikTok'] },
      { type: 'contact', label: 'Написать мне' },
    ],
  },
  {
    id: 'photographer',
    icon: Camera,
    title: 'Фотограф',
    description: 'Для фотографов и видеографов',
    accent: '#0ea5e9',
    previewName: 'Мария Светова',
    previewBio: 'Фотограф · Портрет · Семья · Репортаж',
    blocks: [
      { icon: User, label: 'Аватар + имя + bio' },
      { icon: Image, label: 'Галерея фото' },
      { icon: Link2, label: 'Ссылки (портфолио)' },
      { icon: Link2, label: 'Прайс (текстовый блок)' },
      { icon: MessageSquare, label: 'Контактная форма' },
      { icon: Link2, label: 'Соцсети' },
    ],
    previewBlocks: [
      { type: 'gallery', label: 'Портфолио' },
      { type: 'link', label: 'Посмотреть портфолио' },
      { type: 'text', label: 'Прайс: от 5 000 ₽/час' },
      { type: 'contact', label: 'Заказать съёмку' },
      { type: 'socials', labels: ['Instagram'] },
    ],
  },
  {
    id: 'blogger',
    icon: Video,
    title: 'Блогер / Инфлюенсер',
    description: 'Для контент-мейкеров и медийных личностей',
    accent: '#f43f5e',
    previewName: 'Дарья Лайф',
    previewBio: 'Лайфстайл блогер · 500K подписчиков',
    blocks: [
      { icon: User, label: 'Аватар + имя + bio' },
      { icon: Link2, label: 'Соцсети' },
      { icon: Link2, label: 'Основные площадки' },
      { icon: Youtube, label: 'YouTube блок' },
      { icon: Video, label: 'TikTok блок' },
      { icon: DollarSign, label: 'Донат' },
    ],
    previewBlocks: [
      { type: 'socials', labels: ['Instagram', 'TikTok', 'YouTube'] },
      { type: 'youtube', label: 'Последнее видео' },
      { type: 'tiktok', label: 'TikTok' },
      { type: 'link', label: 'Основная площадка' },
      { type: 'donate', label: 'Поддержать автора' },
    ],
  },
  {
    id: 'business',
    icon: ShoppingBag,
    title: 'Магазин / Бизнес',
    description: 'Для магазинов, брендов и компаний',
    accent: '#10b981',
    previewName: 'Brand Store',
    previewBio: 'Одежда и аксессуары · Доставка по России',
    blocks: [
      { icon: User, label: 'Аватар + название + описание' },
      { icon: ShoppingBag, label: 'Витрина товаров' },
      { icon: Link2, label: 'Ссылки (сайт, маркетплейсы)' },
      { icon: MessageSquare, label: 'Контактная форма' },
      { icon: MapPin, label: 'Карта' },
      { icon: Link2, label: 'Соцсети' },
    ],
    previewBlocks: [
      { type: 'showcase', label: 'Витрина товаров' },
      { type: 'link', label: 'Наш сайт' },
      { type: 'link', label: 'Wildberries' },
      { type: 'contact', label: 'Написать нам' },
      { type: 'map', label: 'Москва, Тверская 10' },
    ],
  },
  {
    id: 'freelancer',
    icon: Briefcase,
    title: 'Фрилансер / Специалист',
    description: 'Для дизайнеров, разработчиков и специалистов',
    accent: '#8b5cf6',
    previewName: 'Иван Дизайнов',
    previewBio: 'UI/UX дизайнер · Figma · 6 лет опыта',
    blocks: [
      { icon: User, label: 'Аватар + имя + bio' },
      { icon: Calendar, label: 'Блок услуг с ценами' },
      { icon: Image, label: 'Портфолио (галерея)' },
      { icon: Heart, label: 'Отзывы' },
      { icon: MessageSquare, label: 'Контактная форма' },
      { icon: Link2, label: 'Соцсети' },
    ],
    previewBlocks: [
      { type: 'services', label: 'Услуги: Дизайн сайта от 30 000 ₽' },
      { type: 'gallery', label: 'Портфолио' },
      { type: 'reviews', label: 'Отзывы клиентов' },
      { type: 'contact', label: 'Обсудить проект' },
      { type: 'socials', labels: ['Behance', 'Telegram'] },
    ],
  },
  {
    id: 'doctor',
    icon: Stethoscope,
    title: 'Врач / Психолог',
    description: 'Для специалистов в области здоровья и психологии',
    accent: '#14b8a6',
    previewName: 'Анна Ковалёва',
    previewBio: 'Психолог · КПТ · Онлайн и офлайн',
    blocks: [
      { icon: User, label: 'Аватар + имя + специализация' },
      { icon: Link2, label: 'О себе, образование' },
      { icon: Calendar, label: 'Расписание приёма' },
      { icon: Link2, label: 'Ссылка на запись' },
      { icon: MessageSquare, label: 'Контактная форма' },
      { icon: MapPin, label: 'Карта (адрес клиники)' },
    ],
    previewBlocks: [
      { type: 'text', label: 'Образование: МГУ, психфак' },
      { type: 'schedule', label: 'Пн, Ср, Пт: 10–18' },
      { type: 'link', label: 'Записаться на приём' },
      { type: 'contact', label: 'Задать вопрос' },
      { type: 'map', label: 'Москва, ул. Садовая' },
    ],
  },
  {
    id: 'restaurant',
    icon: UtensilsCrossed,
    title: 'Ресторан / Кафе',
    description: 'Для заведений общественного питания',
    accent: '#f97316',
    previewName: 'Кафе Уют',
    previewBio: 'Европейская кухня · Уютная атмосфера',
    blocks: [
      { icon: User, label: 'Аватар + название + bio' },
      { icon: Image, label: 'Галерея (блюда/интерьер)' },
      { icon: Link2, label: 'Меню (ссылка или PDF)' },
      { icon: MapPin, label: 'Карта' },
      { icon: Link2, label: 'Соцсети' },
      { icon: Calendar, label: 'Афиша событий' },
    ],
    previewBlocks: [
      { type: 'gallery', label: 'Наши блюда' },
      { type: 'link', label: 'Посмотреть меню' },
      { type: 'map', label: 'Москва, Арбат 15' },
      { type: 'socials', labels: ['Instagram', 'VK'] },
      { type: 'events', label: 'Живая музыка: пятница' },
    ],
  },
];

// ===================== LIVE PREVIEW (real iframe, full-width with scroll) =====================
const IFRAME_W = 390;

const LivePreview = ({ username, template }) => {
  const measureRef = useRef(null);
  const [scale, setScale] = useState(0.9);
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / IFRAME_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Full content height of the preview page scaled down
  // TemplatePreview renders up to ~2200px for templates with many blocks
  const CONTENT_H = 2200;
  const scaledH = Math.round(CONTENT_H * scale);

  const previewUrl = template
    ? `${window.location.origin}/preview/${template}?theme=${isDark ? 'dark' : 'light'}`
    : null;

  return (
    <div className="w-full flex flex-col">
      {/* measure bar — invisible, just to get container width */}
      <div ref={measureRef} className="w-full h-0" />

      {/* scrollable viewport */}
      <div
        className="w-full rounded-xl border border-border overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 520 }}
      >
        {previewUrl ? (
          /* wrapper div sized to scaled content height so scrollbar appears */
          <div style={{ height: scaledH, position: 'relative' }}>
            <iframe
              key={previewUrl}
              src={previewUrl}
              title="preview"
              scrolling="no"
              style={{
                width: IFRAME_W,
                height: CONTENT_H,
                border: 'none',
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
                display: 'block',
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </div>
        ) : (
          <div
            className="w-full flex flex-col items-center pt-16 px-6 gap-3 pb-12"
            style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}
          >
            <div className="w-16 h-16 rounded-full bg-border/40" />
            <div className="w-32 h-3 rounded-full bg-border/40" />
            <div className="w-24 h-2 rounded-full bg-border/20" />
            <div className="w-full mt-4 space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-full h-14 rounded-[12px] bg-card border border-border/30" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* URL pill */}
      <div className="mt-3 self-center px-3 py-1.5 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground">
        inbio.one/{username || '...'}
      </div>
    </div>
  );
};

// ===================== STEP INDICATOR =====================
const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i < current
            ? 'w-5 h-1.5 bg-foreground'
            : i === current
            ? 'w-8 h-1.5 bg-foreground'
            : 'w-5 h-1.5 bg-border'
        }`}
      />
    ))}
  </div>
);

// ===================== STEP 1 — USERNAME =====================
const Step1Username = ({ username, onChange, onNext }) => {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [inputVal, setInputVal] = useState(username);

  useEffect(() => {
    if (!inputVal || inputVal.length < 3) {
      setAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.checkUsername(inputVal);
        if (res.ok) {
          const data = await res.json();
          setAvailable(data.available);
        }
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleChange = (v) => {
    const clean = v.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30);
    setInputVal(clean);
    onChange(clean);
  };

  const canNext = inputVal.length >= 3 && available === true;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Выберите адрес страницы</h2>
        <p className="text-sm text-muted-foreground">Это будет ваша ссылка на inbio.one</p>
      </div>

      <div className="w-full max-w-sm">
        <div className={`flex items-center rounded-xl border-2 bg-background transition-colors overflow-hidden ${
          available === true ? 'border-emerald-500' :
          available === false ? 'border-red-500' :
          'border-border focus-within:border-foreground/50'
        }`}>
          <span className="pl-4 text-sm text-muted-foreground whitespace-nowrap select-none">inbio.one/</span>
          <input
            type="text"
            value={inputVal}
            onChange={e => handleChange(e.target.value)}
            placeholder="yourname"
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm py-3.5 pr-4 text-foreground placeholder:text-muted-foreground/50"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="pr-3 min-w-[20px]">
            {checking && <div className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />}
            {!checking && available === true && <Check size={16} className="text-emerald-500" />}
            {!checking && available === false && <span className="text-red-500 text-xs">✕</span>}
          </div>
        </div>
        <div className="mt-1.5 h-4">
          {available === true && <p className="text-xs text-emerald-500">Свободно!</p>}
          {available === false && <p className="text-xs text-red-500">Уже занято</p>}
          {inputVal.length > 0 && inputVal.length < 3 && <p className="text-xs text-muted-foreground">Минимум 3 символа</p>}
        </div>
      </div>

      <LivePreview username={inputVal} template={null} />

      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-full max-w-sm flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Далее <ArrowRight size={16} />
      </button>
    </div>
  );
};

// ===================== STEP 2 — TEMPLATE =====================
const Step2Template = ({ selected, onSelect, onNext, onBack, username }) => {
  // null = grid view, string = detail/preview view for that templateId
  const [detailId, setDetailId] = useState(null);
  const detailTemplate = detailId ? TEMPLATES.find(t => t.id === detailId) : null;

  const handleCardClick = (id) => {
    onSelect(id);
    setDetailId(id);
  };

  // ---- DETAIL VIEW ----
  if (detailId && detailTemplate) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => setDetailId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Назад
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${detailTemplate.accent}20` }}
            >
              <detailTemplate.icon size={14} style={{ color: detailTemplate.accent }} />
            </div>
            <span className="text-sm font-semibold">{detailTemplate.title}</span>
          </div>
        </div>

        {/* Live iframe preview */}
        <LivePreview username={username} template={detailId} />

        {/* Blocks list */}
        <div className="w-full space-y-1.5">
          <p className="text-xs text-muted-foreground mb-2">Блоки в этом шаблоне:</p>
          {detailTemplate.blocks.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border">
              <b.icon size={13} className="text-muted-foreground shrink-0" style={{ color: detailTemplate.accent }} />
              <span className="text-xs text-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Выбрать этот шаблон <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ---- GRID VIEW ----
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center space-y-0.5">
        <h2 className="text-xl sm:text-2xl font-bold">Выберите шаблон</h2>
        <p className="text-xs text-muted-foreground">Вы сможете изменить всё после регистрации</p>
      </div>

      {/* Grid */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleCardClick(t.id)}
              className={`relative text-left p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                isSelected
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border bg-card hover:border-foreground/30'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                  <Check size={10} className="text-background" />
                </div>
              )}
              <div className="text-xs font-semibold text-foreground leading-tight mb-0.5">{t.title}</div>
              <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{t.description}</div>
            </button>
          );
        })}
      </div>

      {/* "Start from scratch" */}
      <button
        onClick={() => { onSelect(null); onNext(); }}
        className="w-full py-3 rounded-xl border-2 border-border text-sm text-muted-foreground hover:border-foreground/30 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles size={14} /> Начать с нуля
      </button>

      <div className="flex gap-3 w-full">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border-2 border-border text-sm font-medium hover:border-foreground/40 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Назад
        </button>
        {selected && (
          <button
            onClick={onNext}
            className="flex-1 py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Далее <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// ===================== STEP 3 — ACCOUNT =====================
const Step3Account = ({ username, template, onBack }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Заполните все поля'); return; }
    if (password.length < 6) { toast.error('Пароль должен быть не менее 6 символов'); return; }

    setLoading(true);
    try {
      const response = await api.register({ email, password, username, template });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access_token);
        localStorage.removeItem('onboarding_username');
        localStorage.removeItem('onboarding_template');
        toast.success('Аккаунт создан!');
        if (data.username) {
          navigate(`/edit/${data.username}`, { state: { showWelcome: true } });
        } else {
          navigate('/dashboard');
        }
      } else {
        const err = await response.json();
        toast.error(err.detail || 'Ошибка регистрации');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = useCallback((data) => {
    setAuthToken(data.access_token);
    localStorage.removeItem('onboarding_username');
    localStorage.removeItem('onboarding_template');
    toast.success('Аккаунт создан');
    if (data.username) {
      navigate(`/edit/${data.username}`, { state: { showWelcome: true } });
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const selectedTemplate = template ? TEMPLATES.find(t => t.id === template) : null;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Создать аккаунт</h2>
        <p className="text-sm text-muted-foreground">Осталось совсем чуть-чуть</p>
      </div>

      {/* Summary card */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: selectedTemplate ? `${selectedTemplate.accent}20` : 'transparent' }}>
          {selectedTemplate
            ? <selectedTemplate.icon size={18} style={{ color: selectedTemplate.accent }} />
            : <Sparkles size={18} className="text-muted-foreground" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Ваша страница</div>
          <div className="text-sm font-semibold font-mono truncate">inbio.one/{username}</div>
          {selectedTemplate && <div className="text-xs text-muted-foreground">{selectedTemplate.title}</div>}
        </div>
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Изменить
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-sm outline-none focus:border-foreground/50 transition-colors placeholder:text-muted-foreground/50"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            disabled={loading}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-sm outline-none focus:border-foreground/50 transition-colors placeholder:text-muted-foreground/50"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Создаём...</>
          ) : (
            <>Создать аккаунт <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full max-w-sm relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">Или</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <SocialAuth mode="register" onSuccess={handleOAuthSuccess} onError={toast.error} />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Уже есть аккаунт?{' '}
        <a href="/login" className="text-foreground hover:underline font-medium">Войти</a>
      </p>
    </div>
  );
};

// ===================== MAIN ONBOARDING =====================
const Onboarding = () => {
  const navigate = useNavigate();

  const savedUsername = localStorage.getItem('onboarding_username') || '';
  // If username already provided from Landing — skip username step (start at step 1)
  const cameFromLanding = !!savedUsername;
  const [step, setStep] = useState(savedUsername ? 1 : 0);
  const [username, setUsername] = useState(savedUsername);
  const [template, setTemplate] = useState(() => localStorage.getItem('onboarding_template') || null);

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    if (username) localStorage.setItem('onboarding_username', username);
  }, [username]);

  useEffect(() => {
    if (template !== null) localStorage.setItem('onboarding_template', template);
    else localStorage.removeItem('onboarding_template');
  }, [template]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Войти
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="mb-8">
            {cameFromLanding
              ? <StepIndicator current={step - 1} total={2} />
              : <StepIndicator current={step} total={3} />
            }
          </div>

          {/* Steps */}
          {step === 0 && (
            <Step1Username
              username={username}
              onChange={setUsername}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2Template
              selected={template}
              onSelect={setTemplate}
              username={username}
              onNext={() => setStep(2)}
              onBack={() => cameFromLanding ? navigate('/') : setStep(0)}
            />
          )}
          {step === 2 && (
            <Step3Account
              username={username}
              template={template}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
