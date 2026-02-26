import React, { useState } from 'react';
import { Link2, ExternalLink, Trash2, GripVertical, X, ChevronDown } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';

export const SOCIAL_PLATFORMS = [
    { id: 'custom', name: 'Своя ссылка', icon: null, domain: '', placeholder: 'Мой сайт', color: '#888888' },
    { id: 'instagram', name: 'Instagram', icon: '/uploads/social-logo/instagram.svg', domain: 'instagram.com', placeholder: 'Instagram profile', color: '#FF0069' },
    { id: 'youtube', name: 'YouTube', icon: '/uploads/social-logo/youtube.svg', domain: 'youtube.com', placeholder: 'YouTube channel', color: '#FF0000' },
    { id: 'tiktok', name: 'TikTok', icon: '/uploads/social-logo/tiktok.svg', domain: 'tiktok.com', placeholder: '@username', color: '#000000' },
    { id: 'telegram', name: 'Telegram', icon: '/uploads/social-logo/telegram.svg', domain: 't.me', placeholder: 'username', color: '#26A5E4' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '/uploads/social-logo/whatsapp.svg', domain: 'wa.me', placeholder: '71234567890', color: '#25D366' },
    { id: 'facebook', name: 'Facebook', icon: '/uploads/social-logo/facebook.svg', domain: 'facebook.com', placeholder: 'facebook.com/name', color: '#0866FF' },
    { id: 'wechat', name: 'WeChat', icon: '/uploads/social-logo/wechat.svg', domain: '', placeholder: 'WeChat ID', color: '#07C160' },
    { id: 'linkedin', name: 'LinkedIn', icon: '/uploads/social-logo/linkedin.svg', domain: 'linkedin.com/in', placeholder: 'linkedin.com/in/name', color: '#0077B5' },
];

export const LinkBlockItem = ({ block, onDelete, dragHandleProps }) => {
    const { content } = block;
    const platform = SOCIAL_PLATFORMS.find(p => p.id === content.platform);

    return (
        <div className="group flex items-center gap-3 p-3 bg-secondary border border-border rounded-[12px] hover:border-foreground/20 transition-colors">
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                    backgroundColor: platform?.id === 'tiktok' ? '#000000' : (platform?.color ? `${platform.color}15` : 'rgba(255,255,255,0.12)')
                }}
            >
                {platform?.icon ? (
                    <img src={getImageUrl(platform.icon)} className={`w-6 h-6 object-contain ${platform.id === 'tiktok' ? 'invert' : ''}`} alt="" />
                ) : (
                    <Link2 className="w-5 h-5 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{content.title}</div>
                <div className="text-xs text-gray-500 truncate">{content.url}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center hover:bg-foreground/10 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>
                <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>
            <div {...dragHandleProps} className="w-8 h-8 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
        </div>
    );
};

export const LinkBlockRenderer = ({ block, username }) => {
    const { content } = block;
    const platform = SOCIAL_PLATFORMS.find(p => p.id === content.platform);

    return (
        <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
                api.trackEvent({
                    page_id: block.page_id,
                    username: username,
                    event_type: 'click',
                    target_id: block.id
                }).catch(err => console.error('Tracking error:', err));
            }}
            className="group flex items-center gap-3 h-14 px-3 bg-card border border-border rounded-[12px] hover:bg-secondary hover:border-border transition-all shadow-sm"
            data-testid="link-block"
        >
            <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 group-hover:brightness-110 transition-all overflow-hidden"
                style={{
                    backgroundColor: platform?.id === 'tiktok' ? '#000000' : (platform?.color ? `${platform.color}15` : 'rgba(255,255,255,0.12)')
                }}
            >
                {platform?.icon ? (
                    <img src={getImageUrl(platform.icon)} className={`w-6 h-6 object-contain ${platform.id === 'tiktok' ? 'invert' : ''}`} alt="" />
                ) : content?.url ? (
                    <img src={`https://www.google.com/s2/favicons?domain=${content.url}&sz=64`} className="w-6 h-6 object-contain" alt="" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                ) : (
                    <Link2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-[15px]">{content.title}</div>
                {content.subtitle && <div className="text-sm text-gray-500">{content.subtitle}</div>}
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-foreground transition-colors flex-shrink-0" />
        </a>
    );
};

