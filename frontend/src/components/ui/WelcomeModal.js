import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

const WelcomeModal = ({ isOpen, onClose, username, duration = 10 }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(duration);
            setCanClose(false);

            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isOpen, duration]);

    // Auto-close when time is up? Or just enable close button?
    // User asked for "temporary modal for 10 seconds", implying it might close itself or be closable after time.
    // Usually "temporary modal" implies auto-close or forced view time. 
    // Let's make it auto-close IF the user didn't interact, BUT providing a close button is better UX after timer.
    // Re-reading: "временную модалку в 10 секунд" -> likely means it shows for 10s then vanishes, OR forces user to wait 10s.
    // Given "Welcome to InBio", it's probably to ensure they read it.

    // Let's implement: It is visible for `duration` seconds. After that, it automatically closes (or user can close it).
    // Better UX: Show timer, auto-close when done.

    useEffect(() => {
        if (timeLeft === 0) {
            // Optional: Auto-close after timer
            // onClose(); 
        }
    }, [timeLeft, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden relative animate-in zoom-in-95 duration-300">

                {/* Progress bar */}
                <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / duration) * 100}%` }} />

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            Добро пожаловать в мир InBio.One!
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" />
                            <span>{timeLeft > 0 ? `${timeLeft} сек` : 'Готово'}</span>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        <p>
                            Спасибо, что выбрали нас для развития своих проектов.
                            Наша система устроена просто и эффективно:
                        </p>

                        <div className="grid gap-3">
                            <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                                <span className="font-semibold text-foreground flex items-center gap-2 mb-1">
                                    Основная страница (Mainpage)
                                </span>
                                Ваша самая первая ссылка — это цифровой паспорт и лицо вашего бренда в соцсетях.
                            </div>

                            <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                                <span className="font-semibold text-foreground flex items-center gap-2 mb-1">
                                    Бренд-страницы (Brands)
                                </span>
                                Все последующие страницы созданы для ваших отдельных проектов: магазинов, музыкальных групп или мероприятий.
                            </div>
                        </div>

                        <p className="pt-2 font-medium text-foreground">
                            С уважением, команда InBio.One
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={!canClose}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${canClose
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-wait opacity-50'
                            }`}
                    >
                        {canClose ? 'Начать работу' : `Ознакомьтесь с информацией (${timeLeft})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
