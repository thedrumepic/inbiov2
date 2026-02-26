import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';

const HEIGHT_OPTIONS = [
    { value: 8, label: '8px' },
    { value: 16, label: '16px' },
    { value: 32, label: '32px' },
];

export const DividerBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [dividerType, setDividerType] = useState(block?.content?.dividerType || 'space');
    const [height, setHeight] = useState(block?.content?.height || 32);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const content = { dividerType, height };
            let response;
            if (block) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'divider',
                    content,
                    order: blocksCount,
                });
            }

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await response.json();
                setError(err.detail || 'Ошибка сохранения');
            }
        } catch (err) {
            setError('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Разделитель</h1>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto w-full p-4 space-y-6">
                {/* Preview */}
                <div className="p-4 bg-card border border-border rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-3 text-center">Предпросмотр</p>
                    <DividerBlockRenderer block={{ content: { dividerType, height } }} />
                </div>

                {/* Type toggle */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground ml-1">Тип</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDividerType('space')}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${dividerType === 'space'
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-secondary/50 text-foreground border-border hover:border-foreground/30'
                                }`}
                        >
                            Пустое пространство
                        </button>
                        <button
                            onClick={() => setDividerType('line')}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${dividerType === 'line'
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-secondary/50 text-foreground border-border hover:border-foreground/30'
                                }`}
                        >
                            Линия
                        </button>
                    </div>
                </div>

                {/* Height selector */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground ml-1">Высота</label>
                    <div className="grid grid-cols-3 gap-2">
                        {HEIGHT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setHeight(opt.value)}
                                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${height === opt.value
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-secondary/50 text-foreground border-border hover:border-foreground/30'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Сохранение...' : (block ? 'Обновить' : 'Добавить блок')}
                </button>
            </main>
        </div>
    );
};

export const DividerBlockRenderer = ({ block }) => {
    const { dividerType = 'space', height = 32 } = block.content || {};

    if (dividerType === 'line') {
        return (
            <div className="flex items-center" style={{ height }}>
                <div className="w-full mx-4 border-t border-black/[0.08] dark:border-white/[0.1]" />
            </div>
        );
    }

    // Space type
    return <div style={{ height }} />;
};
