import React, { useState } from 'react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Check, Loader2, Info } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Editor State & Save
export const ContactFormBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [fields, setFields] = useState(block?.content?.fields || {
        name: true,
        email: true,
        phone: false,
        message: true,
        validateName: true,
        validatePhone: true
    });
    const [title, setTitle] = useState(block?.content?.title || '');
    const [buttonText, setButtonText] = useState(block?.content?.button_text || 'Отправить');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const content = { fields, button_text: buttonText, title };
            let response;

            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'contact_form',
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
                    <h1 className="text-lg font-bold">Форма контактов</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 pt-6 pb-32 space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Заголовок (необязательно)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all"
                        placeholder="Свяжитесь с нами"
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Поля формы</h3>

                    {[
                        { id: 'name', label: 'Имя' },
                        { id: 'email', label: 'Email' },
                        { id: 'phone', label: 'Телефон' },
                        { id: 'message', label: 'Сообщение' }
                    ].map(field => (
                        <div key={field.id} className="flex items-center justify-between p-4 bg-secondary rounded-[16px] border border-transparent hover:border-border transition-all">
                            <span className="font-medium">{field.label}</span>
                            <button
                                onClick={() => setFields(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                                className={`w-12 h-7 rounded-full transition-colors relative ${fields[field.id] ? 'bg-primary' : 'bg-zinc-300 dark:bg-muted'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform ${fields[field.id] ? 'translate-x-5 bg-primary-foreground' : 'bg-white'}`} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Текст кнопки</label>
                    <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all"
                        placeholder="Например: Отправить"
                    />
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

export const ContactFormBlockRenderer = ({ block }) => {
    const fields = {
        ...block.content?.fields,
        validateName: block.content?.fields?.validateName !== undefined ? block.content.fields.validateName : true,
        validatePhone: block.content?.fields?.validatePhone !== undefined ? block.content.fields.validatePhone : true
    };
    const { button_text, title } = block.content || {};
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState({});

    const handleNameChange = (val) => {
        if (fields?.validateName) {
            const cleanVal = val.replace(/[0-9]/g, '');
            setFormData(prev => ({ ...prev, name: cleanVal }));
            if (val !== cleanVal) {
                toast.error("Имя не может содержать цифры", { id: 'name-error', duration: 1500 });
            }
        } else {
            setFormData(prev => ({ ...prev, name: val }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};

        if (fields?.name && !formData.name.trim()) {
            newErrors.name = "Как вас зовут?";
        }

        if (fields?.email && !formData.email.trim()) {
            newErrors.email = "Укажите Email";
        }

        if (fields?.phone && fields?.validatePhone && (!formData.phone || formData.phone.length < 10)) {
            newErrors.phone = "Некорректный номер";
            toast.error("Пожалуйста, введите полный номер телефона");
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await api.submitLead({
                page_id: block.page_id,
                form_id: block.id,
                name: formData.name || '',
                contact: formData.email || formData.phone || 'Не указан',
                email: formData.email || '',
                phone: formData.phone || '',
                message: formData.message || ''
            });

            if (response.ok) {
                setSent(true);
                toast.success('Сообщение отправлено!');
                setFormData({ name: '', email: '', phone: '', message: '' });
                setErrors({});
                setTimeout(() => setSent(false), 3000);
            } else {
                toast.error('Ошибка отправки');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-card border border-border rounded-[24px] p-6 shadow-sm">
            {title && <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>}
            {sent ? (
                <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Отправлено!</h3>
                    <p className="text-muted-foreground">Мы свяжемся с вами в ближайшее время.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields?.name && (
                        <div className="space-y-1">
                            <input
                                type="text"
                                placeholder="Ваше имя"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className={`w-full h-12 px-4 bg-secondary rounded-[12px] border ${errors.name ? 'border-destructive' : 'border-transparent'} focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground`}
                            />
                        </div>
                    )}

                    {fields?.email && (
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className={`w-full h-12 px-4 bg-secondary rounded-[12px] border ${errors.email ? 'border-destructive' : 'border-transparent'} focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground`}
                        />
                    )}

                    {fields?.phone && (
                        <div className="space-y-1">
                            {fields.validatePhone ? (
                                <div className={`phone-input-container ${errors.phone ? 'has-error' : ''}`}>
                                    <style>{`
                                        .phone-input-container .react-tel-input { width: 100%; font-family: inherit; }
                                        .phone-input-container .form-control { 
                                            width: 100% !important; 
                                            height: 48px !important; 
                                            background: hsl(var(--secondary)) !important; 
                                            border: 1px solid transparent !important;
                                            border-radius: 12px !important;
                                            font-size: 16px !important;
                                            color: hsl(var(--foreground)) !important;
                                            display: flex !important;
                                            align-items: center !important;
                                            padding-left: 58px !important;
                                        }
                                        .phone-input-container.has-error .form-control {
                                            border-color: hsl(var(--destructive)) !important;
                                        }
                                        .phone-input-container .flag-dropdown {
                                            background: transparent !important;
                                            border: none !important;
                                            border-radius: 12px 0 0 12px !important;
                                            padding: 0 !important;
                                            width: 48px !important;
                                        }
                                        .phone-input-container .selected-flag {
                                            background: transparent !important;
                                            width: 48px !important;
                                            padding: 0 0 0 14px !important;
                                            border-radius: 12px 0 0 12px !important;
                                        }
                                        .phone-input-container .selected-flag:hover, 
                                        .phone-input-container .selected-flag:focus,
                                        .phone-input-container .flag-dropdown.open .selected-flag {
                                            background: hsl(var(--secondary)) !important;
                                        }
                                        .phone-input-container .country-list {
                                            background: hsl(var(--card)) !important;
                                            border: 1px solid hsl(var(--border)) !important;
                                            color: hsl(var(--foreground)) !important;
                                            border-radius: 16px !important;
                                            margin-top: 8px !important;
                                            scrollbar-width: thin;
                                            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                                            width: 280px !important;
                                            padding: 8px !important;
                                        }
                                        .phone-input-container .country-list .search {
                                            padding: 12px 8px 8px 8px !important;
                                            background: transparent !important;
                                            display: flex !important;
                                            align-items: center !important;
                                        }
                                        .phone-input-container .country-list .search-emoji {
                                            display: none !important;
                                        }
                                        .phone-input-container .country-list .search-box {
                                            background: hsl(var(--secondary)) !important;
                                            border: 1px solid hsl(var(--border) / 0.5) !important;
                                            color: hsl(var(--foreground)) !important;
                                            border-radius: 10px !important;
                                            width: 100% !important;
                                            margin: 0 !important;
                                            height: 36px !important;
                                        }
                                        .phone-input-container .country-list .country {
                                            border-radius: 8px !important;
                                            padding: 10px 12px !important;
                                            transition: background 0.2s !important;
                                        }
                                        .phone-input-container .country-list .country:hover {
                                            background: hsl(var(--secondary)) !important;
                                        }
                                        .phone-input-container .country-list .country.highlight {
                                            background: hsl(var(--primary) / 0.1) !important;
                                            color: hsl(var(--primary)) !important;
                                        }
                                        .phone-input-container .country-list .country-name {
                                            font-size: 14px !important;
                                            font-weight: 500 !important;
                                        }
                                        .phone-input-container .country-list .dial-code {
                                            color: hsl(var(--muted-foreground)) !important;
                                            font-size: 14px !important;
                                        }
                                    `}</style>
                                    <PhoneInput
                                        country={'kz'}
                                        value={formData.phone}
                                        onChange={val => setFormData(prev => ({ ...prev, phone: val }))}
                                        placeholder="Телефон"
                                        inputClass="form-control"
                                        containerClass="react-tel-input"
                                        buttonClass="flag-dropdown"
                                        searchPlaceholder="Поиск..."
                                        enableSearch={true}
                                        disableCountryGuess={true}
                                        localization={{
                                            kz: 'Казахстан',
                                            ru: 'Россия',
                                            by: 'Беларусь',
                                            ua: 'Украина',
                                            uz: 'Узбекистан',
                                            kg: 'Киргизия',
                                            md: 'Молдова',
                                            de: 'Германия',
                                            us: 'США',
                                            gb: 'Великобритания',
                                            fr: 'Франция',
                                            it: 'Италия',
                                            es: 'Испания',
                                            pl: 'Польша',
                                            tr: 'Турция',
                                            cn: 'Китай',
                                            jp: 'Япония',
                                            am: 'Армения',
                                            az: 'Азербайджан',
                                            tj: 'Таджикистан',
                                            tm: 'Туркменистан',
                                            ge: 'Грузия',
                                        }}
                                        preferredCountries={['kz', 'ru', 'by', 'uz', 'kg']}
                                    />
                                </div>
                            ) : (
                                <input
                                    type="tel"
                                    placeholder="Телефон"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground"
                                />
                            )}
                        </div>
                    )}

                    {fields?.message && (
                        <textarea
                            placeholder="Сообщение..."
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            className={`w-full p-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground resize-none h-32`}
                            required
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-foreground text-background rounded-[12px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {button_text || 'Отправить'}
                    </button>
                </form>
            )}
        </div>
    );
};
