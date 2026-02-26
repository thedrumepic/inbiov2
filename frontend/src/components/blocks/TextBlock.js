import React, { useState } from 'react';
import { ArrowLeft, X, Bold, Italic, Underline, Strikethrough, Link2, Eraser, Highlighter, Palette } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';

export const TextBlockRenderer = ({ block }) => {
    const { content } = block;
    const style = content.style || 'plain';
    const isHighlighted = style === 'highlighted';

    const Wrapper = content.url ? 'a' : 'div';
    const wrapperProps = content.url ? { href: content.url && !content.url.startsWith('http') ? 'https://' + content.url : content.url, target: '_blank', rel: 'noopener noreferrer' } : {};

    return (
        <Wrapper {...wrapperProps} className="block no-underline" data-testid="text-block">
            <div className={`bg-card rounded-[12px] border border-border p-3 shadow-xl transition-all ${content.url ? 'hover:scale-[1.01] active:scale-[0.99] border-border' : ''}`}>
                <div className={`p-4 rounded-[12px] ${isHighlighted ? 'border-2 border-border text-foreground' : 'bg-transparent text-foreground'}`}>
                    {content.title && (
                        <h3 className={`text-xl font-bold mb-2 text-foreground whitespace-pre-wrap`}>
                            {content.title}
                        </h3>
                    )}
                    {content.text && (
                        <div
                            className={`text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/80 content-text`}
                            dangerouslySetInnerHTML={{ __html: content.text }}
                        />
                    )}
                </div>
            </div>
        </Wrapper>
    );
};

