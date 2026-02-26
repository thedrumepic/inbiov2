import React, { useState, useEffect } from 'react';
import { Youtube, X, ArrowLeft, Type, Link2, Play } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';

/**
 * Utility to parse YouTube video ID from various URL formats
 */
const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const YouTubeBlockRenderer = ({ block }) => {
    const { content } = block;
    const videoId = getYouTubeId(content?.url);

    if (!videoId) return null;

    return (
        <div className="w-full">
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">
                <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=0`}
                        title={content.title || 'YouTube Video'}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                {(content.title || content.description) && (
                    <div className="p-4 border-t border-border space-y-1">
                        {content.title && (
                            <h4 className="text-[15px] font-bold text-foreground tracking-tight leading-tight">
                                {content.title}
                            </h4>
                        )}
                        {content.description && (
                            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                                {content.description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const YouTubeBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [url, setUrl] = useState(block?.content?.url || '');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [description, setDescription] = useState(block?.content?.description || '');
    const [saving, setSaving] = useState(false);
    const [videoId, setVideoId] = useState(getYouTubeId(block?.content?.url));

    useEffect(() => {
        const id = getYouTubeId(url);
        setVideoId(id);
    }, [url]);

    const handleSave = async () => {
        if (!videoId) {
            toast.error('Введите корректную ссылку на YouTube');
            return;
        }

        setSaving(true);
        try {
            const content = { url, title, description };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) {
                    toast.success('Блок обновлён');
                    onSuccess();
                }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'youtube',
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

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Видео на YouTube</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Visual Preview */}
                <div className="space-y-4">
                    <div className="bg-secondary rounded-[24px] border border-border overflow-hidden">
                        {videoId ? (
                            <div className="aspect-video relative group">
                                <img
                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                    className="w-full h-full object-cover"
                                    alt="Video Preview"
                                    onError={(e) => {
                                        e.target.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                                        <Play className="w-8 h-8 text-foreground fill-white" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary gap-3">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Youtube className="w-8 h-8 text-foreground" />
                                </div>
                                <span className="text-sm font-medium">Тут будет превью видео</span>
                            </div>
                        )}
                        {(title || description) && (
                            <div className="p-4 bg-card border-t border-border space-y-1">
                                {title && <h4 className="text-[15px] font-bold text-foreground tracking-tight">{title}</h4>}
                                {description && <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Ссылка на YouTube</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                                <Link2 className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Заголовок</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm"
                            placeholder="Название видео..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Описание</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm resize-none"
                            placeholder="Краткое описание (необязательно)..."
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
