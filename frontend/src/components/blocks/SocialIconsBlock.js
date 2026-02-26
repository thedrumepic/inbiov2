import React, { useState } from 'react';
import { X, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { api, getImageUrl } from '@/utils/api';

const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: '/uploads/social-logo/instagram.svg' },
    { id: 'telegram', name: 'Telegram', icon: '/uploads/social-logo/telegram.svg' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '/uploads/social-logo/whatsapp.svg' },
    { id: 'youtube', name: 'YouTube', icon: '/uploads/social-logo/youtube.svg' },
    { id: 'tiktok', name: 'TikTok', icon: '/uploads/social-logo/tiktok.svg' },
    { id: 'facebook', name: 'Facebook', icon: '/uploads/social-logo/facebook.svg' },
    { id: 'linkedin', name: 'LinkedIn', icon: '/uploads/social-logo/linkedin.svg' },
    { id: 'wechat', name: 'WeChat', icon: '/uploads/social-logo/wechat.svg' },
    { id: 'x', name: 'X (Twitter)', icon: '/uploads/social-logo/x.svg' },
    { id: 'threads', name: 'Threads', icon: '/uploads/social-logo/threads.svg' },
    { id: 'spotify', name: 'Spotify', icon: '/uploads/social-logo/spotify.svg' },
    { id: 'soundcloud', name: 'SoundCloud', icon: '/uploads/social-logo/soundcloud.svg' },
    { id: 'vk', name: 'VK', icon: '/uploads/social-logo/vk.svg' },
    { id: 'twitch', name: 'Twitch', icon: '/uploads/social-logo/twitch.svg' },
    { id: 'discord', name: 'Discord', icon: '/uploads/social-logo/discord.svg' },
    { id: 'pinterest', name: 'Pinterest', icon: '/uploads/social-logo/pinterest.svg' },
];

// Platforms whose SVGs are black and need to be inverted to white in dark mode
const MONO_PLATFORMS = ['tiktok', 'x', 'threads'];

const PlatformIcon = ({ platform, className = "w-5 h-5" }) => {
    const platformData = SOCIAL_PLATFORMS.find(p => p.id === platform);
    if (platformData?.icon) {
        const isMono = MONO_PLATFORMS.includes(platform);
        const src = getImageUrl(platformData.icon) + (isMono ? '?v=2' : '');
        return <img src={src} alt={platformData.name} className={`${className}${isMono ? ' dark:invert' : ''}`} />;
    }
    return <span className={className}>?</span>;
};

export const SocialIconsBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [links, setLinks] = useState(block?.content?.links || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPlatformPicker, setShowPlatformPicker] = useState(false);

    const addLink = (platformId) => {
        if (links.length >= 15) return;
        setLinks([...links, { platform: platformId, url: '' }]);
        setShowPlatformPicker(false);
    };

    const updateLink = (index, field, value) => {
        const updated = [...links];
        if (field === 'url') {
            // Auto-prefix https:// if user starts typing without it
            if (value.length > 0 && !value.startsWith('https://') && !value.startsWith('http://')) {
                value = 'https://' + value;
            }
        }
        updated[index] = { ...updated[index], [field]: value };
        setLinks(updated);
    };

    const removeLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError('');

        const validLinks = links.filter(l => l.url.trim());
        if (validLinks.length === 0) {
            setError('Добавьте хотя бы одну ссылку');
            return;
        }

        // Auto-fix links without https://
        const fixedLinks = validLinks.map(link => ({
            ...link,
            url: link.url.startsWith('http') ? link.url : 'https://' + link.url
        }));

        setLoading(true);
        try {
            const content = { links: fixedLinks };
            let response;
            if (block) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'social_icons',
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

    // Filter out already added platforms
    const availablePlatforms = SOCIAL_PLATFORMS.filter(
        p => !links.some(l => l.platform === p.id)
    );

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Социальные иконки</h1>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto w-full p-4 space-y-4">
                {/* Preview */}
                {links.length > 0 && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                        <p className="text-xs text-muted-foreground mb-3 text-center">Предпросмотр</p>
                        <SocialIconsBlockRenderer block={{ content: { links } }} />
                    </div>
                )}

                {/* Links list */}
                <div className="space-y-3">
                    {links.map((link, index) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                        return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                                    <PlatformIcon platform={link.platform} className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{platform?.name}</p>
                                    <input
                                        type="text"
                                        value={link.url}
                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={() => removeLink(index)}
                                    className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Add button */}
                {links.length < 15 && (
                    <button
                        onClick={() => setShowPlatformPicker(true)}
                        className="w-full py-3 bg-secondary border border-dashed border-border rounded-xl text-muted-foreground font-medium hover:border-foreground/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Добавить соцсеть</span>
                    </button>
                )}

                {/* Platform picker */}
                {showPlatformPicker && (
                    <div className="fixed inset-0 backdrop-blur-sm flex items-end justify-center z-[100] p-4" onClick={() => setShowPlatformPicker(false)}>
                        <div className="w-full max-w-[440px] bg-card rounded-t-[24px] p-6 animate-slide-up border border-border max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground">Выберите соцсеть</h3>
                                <button onClick={() => setShowPlatformPicker(false)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {availablePlatforms.map((platform) => (
                                    <button
                                        key={platform.id}
                                        onClick={() => addLink(platform.id)}
                                        className="flex flex-col items-center gap-2 p-3 hover:bg-secondary/50 border border-transparent hover:border-border rounded-xl transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                            <PlatformIcon platform={platform.id} className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] text-foreground font-medium text-center leading-tight">{platform.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || links.length === 0}
                    className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Сохранение...' : (block ? 'Обновить' : 'Добавить блок')}
                </button>
            </main>
        </div>
    );
};

export const SocialIconsBlockRenderer = ({ block }) => {
    const { links } = block.content;

    if (!links || links.length === 0) return null;

    return (
        <div className="w-full">
            <div className="flex flex-wrap justify-center gap-3">
                {links.map((link, index) => (
                    <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-all hover:scale-110"
                        title={SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform}
                    >
                        <PlatformIcon platform={link.platform} className="w-5 h-5" />
                    </a>
                ))}
            </div>
        </div>
    );
};
