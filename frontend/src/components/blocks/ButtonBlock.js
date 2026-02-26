import React, { useState, useRef } from 'react';
import { Download, ExternalLink, Link2, Upload, Trash2, X, ArrowLeft } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';

export const BUTTON_PRESETS = [
    {
        id: 'interstellar',
        name: 'Interstellar',
        bg: 'bg-black dark:bg-white',
        border: 'border-transparent',
        text: 'text-white dark:text-black',
        subtext: 'text-white/70 dark:text-black/70'
    },
    {
        id: 'skeleton',
        name: 'Skeleton',
        bg: 'bg-transparent dark:bg-white/10 dark:backdrop-blur-md',
        border: 'border-slate-200 dark:border-white/20',
        text: 'text-foreground dark:text-white',
        subtext: 'text-muted-foreground dark:text-white/60'
    },
    {
        id: 'liquid',
        name: 'Liquid',
        bg: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/40',
        border: 'border-0',
        text: 'text-white',
        subtext: 'text-white/80'
    },
    {
        id: 'sunset',
        name: 'Sunset',
        bg: 'bg-gradient-to-r from-pink-500 to-orange-400 shadow-[0_4px_20px_rgba(236,72,153,0.3)]',
        border: 'border-0',
        text: 'text-white',
        subtext: 'text-white/80'
    },
    {
        id: 'emerald',
        name: 'Emerald',
        bg: 'bg-emerald-600 dark:bg-emerald-500/10 dark:backdrop-blur-md',
        border: 'border-emerald-600 dark:border-emerald-500/50',
        text: 'text-white dark:text-emerald-400',
        subtext: 'text-white/80 dark:text-emerald-400/60'
    },
    {
        id: 'violet',
        name: 'Violet',
        bg: 'bg-violet-100 dark:bg-[#0f0720]',
        border: 'border-violet-200 dark:border-violet-500/50',
        text: 'text-violet-900 dark:text-violet-400',
        subtext: 'text-violet-700 dark:text-violet-400/60'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        bg: 'bg-[#04a86a] dark:bg-black',
        border: 'border-black dark:border-[#04a86a]',
        text: 'text-black dark:text-[#04a86a]',
        subtext: 'text-black/60 dark:text-[#04a86a]/60'
    },
    {
        id: 'luxury',
        name: 'Luxury',
        bg: 'bg-white dark:bg-[#121212]',
        border: 'border-yellow-600/50 dark:border-yellow-500/30',
        text: 'text-yellow-700 dark:text-yellow-500',
        subtext: 'text-yellow-600/60 dark:text-yellow-500/40'
    },
    {
        id: 'mist',
        name: 'Mist',
        bg: 'bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm',
        border: 'border-slate-200 dark:border-white/10',
        text: 'text-slate-600 dark:text-slate-300',
        subtext: 'text-slate-500/60 dark:text-slate-400/50'
    }
];

