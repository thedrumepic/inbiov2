import React, { useState, useMemo } from 'react';
import { ArrowLeft, X, Eye, EyeOff, GripVertical, Music, Trash2, AlertTriangle } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    STREAMING_SERVICES,
    getServiceIcon,
    getServiceName,
    getServiceColor
} from '../../constants/streaming';

export const MUSIC_PRESETS = [
    {
        id: 'standard',
        name: 'Стандарт',
        link: 'bg-gray-100 border-gray-200 hover:bg-gray-200 dark:bg-secondary dark:border-border dark:hover:bg-foreground/10',
        text: 'text-black dark:text-foreground',
        btn: ''
    },
    {
        id: 'brutal',
        name: 'Brutal',
        link: 'bg-[#fee133] border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000]',
        text: 'text-black',
        btn: 'bg-black text-white px-3 py-1 rounded-sm'
    },
    {
        id: 'cyber',
        name: 'Cyber',
        link: 'bg-[#0a0a0a] border border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)] hover:shadow-[0_0_25px_rgba(0,255,157,0.4)]',
        text: 'text-[#00ff9d]',
        btn: 'bg-[#00ff9d] text-black px-3 py-1 rounded-sm'
    },
    {
        id: 'glass',
        name: 'Glass',
        link: 'bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/60',
        text: 'text-black dark:text-foreground',
        btn: 'bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full text-black/80 dark:text-white/90'
    },
    {
        id: 'purp',
        name: 'Purp',
        link: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_#af66ff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#af66ff]',
        text: 'text-black',
        btn: 'bg-[#af66ff] text-white px-3 py-1 rounded-sm'
    },
    {
        id: 'pink',
        name: 'Pink',
        link: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_#ec4899] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#ec4899]',
        text: 'text-black',
        btn: 'bg-[#ec4899] text-white px-3 py-1 rounded-sm'
    }
];

