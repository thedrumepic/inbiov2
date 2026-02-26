import React, { useState } from 'react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, Camera, ShoppingBag, MessageSquare, ExternalLink, Check, Plus, GripVertical, Info, ArrowUp, ArrowDown, ChevronDown, Edit3 } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../lib/utils';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useRef, useEffect } from 'react';

export const ShowcaseBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    // Migration: If block exists but doesn't have items array, convert single fields to first item
    const getInitialItems = () => {
        if (block?.content?.items) return block.content.items;
        if (block?.content?.title) {
            return [{
                id: Math.random().toString(36).substr(2, 9),
                title: block.content.title,
                description: block.content.description || '',
                price: block.content.price || '',
                currency: block.content.currency || '₸',
                image: block.content.image || '',
                button_label: block.content.button_label || 'Купить',
                action: block.content.action || 'link',
                link: block.content.link || ''
            }];
        }
        return [{
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            price: '',
            currency: '₸',
            image: '',
            button_label: 'Купить',
            action: 'link',
            link: ''
        }];
    };

    const [items, setItems] = useState(getInitialItems());
    const [displayMode, setDisplayMode] = useState(block?.content?.displayMode || 'list');
    const [saving, setSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            price: '',
            currency: '₸',
            image: '',
            button_label: 'Купить',
            action: 'link',
            link: ''
        }]);
    };

    const removeItem = (id) => {
        if (items.length <= 1) {
            toast.error('Должен быть хотя бы один товар');
            return;
        }
        setItemToDelete(id);
    };

    const confirmRemoveItem = () => {
        if (itemToDelete) {
            setItems(items.filter(item => item.id !== itemToDelete));
            setItemToDelete(null);
            toast.success('Товар удален');
        }
    };

    const updateItem = (id, fields) => {
        setItems(items.map(item => item.id === id ? { ...item, ...fields } : item));
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setItems(newItems);
    };

    const handleImageUpload = async (e, id) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(id);
        try {
            const response = await api.uploadImage(file, 'others');
            if (response.ok) {
                const data = await response.json();
                updateItem(id, { image: data.url });
                toast.success('Изображение загружено');
            } else {
                toast.error('Ошибка загрузки');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setUploadingId(null);
        }
    };

    const formatUrl = (url) => {
        if (!url) return '';
        const trimmed = url.trim();
        if (/^(https?:\/\/|mailto:|tel:|#)/i.test(trimmed)) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    const handleSave = async () => {
        if (items.some(item => !item.title.trim())) {
            toast.error('Заполните названия всех товаров');
            return;
        }

        // URL Validation
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
        for (const item of items) {
            if (item.action === 'link' && item.link.trim()) {
                const url = item.link.trim();
                // Special protocols are allowed
                if (!/^(mailto:|tel:|#)/i.test(url) && !urlPattern.test(url)) {
                    toast.error('Введите правильный URL. Пример: example.com');
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const formattedItems = items.map(item => ({
                ...item,
                link: item.action === 'link' ? formatUrl(item.link) : item.link
            }));

            const content = {
                items: formattedItems,
                displayMode: items.length < 2 ? 'list' : displayMode
            };
            let response;

            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'showcase',
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
        <div className="min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">Витрина</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-6 space-y-8">
                {/* Global Block Settings */}
                {items.length >= 2 && (
                    <div className="bg-card p-4 rounded-[20px] border border-border space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Совместить в сетку?</label>
                                <Tooltip content="Сетка лучше подходит для большого количества товаров, а список — для фокуса на деталях">
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </Tooltip>
                            </div>
                            <button
                                onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
                                className={cn(
                                    "relative w-[42px] h-[22px] rounded-full transition-all duration-300 outline-none",
                                    displayMode === 'grid' ? "bg-white" : "bg-zinc-200 dark:bg-zinc-800"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                    displayMode === 'grid' ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                                )} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                "bg-card rounded-[24px] border border-border animate-in fade-in zoom-in-95 duration-300 relative",
                                openDropdownId === item.id ? "z-[100]" : "z-10"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border rounded-t-[24px]">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">Товар #{index + 1}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => moveItem(index, -1)}
                                        disabled={index === 0}
                                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all"
                                    >
                                        <ArrowUp className="w-5 h-5 stroke-[1.5]" />
                                    </button>
                                    <button
                                        onClick={() => moveItem(index, 1)}
                                        disabled={index === items.length - 1}
                                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all"
                                    >
                                        <ArrowDown className="w-5 h-5 stroke-[1.5]" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 ml-2 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-6">
                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <div className="relative aspect-square max-w-[200px] mx-auto bg-secondary rounded-[24px] overflow-hidden border-2 border-dashed border-border group">
                                        {item.image ? (
                                            <>
                                                <img src={getImageUrl(item.image)} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => updateItem(item.id, { image: '' })}
                                                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all shadow-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/80 transition-all text-center p-4">
                                                {uploadingId === item.id ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <>
                                                        <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase leading-tight">Загрузить<br />фото 1:1</span>
                                                    </>
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, item.id)} disabled={uploadingId === item.id} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Название</label>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                            className="w-full h-11 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm"
                                            placeholder="Напр: Футболка Basic"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Описание</label>
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                            className="w-full p-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all resize-none h-20 text-sm"
                                            placeholder="Коротко о товаре..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Цена</label>
                                            <input
                                                type="text"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                                className="w-full h-11 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm"
                                                placeholder="5000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Валюта</label>
                                            <div className="flex bg-secondary rounded-[12px] p-1 h-11">
                                                {['₸', '$', '₽'].map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateItem(item.id, { currency: c })}
                                                        className={`flex-1 rounded-[8px] text-xs font-black transition-all ${item.currency === c ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Кнопка</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-[14px]">
                                            <button
                                                onClick={() => updateItem(item.id, { action: 'link' })}
                                                className={`flex items-center justify-center gap-2 h-9 rounded-[10px] text-xs font-bold transition-all ${item.action === 'link' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Ссылка
                                            </button>
                                            <button
                                                onClick={() => updateItem(item.id, { action: 'form' })}
                                                className={`flex items-center justify-center gap-2 h-9 rounded-[10px] text-xs font-bold transition-all ${item.action === 'form' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Заявка
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {item.action === 'form' ? (
                                            <div className="space-y-4">
                                                <div className="relative group/dropdown">
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5 ml-1 block">Надпись на кнопке</label>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                                            className={cn(
                                                                "w-full h-12 px-5 bg-secondary border border-transparent hover:border-border/50 rounded-[16px] flex items-center justify-between transition-all outline-none group/btn",
                                                                openDropdownId === item.id && "bg-background border-primary/50 ring-4 ring-primary/5 shadow-sm"
                                                            )}
                                                        >
                                                            <span className="text-[13px] font-bold">
                                                                {['Купить', 'Заказать', 'Забронировать'].includes(item.button_label)
                                                                    ? item.button_label
                                                                    : item.button_label === '' ? 'Выберите действие' : 'Своя надпись'}
                                                            </span>
                                                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground group-hover/btn:text-foreground transition-all duration-300", openDropdownId === item.id && "rotate-180 text-primary")} />
                                                        </button>

                                                        {openDropdownId === item.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-[60]"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[70] bg-card border border-border/40 rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl origin-top">
                                                                    <div className="p-1.5">
                                                                        {['Купить', 'Заказать', 'Забронировать'].map((val) => (
                                                                            <button
                                                                                key={val}
                                                                                onClick={() => {
                                                                                    updateItem(item.id, { button_label: val });
                                                                                    setOpenDropdownId(null);
                                                                                }}
                                                                                className={cn(
                                                                                    "w-full px-4 py-3 rounded-[14px] text-sm font-bold flex items-center justify-between transition-all",
                                                                                    item.button_label === val ? "bg-foreground text-background shadow-lg" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                                                                )}
                                                                            >
                                                                                {val}
                                                                                {item.button_label === val && <Check className="w-4 h-4" />}
                                                                            </button>
                                                                        ))}
                                                                        <div className="h-[1px] bg-border/40 my-1.5 mx-2" />
                                                                        <button
                                                                            onClick={() => {
                                                                                if (['Купить', 'Заказать', 'Забронировать'].includes(item.button_label)) {
                                                                                    updateItem(item.id, { button_label: '' });
                                                                                }
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className={cn(
                                                                                "w-full px-4 py-3 rounded-[14px] text-sm font-bold flex items-center gap-2 transition-all",
                                                                                !['Купить', 'Заказать', 'Забронировать'].includes(item.button_label)
                                                                                    ? "bg-primary text-primary-foreground shadow-lg"
                                                                                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                                                            )}
                                                                        >
                                                                            <Edit3 className="w-3.5 h-3.5" /> Своя надпись
                                                                            {!['Купить', 'Заказать', 'Забронировать'].includes(item.button_label) && item.button_label !== '' && <Check className="w-4 h-4 ml-auto" />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {!['Купить', 'Заказать', 'Забронировать'].includes(item.button_label) && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <input
                                                            type="text"
                                                            value={item.button_label}
                                                            onChange={(e) => updateItem(item.id, { button_label: e.target.value })}
                                                            className="w-full h-12 px-4 bg-secondary rounded-[14px] border border-primary/20 focus:border-primary focus:outline-none transition-all text-sm font-bold placeholder:font-medium"
                                                            placeholder="Введите свой текст кнопки..."
                                                            autoFocus
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.button_label}
                                                onChange={(e) => updateItem(item.id, { button_label: e.target.value })}
                                                className="w-full h-11 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                                                placeholder="Текст на кнопке"
                                            />
                                        )}
                                        {item.action === 'link' && (
                                            <input
                                                type="url"
                                                value={item.link}
                                                onChange={(e) => updateItem(item.id, { link: e.target.value })}
                                                className="w-full h-11 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm animate-in slide-in-from-top-2"
                                                placeholder="https://wa.me/..."
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addItem}
                        className="w-full py-4 border-2 border-dashed border-border rounded-[24px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Добавить товар
                    </button>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-[440px] mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploadingId !== null}
                        className="w-full h-12 bg-foreground text-background rounded-[16px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Готово'}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={itemToDelete !== null}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmRemoveItem}
                title="Удалить товар?"
                message="Это действие нельзя отменить. Вы уверены, что хотите удалить этот товар из витрины?"
                confirmText="Удалить"
                cancelText="Отмена"
                isDangerous={true}
            />
        </div>
    );
};

const ProductCard = ({ item, isGrid, pageId, blockId }) => {
    const { title, description, price, currency, image, button_label, action, link } = item;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formSent, setFormSent] = useState(false);
    const [formData, setFormData] = useState({ name: '', contact: '', message: '' });

    const handleAction = () => {
        if (action === 'link' && link) {
            const fullLink = link && !link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('tel:') ? 'https://' + link : link;
            window.open(fullLink, '_blank');
        } else if (action === 'form') {
            setIsFormOpen(true);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const response = await api.submitLead({
                page_id: pageId,
                form_id: `showcase-${blockId}-${item.id}`,
                name: formData.name,
                contact: formData.contact,
                message: `Товар: ${title}\n${formData.message}`
            });

            if (response.ok) {
                setFormSent(true);
                toast.success('Заявка отправлена!');
                setTimeout(() => {
                    setIsFormOpen(false);
                    setFormSent(false);
                    setFormData({ name: '', contact: '', message: '' });
                }, 2000);
            } else {
                toast.error('Ошибка отправки');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className={cn(
            "bg-card border border-border rounded-[24px] overflow-hidden transition-all duration-300 flex flex-col h-full",
            !isGrid && "w-full"
        )}>
            {image && (
                <div className={cn(
                    "w-full overflow-hidden",
                    isGrid ? "aspect-square" : "aspect-[16/10]"
                )}>
                    <img src={getImageUrl(image)} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
            )}
            <div className={cn(
                "p-4 flex flex-col flex-1",
                isGrid ? "gap-2" : "gap-3"
            )}>
                <div className={cn(
                    "flex items-start gap-2",
                    isGrid ? "flex-col" : "justify-between"
                )}>
                    <h3 className={cn(
                        "font-bold leading-tight",
                        isGrid ? "text-sm h-10 line-clamp-2" : "text-lg"
                    )}>{title}</h3>
                    {price && (
                        <div className={cn(
                            "text-primary font-black whitespace-nowrap",
                            isGrid ? "text-sm" : "text-base"
                        )}>
                            {price} {currency}
                        </div>
                    )}
                </div>
                {!isGrid && description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}

                <div className="mt-auto pt-2">
                    <button
                        onClick={handleAction}
                        className={cn(
                            "w-full bg-foreground text-background rounded-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all",
                            isGrid ? "h-9 text-[10px]" : "h-11 text-xs"
                        )}
                    >
                        {!isGrid && <ShoppingBag className="w-4 h-4" />}
                        {button_label || 'Купить'}
                    </button>
                </div>
            </div>

            {/* Leads Modal (Shared) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="w-full max-w-[400px] bg-card rounded-[28px] overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 pb-2">
                            <h3 className="text-xl font-black uppercase tracking-tight">Заказать</h3>
                            <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 pt-2">
                            <p className="text-sm text-muted-foreground mb-4">Напишите нам по поводу товара <b>{title}</b></p>

                            {formSent ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                        <Check className="w-7 h-7" />
                                    </div>
                                    <span className="font-bold uppercase tracking-widest">Спасибо!<br />Отправлено</span>
                                </div>
                            ) : (
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Ваше имя"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full h-12 px-4 bg-secondary rounded-[14px] border border-transparent focus:border-primary focus:outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Телефон или Email"
                                        required
                                        value={formData.contact}
                                        onChange={(e) => setFormData(p => ({ ...p, contact: e.target.value }))}
                                        className="w-full h-12 px-4 bg-secondary rounded-[14px] border border-transparent focus:border-primary focus:outline-none transition-all"
                                    />
                                    <textarea
                                        placeholder="Комментарий (необязательно)"
                                        value={formData.message}
                                        onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                                        className="w-full p-4 bg-secondary rounded-[14px] border border-transparent focus:border-primary focus:outline-none transition-all resize-none h-24"
                                    />
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full h-12 bg-primary text-primary-foreground rounded-[16px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Отправить'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ShowcaseBlockRenderer = ({ block }) => {
    const { items = [], displayMode = 'list' } = block.content || {};

    // Support legacy blocks
    let finalItems = items;
    if (items.length === 0 && block.content?.title) {
        finalItems = [{
            id: 'legacy',
            ...block.content
        }];
    }

    if (finalItems.length === 0) return null;

    const isGrid = displayMode === 'grid' && finalItems.length >= 2;

    return (
        <div className={cn(
            "w-full transition-all duration-500 ease-in-out",
            isGrid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-4"
        )}>
            {finalItems.map((item) => (
                <div key={item.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ProductCard
                        item={item}
                        isGrid={isGrid}
                        pageId={block.page_id}
                        blockId={block.id}
                    />
                </div>
            ))}
        </div>
    );
};