export const ButtonBlockRenderer = ({ block }) => {
    const { content } = block;
    const preset = BUTTON_PRESETS.find(p => p.id === content.presetId) || BUTTON_PRESETS[0];

    const handleClick = async (e) => {
        if (!content.url) return;
        if (content.type === 'file') {
            try {
                const response = await fetch(getImageUrl(content.url));
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = content.fileName || 'file';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error('Download error:', error);
                // Fallback to simple link if fetch fails
                window.open(getImageUrl(content.url), '_blank');
            }
        } else {
            window.open(content.url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={handleClick}
                className={`w-full h-[56px] px-6 rounded-[18px] border ${preset.bg} ${preset.border} transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] flex flex-col items-center justify-center text-center group relative`}
            >
                <span className={`text-base font-bold ${preset.text} leading-tight`}>{content.title || 'Кнопка'}</span>
                {content.subtext && (
                    <span className={`text-[11px] mt-0.5 ${preset.subtext} tracking-wider font-medium leading-tight`}>
                        {content.subtext}
                    </span>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {content.type === 'file' ? (
                        <Download className={`w-4 h-4 ${preset.subtext} group-hover:opacity-100 transition-opacity`} />
                    ) : (
                        <ExternalLink className={`w-4 h-4 ${preset.subtext} group-hover:opacity-100 transition-opacity`} />
                    )}
                </div>
            </button>
        </div>
    );
};

export const ButtonBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [title, setTitle] = useState(block?.content?.title || '');
    const [subtext, setSubtext] = useState(block?.content?.subtext || '');
    const [url, setUrl] = useState(block?.content?.url || '');
    const [type, setType] = useState(block?.content?.type || 'link');
    const [presetId, setPresetId] = useState(block?.content?.presetId || 'classic-dark');
    const [fileName, setFileName] = useState(block?.content?.fileName || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Drag to scroll logic with inertia
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const requestRef = useRef();
    const velocityRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);

    const handleMouseDown = (e) => {
        setIsDown(true);
        setIsDragging(false);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);

        // Stop any ongoing inertia
        cancelAnimationFrame(requestRef.current);
        velocityRef.current = 0;
        lastXRef.current = e.pageX;
        lastTimeRef.current = Date.now();
    };

    const handleMouseLeave = () => {
        if (isDown) handleMouseUp();
    };

    const startMomentum = () => {
        if (Math.abs(velocityRef.current) < 0.1) return;

        scrollRef.current.scrollLeft -= velocityRef.current;
        velocityRef.current *= 0.95; // Friction

        requestRef.current = requestAnimationFrame(startMomentum);
    };

    const handleMouseUp = () => {
        setIsDown(false);
        if (Math.abs(velocityRef.current) > 2) {
            requestRef.current = requestAnimationFrame(startMomentum);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();

        const currentTime = Date.now();
        const timeDiff = currentTime - lastTimeRef.current;

        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;

        if (Math.abs(walk) > 5) {
            setIsDragging(true);
        }

        // Calculate velocity
        if (timeDiff > 0) {
            velocityRef.current = (e.pageX - lastXRef.current) / timeDiff * 15;
        }

        scrollRef.current.scrollLeft = scrollLeft - walk;

        lastXRef.current = e.pageX;
        lastTimeRef.current = currentTime;
    };

    const currentPreset = BUTTON_PRESETS.find(p => p.id === presetId) || BUTTON_PRESETS[0];

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) {
            toast.error('Файл слишком большой (макс. 100МБ)');
            return;
        }

        setUploading(true);
        try {
            const response = await api.uploadImage(file, 'files'); // Expand it later or keep as is
            if (response.ok) {
                const data = await response.json();
                setUrl(data.url);
                setFileName(file.name);
                setType('file');
                toast.success('Файл загружен');
            } else {
                toast.error('Ошибка при загрузке');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Введите текст на кнопке');
            return;
        }

        setSaving(true);
        try {
            let finalUrl = url;
            if (type !== 'file' && url && !/^https?:\/\//i.test(url)) {
                finalUrl = 'https://' + url;
            }

            const content = { title, subtext, url: finalUrl, type, presetId, fileName };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) { toast.success('Блок обновлён'); onSuccess(); }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'button',
                    content,
                    order: blocksCount || 0,
                });
                if (response.ok) { toast.success('Блок создан'); onSuccess(); }
            }
        } catch (error) {
            toast.error('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Кнопка</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Visual Preview */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center py-10 bg-secondary rounded-[24px] border border-white/5">
                        <div className="w-full px-4">
                            <button
                                className={`w-full h-[56px] px-6 rounded-[18px] border ${currentPreset.bg} ${currentPreset.border} transition-all duration-300 flex flex-col items-center justify-center text-center shadow-2xl pointer-events-none relative`}
                            >
                                <span className={`text-base font-bold ${currentPreset.text} leading-tight`}>{title || 'Кнопка'}</span>
                                {subtext && (
                                    <span className={`text-[11px] mt-0.5 ${currentPreset.subtext} tracking-wider font-medium leading-tight`}>
                                        {subtext}
                                    </span>
                                )}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                    {type === 'file' ? (
                                        <Download className={`w-4 h-4 ${currentPreset.subtext} opacity-50`} />
                                    ) : (
                                        <ExternalLink className={`w-4 h-4 ${currentPreset.subtext} opacity-50`} />
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Preset Selector Slider */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium ml-1 text-foreground/70">Стиль кнопки</label>
                        <div
                            ref={scrollRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            className={`overflow-x-auto pb-4 no-scrollbar select-none ${isDown ? 'cursor-grabbing' : 'cursor-grab'} active:cursor-grabbing transition-transform`}
                        >
                            <div className="flex gap-3 min-w-max px-2">
                                {BUTTON_PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={(e) => {
                                            if (!isDragging) {
                                                setPresetId(p.id);
                                            }
                                        }}
                                        className={`relative px-6 py-3 rounded-[12px] text-sm font-medium border transition-all ${presetId === p.id ? 'bg-foreground text-background border-foreground' : 'bg-secondary text-muted-foreground border-border hover:border-foreground/20'}`}
                                    >
                                        {p.name}
                                        {presetId === p.id && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border-2 border-foreground rounded-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all font-medium"
                            placeholder="Текст на кнопке"
                        />
                    </div>

                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={(type === 'file' && fileName) ? `Файл: ${fileName}` : url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                if (type === 'file') {
                                    setFileName('');
                                    setType('link');
                                }
                            }}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm font-medium pr-24"
                            placeholder="Ссылка или загрузите файл"
                        />
                        <div className="absolute right-3 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="p-2.5 bg-foreground/10 hover:bg-foreground/20 rounded-xl transition-all disabled:opacity-50"
                                title="Загрузить файл"
                            >
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 text-foreground" />
                                )}
                            </button>
                            {url && (
                                <button
                                    type="button"
                                    onClick={() => { setUrl(''); setFileName(''); setType('link'); }}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                    title="Удалить"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={subtext}
                            onChange={(e) => setSubtext(e.target.value)}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm font-medium"
                            placeholder="Подпись кнопки (необязательно)"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all disabled:opacity-50 mt-10"
                >
                    {saving ? 'Сохранение...' : (block?.id ? 'Обновить кнопку' : 'Создать кнопку')}
                </button>
            </main>
        </div>
    );
};

export default ButtonBlockRenderer;
