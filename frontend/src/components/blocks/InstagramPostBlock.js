import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { api, getImageUrl } from '@/utils/api';

// Parse Instagram or Threads post URL to get embed URL
const parseInstagramUrl = (url) => {
    if (!url) return null;

    try {
        // Instagram post: instagram.com/p/POST_ID/ or instagram.com/reel/POST_ID/
        const igPostMatch = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
        if (igPostMatch) {
            return {
                type: 'instagram',
                postId: igPostMatch[2],
                embedUrl: `https://www.instagram.com/${igPostMatch[1]}/${igPostMatch[2]}/embed/`,
            };
        }

        // Threads post: threads.net/@user/post/POST_ID or threads.com/@user/post/POST_ID
        const threadsMatch = url.match(/threads\.(?:net|com)\/@([\w.]+)\/post\/([A-Za-z0-9_-]+)/);
        if (threadsMatch) {
            return {
                type: 'threads',
                postId: threadsMatch[2],
                embedUrl: `https://www.threads.net/@${threadsMatch[1]}/post/${threadsMatch[2]}/embed`,
            };
        }

        return null;
    } catch (e) {
        return null;
    }
};

export const InstagramPostBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        if (!url) {
            setError('Введите ссылку на пост');
            return;
        }

        const parsed = parseInstagramUrl(url);
        if (!parsed) {
            setError('Некорректная ссылка. Поддерживаются Instagram посты/reels и Threads посты.');
            return;
        }

        setLoading(true);
        try {
            const content = {
                url,
                embedUrl: parsed.embedUrl,
                postId: parsed.postId,
                platform: parsed.type,
            };

            let response;
            if (block) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'instagram_post',
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

    const parsed = parseInstagramUrl(url);

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Instagram / Threads</h1>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto w-full p-4 space-y-6">
                <div className="text-center space-y-2 py-4">
                    <div className="w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <img
                            src={getImageUrl('/uploads/social-logo/instagram.svg')}
                            alt="Instagram"
                            className="w-8 h-8"
                        />
                    </div>
                    <h2 className="text-xl font-bold">Встроить пост</h2>
                    <p className="text-sm text-muted-foreground">
                        Вставьте ссылку на пост из Instagram или Threads
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Ссылка на пост</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.instagram.com/p/..."
                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-foreground/30 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground ml-1">
                            Поддерживаются посты, reels из Instagram и посты Threads
                        </p>
                    </div>

                    {parsed && (
                        <div className="pt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2 ml-1">Предпросмотр</p>
                            <InstagramPostBlockRenderer block={{
                                content: {
                                    url,
                                    embedUrl: parsed.embedUrl,
                                    platform: parsed.type
                                }
                            }} />
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
                    {loading ? 'Сохранение...' : (block ? 'Обновить' : 'Добавить пост')}
                </button>
            </main>
        </div>
    );
};

export const InstagramPostBlockRenderer = ({ block }) => {
    const { url, platform } = block.content;

    // Determine platform
    const isThreads = platform === 'threads' || (url && (url.includes('threads.net') || url.includes('threads.com')));

    // Use the same initial height for both platforms to prevent cutoff and maintain consistency
    const initialHeight = 540;
    const [height, setHeight] = React.useState(initialHeight);
    const iframeRef = React.useRef(null);

    React.useEffect(() => {
        // CLEANUP: Remove any legacy scripts from previous versions
        const legacyScripts = ['threads-embed-script', 'instagram-embed-script'];
        legacyScripts.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const handleMessage = (event) => {
            // Only respond to messages from our own iframe for security and correctness
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

            try {
                if (!event.data) return;

                let data = event.data;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        // Ignore non-JSON strings
                    }
                }

                // Comprehensive height check for all known Meta embed message formats
                let newHeight = null;

                // Format: { type: 'MOA_RESIZE', details: { height: 123 } }
                if ((data.type === 'MOA_RESIZE' || data.type === 'moa_resize') && data.details?.height) {
                    newHeight = data.details.height;
                }
                // Format: { action: 'resize', height: 123 }
                else if (data.action === 'resize' && data.height) {
                    newHeight = data.height;
                }
                // Fallback for any object containing height and implying a resize
                else if (data.height && (data.type?.includes('resize') || data.action?.includes('resize'))) {
                    newHeight = data.height;
                }

                if (newHeight && newHeight > 50) { // Safety check to avoid zero height
                    setHeight(newHeight);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isThreads]); // Add isThreads to dependencies to reset if platform changes

    if (!url) {
        return (
            <div className="w-full p-6 bg-card border border-border rounded-2xl text-center">
                <p className="text-muted-foreground text-sm">Ссылка не указана</p>
            </div>
        );
    }

    // Resolve embed URL
    let embedUrl = '';
    const parsed = parseInstagramUrl(url);
    if (parsed) {
        embedUrl = parsed.embedUrl;
        // Ensure Threads uses .net for the iframe src to avoid CSP/Cross-Origin issues with .com
        if (isThreads) {
            embedUrl = embedUrl.replace('threads.com', 'threads.net');
        }
    }

    if (!embedUrl) {
        return (
            <div className="w-full p-6 bg-card border border-border rounded-2xl text-center">
                <p className="text-muted-foreground text-sm">Некорректная ссылка</p>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center overflow-hidden rounded-2xl" key={url}>
            <iframe
                ref={iframeRef}
                src={embedUrl}
                style={{
                    width: '100%',
                    maxWidth: 540,
                    height: `${height}px`,
                    border: 'none',
                    transition: 'height 0.4s ease-in-out',
                    background: 'transparent'
                }}
                allowFullScreen
                allow="encrypted-media"
                title={isThreads ? "Threads post" : "Instagram post"}
                scrolling="no"
            />
        </div>
    );
};
