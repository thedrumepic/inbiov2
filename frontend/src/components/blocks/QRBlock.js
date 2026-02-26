import React, { useState, useEffect } from 'react';
import { QrCode, ArrowLeft, X, Link2, Palette, Type } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ColorPicker } from '../ui/ColorPicker';

export const QRBlockRenderer = ({ block }) => {
    const { content } = block;
    const qrUrl = content.url || '';
    const color = content.color || '#000000';

    // Construct the backend URL for the QR image
    const qrImageSrc = getImageUrl(`/api/qr/generate?url=${encodeURIComponent(qrUrl)}&color=${encodeURIComponent(color)}`);

    return (
        <div className="w-full p-5 bg-card border border-border rounded-[24px] text-center shadow-sm relative overflow-hidden">
            {/* Background Accent like in Timer */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            {content.title && (
                <h3 className="font-medium text-foreground/80 mb-4 text-sm uppercase tracking-wider text-center">{content.title}</h3>
            )}

            <div className="flex justify-center">
                <div className="relative w-32 h-32 bg-white p-2 rounded-[16px] shadow-inner flex items-center justify-center border border-border/10">
                    {qrUrl ? (
                        <img
                            src={qrImageSrc}
                            alt="QR Code"
                            className="w-full h-full object-contain"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                            <QrCode className="w-6 h-6 opacity-20" />
                            <span className="text-[8px] uppercase tracking-widest font-black opacity-30">No URL</span>
                        </div>
                    )}
                </div>
            </div>

            {content.subtext && (
                <p className="text-[10px] text-muted-foreground mt-4 text-center font-medium uppercase tracking-wide opacity-70">{content.subtext}</p>
            )}
        </div>
    );
};

export const QRBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [title, setTitle] = useState(block?.content?.title || '');
    const [subtext, setSubtext] = useState(block?.content?.subtext || '');
    const [url, setUrl] = useState(block?.content?.url || '');
    const [color, setColor] = useState(block?.content?.color || '#000000');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!url.trim()) {
            toast.error('Введите ссылку для QR-кода');
            return;
        }

        setSaving(true);
        try {
            let finalUrl = url;
            if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
                finalUrl = 'https://' + url;
            }

            const content = { title, subtext, url: finalUrl, color };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) { toast.success('Блок обновлён'); onSuccess(); }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'qr_code',
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

    const qrImagePreview = getImageUrl(`/api/qr/generate?url=${encodeURIComponent(url || 'https://inbio.one')}&color=${encodeURIComponent(color)}`);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">QR-код</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Visual Preview */}
                <div className="flex flex-col items-center justify-center py-8 bg-secondary rounded-[32px] border border-white/5 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-2xl relative group border border-border/10">
                        <img
                            src={qrImagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-black/10" />
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">Предпросмотр</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">Ссылка (URL)</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Link2 className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-11 pr-5 py-3.5 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all font-medium text-sm"
                                placeholder="Например: inbio.one/alex"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">Заголовок</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Type className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full pl-11 pr-5 py-3.5 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all font-medium text-sm"
                                placeholder="Например: Сканируй для оплаты"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">Цвет кода</label>
                            <ColorPicker
                                color={color}
                                onChange={setColor}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">Подпись</label>
                            <input
                                type="text"
                                value={subtext}
                                onChange={(e) => setSubtext(e.target.value)}
                                className="w-full px-4 py-3.5 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all text-xs font-medium h-[52px]"
                                placeholder="Текст внизу"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 mt-6 active:scale-[0.98] shadow-lg shadow-foreground/5"
                >
                    {saving ? 'Сохранение...' : (block?.id ? 'Обновить блок' : 'Добавить QR-код')}
                </button>
            </main>
        </div>
    );
};
