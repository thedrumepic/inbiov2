import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../utils/api';
import { Logo } from '../components/Logo';
import { Calendar, User, ExternalLink, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { toast } from '../utils/toast';
import { TextBlockRenderer } from '../components/blocks/TextBlock';
import { MusicBlockRenderer } from '../components/blocks/MusicBlock';
import { LinkBlockRenderer } from '../components/blocks/LinkBlock';
import { ButtonBlockRenderer } from '../components/blocks/ButtonBlock';
import { FAQBlockRenderer } from '../components/blocks/FAQBlock';
import { YouTubeBlockRenderer } from '../components/blocks/YouTubeBlock';
import { ImageGalleryBlockRenderer } from '../components/blocks/ImageGalleryBlock';
import { CountdownBlockRenderer } from '../components/blocks/CountdownBlock';
import { TikTokBlockRenderer } from '../components/blocks/TikTokBlock';
import { SocialIconsBlockRenderer } from '../components/blocks/SocialIconsBlock';
import { InstagramPostBlockRenderer } from '../components/blocks/InstagramPostBlock';
import { DividerBlockRenderer } from '../components/blocks/DividerBlock';
import { SpotifyBlockRenderer } from '../components/blocks/SpotifyBlock';
import { AppleMusicBlockRenderer } from '../components/blocks/AppleMusicBlock';
import { PinterestBlockRenderer } from '../components/blocks/PinterestBlock';
import { ContactFormBlockRenderer } from '../components/blocks/ContactFormBlock';
import { MessengersBlockRenderer } from '../components/blocks/MessengersBlock';
import { MapBlockRenderer } from '../components/blocks/MapBlock';
import { DonationBlockRenderer } from '../components/blocks/DonationBlock';
import { ShowcaseBlockRenderer } from '../components/blocks/ShowcaseBlock';
import { EventsBlockRenderer } from '../components/blocks/EventsBlock';
import { QRBlockRenderer } from '../components/blocks/QRBlock';
import { ReviewsBlockRenderer } from '../components/blocks/ReviewsBlock';
import { ScheduleBlockRenderer } from '../components/blocks/ScheduleBlock';
import { EmailSubscribeBlockRenderer } from '../components/blocks/EmailSubscribeBlock';
import { PricingBlockRenderer } from '../components/blocks/PricingBlock';

const PublicPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadPage();

    // WebSocket for Live Sync
    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${backendUrl.replace(/^https?:\/\//, '')}/ws/${username}`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'page_update') {
            if (msg.data) {
              setData(msg.data);
            } else {
              loadPage();
            }
          }
        } catch (e) {
          // Silently handle WS parsing errors
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [username]);

  // Inject Global Analytics
  useEffect(() => {
    if (!data?.analytics) return;

    const { ga_pixel_id, fb_pixel_id } = data.analytics;

    // Google Analytics
    if (ga_pixel_id) {
      // 1. Load Main Lib if not present
      if (!document.getElementById('ga-lib')) {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${ga_pixel_id}`;
        script1.id = 'ga-lib';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
        `;
        document.head.appendChild(script2);
      }

      // 2. Config specific ID (if not already configured)
      if (!document.getElementById(`ga-config-${ga_pixel_id}`)) {
        const script3 = document.createElement('script');
        script3.innerHTML = `gtag('config', '${ga_pixel_id}');`;
        script3.id = `ga-config-${ga_pixel_id}`;
        document.head.appendChild(script3);
      }
    }

    // VK Pixel
    const { vk_pixel_id } = data.analytics;
    if (vk_pixel_id && !document.getElementById(`vk-pixel-${vk_pixel_id}`)) {
      const script = document.createElement('script');
      script.id = `vk-pixel-${vk_pixel_id}`;
      script.innerHTML = `
        !function(){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://vk.com/js/api/openapi.js?169",t.onload=function(){VK.Retargeting.Init("${vk_pixel_id}"),VK.Retargeting.Hit()},document.head.appendChild(t)}();
      `;
      document.head.appendChild(script);
    }

    // Facebook Pixel
    if (fb_pixel_id) {
      // 1. Init Main Lib if not present
      if (!window.fbq) {
        !function (f, b, e, v, n, t, s) {
          if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ?
              n.callMethod.apply(n, arguments) : n.queue.push(arguments)
          };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
          n.queue = []; t = b.createElement(e); t.async = !0;
          t.src = v; s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s)
        }(window, document, 'script',
          'https://connect.facebook.net/en_US/fbevents.js');
      }

      // 2. Init specific Pixel ID
      if (!document.getElementById(`fb-init-${fb_pixel_id}`)) {
        const script = document.createElement('script');
        script.innerHTML = `
          fbq('init', '${fb_pixel_id}');
          fbq('track', 'PageView');
        `;
        script.id = `fb-init-${fb_pixel_id}`;
        document.head.appendChild(script);
      }
    }
  }, [data]);

  // Handle Page Theme
  useEffect(() => {
    if (!data?.page) return;

    const pageTheme = data.page.theme === 'light' ? 'light' : 'dark';

    if (pageTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data]);

  // Handle SEO
  useEffect(() => {
    if (!data?.page) return;
    const { seoSettings, name } = data.page;

    // Title
    const baseTitle = seoSettings?.title || name || 'Моя страница';
    const finalTitle = `${baseTitle} | InBio.One`;
    document.title = finalTitle;

    // Meta Tags Helper
    const updateMeta = (name, property, content) => {
      let el = name ? document.querySelector(`meta[name="${name}"]`) : document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name) el.name = name;
        if (property) el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.content = content || '';
    };

    updateMeta(null, 'og:title', finalTitle);
    updateMeta('description', null, seoSettings?.description || '');
    updateMeta(null, 'og:description', seoSettings?.description || '');

    const ogImagePath = seoSettings?.og_image || '/uploads/files/og-preview/default.jpg';
    updateMeta(null, 'og:image', getImageUrl(ogImagePath));
    updateMeta(null, 'twitter:image', getImageUrl(ogImagePath));

    // Favicon
    if (seoSettings?.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = getImageUrl(seoSettings.favicon);
    }
  }, [data]);

  const loadPage = async () => {
    try {
      const response = await api.getPageByUsername(username);
      if (response.ok) {
        const result = await response.json();
        setData(result);

        // Parse UTM params
        const utmParams = (() => {
          const sp = new URLSearchParams(window.location.search);
          const utm = {};
          ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => {
            const v = sp.get(k);
            if (v) utm[k] = v;
          });
          return Object.keys(utm).length ? utm : null;
        })();

        // Track View with geo + UTM
        (async () => {
          try {
            const geoRes = await fetch('https://ipapi.co/json/', { mode: 'cors' });
            const geo = geoRes.ok ? await geoRes.json() : {};
            const countryCode = geo.country_code || '';
            const flag = countryCode
              ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
              : '';
            const country = geo.country_name || geo.country || '';
            api.trackEvent({
              page_id: result.page.id,
              username: result.page.username,
              event_type: 'view',
              metadata: { country: country || null, flag, ...(utmParams || {}) }
            }).catch(() => {});
          } catch {
            api.trackEvent({
              page_id: result.page.id,
              username: result.page.username,
              event_type: 'view',
              metadata: utmParams || undefined
            }).catch(() => {});
          }
        })();

      } else {
        navigate('/404');
      }
    } catch (error) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Страница не найдена</h2>
          <p className="text-muted-foreground">Проверьте URL и попробуйте снова</p>
        </div>
      </div>
    );
  }

  const { page, blocks, events, showcases } = data;

  const linkBlocks = blocks.filter(b => b.block_type === 'link');

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="public-page">
      <div className="max-w-[440px] mx-auto px-4 py-6">
        {/* Banner Section */}
        <div className="relative">
          {page.cover ? (
            <div
              className="w-full h-[215px] bg-cover overflow-hidden rounded-t-[12px] transition-all duration-300"
              style={{
                backgroundImage: `url(${getImageUrl(page.cover)})`,
                backgroundPosition: `${page.cover_position_x || 50}% ${page.cover_position || 50}%`
              }}
              data-testid="page-cover"
            />
          ) : (
            <div className="w-full h-[215px] bg-card rounded-t-[12px]" />
          )}
        </div>

        {/* Profile & Links Card */}
        <div className="relative -mt-12 z-10 space-y-4">
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20">
              {page.avatar ? (
                <img src={getImageUrl(page.avatar)} alt={page.name} className="w-24 h-24 rounded-full border-4 border-background object-cover shadow-2xl" data-testid="page-avatar" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-background bg-card flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
              )}
            </div>

            <div className="bg-card rounded-[12px] border border-border pt-16 pb-6 px-4 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center" data-testid="page-name">
                  {page.name}
                  {page.is_verified && !page.is_brand && page.brand_status !== 'verified' && (
                    <Tooltip content="Подтвержденная страница">
                      <BadgeCheck className="w-[18px] h-[18px] ml-2 text-black dark:text-white" />
                    </Tooltip>
                  )}
                  {(page.is_brand || page.brand_status === 'verified') && (
                    <Tooltip content="Подтвержденный бренд">
                      <ShieldCheck className="w-[18px] h-[18px] ml-2 text-black dark:text-white" />
                    </Tooltip>
                  )}
                </h1>
                {page.bio && <p className="text-muted-foreground text-sm whitespace-pre-wrap content-text" data-testid="page-bio">{page.bio}</p>}
              </div>

              {activeTab === 'profile' && linkBlocks.length > 0 && (
                <div className="space-y-3">
                  {linkBlocks.map((block) => (
                    <BlockSelector key={block.id} block={block} username={data?.page?.username} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          {(events.length > 0 || showcases.length > 0) && (
            <div className="flex justify-center gap-2 overflow-x-auto py-2" data-testid="tabs-container">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
              >
                Профиль
              </button>
              {events.length > 0 && (
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                >
                  События
                </button>
              )}
              {showcases.length > 0 && (
                <button
                  onClick={() => setActiveTab('showcases')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'showcases' ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                >
                  Витрины
                </button>
              )}
            </div>
          )}

          {/* Content Blocks */}
          <div data-testid="blocks-container" className="space-y-4">
            {activeTab === 'profile' && (
              <>
                {(() => {
                  const renderedBlocks = [];
                  let currentEventGroup = [];

                  const flushEvents = () => {
                    if (currentEventGroup.length === 0) return;
                    const sortedEvents = [...currentEventGroup].sort((a, b) => {
                      const dateA = new Date(a.content?.date || 0);
                      const dateB = new Date(b.content?.date || 0);
                      return dateA - dateB;
                    });
                    sortedEvents.forEach(block => {
                      renderedBlocks.push(<div key={block.id} className="w-full"><BlockSelector block={block} username={data?.page?.username} /></div>);
                    });
                    currentEventGroup = [];
                  };

                  blocks.filter(b => b.block_type !== 'link').forEach((block) => {
                    if (block.block_type === 'events') {
                      currentEventGroup.push(block);
                    } else {
                      flushEvents();
                      renderedBlocks.push(<div key={block.id} className="w-full"><BlockSelector block={block} username={data?.page?.username} /></div>);
                    }
                  });
                  flushEvents();

                  return renderedBlocks;
                })()}

                {blocks.length === 0 && <div className="text-center py-12 text-gray-500">Пока нет контента</div>}
              </>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {events.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            )}

            {activeTab === 'showcases' && (
              <div className="grid grid-cols-2 gap-4">
                {showcases.map((showcase) => <ShowcaseCard key={showcase.id} showcase={showcase} />)}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-12 pb-4">
          <a href="https://inbio.one" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-gray-600 hover:text-muted-foreground transition-colors">
            <span className="text-xs">Powered by</span>
            <Logo size="xs" forceTheme={page.theme} />
          </a>
        </div>
      </div>
    </div>
  );
};

// ===== BLOCK SELECTOR =====
const BlockSelector = ({ block, username }) => {
  const { block_type } = block;

  switch (block_type) {
    case 'link':
      return <LinkBlockRenderer block={block} username={username} />;
    case 'button':
      return <ButtonBlockRenderer block={block} />;
    case 'faq':
      return <FAQBlockRenderer block={block} />;
    case 'youtube':
      return <YouTubeBlockRenderer block={block} />;
    case 'gallery':
      return <ImageGalleryBlockRenderer block={block} />;
    case 'text':
      return <TextBlockRenderer block={block} />;
    case 'music':
      return <MusicBlockRenderer block={block} />;
    case 'countdown':
      return <CountdownBlockRenderer block={block} />;
    case 'tiktok':
      return <TikTokBlockRenderer block={block} />;
    case 'social_icons':
      return <SocialIconsBlockRenderer block={block} />;
    case 'instagram_post':
      return <InstagramPostBlockRenderer block={block} />;
    case 'spotify':
      return <SpotifyBlockRenderer block={block} />;
    case 'applemusic':
      return <AppleMusicBlockRenderer block={block} />;
    case 'pinterest':
      return <PinterestBlockRenderer block={block} />;
    case 'divider':
      return <DividerBlockRenderer block={block} />;
    case 'contact_form':
      return <ContactFormBlockRenderer block={block} />;
    case 'messengers':
      return <MessengersBlockRenderer block={block} />;
    case 'map':
      return <MapBlockRenderer block={block} />;
    case 'donation':
      return <DonationBlockRenderer block={block} />;
    case 'showcase':
      return <ShowcaseBlockRenderer block={block} />;
    case 'events':
      return <EventsBlockRenderer block={block} />;
    case 'qr_code':
      return <QRBlockRenderer block={block} />;
    case 'reviews':
      return <ReviewsBlockRenderer block={block} />;
    case 'schedule':
      return <ScheduleBlockRenderer block={block} />;
    case 'email_subscribe':
      return <EmailSubscribeBlockRenderer block={block} />;
    case 'pricing':
      return <PricingBlockRenderer block={block} />;
    default:
      return null;
  }
};

// ===== EVENT CARD =====
const EventCard = ({ event }) => (
  <div className="bg-card rounded-[2rem] border border-border p-4 shadow-xl">
    {event.cover && <img src={event.cover} alt={event.title} className="w-full h-40 object-cover rounded-[12px] mb-4" />}
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-14 h-14 rounded-[12px] bg-secondary flex flex-col items-center justify-center">
        <Calendar className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-1">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-1">{event.date}</p>
        {event.description && <p className="text-sm text-gray-500 mb-2">{event.description}</p>}
        {event.button_url && (
          <a href={event.button_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground hover:text-gray-300 transition-colors">
            {event.button_text} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  </div>
);

// ===== SHOWCASE CARD =====
const ShowcaseCard = ({ showcase }) => (
  <div className="bg-card rounded-[2rem] border border-border p-4 shadow-xl">
    {showcase.cover && <img src={showcase.cover} alt={showcase.title} className="w-full aspect-square object-cover rounded-[12px] mb-3" />}
    <h3 className="font-semibold text-foreground text-sm mb-1">{showcase.title}</h3>
    {showcase.price && <p className="text-sm text-muted-foreground mb-2">{showcase.price}</p>}
    {showcase.button_url && (
      <a href={showcase.button_url} target="_blank" rel="noopener noreferrer" className="block w-full py-2 text-center text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-[12px] transition-colors">
        {showcase.button_text}
      </a>
    )}
  </div>
);

export default PublicPage;
