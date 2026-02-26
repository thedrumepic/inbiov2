import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, X, ArrowLeft, Pencil, Trash2, Plus, Link2, GripVertical, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import ConfirmationModal from '../ui/ConfirmationModal';

/**
 * Lightbox Component
 * Full-screen image viewer with navigation.
 */
const Lightbox = ({ items, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent">
                <span className="text-foreground font-medium text-sm">
                    {currentIndex + 1} / {items.length}
                </span>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full max-w-5xl aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center p-4">
                <img
                    key={currentIndex}
                    src={getImageUrl(items[currentIndex].url)}
                    alt={items[currentIndex].description || ""}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                />
            </div>

            {/* Navigation Buttons */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 border border-white/10 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-md"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 border border-white/10 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-md"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Description */}
            {items[currentIndex].description && (
                <div className="absolute bottom-8 px-6 text-center max-w-lg">
                    <p className="text-white text-base font-medium leading-relaxed drop-shadow-md">
                        {items[currentIndex].description}
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * ImageGalleryBlockRenderer
 * Public-facing view of the gallery.
 */
export const ImageGalleryBlockRenderer = ({ block }) => {
    const { content } = block;
    const items = content?.items || [];
    const title = content?.title || '';

    const [lightboxIndex, setLightboxIndex] = useState(null);
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    if (items.length === 0) return null;

    // Mouse Drag Logic
    const onMouseDown = (e) => {
        setIsDragging(true);
        startXRef.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeftRef.current = scrollRef.current.scrollLeft;
        // Prevent default to avoid image dragging or text selection
        if (e.cancelable) e.preventDefault();
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    return (
        <div className="w-full relative">
            {title && (
                <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1 tracking-wider">
                    {title}
                </h3>
            )}

            <div
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseLeave={stopDragging}
                onMouseUp={stopDragging}
                onMouseMove={onMouseMove}
                className={`flex overflow-x-auto gap-3 no-scrollbar cursor-grab active:cursor-grabbing select-none ${isDragging ? 'scroll-auto' : 'scroll-smooth'}`}
            >

                {items.map((item, index) => {
                    const hasLink = !!item.link;
                    const Wrapper = hasLink ? 'a' : 'div';
                    const wrapperProps = hasLink ? {
                        href: item.link && !item.link.startsWith("http") ? "https://" + item.link : item.link,
                        target: "_blank",
                        rel: "noopener noreferrer"
                    } : {
                        onClick: () => setLightboxIndex(index)
                    };

                    return (
                        <Wrapper
                            key={index}
                            {...wrapperProps}
                            className={`group relative flex-none w-[calc(50%-6px)] aspect-square bg-card border border-border rounded-[16px] overflow-hidden transition-all hover:border-foreground/20 block first:ml-0`}
                        >
                            <img
                                src={getImageUrl(item.url)}
                                alt={item.description || `Gallery image ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                            />
                            {item.link && (
                                <div className="absolute top-2 right-2 w-7 h-7 bg-background/50 backdrop-blur-md rounded-full flex items-center justify-center border border-border text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link2 className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                            {item.description && (
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                                        {item.description}
                                    </p>
                                </div>
                            )}
                        </Wrapper>
                    );
                })}
                <div className="flex-none w-0" />
            </div>

            {/* Lightbox Rendering */}
            {lightboxIndex !== null && (
                <Lightbox
                    items={items}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
};

/**
 * ImageItemEditor
 * Editor for a single image's metadata (description, link).
 */
const ImageItemEditor = ({ item, onSave, onBack }) => {
    const [description, setDescription] = useState(item.description || '');
    const [link, setLink] = useState(item.link || '');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft className="w-4 h-4 text-foreground" />
                </button>
                <h2 className="text-sm font-bold text-foreground">Данные картинки</h2>
            </div>

            <div className="aspect-video relative rounded-[16px] overflow-hidden border border-border">
                <img src={getImageUrl(item.url)} className="w-full h-full object-cover" alt="Selected" />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Описание (необязательно)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all text-sm resize-none"
                        placeholder="О чем это фото?.."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Ссылка (необязательно)</label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                            <Link2 className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all text-sm"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={() => onSave({ ...item, description, link })}
                className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base hover:bg-foreground/90 transition-all"
            >
                Сохранить
            </button>
        </div>
    );
};

/**
 * ImageGalleryBlockEditor
 * Main editor for the gallery block.
 */
export const ImageGalleryBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [title, setTitle] = useState(block?.content?.title || '');
    const [items, setItems] = useState(block?.content?.items || []);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newItems = [...items];

        try {
            for (const file of files) {
                const response = await api.uploadImage(file, 'gallery');
                if (response.ok) {
                    const data = await response.json();
                    newItems.push({
                        url: data.url,
                        description: '',
                        link: ''
                    });
                }
            }
            setItems(newItems);
            toast.success(`Загружено ${files.length} фото`);
        } catch (error) {
            toast.error('Ошибка при загрузке');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveItem = (updatedItem) => {
        const newItems = [...items];
        newItems[editingItemIndex] = updatedItem;
        setItems(newItems);
        setEditingItemIndex(null);
    };

    const confirmDeleteItem = () => {
        if (deleteIndex !== null) {
            setItems(items.filter((_, i) => i !== deleteIndex));
            setDeleteIndex(null);
        }
    };

    const handleSaveAll = async () => {
        if (items.length === 0) {
            toast.error('Добавьте хотя бы одно фото');
            return;
        }

        setSaving(true);
        try {
            const content = { title, items };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) {
                    toast.success('Галерея обновлена');
                    onSuccess();
                }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'gallery',
                    content,
                    order: blocksCount || 0,
                });
                if (response.ok) {
                    toast.success('Галерея создана');
                    onSuccess();
                }
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    };

    if (editingItemIndex !== null) {
        return (
            <div className="min-h-screen bg-background p-4">
                <div className="max-w-[440px] mx-auto">
                    <ImageItemEditor
                        item={items[editingItemIndex]}
                        onSave={handleSaveItem}
                        onBack={() => setEditingItemIndex(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Галерея</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8 pb-32">
                {/* Multi-upload Placeholder */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-secondary border-2 border-dashed border-border rounded-[24px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-foreground/[0.07] hover:border-foreground/20 transition-all group"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        accept="image/*"
                    />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#86efac] animate-spin" />
                            <span className="text-sm text-muted-foreground">Загрузка...</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-7 h-7 text-foreground" />
                            </div>
                            <span className="text-sm font-bold text-foreground tracking-tight text-center px-4">Добавьте одну или несколько фотографии/картинок</span>
                        </>
                    )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Заголовок (необязательно)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all text-sm"
                        placeholder="Интересные моменты..."
                    />
                </div>

                {/* Items List */}
                {items.length > 0 && (
                    <div className="space-y-4">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Загруженные фото ({items.length})</label>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-secondary border border-border rounded-[18px] group">
                                    <div className="w-14 h-14 rounded-[12px] overflow-hidden border border-border shrink-0">
                                        <img src={getImageUrl(item.url)} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Pencil className="w-3 h-3" />
                                            <span className="text-[11px] truncate">{item.description || 'Нет описания'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Link2 className="w-3 h-3" />
                                            <span className="text-[11px] truncate">{item.link || 'Нет ссылки'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setEditingItemIndex(index)}
                                            className="w-9 h-9 flex items-center justify-center bg-[#86efac]/10 hover:bg-[#86efac]/20 text-[#86efac] rounded-full transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteIndex(index)}
                                            className="w-9 h-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Constant Floating Save Button */}
                <div className="fixed bottom-8 left-4 right-4 max-w-[408px] mx-auto z-50">
                    <button
                        onClick={handleSaveAll}
                        disabled={saving || uploading}
                        className="w-full py-4 bg-foreground text-background rounded-[24px] font-bold text-base shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {saving ? 'Сохранение...' : (block?.id ? 'Обновить галерею' : 'Сохранить')}
                    </button>
                </div>
            </main>

            <ConfirmationModal
                isOpen={deleteIndex !== null}
                onClose={() => setDeleteIndex(null)}
                onConfirm={confirmDeleteItem}
                title="Удалить фото?"
                message="Это действие нельзя отменить. Вы уверены?"
                confirmText="Удалить"
                cancelText="Отмена"
            />
        </div>
    );
};
