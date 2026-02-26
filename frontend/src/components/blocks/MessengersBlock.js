import React, { useState } from 'react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, MessageCircle } from 'lucide-react';

export const MessengersBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [platform, setPlatform] = useState(block?.content?.platform || 'whatsapp');
    const [identifier, setIdentifier] = useState(block?.content?.identifier || '');
    const [text, setText] = useState(block?.content?.text || '');
    const [buttonLabel, setButtonLabel] = useState(block?.content?.button_label || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!identifier) {
            toast.error('Введите номер или имя пользователя');
            return;
        }

        setSaving(true);
        try {
            const content = { platform, identifier, text, button_label: buttonLabel };
            let response;

            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'messengers',
                    content,
                    order: blocksCount || 0,
                });
            }

            if (response.ok) {
                toast.success(block?.id ? 'Блок обновлён' : 'Блок создан');
                onSuccess();
            } else {
                toast.error('Ошибка сохранения');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">Мессенджеры</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setPlatform('whatsapp')}
                        className={`p-4 rounded-[16px] border-2 flex flex-col items-center gap-2 transition-all ${platform === 'whatsapp' ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary'}`}
                    >
                        <img src={getImageUrl('/uploads/social-logo/whatsapp.svg')} alt="WhatsApp" className="w-8 h-8" />
                        <span className="font-medium text-sm">WhatsApp</span>
                    </button>
                    <button
                        onClick={() => setPlatform('telegram')}
                        className={`p-4 rounded-[16px] border-2 flex flex-col items-center gap-2 transition-all ${platform === 'telegram' ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary'}`}
                    >
                        <img src={getImageUrl('/uploads/social-logo/telegram.svg')} alt="Telegram" className="w-8 h-8" />
                        <span className="font-medium text-sm">Telegram</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {platform === 'whatsapp' ? 'Номер телефона' : 'Имя пользователя'}
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all"
                            placeholder={platform === 'whatsapp' ? '79001234567' : 'username'}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Текст на кнопке</label>
                        <input
                            type="text"
                            value={buttonLabel}
                            onChange={(e) => setButtonLabel(e.target.value)}
                            className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all"
                            placeholder={platform === 'whatsapp' ? 'Написать в WhatsApp' : 'Написать в Telegram'}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Заготовленный текст</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full p-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all resize-none h-24"
                            placeholder="Привет! Хочу узнать подробнее..."
                        />
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border mt-auto">
                <div className="max-w-[440px] mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-12 bg-foreground text-background rounded-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MessengersBlockRenderer = ({ block }) => {
    const { platform, identifier, text, button_label } = block.content || {};

    const getUrl = () => {
        if (platform === 'whatsapp') {
            const cleanPhone = identifier?.replace(/\D/g, '');
            const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
            return `https://wa.me/${cleanPhone}${encodedText}`;
        }
        if (platform === 'telegram') {
            const cleanUsername = identifier?.replace('@', '').replace('t.me/', '').replace('https://', '');
            const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
            return `https://t.me/${cleanUsername}${encodedText}`;
        }
        return '#';
    };

    const bgColor = platform === 'whatsapp' ? 'bg-[#25D366]' : 'bg-[#0088cc]';
    const label = button_label || (platform === 'whatsapp' ? 'Написать в WhatsApp' : 'Написать в Telegram');
    const iconSrc = platform === 'whatsapp' ? '/uploads/social-logo/whatsapp.svg' : '/uploads/social-logo/telegram.svg';

    return (
        <a
            href={getUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full h-14 ${bgColor} rounded-[16px] flex items-center justify-center gap-3 text-white font-bold hover:opacity-90 active:scale-[0.99] transition-all shadow-lg`}
        >
            <img src={getImageUrl(iconSrc)} alt={platform} className="w-6 h-6 invert brightness-0" />
            <span>{label}</span>
        </a>
    );
};
