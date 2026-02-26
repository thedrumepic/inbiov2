import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md space-y-8 fade-in">
                {/* Logo Section */}
                <div className="flex justify-center mb-4">
                    <Logo size="xl" />
                </div>

                {/* 404 Text */}
                <div className="space-y-4">
                    <h1 className="text-8xl font-black tracking-tighter text-foreground/10 select-none">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-foreground">
                        Страница не найдена
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        К сожалению, запрашиваемая страница не существует или была перемещена.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Назад
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-foreground text-background font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        На главную
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
