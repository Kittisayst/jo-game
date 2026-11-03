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
    subtitle,
    tabs,
    activeTab,
    onTabChange,
    leftPage,
    rightPage,
    footer,
    maxWidth = 'max-w-4xl',
    className = '',
    dataTestId,
    windowTestId,
}) => {
    useEffect(() => {
        if (!isOpen) return;
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
                className={`gw-window book-window relative w-full ${maxWidth} flex flex-col max-h-[92vh] ${className}`}
                data-testid={windowTestId || dataTestId}
            >
                {/* 4 Brass Corners */}
                <BrassCorner className="book-corner-tl" rotate={0} />
                <BrassCorner className="book-corner-tr" rotate={90} />
                <BrassCorner className="book-corner-bl" rotate={270} />
                <BrassCorner className="book-corner-br" rotate={180} />

                {/* Book Header Bar */}
                <div className="gw-header flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 bg-[#1e1008] border-b-2 border-[#78350f]">
                    <div className="flex items-center gap-2.5">
                        <span className="gw-icon text-2xl sm:text-3xl filter drop-shadow">{icon}</span>
                        <div>
                            <h2 className="text-base sm:text-xl font-bold text-amber-200 tracking-wide flex items-center gap-2">
                                <span>{title}</span>
                            </h2>
                            {subtitle && (
                                <p className="gw-subtitle text-xs text-amber-100/70">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            soundManager.playSelect();
                            onClose();
                        }}
                        className="gw-close rounded-xl p-2 text-amber-200/70 hover:text-amber-100 hover:bg-amber-950/60 transition"
                        title="ປິດ (Escape)"
                    >
                        ✕
                    </button>
                </div>

                {/* Bookmark Ribbon Tabs */}
                {tabs && tabs.length > 0 && (
                    <div className="gw-tabs book-tabs-container">
                        {tabs.map(tab => {
                            const isActive = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    data-testid={tab.testId}
                                    disabled={tab.disabled}
                                    onClick={() => {
                                        if (tab.disabled) return;
                                        soundManager.playSelect();
                                        onTabChange?.(tab.id);
                                    }}
                                    className={`book-ribbon-tab ${isActive ? 'book-ribbon-tab-active' : ''} ${
                                        tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {tab.icon && <span>{tab.icon}</span>}
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200 font-mono">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Dual-Page Parchment Spread */}
                <div className="gw-body book-spread flex-1">
                    <div className="book-page book-page-left">
                        {leftPage}
                    </div>
                    <div className="book-spine" />
                    <div className="book-page book-page-right">
                        {rightPage}
                    </div>
                </div>

                {/* Book Footer */}
                {footer && (
                    <div className="gw-footer px-4 sm:px-6 py-2.5 bg-[#1e1008] border-t-2 border-[#78350f] flex items-center justify-between text-xs text-[#d6c7a7]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

