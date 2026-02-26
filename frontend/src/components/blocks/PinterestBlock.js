import React, { useState, useEffect, useRef } from 'react';
import { Image, X, ArrowLeft, Link2 } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';

/**
 * Парсинг Pinterest URL
 */
const parsePinterestUrl = (url) => {
    if (!url) return null;

    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

        // Short links (pin.it)
        if (urlObj.hostname === 'pin.it') {
            return { type: 'pin', isShort: true, url: urlObj.href };
        }

        // Standard Pinterest domains
        if (urlObj.hostname.includes('pinterest.')) {
            const pinMatch = urlObj.pathname.match(/\/pin\/(\d+)/);
            if (pinMatch) {
                return { type: 'pin', id: pinMatch[1], url: urlObj.href };
            }
            if (!urlObj.pathname.includes('/pin/') && !urlObj.pathname.includes('/_/') && urlObj.pathname.split('/').filter(Boolean).length >= 2) {
                const parts = urlObj.pathname.split('/').filter(Boolean);
                return {
                    type: 'board',
                    username: parts[0],
                    boardName: parts[1],
                    url: urlObj.href
                };
            }
        }
    } catch (e) {
        return null;
    }

    return null;
};

/**
 * Компонент-изолятор.
 * Рендерит Pinterest SDK внутри iframe с авто-высотой.
 */