// --- Sortable Item Component ---
const SortablePlatformItem = ({ service, url, onUrlChange, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: service?.id || 'unknown' });

    if (!service) return null;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-secondary border border-border rounded-[12px] group ${isDragging ? 'shadow-2xl border-foreground/30 bg-foreground/10' : ''}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-foreground transition-colors">
                <GripVertical className="w-4 h-4" />
            </div>

            <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full"
                style={{
                    backgroundColor: (getServiceColor(service.id).toLowerCase() === '#ffffff' || getServiceColor(service.id).toLowerCase() === '#000000')
                        ? getServiceColor(service.id)
                        : `${getServiceColor(service.id)}20`
                }}
            >
                {getServiceIcon(service.id)}
            </div>

            <input
                type="url"
                value={url || ''}
                onChange={(e) => onUrlChange(service.id, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-gray-600 h-10"
                placeholder={`${service.name} URL`}
            />

            <button
                onClick={() => onDelete(service.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors text-gray-600 hover:text-red-500 hover:bg-red-500/10"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export const MusicBlockRenderer = ({ block }) => {
    const { content } = block;
    const theme = content.theme || 'dark';
    const presetId = content.presetId || 'standard';
    const preset = MUSIC_PRESETS.find(p => p.id === presetId) || MUSIC_PRESETS[0];
    const showCover = content.showCover !== false;
    const platforms = content.platforms || [];
    const isLight = theme === 'light';
    const visiblePlatforms = platforms.filter(p => p.visible !== false && p.url);

    return (
        <div className={`rounded-[12px] overflow-hidden border shadow-2xl transition-all duration-300 ${isLight ? 'bg-white border-gray-200' : 'dark bg-card border-border'}`} data-testid="music-block">
            {showCover && content.cover ? (
                <img src={getImageUrl(content.cover)} alt={content.title} className="w-full aspect-square object-cover" />
            ) : showCover && (
                <div className="w-full aspect-square bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center">
                    <Music className="w-20 h-20 text-foreground/20" />
                </div>
            )}

            <div className="p-6">
                {content.title && (
                    <div className="mb-6">
                        <h3 className={`text-xl font-black mb-1 leading-tight ${isLight ? 'text-black' : 'text-foreground'}`}>{content.title}</h3>
                        {content.artist && <p className={`text-base font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{content.artist}</p>}
                    </div>
                )}

                {visiblePlatforms.length > 0 && (
                    <div className="space-y-2">
                        {visiblePlatforms.map((p, idx) => (
                            <a
                                key={idx}
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-between px-4 h-[65px] rounded-[16px] transition-all transform active:scale-[0.98] group ${preset.link}`}
                            >
                                <span className="flex items-center gap-4">
                                    <span
                                        className="w-10 h-10 flex items-center justify-center rounded-full transition-transform"
                                        style={{
                                            backgroundColor: (getServiceColor(p.platform).toLowerCase() === '#ffffff' || getServiceColor(p.platform).toLowerCase() === '#000000')
                                                ? getServiceColor(p.platform)
                                                : `${getServiceColor(p.platform)}20`
                                        }}
                                    >
                                        {getServiceIcon(p.platform)}
                                    </span>
                                    <span className={`font-bold text-sm tracking-tight ${preset.text}`}>{getServiceName(p.platform)}</span>
                                </span>
                                <span className={`text-[11px] font-black uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100 ${preset.btn || (isLight ? 'text-black' : 'text-foreground')}`}>Слушать</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const MusicBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [theme, setTheme] = useState(block?.content?.theme || 'dark');
    const [presetId, setPresetId] = useState(block?.content?.presetId || 'standard');
    const [method, setMethod] = useState('auto');
    const [showCover, setShowCover] = useState(block?.content?.showCover !== false);
    const [musicUrl, setMusicUrl] = useState('');
    const [manualUrl, setManualUrl] = useState('');
    const [platformToDelete, setPlatformToDelete] = useState(null);
    const [musicData, setMusicData] = useState(block?.content || null);

    // Ordered platform state: [ { platform: 'spotify', url: '...', visible: true }, ... ]
    const initialPlatforms = useMemo(() => {
        const supportedServiceIds = STREAMING_SERVICES.map(s => s.id);
        return (block?.content?.platforms || []).filter(p => supportedServiceIds.includes(p.platform));
    }, [block]);

    const [platforms, setPlatforms] = useState(initialPlatforms);
    const [saving, setSaving] = useState(false);
    const [resolving, setResolving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleResolve = async () => {
        if (!musicUrl.trim()) {
            toast.error('Введите URL');
            return;
        }

        setResolving(true);
        try {
            const response = await api.resolveMusic({ url: musicUrl, mode: 'auto' });
            const result = await response.json();

            if (result.success) {
                // Metadata cleanup
                let title = result.data.title || '';
                // Remove "(Official Video)", "[MV]", etc
                title = title.replace(/\s*[\(\[].*?(official|video|music|clip|audio).*?[\)\]]/gi, '').trim();

                setMusicData({
                    ...musicData,
                    title: title,
                    artist: result.data.artist || 'Unknown',
                    cover: result.data.cover
                });

                // Merge discovered platforms into existing state, prioritizing discovered URLs
                const supportedServiceIds = STREAMING_SERVICES.map(s => s.id);
                const discovered = (result.data.platforms || [])
                    .filter(d => supportedServiceIds.includes(d.platform))
                    .map(d => ({ ...d, url: String(d.url) })); // Force string URL

                setPlatforms(prev => {
                    const next = [...prev];
                    discovered.forEach(d => {
                        const idx = next.findIndex(p => p.platform === d.platform);
                        if (idx !== -1) {
                            next[idx] = { ...next[idx], url: d.url, visible: true };
                        } else {
                            next.push({ platform: d.platform, url: d.url, visible: true });
                        }
                    });

                    // Keep only discovered and previously active platforms
                    const activeNext = next.filter(p => p.url);

                    // Sort: Discovered first, in order
                    const discoveredIds = discovered.map(d => d.platform);
                    const found = activeNext.filter(p => discoveredIds.includes(p.platform));
                    const rest = activeNext.filter(p => !discoveredIds.includes(p.platform));
                    return [...found, ...rest];
                });

                toast.success('Трек найден!');
            } else {
                toast.error(result.error || 'Не удалось найти трек');
            }
        } catch (error) {
            toast.error('Ошибка поиска');
        } finally {
            setResolving(false);
        }
    };

    const handleManualAdd = () => {
        if (!manualUrl.trim()) {
            toast.error('Введите URL');
            return;
        }

        let detectedPlatform = null;
        const urlLower = manualUrl.toLowerCase();

        if (urlLower.includes('spotify.com')) detectedPlatform = 'spotify';
        else if (urlLower.includes('apple.com') || urlLower.includes('itunes.apple.com')) detectedPlatform = 'appleMusic';
        else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
            detectedPlatform = urlLower.includes('music.youtube') ? 'youtubeMusic' : 'youtube';
        }
        else if (urlLower.includes('yandex.')) detectedPlatform = 'yandex';
        else if (urlLower.includes('vk.com')) detectedPlatform = 'vk';
        else if (urlLower.includes('soundcloud.com')) detectedPlatform = 'soundcloud';
        else if (urlLower.includes('deezer.com')) detectedPlatform = 'deezer';
        else if (urlLower.includes('tidal.com')) detectedPlatform = 'tidal';
        else if (urlLower.includes('amazon.')) detectedPlatform = 'amazonMusic';
        else if (urlLower.includes('pandora.com')) detectedPlatform = 'pandora';
        else if (urlLower.includes('bandcamp.com')) detectedPlatform = 'bandcamp';
        else if (urlLower.includes('boomplay.com')) detectedPlatform = 'boomplay';
        else if (urlLower.includes('tiktok.com')) detectedPlatform = 'tiktok';
        else if (urlLower.includes('anghami.com')) detectedPlatform = 'anghami';
        else if (urlLower.includes('audius.co') || urlLower.includes('audius.org')) detectedPlatform = 'audius';
        else if (urlLower.includes('audiomack.com')) detectedPlatform = 'audiomack';

        if (detectedPlatform) {
            setPlatforms(prev => {
                const next = [...prev];
                const idx = next.findIndex(p => p.platform === detectedPlatform);
                if (idx !== -1) {
                    next[idx] = { ...next[idx], url: manualUrl, visible: true };
                    // Move to top
                    const item = next[idx];
                    next.splice(idx, 1);
                    return [item, ...next];
                }
                // Add new platform if not in list
                return [{ platform: detectedPlatform, url: manualUrl, visible: true }, ...next];
            });
            setManualUrl('');
            toast.success(`Распознано: ${getServiceName(detectedPlatform)}`);
        } else {
            toast.error('Платформа не распознана. Используйте автозаполнение или проверьте ссылку.');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setPlatforms((items) => {
                const oldIndex = items.findIndex((i) => i.platform === active.id);
                const newIndex = items.findIndex((i) => i.platform === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const deletePlatform = (platformId) => {
        setPlatforms(prev => prev.filter(p => p.platform !== platformId));
        setPlatformToDelete(null);
        toast.success('Платформа удалена');
    };

    const updatePlatformUrl = (platformId, url) => {
        setPlatforms(prev =>
            prev.map(p => p.platform === platformId ? { ...p, url } : p)
        );
    };

    const handleSave = async () => {
        const activePlatforms = platforms.filter(p => p.url && p.visible !== false);
        if (!musicData?.title && activePlatforms.length === 0) {
            toast.error('Добавьте данные трека или хотя бы одну ссылку');
            return;
        }

        setSaving(true);
        try {
            const content = {
                ...musicData,
                theme,
                presetId,
                showCover,
                platforms: platforms.filter(p => p.url), // Save all URLs, visibility handles rendering
            };

            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) { toast.success('Блок обновлён'); onSuccess(); }
                else {
                    const err = await response.json();
                    toast.error(err.detail || 'Ошибка обновления');
                }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'music',
                    content,
                    order: blocksCount || 0,
                });
                if (response.ok) { toast.success('Блок создан'); onSuccess(); }
                else {
                    const err = await response.json();
                    toast.error(err.detail || 'Ошибка создания');
                }
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    };

    const isLight = theme === 'light';
    const currentPreset = MUSIC_PRESETS.find(p => p.id === presetId) || MUSIC_PRESETS[0];
    const visiblePlatformsInPreview = platforms.filter(p => p.visible !== false && p.url);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Музыкальный релиз</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-6 space-y-6">
                {/* Preview Section */}
                <div className={`rounded-[12px] overflow-hidden border shadow-2xl transition-all duration-300 ${isLight ? 'bg-white border-gray-200' : 'dark bg-card border-border'}`}>
                    {showCover && (
                        <div className="relative group">
                            {musicData?.cover ? (
                                <img src={getImageUrl(musicData.cover)} alt={musicData.title} className="w-full aspect-square object-cover" />
                            ) : (
                                <div className="w-full aspect-square bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center">
                                    <Music className="w-20 h-20 text-foreground/20" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        {musicData?.title ? (
                            <div className="mb-6">
                                <h3 className={`text-xl font-black mb-1 leading-tight ${isLight ? 'text-black' : 'text-foreground'}`}>{musicData.title}</h3>
                                <p className={`text-base font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{musicData.artist}</p>
                            </div>
                        ) : (
                            <div className="mb-6 animate-pulse space-y-2">
                                <div className="h-6 w-2/3 bg-secondary rounded" />
                                <div className="h-4 w-1/3 bg-secondary rounded" />
                            </div>
                        )}

                        <div className="space-y-2">
                            {visiblePlatformsInPreview.map((p, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between px-4 h-[65px] rounded-[16px] transition-all transform active:scale-[0.98] group ${currentPreset.link}`}
                                >
                                    <span className="flex items-center gap-4">
                                        <span
                                            className="w-10 h-10 flex items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: (getServiceColor(p.platform).toLowerCase() === '#ffffff' || getServiceColor(p.platform).toLowerCase() === '#000000')
                                                    ? getServiceColor(p.platform)
                                                    : `${getServiceColor(p.platform)}20`
                                            }}
                                        >
                                            {getServiceIcon(p.platform)}
                                        </span>
                                        <span className={`font-bold text-sm tracking-tight ${currentPreset.text}`}>{getServiceName(p.platform)}</span>
                                    </span>
                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100 ${currentPreset.btn || (isLight ? 'text-black' : 'text-foreground')}`}>Слушать</span>
                                </div>
                            ))}
                            {visiblePlatformsInPreview.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-border rounded-[16px]">
                                    <p className="text-sm text-gray-500">Добавьте ссылки для отображения</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor Section */}
                <div className="bg-card rounded-[12px] border border-border overflow-hidden shadow-xl">
                    <div className="flex p-1 bg-secondary m-4 rounded-[16px]">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-[12px] transition-all ${theme === 'dark' ? 'bg-foreground text-background shadow-lg' : 'text-gray-500 hover:text-foreground'}`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-[12px] transition-all ${theme === 'light' ? 'bg-foreground text-background shadow-lg' : 'text-gray-500 hover:text-foreground'}`}
                        >
                            Light
                        </button>
                    </div>

                    <div className="px-4 mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Preset Style</p>
                        <div className="grid grid-cols-2 gap-2">
                            {MUSIC_PRESETS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPresetId(p.id)}
                                    className={`py-3 px-4 rounded-[14px] text-xs font-bold border transition-all ${presetId === p.id
                                        ? 'bg-foreground/10 border-foreground/30 text-foreground'
                                        : 'bg-secondary border-transparent text-gray-500 hover:border-gray-700'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        {p.name}
                                        {presetId === p.id && <div className="w-1.5 h-1.5 bg-foreground rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex px-4 pb-4 gap-2">
                        <button
                            onClick={() => setMethod('auto')}
                            className={`flex-1 py-3 text-sm font-bold rounded-[14px] transition-all border ${method === 'auto' ? 'bg-foreground/10 border-foreground/20 text-foreground' : 'bg-secondary border-transparent text-gray-500'}`}
                        >
                            Автозаполнение
                        </button>
                        <button
                            onClick={() => setMethod('manual')}
                            className={`flex-1 py-3 text-sm font-bold rounded-[14px] transition-all border ${method === 'manual' ? 'bg-foreground/10 border-foreground/20 text-foreground' : 'bg-secondary border-transparent text-gray-500'}`}
                        >
                            Ручной ввод
                        </button>
                    </div>

                    {method === 'auto' && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Вставьте ссылку из платформ или UPC код.</p>
                                <div className="relative group">
                                    <input
                                        type="url"
                                        value={musicUrl}
                                        onChange={(e) => setMusicUrl(e.target.value)}
                                        className="w-full pl-4 pr-24 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-gray-600 placeholder:text-xs focus:outline-none focus:border-white/30 transition-all font-medium"
                                        placeholder="Вставьте ссылку..."
                                    />
                                    <button
                                        onClick={handleResolve}
                                        disabled={resolving}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-foreground text-background rounded-[12px] font-bold text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
                                    >
                                        {resolving ? '...' : 'Найти'}
                                    </button>
                                </div>
                            </div>

                            {/* Quick Results Preview in Auto Tab */}
                            {platforms.some(p => p.url) && (
                                <div className="space-y-2 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                        Найдено {platforms.filter(p => p.url).length} ссылок
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {platforms.filter(p => p.url).map(p => (
                                            <div key={p.platform} className="p-2.5 bg-secondary rounded-xl border border-border flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 flex items-center justify-center rounded-full"
                                                    style={{
                                                        backgroundColor: (getServiceColor(p.platform).toLowerCase() === '#ffffff' || getServiceColor(p.platform).toLowerCase() === '#000000')
                                                            ? getServiceColor(p.platform)
                                                            : `${getServiceColor(p.platform)}40`
                                                    }}
                                                >
                                                    {getServiceIcon(p.platform)}
                                                </div>
                                                <span className="text-[10px] font-bold text-foreground/60">{getServiceName(p.platform)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-600 ml-1">Перейдите в «Ручной ввод», чтобы изменить порядок или скрыть платформы</p>
                                </div>
                            )}
                        </div>
                    )}

                    {method === 'manual' && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Вставьте ссылку из платформ или UPC код.</p>
                                <div className="relative group">
                                    <input
                                        type="url"
                                        value={manualUrl}
                                        onChange={(e) => setManualUrl(e.target.value)}
                                        className="w-full pl-4 pr-24 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-gray-600 placeholder:text-xs focus:outline-none focus:border-white/30 transition-all font-medium"
                                        placeholder="Вставьте ссылку..."
                                    />
                                    <button
                                        onClick={handleManualAdd}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-foreground text-background rounded-[12px] font-bold text-sm hover:bg-foreground/90 transition-colors"
                                    >
                                        Добавить
                                    </button>
                                </div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={platforms.map(p => p.platform)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                        {platforms.map((p) => {
                                            const service = STREAMING_SERVICES.find(s => s.id === p.platform);
                                            return (
                                                <SortablePlatformItem
                                                    key={p.platform}
                                                    service={service}
                                                    url={p.url}
                                                    onUrlChange={updatePlatformUrl}
                                                    onDelete={setPlatformToDelete}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    <div className="p-4 flex items-center justify-between border-t border-border">
                        <div className="flex flex-col">
                            <span className="text-foreground text-sm font-bold">Отображать обложку</span>
                            <span className="text-xs text-gray-500">Показывать изображение альбома</span>
                        </div>
                        <button
                            onClick={() => setShowCover(!showCover)}
                            className={`w-14 h-8 rounded-full p-1 transition-all relative border border-border flex items-center ${showCover ? 'bg-foreground' : 'bg-secondary'}`}
                        >
                            <span className={`w-6 h-6 rounded-full shadow-sm transition-transform ${showCover ? 'translate-x-[22px] bg-background' : 'translate-x-0 bg-foreground opacity-40'}`} />
                        </button>
                    </div>
                </div>

                {/* Save Action */}
                <div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-card border border-border text-foreground rounded-[18px] font-bold text-base flex items-center justify-center gap-2 hover:bg-secondary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                        <span className="text-xl">+</span>
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {platformToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-[24px] p-6 w-full max-w-[340px] shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Удалить платформу?</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    Вы собираетесь удалить {getServiceName(platformToDelete)}. Это действие нельзя отменить.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setPlatformToDelete(null)}
                                        className="flex-1 py-3 bg-secondary hover:bg-foreground/10 text-foreground rounded-[14px] font-bold text-sm transition-all"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={() => deletePlatform(platformToDelete)}
                                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-foreground rounded-[14px] font-bold text-sm transition-all"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MusicBlockRenderer;
