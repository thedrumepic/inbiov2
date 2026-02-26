import React from 'react';
import { createPortal } from 'react-dom';

export const Tooltip = ({ children, content, side = 'bottom', className = "inline-flex items-center" }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [pos, setPos] = React.useState({ top: 0, left: 0 });
    const targetRef = React.useRef(null);
    const timeoutRef = React.useRef(null);

    const updatePos = React.useCallback(() => {
        if (targetRef.current && isVisible) {
            const rect = targetRef.current.getBoundingClientRect();
            let top, left;

            if (side === 'top') {
                top = rect.top - 8;
                left = rect.left + rect.width / 2;
            } else if (side === 'bottom') {
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
            } else if (side === 'left') {
                top = rect.top + rect.height / 2;
                left = rect.left - 8;
            } else if (side === 'right') {
                top = rect.top + rect.height / 2;
                left = rect.right + 8;
            }

            setPos({ top, left });
        }
    }, [isVisible, side]);

    React.useLayoutEffect(() => {
        updatePos();
    }, [updatePos]);

    React.useEffect(() => {
        if (isVisible) {
            window.addEventListener('resize', updatePos);
            window.addEventListener('scroll', updatePos, true);
        }
        return () => {
            window.removeEventListener('resize', updatePos);
            window.removeEventListener('scroll', updatePos, true);
        };
    }, [isVisible, updatePos]);

    const transformMap = {
        top: 'translate(-50%, -100%)',
        bottom: 'translate(-50%, 0)',
        left: 'translate(-100%, -50%)',
        right: 'translate(0, -50%)'
    };

    // Скрываем tooltip при открытии модальных окон
    React.useEffect(() => {
        const handleModalOpen = () => {
            setIsVisible(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };

        // Слушаем клики по backdrop модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') || e.target.closest('[role="dialog"]')) {
                handleModalOpen();
            }
        });

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        setIsVisible(true);
        // Автоматически скрываем через 2 секунды
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 2000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const handleClick = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={targetRef}
                className={className}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: `${pos.top}px`,
                        left: `${pos.left}px`,
                        transform: transformMap[side],
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}
                    className="px-3 py-2 text-xs font-medium text-foreground bg-popover border border-border rounded-xl shadow-xl min-w-[80px] max-w-[280px] break-words"
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};
