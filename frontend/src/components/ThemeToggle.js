import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Tooltip } from './ui/Tooltip';

export const ThemeToggle = ({ value, onChange }) => {
    const isControlled = value !== undefined && onChange !== undefined;
    const [localTheme, setLocalTheme] = useState('dark');

    const currentTheme = isControlled ? value : localTheme;

    const applyClass = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        if (!isControlled) {
            const saved = localStorage.getItem('admin_theme');
            const initial = saved || 'dark';
            setLocalTheme(initial);
            applyClass(initial);
        } else {
            applyClass(value);
        }
    }, [isControlled, value]);

    const cycleTheme = () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

        if (isControlled) {
            onChange(nextTheme);
        } else {
            setLocalTheme(nextTheme);
            localStorage.setItem('admin_theme', nextTheme);
            applyClass(nextTheme);
        }
    };

    const getIcon = () => {
        return currentTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
    };

    const getTooltip = () => {
        return currentTheme === 'dark' ? 'Темная тема' : 'Светлая тема';
    };

    return (
        <Tooltip content={getTooltip()}>
            <button
                onClick={cycleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
            >
                {getIcon()}
            </button>
        </Tooltip>
    );
};
