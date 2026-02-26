import React, { useState, useRef } from 'react';
import { Heart, ExternalLink, QrCode, Upload, Trash2, X, ArrowLeft, Loader2 } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';

export const DONATION_PRESETS = [
    {
        id: 'heart-pulse',
        name: 'Пульс сердца',
        bg: 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 dark:shadow-red-500/40',
        border: 'border-transparent',
        text: 'text-white',
        icon: 'text-white'
    },
    {
        id: 'glass-love',
        name: 'Стеклянная любовь',
        bg: 'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20',
        border: 'border-white/20',
        text: 'text-foreground dark:text-white',
        icon: 'text-red-500'
    },
    {
        id: 'soft-pink',
        name: 'Нежный розовый',
        bg: 'bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-900/40',
        border: 'border-pink-200 dark:border-pink-900/50',
        text: 'text-pink-900 dark:text-pink-100',
        icon: 'text-pink-600'
    }
];

export const DonationBlockRenderer = ({ block }) => {
    const { content } = block;
    const [showQR, setShowQR] = useState(false);
    const preset = DONATION_PRESETS.find(p => p.id === (content.presetId || 'heart-pulse')) || DONATION_PRESETS[0];

    const handleClick = () => {
        if (content.qr_url) {
            setShowQR(true);
        } else if (content.link) {
            window.open(content.link.startsWith('http') ? content.link : `https://${content.link}`, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={handleClick}
                className={`w-full group relative flex flex-col items-center justify-center py-4 px-6 rounded-[24px] border ${preset.bg} ${preset.border} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
            >
                {/* Decoration heart bg */}
                <Heart className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12 transition-transform duration-500 group-hover:scale-125`} />

                <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-full bg-white/20 backdrop-blur-sm animate-pulse`}>
                        <Heart className={`w-5 h-5 fill-current ${preset.icon}`} />
                    </div>
                    <span className={`text-lg font-bold ${preset.text}`}>{content.title || 'Поддержать автора'}</span>
                </div>

                {content.subtext && (
                    <span className={`text-sm mt-1 opacity-80 ${preset.text} relative z-10`}>
                        {content.subtext}
                    </span>
                )}
            </button>

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQR(false)}>
                    <div className="relative max-w-sm w-full bg-card border border-border rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold mb-2">{content.title || 'Поддержать автора'}</h3>
                            <p className="text-sm text-muted-foreground">{content.subtext || 'Отсканируйте код для перевода'}</p>
                        </div>

                        <div className="relative group bg-white p-4 rounded-2xl">
                            <img
                                src={getImageUrl(content.qr_url)}
                                alt="QR Code"
                                className="w-full h-auto rounded-lg"
                            />
                        </div>

                        {content.link && (
                            <button
                                onClick={() => window.open(content.link, '_blank')}
                                className="w-full mt-6 py-4 px-6 bg-foreground text-background rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Перейти по ссылке
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const DonationBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [title, setTitle] = useState(block?.content?.title || '');
    const [subtext, setSubtext] = useState(block?.content?.subtext || '');
    const [link, setLink] = useState(block?.content?.link || '');
    const [qr_url, setQrUrl] = useState(block?.content?.qr_url || '');
    const [presetId, setPresetId] = useState(block?.content?.presetId || 'heart-pulse');
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
        velocityRef.current *= 0.95;
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

        if (Math.abs(walk) > 5) setIsDragging(true);

        if (timeDiff > 0) {
            velocityRef.current = (e.pageX - lastXRef.current) / timeDiff * 15;
        }

        scrollRef.current.scrollLeft = scrollLeft - walk;
        lastXRef.current = e.pageX;
        lastTimeRef.current = currentTime;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploadImage(file, 'donations');
            if (response.ok) {
                const data = await response.json();
                setQrUrl(data.url);
                toast.success('QR-код загружен');
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
            toast.error('Введите название кнопки');
            return;
        }

        setSaving(true);
        try {
            const content = { title, subtext, link, qr_url, presetId };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) { toast.success('Блок обновлен'); onSuccess(); }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'donation',
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
        <div className="fixed inset-0 z-[100] bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold">Донаты / Поддержка</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8 overflow-y-auto max-h-[calc(100vh-56px)] no-scrollbar">
                <div className="bg-secondary/30 rounded-[32px] p-6 border border-border/50">
                    <div className="text-xs font-medium text-muted-foreground mb-4 text-center uppercase tracking-wider">Предпросмотр</div>
                    <DonationBlockRenderer block={{ content: { title, subtext, presetId, qr_url, link } }} />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium ml-1">Стиль кнопки</label>
                    <div
                        ref={scrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className={`overflow-x-auto pb-4 no-scrollbar select-none ${isDown ? 'cursor-grabbing' : 'cursor-grab'} active:cursor-grabbing transition-transform`}
                    >
                        <div className="flex gap-3 min-w-max px-2">
                            {DONATION_PRESETS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { if (!isDragging) setPresetId(p.id); }}
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

                <div className="space-y-4">
                    <div className="relative group overflow-hidden bg-secondary border border-border rounded-[24px] p-2 transition-all hover:border-foreground/20">
                        {qr_url ? (
                            <div className="relative aspect-square max-w-[200px] mx-auto">
                                <img src={getImageUrl(qr_url)} alt="QR Preview" className="w-full h-full object-contain rounded-xl" />
                                <button
                                    onClick={() => setQrUrl('')}
                                    className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full aspect-[2/1] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all"
                            >
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                                            <QrCode className="w-6 h-6" />
                                        </div>
                                        <div className="text-xs font-medium">Загрузить QR-код</div>
                                    </>
                                )}
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-14 px-5 bg-secondary border border-border rounded-[18px] focus:outline-none focus:border-foreground/20 transition-all font-medium"
                            placeholder="Название кнопки"
                        />
                        <input
                            type="text"
                            value={subtext}
                            onChange={(e) => setSubtext(e.target.value)}
                            className="w-full h-14 px-5 bg-secondary border border-border rounded-[18px] focus:outline-none focus:border-foreground/20 transition-all font-medium"
                            placeholder="Описание"
                        />
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full h-14 px-5 bg-secondary border border-border rounded-[18px] focus:outline-none focus:border-foreground/20 transition-all font-medium"
                            placeholder="Ссылка на оплату"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="w-full h-14 bg-foreground text-background rounded-[20px] font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (block?.id ? 'Сохранить изменения' : 'Создать блок')}
                </button>
            </main>
        </div>
    );
};
