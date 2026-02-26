import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { Check, Paintbrush } from 'lucide-react';

const PRESET_COLORS = [
    '#000000', '#FFFFFF', '#FF00A2', '#00FF9D', '#AF66FF',
    '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1',
    '#14B8A6', '#8B5CF6', '#EC4899', '#94A3B8', '#1E293B'
];

export const ColorPicker = ({ color, onChange, className }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "relative flex items-center gap-3 bg-secondary border border-border rounded-[18px] px-4 py-3.5 h-[52px] w-full hover:border-primary/40 transition-all group",
                        className
                    )}
                >
                    <div
                        className="w-8 h-8 rounded-lg border border-black/5 dark:border-white/10 shadow-sm shrink-0"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-foreground uppercase tracking-wider">{color}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 bg-card border border-border rounded-[24px] shadow-2xl z-[100]" align="start">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Пресеты</p>
                    <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => onChange(c)}
                                className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center group relative hover:scale-110 active:scale-95 transition-all"
                                style={{ backgroundColor: c }}
                            >
                                {color.toUpperCase() === c.toUpperCase() && (
                                    <Check className={cn("w-4 h-4", (c === '#FFFFFF' || c === '#94A3B8') ? "text-black" : "text-white")} />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Свой цвет</p>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-secondary border border-border rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-primary/40 transition-all"
                                />
                                <Paintbrush className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                            </div>
                            <div className="w-10 h-8 rounded-lg overflow-hidden border border-border bg-secondary relative">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="absolute -inset-2 w-[150%] h-[150%] bg-transparent cursor-pointer border-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
