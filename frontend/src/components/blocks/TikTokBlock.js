import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { api, getImageUrl } from '@/utils/api';

// Helper to extract video ID from TikTok URLs
const parseTikTokUrl = (url) => {
    if (!url) return null;

    try {
        // Standard format: tiktok.com/@user/video/VIDEO_ID
        const standardMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (standardMatch) {
            return { id: standardMatch[1], url };
        }

        // Short format: vm.tiktok.com/XXXXX/ or vt.tiktok.com/XXXXX/
        const shortMatch = url.match(/(?:vm|vt)\.tiktok\.com\/([A-Za-z0-9]+)/);
        if (shortMatch) {
            return { id: shortMatch[1], url, isShort: true };
        }

        // Any other tiktok.com link
        if (url.includes('tiktok.com')) {
            return { id: null, url };
        }

        return null;
    } catch (e) {
        return null;
    }
};

export const TikTokBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        if (!url) {
            setError('Введите ссылку на видео');
            return;
        }

        const parsed = parseTikTokUrl(url);
        if (!parsed) {
            setError('Некорректная ссылка на TikTok');
            return;
        }

        if (!parsed.id || parsed.isShort) {
            setError('Вставьте полную ссылку формата tiktok.com/@user/video/ID');
            return;
        }

        setLoading(true);
        try {
            const content = {
                url: url,
                videoId: parsed.id,
            };

            let response;
            if (block) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'tiktok',
                    content,
                    order: blocksCount,
                });
            }

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await response.json();
                setError(err.detail || 'Ошибка сохранения');
            }
        } catch (err) {
            setError('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    const parsed = parseTikTokUrl(url);
    const canPreview = parsed && parsed.id && !parsed.isShort;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">TikTok</h1>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
                <div className="text-center space-y-2 py-4">
                    <div className="w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <img
                            src={getImageUrl('/uploads/social-logo/tiktok.svg') + '?v=2'}
                            alt="TikTok"
                            className="w-8 h-8 dark:invert"
                        />
                    </div>
                    <h2 className="text-xl font-bold">Добавить TikTok видео</h2>
                    <p className="text-sm text-muted-foreground">
                        Вставьте ссылку на видео, чтобы встроить его на страницу
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Ссылка на видео</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.tiktok.com/@user/video/..."
                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-foreground/30 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground ml-1">
                            Вставьте полную ссылку на видео из TikTok
                        </p>
                    </div>

                    {canPreview && (
                        <div className="pt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2 ml-1">Предпросмотр</p>
                            <TikTokBlockRenderer block={{ content: { url, videoId: parsed.id } }} />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !url}
                    className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                    {loading ? 'Сохранение...' : (block ? 'Обновить' : 'Добавить видео')}
                </button>
            </main>
        </div>
    );
};

export const TikTokBlockRenderer = ({ block }) => {
    const { url, videoId } = block.content;
    const containerRef = useRef(null);

    const resolvedId = videoId || (() => {
        const match = url?.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        return match ? match[1] : null;
    })();

    useEffect(() => {
        if (!url) return;

        // Remove old script to force re-scan
        const oldScript = document.getElementById('tiktok-embed-script');
        if (oldScript) {
            oldScript.remove();
        }

        // Add script fresh — it will scan DOM and convert blockquotes to embeds
        const script = document.createElement('script');
        script.id = 'tiktok-embed-script';
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Clean up generated iframes inside our container on unmount
            if (containerRef.current) {
                const iframes = containerRef.current.querySelectorAll('iframe');
                iframes.forEach(iframe => iframe.remove());
            }
        };
    }, [url]);

    if (!url || !resolvedId) {
        return (
            <div className="w-full p-6 bg-card border border-border rounded-2xl text-center">
                <p className="text-muted-foreground text-sm">Не удалось загрузить видео</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-2xl" ref={containerRef}>
            <blockquote
                className="tiktok-embed"
                cite={url}
                data-video-id={resolvedId}
                style={{ maxWidth: '100%', margin: 0 }}
            >
                <section>
                    <a target="_blank" href={url} rel="noreferrer" style={{ display: 'none' }}>
                        TikTok
                    </a>
                </section>
            </blockquote>
        </div>
    );
};
