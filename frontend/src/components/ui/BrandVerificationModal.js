import React, { useState } from 'react';
import { X, ShieldCheck, Link2, Trash, ExternalLink } from 'lucide-react';
import { SOCIAL_PLATFORMS } from '../blocks/LinkBlock';
import { getImageUrl } from '../../utils/api';
import { useMediaQuery } from '../../hooks/use-media-query';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '../ui/drawer';

const BrandVerificationModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [category, setCategory] = useState('Business');
    const [bio, setBio] = useState('');
    const [comment, setComment] = useState('');
    const [website, setWebsite] = useState('');
    const [socialLinks, setSocialLinks] = useState([]);
    const [currentUrl, setCurrentUrl] = useState('');
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!isOpen) return null;

    const handleUrlChange = (value) => {
        setCurrentUrl(value);
        if (value && value.trim()) {
            const lowerValue = value.toLowerCase().trim();
            const detected = SOCIAL_PLATFORMS.find(p =>
                p.id !== 'custom' && p.domain && lowerValue.includes(p.domain)
            );

            if (detected) {
                if (!socialLinks.some(l => l.url === value.trim())) {
                    setSocialLinks([...socialLinks, {
                        platform: detected.id,
                        url: value.trim(),
                        icon: detected.icon
                    }]);
                }
                setCurrentUrl('');
            }
        }
    };

    const removeSocialLink = (index) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let finalLinks = [...socialLinks];
        if (currentUrl.trim()) {
            finalLinks.push({ platform: 'custom', url: currentUrl.trim() });
        }

        onSubmit({
            category,
            bio,
            comment,
            website,
            social_links: finalLinks.map(l => ({ platform: l.platform, url: l.url }))
        });
    };



    const content = (
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Категория</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary/30 text-foreground transition-all"
                >
                    <option value="Group">Группа / Музыкальный коллектив</option>
                    <option value="Business">Бизнес / Компания</option>
                    <option value="Festival">Фестиваль / Мероприятие</option>
                    <option value="Project">Проект / Организация</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Сайт бренда (Website)</label>
                <input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary/30 text-foreground transition-all"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">О бренде (описание)</label>
                <textarea
                    required
                    rows={3}
                    placeholder="Расскажите о вашем бренде или организации..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary/30 text-foreground transition-all resize-none min-h-[80px]"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Ссылки на соцсети</label>
                <div className="space-y-2 mb-3">
                    {socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-secondary/50 border border-border rounded-lg animate-in fade-in slide-in-from-left-2 text-xs">
                            <div className="w-7 h-7 rounded flex items-center justify-center overflow-hidden bg-background shrink-0">
                                {link.icon ? (
                                    <img src={getImageUrl(link.icon)} className="w-4 h-4 object-contain" alt="" />
                                ) : (
                                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 truncate font-medium text-foreground">{link.url}</div>
                            <button
                                type="button"
                                onClick={() => removeSocialLink(index)}
                                className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                            >
                                <Trash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        value={currentUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary/30 text-foreground transition-all"
                        placeholder="Вставьте ссылку..."
                    />
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-1 italic">
                    * Автоопределение при вставке
                </p>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Дополнительные комментарии</label>
                <textarea
                    rows={2}
                    placeholder="Например, подтверждающая информация..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary/30 text-foreground transition-all resize-none min-h-[60px]"
                />
            </div>

            <div className="pt-4 flex gap-3 pb-safe">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                    Отмена
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                >
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Верификация бренда
                        </h3>
                        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }} modal={true} dismissible={false}>
            <DrawerContent className="max-h-[90vh] focus-within:max-h-[85vh]">
                <DrawerHeader className="text-left px-6 pt-6 flex items-center justify-between">
                    <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Верификация бренда
                    </DrawerTitle>
                </DrawerHeader>
                <div className="px-0 pb-0 overflow-y-auto">
                    {content}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default BrandVerificationModal;
