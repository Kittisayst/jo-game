import React, { useEffect } from 'react';
import { soundManager } from '../../../audio/SoundManager';

export interface BookTabItem {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
    disabled?: boolean;
    testId?: string;
}

export interface BookFrameProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: string;
    subtitle?: string;
    tabs?: BookTabItem[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    leftPage: React.ReactNode;
    rightPage: React.ReactNode;
    tabExtra?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    className?: string;
    dataTestId?: string;
    windowTestId?: string;
}

const BrassCorner: React.FC<{ className?: string; rotate?: number }> = ({ className, rotate = 0 }) => (
    <svg
        className={className}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: `rotate(${rotate}deg)` }}
    >
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
        <path d="M2 2 L30 2 L30 6 L6 6 L6 30 L2 30 Z" fill="#fbbf24" opacity="0.8" />
        <circle cx="4" cy="4" r="1.5" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
        <circle cx="20" cy="4" r="1.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
        <circle cx="4" cy="20" r="1.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
    </svg>
);

export const BookFrame: React.FC<BookFrameProps> = ({
    isOpen,
    onClose,
    title,
    icon = '📖',
    tabs,
    activeTab,
    onTabChange,
    leftPage,
    rightPage,
    tabExtra,
    maxWidth = 'max-w-4xl',
    className = '',
    dataTestId,
    windowTestId,
}) => {
    useEffect(() => {
        if (!isOpen) return;
        soundManager.playPageTurn();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                soundManager.playSelect();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="gw-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in"
            data-testid={dataTestId}
        >
            <div
                className={`gw-window book-window relative w-full ${maxWidth} flex flex-col max-h-[96vh] h-[92vh] ${className}`}
                data-testid={windowTestId}
            >
                {/* 4 Brass Corners */}
                <BrassCorner className="book-corner-tl" rotate={0} />
                <BrassCorner className="book-corner-tr" rotate={90} />
                <BrassCorner className="book-corner-bl" rotate={270} />
                <BrassCorner className="book-corner-br" rotate={180} />

                {/* Top Bookmark Ribbon Tabs Strip with Close Button on Far-Right */}
                <div className="gw-tabs book-tabs-container">
                    <div className="book-tabs-list">
                        {tabs && tabs.length > 0 ? (
                            tabs.map(tab => {
                                const isActive = tab.id === activeTab;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        data-testid={tab.testId}
                                        disabled={tab.disabled}
                                        onClick={() => {
                                            if (tab.disabled) return;
                                            soundManager.playPageTurn();
                                            onTabChange?.(tab.id);
                                        }}
                                        className={`book-ribbon-tab ${isActive ? 'book-ribbon-tab-active' : ''} ${
                                            tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {tab.icon && <span>{tab.icon}</span>}
                                        <span>{tab.label}</span>
                                        {tab.badge !== undefined && tab.badge !== '' && (
                                            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200 font-mono">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="book-ribbon-tab book-ribbon-tab-active cursor-default select-none">
                                {icon && <span>{icon}</span>}
                                <span>{title}</span>
                            </div>
                        )}
                    </div>

                    {/* Far-Right: Tab Extra (Credit/Balance) & Close Button */}
                    <div className="book-tabs-actions">
                        {tabExtra && <div className="book-tab-extra">{tabExtra}</div>}
                        <button
                            type="button"
                            onClick={() => {
                                soundManager.playSelect();
                                onClose();
                            }}
                            className="gw-close book-close-tab-btn"
                            title="ປິດ (Escape)"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Dual-Page Parchment Spread (Maximized Content Height) */}
                <div className="gw-body book-spread flex-1">
                    <div className="book-page book-page-left book-page-turn">
                        {leftPage}
                    </div>
                    <div className="book-spine" />
                    <div className="book-page book-page-right book-page-turn">
                        {rightPage}
                    </div>
                </div>
            </div>
        </div>
    );
};
