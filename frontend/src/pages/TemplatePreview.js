import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { BadgeCheck } from 'lucide-react';
import { LinkBlockRenderer } from '../components/blocks/LinkBlock';
import { TextBlockRenderer } from '../components/blocks/TextBlock';
import { SocialIconsBlockRenderer } from '../components/blocks/SocialIconsBlock';
import { ScheduleBlockRenderer } from '../components/blocks/ScheduleBlock';
import { MusicBlockRenderer } from '../components/blocks/MusicBlock';
import { PricingBlockRenderer } from '../components/blocks/PricingBlock';
import { FAQBlockRenderer } from '../components/blocks/FAQBlock';
import { EmailSubscribeBlockRenderer } from '../components/blocks/EmailSubscribeBlock';
import { ButtonBlockRenderer } from '../components/blocks/ButtonBlock';

// ---- Accent colors per template (for cover gradient) ----
const TEMPLATE_ACCENTS = {
  musician:    '#7C3AED',
  barber:      '#F59E0B',
  photographer:'#EC4899',
  blogger:     '#EF4444',
  business:    '#3B82F6',
  freelancer:  '#10B981',
  doctor:      '#06B6D4',
  restaurant:  '#F97316',
};

// ---- Rich preview data per template ----
const PREVIEW_DATA = {
  // ===== МУЗЫКАНТ / АРТИСТ =====
  musician: {
    page: { id: 'preview', username: 'musician', name: 'Артём Волков', bio: 'Электронная музыка · DJ · Продюсер', is_verified: true },
    blocks: [
      {
        id: 'm1', block_type: 'music', page_id: 'preview',
        content: {
          title: 'Last Letter EP',
          artist: 'Артём Волков',
          showCover: false,
          cover: null,
          presetId: 'standard',
          theme: 'dark',
          platforms: [
            { platform: 'spotify',     url: 'https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb', visible: true },
            { platform: 'appleMusic',  url: 'https://music.apple.com/ru/artist/artем-волков/1234567', visible: true },
            { platform: 'youtubeMusic',url: 'https://music.youtube.com', visible: true },
            { platform: 'yandex',      url: 'https://music.yandex.ru/artist/123456', visible: true },
          ],
        },
      },
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'BeatStore — купить биты', url: 'https://beatstars.com', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'YouTube канал', url: 'https://youtube.com/@artem', platform: 'youtube' } },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/artem' },
          { platform: 'telegram',  url: 'https://t.me/artem' },
          { platform: 'tiktok',    url: 'https://tiktok.com/@artem' },
          { platform: 'vk',        url: 'https://vk.com/artem' },
        ]},
      },
    ],
  },

  // ===== БАРБЕР / МАСТЕР КРАСОТЫ =====
  barber: {
    page: { id: 'preview', username: 'barber', name: 'Алексей Стрижов', bio: 'Барбер · Москва · 5 лет опыта' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Записаться онлайн (Yclients)', url: 'https://yclients.com', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'Написать в WhatsApp', url: 'https://wa.me/79001234567', platform: 'whatsapp' } },
      {
        id: 'pr1', block_type: 'pricing', page_id: 'preview',
        content: {
          title: 'Прайс-лист',
          plans: [
            { name: 'Стрижка', price: '1 500', currency: '₽', period: '', features: 'Мытьё головы\nУкладка\nКонсультация по стилю', button_text: 'Записаться', button_url: 'https://yclients.com', highlighted: false },
            { name: 'Стрижка + борода', price: '2 500', currency: '₽', period: '', features: 'Мытьё головы\nФорма бороды\nУкладка\nМаска для бороды', button_text: 'Записаться', button_url: 'https://yclients.com', highlighted: true },
          ],
        },
      },
      {
        id: 's1', block_type: 'schedule', page_id: 'preview',
        content: {
          title: 'График работы',
          schedule: {
            mon: { enabled: true, from: '10:00', to: '20:00', note: '' },
            tue: { enabled: true, from: '10:00', to: '20:00', note: '' },
            wed: { enabled: true, from: '10:00', to: '20:00', note: '' },
            thu: { enabled: true, from: '10:00', to: '20:00', note: '' },
            fri: { enabled: true, from: '10:00', to: '20:00', note: '' },
            sat: { enabled: true, from: '10:00', to: '18:00', note: '' },
            sun: { enabled: false, from: '10:00', to: '18:00', note: '' },
          },
        },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/barber_alex' },
          { platform: 'tiktok',    url: 'https://tiktok.com/@barber_alex' },
          { platform: 'telegram',  url: 'https://t.me/barber_alex' },
        ]},
      },
    ],
  },

  // ===== ФОТОГРАФ =====
  photographer: {
    page: { id: 'preview', username: 'photographer', name: 'Мария Светова', bio: 'Фотограф · Портрет · Семья · Репортаж' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Портфолио — Behance', url: 'https://behance.net/mariya_svetova', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'Заказать съёмку', url: 'https://t.me/mariya_photo', platform: 'telegram' } },
      {
        id: 'pr1', block_type: 'pricing', page_id: 'preview',
        content: {
          title: 'Стоимость съёмок',
          plans: [
            { name: 'Портрет', price: '5 000', currency: '₽', period: 'час', features: 'До 2 образов\n20+ обработанных фото\nЛокация на выбор', button_text: 'Заказать', button_url: 'https://t.me/mariya_photo', highlighted: false },
            { name: 'Семейная', price: '8 000', currency: '₽', period: 'час', features: 'До 4 человек\n30+ фото\nПрогулка или студия\nЭкспресс-готовность', button_text: 'Заказать', button_url: 'https://t.me/mariya_photo', highlighted: true },
          ],
        },
      },
      {
        id: 't1', block_type: 'text', page_id: 'preview',
        content: { title: 'Как проходит съёмка', text: '1. Обсуждаем концепцию и образы\n2. Выбираем локацию или студию\n3. Съёмка 1–2 часа\n4. Обработка 5–7 дней\n5. Получаете архив + печатный альбом' },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/mariya_photo' },
          { platform: 'telegram',  url: 'https://t.me/mariya_photo' },
          { platform: 'vk',        url: 'https://vk.com/mariya_photo' },
        ]},
      },
    ],
  },

  // ===== БЛОГЕР =====
  blogger: {
    page: { id: 'preview', username: 'blogger', name: 'Дарья Лайф', bio: 'Лайфстайл · Путешествия · 500K подписчиков' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Instagram', url: 'https://instagram.com/darya_life', platform: 'instagram' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'TikTok', url: 'https://tiktok.com/@darya_life', platform: 'tiktok' } },
      { id: 'l3', block_type: 'link', page_id: 'preview', content: { title: 'YouTube', url: 'https://youtube.com/@darya_life', platform: 'youtube' } },
      { id: 'l4', block_type: 'link', page_id: 'preview', content: { title: 'Telegram-канал', url: 'https://t.me/darya_life', platform: 'telegram' } },
      {
        id: 'btn1', block_type: 'button', page_id: 'preview',
        content: { text: 'Поддержать автора ☕', subtext: 'Boosty · донаты', url: 'https://boosty.to/darya_life', presetId: 'liquid', fileUrl: null },
      },
      {
        id: 'email1', block_type: 'email_subscribe', page_id: 'preview',
        content: { title: 'Закрытая рассылка', subtitle: 'Советы, которые не публикую в соцсетях', button_text: 'Подписаться', placeholder: 'Ваш email', success_text: 'Вы подписались!' },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'pinterest', url: 'https://pinterest.com/darya_life' },
          { platform: 'vk',        url: 'https://vk.com/darya_life' },
          { platform: 'spotify',   url: 'https://open.spotify.com' },
        ]},
      },
    ],
  },

  // ===== БИЗНЕС / МАГАЗИН =====
  business: {
    page: { id: 'preview', username: 'business', name: 'Brand Store', bio: 'Одежда и аксессуары · Доставка по России' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Наш сайт', url: 'https://brandstore.ru', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'Wildberries', url: 'https://wildberries.ru', platform: 'custom' } },
      { id: 'l3', block_type: 'link', page_id: 'preview', content: { title: 'Ozon', url: 'https://ozon.ru', platform: 'custom' } },
      { id: 'l4', block_type: 'link', page_id: 'preview', content: { title: 'Написать в Telegram', url: 'https://t.me/brandstore_ru', platform: 'telegram' } },
      {
        id: 't1', block_type: 'text', page_id: 'preview',
        content: { title: 'Доставка и оплата', text: '🚚 Доставка по России 2–7 дней\n💳 Оплата картой, СБП, при получении\n🔄 Бесплатный возврат в течение 14 дней' },
      },
      {
        id: 'faq1', block_type: 'faq', page_id: 'preview',
        content: {
          title: 'Частые вопросы',
          hasHighlight: true,
          showNumbers: false,
          items: [
            { question: 'Как оформить заказ?', answer: 'Выберите товар на сайте, WB или Ozon — или напишите нам в Telegram, поможем подобрать.' },
            { question: 'Есть ли примерка?', answer: 'Да, при самовывозе из шоурума в Москве по предварительной записи.' },
            { question: 'Как узнать свой размер?', answer: 'Таблица размеров есть на странице каждого товара. При сомнениях — напишите!' },
          ],
        },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/brandstore_ru' },
          { platform: 'telegram',  url: 'https://t.me/brandstore_ru' },
          { platform: 'whatsapp',  url: 'https://wa.me/79001234567' },
          { platform: 'vk',        url: 'https://vk.com/brandstore_ru' },
        ]},
      },
    ],
  },

  // ===== ФРИЛАНСЕР / СПЕЦИАЛИСТ =====
  freelancer: {
    page: { id: 'preview', username: 'freelancer', name: 'Иван Дизайнов', bio: 'UI/UX дизайнер · Figma · 6 лет опыта' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Портфолио на Behance', url: 'https://behance.net/ivan_dizainov', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'Обсудить проект', url: 'https://t.me/ivan_design', platform: 'telegram' } },
      {
        id: 'pr1', block_type: 'pricing', page_id: 'preview',
        content: {
          title: 'Услуги и цены',
          plans: [
            { name: 'Лендинг', price: '30 000', currency: '₽', period: '', features: 'Анализ и референсы\nДизайн в Figma\nАдаптив Mobile/Desktop\n2 правки', button_text: 'Заказать', button_url: 'https://t.me/ivan_design', highlighted: false },
            { name: 'Мобильное приложение', price: '50 000', currency: '₽', period: '', features: 'UX-исследование\nUser Flow\nПрототип\nUI-дизайн iOS/Android\n3 правки', button_text: 'Заказать', button_url: 'https://t.me/ivan_design', highlighted: true },
          ],
        },
      },
      {
        id: 'faq1', block_type: 'faq', page_id: 'preview',
        content: {
          title: 'Вопросы о работе',
          hasHighlight: true,
          showNumbers: false,
          items: [
            { question: 'Как проходит работа?', answer: 'Бриф → концепция → дизайн → правки → финальная передача файлов. Всё через Figma.' },
            { question: 'Сколько времени занимает?', answer: 'Лендинг — 5–7 дней, мобильное приложение — 2–4 недели.' },
          ],
        },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'telegram',  url: 'https://t.me/ivan_design' },
          { platform: 'linkedin',  url: 'https://linkedin.com/in/ivan_design' },
          { platform: 'vk',        url: 'https://vk.com/ivan_design' },
        ]},
      },
    ],
  },

  // ===== ВРАЧ / ПСИХОЛОГ =====
  doctor: {
    page: { id: 'preview', username: 'doctor', name: 'Анна Ковалёва', bio: 'Психолог · КПТ · Онлайн и офлайн' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Записаться на консультацию', url: 'https://t.me/anna_psy', platform: 'telegram' } },
      {
        id: 't1', block_type: 'text', page_id: 'preview',
        content: { title: 'Обо мне', text: '8 лет практики · МГУ, психологический факультет\nСпециализация: тревога, депрессия, отношения\nМетод: когнитивно-поведенческая терапия (КПТ)' },
      },
      {
        id: 'pr1', block_type: 'pricing', page_id: 'preview',
        content: {
          title: 'Стоимость сессий',
          plans: [
            { name: 'Онлайн', price: '3 500', currency: '₽', period: '50 мин', features: 'Zoom / Telegram\nКонспект после сессии\nПоддержка в чате', button_text: 'Записаться', button_url: 'https://t.me/anna_psy', highlighted: false },
            { name: 'Офлайн', price: '4 500', currency: '₽', period: '50 мин', features: 'м. Арбат, Москва\nЧай / кофе включено\nЗапись и конспект', button_text: 'Записаться', button_url: 'https://t.me/anna_psy', highlighted: true },
          ],
        },
      },
      {
        id: 's1', block_type: 'schedule', page_id: 'preview',
        content: {
          title: 'Расписание приёма',
          schedule: {
            mon: { enabled: true,  from: '10:00', to: '18:00', note: '' },
            tue: { enabled: false, from: '10:00', to: '18:00', note: '' },
            wed: { enabled: true,  from: '10:00', to: '18:00', note: '' },
            thu: { enabled: false, from: '10:00', to: '18:00', note: '' },
            fri: { enabled: true,  from: '10:00', to: '18:00', note: '' },
            sat: { enabled: true,  from: '11:00', to: '15:00', note: '' },
            sun: { enabled: false, from: '10:00', to: '18:00', note: '' },
          },
        },
      },
      {
        id: 'faq1', block_type: 'faq', page_id: 'preview',
        content: {
          title: 'Частые вопросы',
          hasHighlight: true,
          showNumbers: false,
          items: [
            { question: 'Как проходит первая сессия?', answer: 'Знакомство, обсуждение запроса и ожиданий. Без оценок и осуждения.' },
            { question: 'Сколько сессий нужно?', answer: 'Зависит от запроса. Обычно 8–16 встреч для устойчивого результата.' },
          ],
        },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/anna_psy' },
          { platform: 'telegram',  url: 'https://t.me/anna_psy' },
          { platform: 'vk',        url: 'https://vk.com/anna_psy' },
        ]},
      },
    ],
  },

  // ===== РЕСТОРАН / КАФЕ =====
  restaurant: {
    page: { id: 'preview', username: 'restaurant', name: 'Кафе Уют', bio: 'Европейская кухня · Уютная атмосфера · Москва, Арбат' },
    blocks: [
      { id: 'l1', block_type: 'link', page_id: 'preview', content: { title: 'Посмотреть меню', url: 'https://cafe-uyut.ru/menu', platform: 'custom' } },
      { id: 'l2', block_type: 'link', page_id: 'preview', content: { title: 'Забронировать стол', url: 'https://cafe-uyut.ru/booking', platform: 'custom' } },
      { id: 'l3', block_type: 'link', page_id: 'preview', content: { title: 'Доставка — Яндекс Еда', url: 'https://eda.yandex.ru/moscow/cafe-uyut', platform: 'custom' } },
      {
        id: 's1', block_type: 'schedule', page_id: 'preview',
        content: {
          title: 'Часы работы',
          schedule: {
            mon: { enabled: true, from: '11:00', to: '23:00', note: '' },
            tue: { enabled: true, from: '11:00', to: '23:00', note: '' },
            wed: { enabled: true, from: '11:00', to: '23:00', note: '' },
            thu: { enabled: true, from: '11:00', to: '23:00', note: '' },
            fri: { enabled: true, from: '11:00', to: '00:00', note: '' },
            sat: { enabled: true, from: '12:00', to: '00:00', note: '' },
            sun: { enabled: true, from: '12:00', to: '22:00', note: '' },
          },
        },
      },
      {
        id: 't1', block_type: 'text', page_id: 'preview',
        content: { title: 'Как нас найти', text: '📍 Москва, ул. Арбат, 15\nМетро Арбатская — 3 минуты пешком\nПарковка: ТЦ Арбат' },
      },
      {
        id: 'si1', block_type: 'social_icons', page_id: 'preview',
        content: { links: [
          { platform: 'instagram', url: 'https://instagram.com/cafe_uyut' },
          { platform: 'telegram',  url: 'https://t.me/cafe_uyut' },
          { platform: 'vk',        url: 'https://vk.com/cafe_uyut' },
          { platform: 'whatsapp',  url: 'https://wa.me/79001234567' },
        ]},
      },
    ],
  },
};

