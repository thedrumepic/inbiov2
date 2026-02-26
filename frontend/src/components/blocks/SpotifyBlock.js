import React, { useState, useEffect } from 'react';
import { Music, X, ArrowLeft, Link2 } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';

/**
 * Парсинг Spotify URL и определение типа контента
 * Поддерживаемые форматы:
 * - Track: https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
 * - Album: https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy
 * - Playlist: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 */
const parseSpotifyUrl = (url) => {
    if (!url) return null;

    const patterns = [
        { type: 'track', regex: /spotify\.com\/track\/([a-zA-Z0-9]+)/ },
        { type: 'album', regex: /spotify\.com\/album\/([a-zA-Z0-9]+)/ },
        { type: 'playlist', regex: /spotify\.com\/playlist\/([a-zA-Z0-9]+)/ },
        { type: 'artist', regex: /spotify\.com\/artist\/([a-zA-Z0-9]+)/ }
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern.regex);
        if (match) {
            return { type: pattern.type, id: match[1] };
        }
    }

    return null;
};

export const SpotifyBlockRenderer = ({ block }) => {
    const { content } = block;
    const spotifyData = parseSpotifyUrl(content?.url);

    if (!spotifyData) return null;

    // Высота виджета: трек = 152px, альбом/плейлист = 352px
    const height = spotifyData.type === 'track' ? '152' : '352';
    const embedUrl = `https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}`;

    return (
        <div className="w-full">
            {content?.title && (
                <div className="mb-3">
                    <h3 className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                        {content.title}
                    </h3>
                </div>
            )}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">
                <iframe
                    style={{ borderRadius: '12px' }}
                    src={embedUrl}
                    width="100%"
                    height={height}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={content.title || 'Spotify Player'}
                />
            </div>
        </div>
    );
};

export const SpotifyBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [saving, setSaving] = useState(false);
    const [spotifyData, setSpotifyData] = useState(parseSpotifyUrl(block?.content?.url));

    useEffect(() => {
        const data = parseSpotifyUrl(url);
        setSpotifyData(data);
    }, [url]);

    const handleSave = async () => {
        if (!spotifyData) {
            toast.error('Введите корректную ссылку на Spotify');
            return;
        }

        setSaving(true);
        try {
            const content = { url, title };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) {
                    toast.success('Блок обновлён');
                    onSuccess();
                }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'spotify',
                    content,
                    order: blocksCount || 0,
                });
                if (response.ok) {
                    toast.success('Блок создан');
                    onSuccess();
                }
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    };

    const getTypeLabel = () => {
        if (!spotifyData) return '';
        const labels = {
            track: 'Трек',
            album: 'Альбом',
            playlist: 'Плейлист',
            artist: 'Артист'
        };
        return labels[spotifyData.type] || '';
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Spotify</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Preview */}
                <div className="space-y-4">
                    <div className="bg-secondary rounded-[24px] border border-border overflow-hidden">
                        {spotifyData ? (
                            <div className="p-4">
                                <iframe
                                    style={{ borderRadius: '12px' }}
                                    src={`https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}`}
                                    width="100%"
                                    height={spotifyData.type === 'track' ? '152' : '352'}
                                    frameBorder="0"
                                    allowFullScreen
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary gap-3">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Music className="w-8 h-8 text-foreground" />
                                </div>
                                <span className="text-sm font-medium">Тут будет Spotify плеер</span>
                            </div>
                        )}
                    </div>
                    {spotifyData && (
                        <div className="text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                                <Music className="w-3.5 h-3.5" />
                                {getTypeLabel()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">
                            Ссылка на Spotify
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
                                placeholder="https://open.spotify.com/track/..."
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1 italic">
                            Поддерживаются треки, альбомы и плейлисты
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
                    disabled={saving}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                    {saving ? 'Сохранение...' : (block?.id ? 'Обновить блок' : 'Сохранить')}
                </button>
            </main>
        </div>
    );
};