export const TextBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [style, setStyle] = useState(block?.content?.style || 'highlighted');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [text, setText] = useState(block?.content?.text || '');
    const [url, setUrl] = useState(block?.content?.url || '');
    const [saving, setSaving] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showTextColorModal, setShowTextColorModal] = useState(false);
    const [savedSelection, setSavedSelection] = useState(null);
    const editorRef = React.useRef(null);

    const isHighlighted = style === 'highlighted';

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            setSavedSelection(sel.getRangeAt(0));
        }
    };

    const restoreSelection = (range) => {
        if (range) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    const applyFormat = (command, value = null) => {
        if (!editorRef.current) return;
        editorRef.current.focus();

        if (command === 'createLink') {
            saveSelection();
            setShowLinkModal(true);
            return;
        }

        if (command === 'hiliteColor') {
            saveSelection();
            setShowColorModal(true);
            return;
        }

        if (command === 'foreColor') {
            saveSelection();
            setShowTextColorModal(true);
            return;
        }

        if (command === 'removeFormat') {
            document.execCommand('removeFormat', false, null);
            document.execCommand('unlink', false, null);
        } else {
            document.execCommand(command, false, value);
        }
        setText(editorRef.current.innerHTML);
    };

    const handleColorSubmit = (color) => {
        restoreSelection(savedSelection);
        document.execCommand('hiliteColor', false, color);
        setText(editorRef.current.innerHTML);
        setShowColorModal(false);
    };

    const handleTextColorSubmit = (color) => {
        restoreSelection(savedSelection);
        document.execCommand('foreColor', false, color);
        setText(editorRef.current.innerHTML);
        setShowTextColorModal(false);
    };

    const handleLinkSubmit = (linkUrl) => {
        restoreSelection(savedSelection);
        document.execCommand('createLink', false, linkUrl);
        setText(editorRef.current.innerHTML);
        setShowLinkModal(false);
    };

    const handleSave = async () => {
        const plainText = editorRef.current?.innerText || '';
        if (!plainText.trim() && !text.trim()) {
            toast.error('Введите текст');
            return;
        }

        setSaving(true);
        try {
            const content = { style, title, text, url };

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
                    block_type: 'text',
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

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Текст</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-6 space-y-4">
                {/* Preview Card */}
                <div className="bg-card rounded-[12px] border border-border p-3">
                    <div className={`rounded-[12px] p-4 ${isHighlighted ? 'border-2 border-border' : 'bg-transparent'}`}>
                        {title && (
                            <h3 className={`text-lg font-semibold mb-2 text-foreground`}>
                                {title}
                            </h3>
                        )}
                        <div
                            className={`text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap`}
                            dangerouslySetInnerHTML={{ __html: text || 'Введите текст для предпросмотра...' }}
                        />
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-card rounded-[12px] border border-border overflow-hidden">
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setStyle('highlighted')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${style === 'highlighted' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            С выделением
                        </button>
                        <button
                            onClick={() => setStyle('plain')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${style === 'plain' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Без выделения
                        </button>
                    </div>

                    <div className="p-4 border-b border-border">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30"
                            placeholder="Заголовок (необязательно)"
                        />
                    </div>

                    <div className="flex items-center gap-1 px-4 py-3 border-b border-border">
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Жирный"
                        >
                            <Bold className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Курсив"
                        >
                            <Italic className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Подчеркнутый"
                        >
                            <Underline className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('strikeThrough'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Зачеркнутый"
                        >
                            <Strikethrough className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('createLink'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Ссылка"
                        >
                            <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('hiliteColor'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Цвет заливки"
                        >
                            <Highlighter className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('foreColor'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Цвет текста"
                        >
                            <Palette className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat'); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors group"
                            title="Очистить формат"
                        >
                            <Eraser className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                    </div>

                    <div className="px-4 py-1.5 bg-secondary/30 border-b border-border">
                        <p className="text-[10px] text-muted-foreground/60 italic">
                            Выделите текст, чтобы применить форматирование
                        </p>
                    </div>

                    <div className="p-4">
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            onInput={(e) => {
                                const newHtml = e.currentTarget.innerHTML;
                                setText(newHtml);
                            }}
                            onBlur={(e) => {
                                // Sync on blur just in case
                                setText(e.currentTarget.innerHTML);
                            }}
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 min-h-[150px] outline-none editor-content"
                            placeholder="Введите текст..."
                            suppressContentEditableWarning={true}
                        />
                        {/* We use useEffect to set innerHTML only when text changes from outside (e.g. formatting) */}
                        <EditorSync editorRef={editorRef} html={text} />
                        <style>{`
                            .editor-content:empty:before {
                                content: attr(placeholder);
                                color: #6b7280;
                            }
                            .editor-content a, .text-block-content a {
                                text-decoration: underline;
                                color: #60a5fa;
                            }
                            .editor-content p, .editor-content div {
                                margin-bottom: 0.5em;
                                min-height: 1em;
                            }
                        `}</style>
                    </div>

                    <div className="p-4 border-t border-white/5">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 text-sm"
                            placeholder="https://ссылка на весь блок (необязательно)"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-card border border-border text-foreground rounded-[18px] font-bold text-base flex items-center justify-center gap-2 hover:bg-secondary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                    <span className="text-xl">+</span>
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </main>

            {showLinkModal && (
                <LinkModal
                    onClose={() => setShowLinkModal(false)}
                    onSave={handleLinkSubmit}
                />
            )}
            {showColorModal && (
                <ColorModal
                    title="Цвет заливки"
                    onClose={() => setShowColorModal(false)}
                    onSave={handleColorSubmit}
                />
            )}
            {showTextColorModal && (
                <ColorModal
                    title="Цвет текста"
                    onClose={() => setShowTextColorModal(false)}
                    onSave={handleTextColorSubmit}
                />
            )}
        </div>
    );
};

const LinkModal = ({ onClose, onSave }) => {
    const [url, setUrl] = useState('https://');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
            <div className="bg-card border border-border rounded-[20px] p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-foreground text-center">Вставить ссылку</h2>
                <div className="space-y-4">
                    <input
                        type="url"
                        autoFocus
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30"
                        placeholder="https://..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave(url);
                        }}
                    />
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => onSave(url)}
                            className="flex-1 py-3 bg-foreground text-background rounded-[12px] font-bold hover:opacity-90 transition-all shadow-lg"
                        >
                            Вставить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ColorModal = ({ title, onClose, onSave }) => {
    const PRESET_COLORS = [
        '#fef2f2', '#fefce8', '#f0fdf4', '#eff6ff', '#faf5ff', // Light
        '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', // Vivid
        '#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff', // gray
        'transparent'
    ];

    const [customColor, setCustomColor] = useState('#ffffff');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
            <div className="bg-card border border-border rounded-[20px] p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-foreground text-center">{title}</h2>
                <div className="grid grid-cols-5 gap-3 mb-6">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => onSave(color)}
                            className="w-10 h-10 rounded-full border border-border hover:scale-110 active:scale-95 transition-all flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: color }}
                        >
                            {color === 'transparent' && <Eraser className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-12 h-12 bg-transparent border-none outline-none cursor-pointer rounded-xl overflow-hidden"
                    />
                    <button
                        onClick={() => onSave(customColor)}
                        className="flex-1 py-3 bg-foreground text-background rounded-[12px] font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                        Применить
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors text-sm"
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

const EditorSync = ({ editorRef, html }) => {
    React.useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
    }, [html, editorRef]);
    return null;
};

export default TextBlockRenderer;
