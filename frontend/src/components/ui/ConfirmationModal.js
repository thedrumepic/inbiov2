import React, { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Подтвердите действие",
    message = "Вы уверены, что хотите это сделать?",
    confirmText = "Удалить",
    cancelText = "Отмена",
    variant = "danger" // danger, primary, success
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, isSubmitting]);

    // Сброс состояния при повторном открытии
    useEffect(() => {
        if (isOpen) setIsSubmitting(false);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm();
        } finally {
            // Всегда закрываем модальное окно, даже при ошибке
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={isSubmitting ? undefined : onClose}
        >
            <div
                className="w-full max-w-sm bg-card border border-border rounded-[12px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : variant === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-foreground/10 text-foreground'}`}>
                            {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="p-4 bg-foreground/5 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-[12px] text-foreground font-medium bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`flex-1 py-3 px-4 rounded-[12px] text-background font-bold transition-colors disabled:opacity-70 ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : variant === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-foreground hover:bg-foreground/90'
                            }`}
                    >
                        {isSubmitting ? 'Выполняется...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
