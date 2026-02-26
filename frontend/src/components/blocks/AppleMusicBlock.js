import React, { useState, useEffect } from 'react';
import { Music, X, ArrowLeft, Link2 } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';

/**
 * Парсинг Apple Music URL
 * Поддерживаемые форматы для всех стран (us, ru, gb, de, fr, jp, kr, cn и др.):
 * - Album: https://music.apple.com/{country}/album/album-name/1234567890
 * - Song (в альбоме): https://music.apple.com/{country}/album/album-name/1234567890?i=9876543210
 * - Song (прямая): https://music.apple.com/{country}/song/song-name/1234567890
 * - Playlist: https://music.apple.com/{country}/playlist/playlist-name/pl.u-abc123
 * 
 * Примеры стран:
 * us (США), ru (Россия), gb (Великобритания), de (Германия), fr (Франция),
 * jp (Япония), kr (Корея), cn (Китай), br (Бразилия), mx (Мексика),
 * it (Италия), es (Испания), ca (Канада), au (Австралия), in (Индия)
 */
const parseAppleMusicUrl = (url) => {
    if (!url) return null;

    // Извлекаем ID из URL
    const albumMatch = url.match(/\/album\/[^/]+\/(\d+)/);
    const playlistMatch = url.match(/\/playlist\/[^/]+(\/pl\.[a-zA-Z0-9-]+)/);
    const songParamMatch = url.match(/\?i=(\d+)/);
    const songPathMatch = url.match(/\/song\/[^/]+\/(\d+)/);

    if (songParamMatch && albumMatch) {
        return { type: 'song', albumId: albumMatch[1], songId: songParamMatch[1] };
    } else if (songPathMatch) {
        return { type: 'song', id: songPathMatch[1] };
    } else if (albumMatch) {
        return { type: 'album', id: albumMatch[1] };
    } else if (playlistMatch) {
        return { type: 'playlist', id: playlistMatch[1] };
    }

    return null;
};

export const AppleMusicBlockRenderer = ({ block }) => {
    const { content } = block;
    const appleMusicData = parseAppleMusicUrl(content?.url);

    if (!appleMusicData || !content?.url) return null;

    // Высота: песня = 175px, альбом/плейлист = 450px
    const height = appleMusicData.type === 'song' ? '175' : '450';

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
                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                    frameBorder="0"
                    height={height}
                    style={{
                        width: '100%',
                        maxWidth: '660px',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        background: 'transparent'
                    }}
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                    src={`https://embed.music.apple.com${content.url.split('music.apple.com')[1]}`}
                    loading="lazy"
                    title={content.title || 'Apple Music Player'}
                />
            </div>
        </div>
    );
};

export const AppleMusicBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [saving, setSaving] = useState(false);
    const [appleMusicData, setAppleMusicData] = useState(parseAppleMusicUrl(block?.content?.url));

    useEffect(() => {
        const data = parseAppleMusicUrl(url);
        setAppleMusicData(data);
    }, [url]);

    const handleSave = async () => {
        if (!appleMusicData) {
            toast.error('Введите корректную ссылку на Apple Music');
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
                    block_type: 'applemusic',
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
        if (!appleMusicData) return '';
        const labels = {
            song: 'Песня',
            album: 'Альбом',
            playlist: 'Плейлист'
        };
        return labels[appleMusicData.type] || '';
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Apple Music</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Preview */}
                <div className="space-y-4">
                    <div className="bg-secondary rounded-[24px] border border-border overflow-hidden">
                        {appleMusicData && url ? (
                            <div className="p-4">
                                <iframe
                                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                                    frameBorder="0"
                                    height={appleMusicData.type === 'song' ? '175' : '450'}
                                    style={{
                                        width: '100%',
                                        maxWidth: '660px',
                                        overflow: 'hidden',
                                        borderRadius: '12px',
                                        background: 'transparent'
                                    }}
                                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                                    src={`https://embed.music.apple.com${url.split('music.apple.com')[1]}`}
                                    loading="lazy"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary gap-3">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Music className="w-8 h-8 text-foreground" />
                                </div>
                                <span className="text-sm font-medium">Тут будет Apple Music плеер</span>
                            </div>
                        )}
                    </div>
                    {appleMusicData && (
                        <div className="text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-xs font-medium">
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
                            Ссылка на Apple Music
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
                                placeholder="https://music.apple.com/{country}/song/..."
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1 italic">
                            Поддерживаются все страны (us, ru, gb, de, fr и др.). Песни, альбомы и плейлисты
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