const PinterestWidgetIframe = ({ url, type, defaultHeight = 500 }) => {
    const iframeRef = useRef(null);
    const [height, setHeight] = useState(defaultHeight);
    const [uid] = useState(() => Math.random().toString(36).substr(2, 9));

    useEffect(() => {
        const handleMessage = (event) => {
            // Фильтруем сообщения только от нашего iframe
            if (event.data?.type === 'pinterest-resize' && event.data?.uid === uid) {
                // Добавляем немного отступа, чтобы точно не было скролла
                setHeight(event.data.height + 20);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [uid]);

    // Генерируем HTML для iframe
    const getIframeContent = () => {
        const embedCode = type === 'pin'
            ? `<a data-pin-do="embedPin" data-pin-width="medium" href="${url}"></a>`
            : `<a data-pin-do="embedBoard" data-pin-board-width="100%" data-pin-scale-height="300" data-pin-scale-width="100" href="${url}"></a>`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        display: flex; 
                        justify-content: center; 
                        overflow: hidden; 
                        font-family: sans-serif;
                    }
                    /* Скрываем скроллбары */
                    ::-webkit-scrollbar { display: none; }
                </style>
            </head>
            <body>
                <div id="widget-container" style="display: flex; justify-content: center; width: 100%;">
                    ${embedCode}
                </div>
                <script type="text/javascript" async defer src="//assets.pinterest.com/js/pinit.js"></script>
                <script>
                    const uid = "${uid}";
                    
                    // Перехват ошибок
                    window.onerror = function(msg, url, line) {
                        return true;
                    };

                    // Отслеживание размера через ResizeObserver
                    const container = document.getElementById('widget-container');
                    
                    // Функция отправки размера
                    const sendHeight = () => {
                        const height = document.body.scrollHeight;
                        window.parent.postMessage({ type: 'pinterest-resize', uid: uid, height: height }, '*');
                    };

                    const observer = new ResizeObserver(() => {
                        sendHeight();
                    });
                    
                    // Следим за body и контейнером
                    observer.observe(document.body);
                    if (container) observer.observe(container);
                    
                    // Периодическая проверка (так как картинки могут грузиться долго)
                    let itemsChecked = 0;
                    const interval = setInterval(() => {
                       sendHeight();
                       itemsChecked++;
                       if (itemsChecked > 20) clearInterval(interval); // Останавливаем через 10 секунд
                    }, 500);
                </script>
            </body>
            </html>
        `;
    };

    return (
        <iframe
            ref={iframeRef}
            srcDoc={getIframeContent()}
            title="Pinterest Widget"
            style={{
                width: '100%',
                height: `${height}px`,
                border: 'none',
                overflow: 'hidden',
                transition: 'height 0.3s ease'
            }}
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
    );
};

export const PinterestBlockRenderer = ({ block }) => {
    const { content } = block;
    const pinterestData = parsePinterestUrl(content?.url);

    if (!pinterestData) return null;

    const renderTitle = () => (
        content?.title && (
            <div className="mb-3">
                <h3 className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                    {content.title}
                </h3>
            </div>
        )
    );

    // Фоллбек для коротких ссылок pin.it (если вдруг не развернулись)
    if (pinterestData.isShort) {
        return (
            <div className="w-full">
                {renderTitle()}
                <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-[12px] hover:bg-secondary transition-colors group"
                >
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shrink-0 text-white">
                        <Image className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate group-hover:text-red-500 transition-colors">
                            Открыть Pin в Pinterest
                        </p>
                        <p className="text-xs text-muted-foreground truncate opacity-70">
                            {content.url}
                        </p>
                    </div>
                    <Link2 className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
            </div>
        );
    }

    // Изолированный рендеринг через Iframe
    return (
        <div className="w-full">
            {renderTitle()}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden p-4 flex justify-center min-h-[150px]">
                <PinterestWidgetIframe
                    url={pinterestData.url}
                    type={pinterestData.type}
                    defaultHeight={pinterestData.type === 'pin' ? 600 : 400}
                />
            </div>
        </div>
    );
};

export const PinterestBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [saving, setSaving] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [pinterestData, setPinterestData] = useState(null);

    // Refs
    const resolveTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!url) {
            setPinterestData(null);
            return;
        }

        const processUrl = async () => {
            // 1. Автоматическое разворачивание pin.it
            if (url.includes('pin.it')) {
                setIsResolving(true);
                if (isMountedRef.current) setPinterestData(null);
                try {
                    const res = await api.resolveUrl(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.url && data.url !== url && isMountedRef.current) {
                            setUrl(data.url);
                            toast.success("Ссылка успешно развернута");
                            return;
                        }
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    if (isMountedRef.current) setIsResolving(false);
                }
            }

            // 2. Парсинг
            if (!url.includes('pin.it') && isMountedRef.current) {
                setPinterestData(parsePinterestUrl(url));
            }
        };

        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = setTimeout(processUrl, 600);

        return () => {
            if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        };
    }, [url]);

    const handleSave = async () => {
        if (!pinterestData && !isResolving) {
            toast.error('Введите корректную ссылку на Pinterest');
            return;
        }

        if (pinterestData?.isShort && !isResolving) {
            toast.error('Не удалось развернуть ссылку. Попробуйте полную.');
            return;
        }

        if (isResolving) {
            toast.message('Подождите завершения обработки...');
            return;
        }

        setSaving(true);

        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

        try {
            const content = { url, title };
            let response;

            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'pinterest',
                    content,
                    order: blocksCount || 0,
                });
            }

            if (response.ok) {
                toast.success(block?.id ? 'Блок обновлён' : 'Блок создан');
                if (isMountedRef.current) onSuccess();
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            if (isMountedRef.current) setSaving(false);
        }
    };

    const getTypeLabel = () => {
        if (!pinterestData) return '';
        const labels = {
            pin: 'Пин',
            board: 'Доска'
        };
        return labels[pinterestData.type] || '';
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Pinterest</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Preview */}
                <div className="space-y-4">
                    <div className="bg-secondary rounded-[24px] border border-border overflow-hidden">
                        {isResolving ? (
                            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary gap-3 animate-pulse">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Image className="w-8 h-8 text-foreground opacity-50" />
                                </div>
                                <span className="text-sm font-medium">Разворачиваем ссылку...</span>
                            </div>
                        ) : (pinterestData && url ? (
                            <div className="p-4 min-h-[200px] flex justify-center">
                                {/* Используем тот же Iframe-изолятор для превью */}
                                <PinterestWidgetIframe
                                    url={pinterestData.url}
                                    type={pinterestData.type}
                                    defaultHeight={pinterestData.type === 'pin' ? 600 : 400}
                                />
                            </div>
                        ) : (
                            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary gap-3">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Image className="w-8 h-8 text-foreground" />
                                </div>
                                <span className="text-sm font-medium">Тут будет Pinterest виджет</span>
                            </div>
                        ))}
                    </div>
                    {pinterestData && !isResolving && (
                        <div className="text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                                <Image className="w-3.5 h-3.5" />
                                {getTypeLabel()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">
                            Ссылка на Pinterest
                        </label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                                <Link2 className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm"
                                placeholder="https://pin.it/... или pinterest.com/pin/..."
                                disabled={isResolving}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1 italic">
                            {isResolving ? 'Получаем данные...' : 'Поддерживаются сокращенные ссылки pin.it, пины и доски'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">
                            Заголовок (необязательно)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm"
                            placeholder="Название..."
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || isResolving}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                    {saving || isResolving ? 'Обработка...' : (block?.id ? 'Обновить блок' : 'Сохранить')}
                </button>
            </main>
        </div>
    );
};
