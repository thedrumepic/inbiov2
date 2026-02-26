import React, { useState, useEffect } from 'react';
import { Timer, X, ArrowLeft } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { api } from '@/utils/api';

export const CountdownBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [data, setData] = useState({
        title: block?.content?.title || '',
        targetDate: block?.content?.targetDate || '',
        completionText: block?.content?.completionText || 'Событие наступило!',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Если это редактирование существующего блока, инициализируем данные
    useEffect(() => {
        if (block && block.content) {
            setData({
                title: block.content.title || '',
                targetDate: block.content.targetDate || '',
                completionText: block.content.completionText || 'Событие наступило!',
            });
        }
    }, [block]);

    const handleSubmit = async () => {
        setError('');

        if (!data.targetDate) {
            setError('Выберите дату и время');
            return;
        }

        setLoading(true);
        try {
            let response;

            if (block) {
                response = await api.updateBlock(block.id, {
                    content: data
                });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'countdown',
                    content: data,
                    order: blocksCount
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
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold text-foreground">Таймер</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-8 space-y-8">
                {/* Helper Text */}


                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Заголовок</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all font-medium"
                            placeholder="До события осталось..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Дата и время окончания</label>
                        <DateTimePicker
                            date={data.targetDate}
                            setDate={(date) => setData({ ...data, targetDate: date ? date.toISOString() : '' })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Текст после завершения</label>
                        <input
                            type="text"
                            value={data.completionText}
                            onChange={(e) => setData({ ...data, completionText: e.target.value })}
                            className="w-full px-5 py-4 bg-secondary border border-border rounded-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all font-medium"
                            placeholder="Событие началось!"
                        />
                    </div>
                </div>

                {/* Preview */}
                <div className="pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-4 ml-1">Предпросмотр</p>
                    <CountdownBlockRenderer block={{ content: data }} />
                </div>


                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[18px] text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-foreground text-background rounded-[20px] font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
                >
                    {loading ? 'Сохранение...' : (block ? 'Обновить таймер' : 'Создать таймер')}
                </button>
            </main>
        </div>
    );
};

export const CountdownBlockRenderer = ({ block }) => {
    const { title, targetDate, completionText } = block.content;
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();

        if (difference <= 0) {
            return null;
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // Prevent hydration mismatch
    if (!isClient) return null;

    if (!timeLeft) {
        return (
            <div className="w-full p-6 bg-card border border-border rounded-[24px] text-center shadow-sm">
                <h3 className="font-bold text-xl text-foreground mb-2">{title}</h3>
                <p className="text-lg text-primary font-medium">{completionText || 'Событие завершено'}</p>
            </div>
        );
    }

    return (
        <div className="w-full p-5 bg-card border border-border rounded-[24px] text-center shadow-sm relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            {title && <h3 className="font-medium text-foreground/80 mb-4 text-sm uppercase tracking-wider">{title}</h3>}

            <div className="grid grid-cols-4 gap-2">
                <TimeUnit value={timeLeft.days} label="Дней" />
                <TimeUnit value={timeLeft.hours} label="Часов" />
                <TimeUnit value={timeLeft.minutes} label="Минут" />
                <TimeUnit value={timeLeft.seconds} label="Секунд" />
            </div>
        </div>
    );
};

const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-[16px] border border-transparent">
        <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono leading-none mb-1">
            {value.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            {label}
        </span>
    </div>
);