export const LinkModal = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [platformId, setPlatformId] = useState(block?.content?.platform || 'custom');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [url, setUrl] = useState(block?.content?.url || '');
    const [loading, setLoading] = useState(false);
    const [showPlatforms, setShowPlatforms] = useState(false);

    const isEditing = !!block;
    const currentPlatform = SOCIAL_PLATFORMS.find(p => p.id === platformId) || SOCIAL_PLATFORMS[0];

    const handleUrlChange = (value) => {
        setUrl(value);

        // Auto-detect platform from URL
        if (value && value.trim()) {
            const lowerValue = value.toLowerCase().trim();
            const detected = SOCIAL_PLATFORMS.find(p =>
                p.id !== 'custom' && p.domain && lowerValue.includes(p.domain)
            );

            if (detected && detected.id !== platformId) {
                setPlatformId(detected.id);
                if (!title || title === currentPlatform.name || SOCIAL_PLATFORMS.some(p => p.name === title)) {
                    setTitle(detected.name);
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !url) { toast.error('Заполните все поля'); return; }

        let finalUrl = url.trim();

        // Smart URL build for social platforms
        if (platformId !== 'custom') {
            const domain = currentPlatform.domain;
            const cleanUrl = finalUrl.replace(/^https?:\/\//i, '').replace(/^(www\.)?/, '');

            if (domain && !cleanUrl.includes(domain)) {
                let username = finalUrl.replace(/^@/, '');
                finalUrl = `https://${domain}/${username}`;
            }
        }

        if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

        setLoading(true);
        try {
            const content = {
                title,
                url: finalUrl,
                platform: platformId !== 'custom' ? platformId : undefined
            };

            if (isEditing) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) {
                    toast.success('Ссылка обновлена');
                    onSuccess();
                } else {
                    const err = await response.json().catch(() => ({}));
                    toast.error(err.detail || 'Ошибка при обновлении');
                }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'link',
                    content,
                    order: blocksCount || 0
                });
                if (response.ok) {
                    toast.success('Ссылка создана');
                    onSuccess();
                } else {
                    const err = await response.json().catch(() => ({}));
                    toast.error(err.detail || 'Ошибка при добавлении');
                }
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    const selectPlatform = (p) => {
        setPlatformId(p.id);
        if (!title || title === currentPlatform.name || SOCIAL_PLATFORMS.some(platform => platform.name === title)) {
            setTitle(p.name);
        }
        setShowPlatforms(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]" onClick={onClose}>
            <div className="w-full max-w-[440px] bg-card rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up border border-border" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Ссылки и социальные сети</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Выберите тип</label>
                        <button
                            type="button"
                            onClick={() => setShowPlatforms(!showPlatforms)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground hover:border-white/30 transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden"
                                    style={{
                                        backgroundColor: currentPlatform.id === 'tiktok' ? '#000000' : (currentPlatform.color ? `${currentPlatform.color}20` : 'rgba(255,255,255,0.1)')
                                    }}
                                >
                                    {currentPlatform.icon ? (
                                        <img src={getImageUrl(currentPlatform.icon)} className={`w-5 h-5 object-contain ${currentPlatform.id === 'tiktok' ? 'invert' : ''}`} alt="" />
                                    ) : (
                                        <Link2 className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                                <span className="font-medium text-[15px]">{currentPlatform.name}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showPlatforms ? 'rotate-180' : ''}`} />
                        </button>

                        {showPlatforms && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-[12px] shadow-2xl z-20 py-1 max-h-[240px] overflow-y-auto scrollbar-hide animate-in fade-in zoom-in-95 duration-200">
                                {SOCIAL_PLATFORMS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => selectPlatform(p)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/10 transition-colors text-left ${platformId === p.id ? 'bg-secondary' : ''}`}
                                    >
                                        <div
                                            className="w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden"
                                            style={{
                                                backgroundColor: p.id === 'tiktok' ? '#000000' : (p.color ? `${p.color}20` : 'transparent')
                                            }}
                                        >
                                            {p.icon ? (
                                                <img src={getImageUrl(p.icon)} className={`w-5 h-5 object-contain ${p.id === 'tiktok' ? 'invert' : ''}`} alt="" />
                                            ) : (
                                                <Link2 className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="text-foreground font-medium text-[14px]">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Название</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-gray-500 focus:outline-none focus:border-white/30" placeholder={currentPlatform.placeholder} disabled={loading} required />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-muted-foreground">URL или Username</label>
                            <span className="text-[10px] text-gray-500 italic">Автоопределение при вставке ссылки</span>
                        </div>
                        <input type="text" value={url} onChange={(e) => handleUrlChange(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-gray-500 focus:outline-none focus:border-white/30" placeholder={platformId === 'custom' ? 'example.com' : 'username'} disabled={loading} required />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-secondary text-foreground rounded-[12px] font-medium hover:bg-foreground/10 transition-colors">Отмена</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-foreground text-background rounded-[12px] font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg">
                            {loading ? (isEditing ? 'Сохранение...' : 'Добавление...') : (isEditing ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
