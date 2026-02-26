import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, X, ArrowLeft, GripVertical } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import ConfirmationModal from '../ui/ConfirmationModal';
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

// --- Sortable FAQ Item ---
const SortableFAQItem = ({ index, item, onUpdate, onDelete, itemsCount }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `faq-item-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group p-4 bg-accent/50 border border-border rounded-[20px] space-y-3 ${isDragging ? 'shadow-2xl border-foreground/30 bg-foreground/10' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-foreground transition-colors">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] text-muted-foreground font-bold border border-border">
                    {index + 1}
                </div>
                <input
                    type="text"
                    value={item.question}
                    onChange={(e) => onUpdate(index, 'question', e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm font-medium"
                    placeholder="Вопрос..."
                />
                {itemsCount > 1 && (
                    <button onClick={() => onDelete(index)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            <textarea
                value={item.answer}
                onChange={(e) => onUpdate(index, 'answer', e.target.value)}
                rows={2}
                className="w-full bg-transparent border-t border-border pt-3 text-sm text-muted-foreground placeholder:text-gray-600 focus:outline-none resize-none"
                placeholder="Ответ..."
            />
        </div>
    );
};

export const FAQBlockRenderer = ({ block }) => {
    const { content } = block;
    const [openIndex, setOpenIndex] = useState(null);
    const items = content?.items || [];
    const hasHighlight = content?.hasHighlight || false;
    const showNumbers = content?.showNumbers || false;

    const toggleItem = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full">
            {content.title && (
                <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1 tracking-wider">
                    {content.title}
                </h3>
            )}
            <div className={`bg-card rounded-[12px] overflow-hidden transition-all duration-300 border ${hasHighlight ? 'border-foreground/40 shadow-[0_0_20px_rgba(255,255,255,0.02)]' : 'border-border'}`}>
                <div className="divide-y divide-foreground/5">
                    {items.map((item, index) => (
                        <div key={index} className={`transition-colors duration-300 ${openIndex === index ? 'bg-accent/50' : ''}`}>
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full h-[56px] px-6 flex items-center justify-between text-left group"
                            >
                                <span className="text-[15px] font-bold text-foreground group-hover:text-foreground/90 transition-colors pr-4 truncate">
                                    {showNumbers ? `${index + 1}. ` : ''}{item.question}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-foreground/[0.02] pt-4">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const FAQBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [title, setTitle] = useState(block?.content?.title || '');
    const [hasHighlight, setHasHighlight] = useState(block?.content?.hasHighlight ?? true);
    const [showNumbers, setShowNumbers] = useState(block?.content?.showNumbers ?? false);
    const [items, setItems] = useState(block?.content?.items || [{ question: '', answer: '' }]);
    const [saving, setSaving] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addItem = () => {
        setItems([...items, { question: '', answer: '' }]);
    };

    const confirmDeleteItem = () => {
        if (deleteIndex !== null) {
            setItems(items.filter((_, i) => i !== deleteIndex));
            setDeleteIndex(null);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((prevItems) => {
                const oldIndex = prevItems.findIndex((_, idx) => `faq-item-${idx}` === active.id);
                const newIndex = prevItems.findIndex((_, idx) => `faq-item-${idx}` === over.id);
                return arrayMove(prevItems, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        const filteredItems = items.filter(item => item.question.trim() && item.answer.trim());
        if (filteredItems.length === 0) {
            toast.error('Добавьте хотя бы один вопрос и ответ');
            return;
        }

        setSaving(true);
        try {
            const content = { title, hasHighlight, showNumbers, items: filteredItems };
            if (block?.id) {
                const response = await api.updateBlock(block.id, { content });
                if (response.ok) { toast.success('Блок обновлён'); onSuccess(); }
            } else {
                const response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'faq',
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
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">FAQ</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Preview */}
                <div className="p-4 bg-secondary rounded-[24px] border border-border">
                    <FAQBlockRenderer block={{ content: { title, hasHighlight, showNumbers, items: items.filter(i => i.question) } }} />
                </div>

                {/* Style Toggle */}
                <div className="p-1 bg-secondary rounded-[16px] flex gap-1">
                    <button
                        onClick={() => setHasHighlight(true)}
                        className={`flex-1 py-3 px-4 rounded-[12px] text-sm font-medium transition-all ${hasHighlight ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        С выделением
                    </button>
                    <button
                        onClick={() => setHasHighlight(false)}
                        className={`flex-1 py-3 px-4 rounded-[12px] text-sm font-medium transition-all ${!hasHighlight ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Без выделения
                    </button>
                </div>

                {/* Block Settings */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Заголовок блока</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all text-sm"
                            placeholder="Например: Популярные вопросы"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Вопросы и ответы</label>
                            <button
                                onClick={() => setShowNumbers(!showNumbers)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showNumbers ? 'bg-foreground text-background border-foreground' : 'bg-secondary text-muted-foreground border-border hover:border-foreground/20'}`}
                            >
                                <span className="text-[10px] font-bold">Показывать порядок цифр?</span>
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map((_, idx) => `faq-item-${idx}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <SortableFAQItem
                                            key={index}
                                            index={index}
                                            item={item}
                                            onUpdate={updateItem}
                                            onDelete={setDeleteIndex}
                                            itemsCount={items.length}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <button
                            onClick={addItem}
                            className="w-full py-4 border border-dashed border-border rounded-[20px] text-muted-foreground text-sm font-medium hover:border-foreground/20 hover:text-foreground transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Добавить еще
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                    {saving ? 'Сохранение...' : (block?.id ? 'Обновить блок' : 'Сохранить FAQ')}
                </button>
            </main>

            <ConfirmationModal
                isOpen={deleteIndex !== null}
                onClose={() => setDeleteIndex(null)}
                onConfirm={confirmDeleteItem}
                title="Удалить вопрос?"
                message="Это действие нельзя отменить. Вы уверены?"
                confirmText="Удалить"
                cancelText="Отмена"
            />
        </div>
    );
};

export default FAQBlockRenderer;