// Block renderer
const BlockRenderer = ({ block }) => {
  switch (block.block_type) {
    case 'link':          return <LinkBlockRenderer block={block} username={block.page_id} />;
    case 'text':          return <TextBlockRenderer block={block} />;
    case 'social_icons':  return <SocialIconsBlockRenderer block={block} />;
    case 'schedule':      return <ScheduleBlockRenderer block={block} />;
    case 'music':         return <MusicBlockRenderer block={block} />;
    case 'pricing':       return <PricingBlockRenderer block={block} />;
    case 'faq':           return <FAQBlockRenderer block={block} />;
    case 'email_subscribe': return <EmailSubscribeBlockRenderer block={block} />;
    case 'button':        return <ButtonBlockRenderer block={block} />;
    default:              return null;
  }
};

const TemplatePreview = () => {
  const { templateId } = useParams();
  const location = useLocation();
  const data = PREVIEW_DATA[templateId];
  const accent = TEMPLATE_ACCENTS[templateId] || '#888';

  // Read ?theme= from query string, default dark
  const queryTheme = new URLSearchParams(location.search).get('theme');
  const isDark = queryTheme !== 'light';

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Шаблон не найден</p>
      </div>
    );
  }

  const { page, blocks } = data;

  // Split: leading link blocks go inside profile card, rest render below in order
  let leadingLinks = [];
  let remainingBlocks = [];
  let foundNonLink = false;
  for (const b of blocks) {
    if (!foundNonLink && b.block_type === 'link') {
      leadingLinks.push(b);
    } else {
      foundNonLink = true;
      remainingBlocks.push(b);
    }
  }

  return (
    <div className="bg-background">
      <div className="max-w-[440px] mx-auto px-4 py-6">
        {/* Banner — neutral cover */}
        <div className="w-full h-[215px] rounded-t-[12px] bg-card border border-border flex items-center justify-center">
          <Logo size="default" forceTheme={isDark ? 'dark' : 'light'} />
        </div>

        {/* Profile Card */}
        <div className="relative -mt-12 z-10 space-y-4">
          <div className="relative">
            {/* Avatar */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20">
              <div className="w-24 h-24 rounded-full border-4 border-background bg-card flex items-center justify-center shadow-2xl">
                <Logo size="sm" forceTheme={isDark ? 'dark' : 'light'} />
              </div>
            </div>

            <div className="bg-card rounded-[12px] border border-border pt-16 pb-6 px-4 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center">
                  {page.name}
                  {page.is_verified && (
                    <BadgeCheck className="w-[18px] h-[18px] ml-2 text-foreground" />
                  )}
                </h1>
                {page.bio && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{page.bio}</p>
                )}
              </div>

              {leadingLinks.length > 0 && (
                <div className="space-y-3">
                  {leadingLinks.map(block => (
                    <BlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Remaining blocks in order */}
          {remainingBlocks.length > 0 && (
            <div className="space-y-4">
              {remainingBlocks.map(block => (
                <div key={block.id} className="w-full">
                  <BlockRenderer block={block} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 pb-2">
          <a href="https://inbio.one" className="flex items-center justify-center gap-1.5 text-gray-600 hover:text-muted-foreground transition-colors">
            <span className="text-xs">Powered by</span>
            <Logo size="xs" forceTheme={isDark ? 'dark' : 'light'} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
