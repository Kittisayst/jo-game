import { useEffect, useState, useRef, useCallback } from 'react';
import { DialogueChoice, DialogueNode } from '../../../domain/entities/Dialogue';
import { soundManager } from '../../audio/SoundManager';

export interface DialogueModalProps
{
    node: DialogueNode | null;
    choices: DialogueChoice[];
    onAdvance: () => void;
    onChoose: (choiceIndex: number) => void;
    onClose: () => void;
}

export function DialogueModal ({
    node,
    choices,
    onAdvance,
    onChoose,
    onClose,
}: DialogueModalProps)
{
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const fullText = node?.line ?? '';
    const timerRef = useRef<number | null>(null);

    // Typewriter effect with retro voice blips
    useEffect(() =>
    {
        if (!fullText)
        {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        setDisplayedText('');
        setIsTyping(true);
        let currentIndex = 0;

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = window.setInterval(() =>
        {
            currentIndex++;
            if (currentIndex <= fullText.length)
            {
                setDisplayedText(fullText.slice(0, currentIndex));
                const char = fullText[currentIndex - 1];
                if (char && char.trim() !== '' && currentIndex % 3 === 0)
                {
                    soundManager.playDialogueBlip();
                }
            }
            else
            {
                if (timerRef.current) clearInterval(timerRef.current);
                setIsTyping(false);
            }
        }, 22);

        return () =>
        {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fullText]);

    const handleBoxClick = useCallback(() =>
    {
        if (isTyping)
        {
            // Complete typewriter text instantly
            if (timerRef.current) clearInterval(timerRef.current);
            setDisplayedText(fullText);
            setIsTyping(false);
        }
        else if (!choices || choices.length === 0)
        {
            soundManager.playSelect();
            onAdvance();
        }
    }, [isTyping, fullText, choices, onAdvance]);

    // Keyboard navigation (Space/Enter/E to advance, 1-9 to select choice, Escape to close)
    useEffect(() =>
    {
        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'Escape')
            {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E')
            {
                e.preventDefault();
                handleBoxClick();
                return;
            }

            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= choices.length)
            {
                e.preventDefault();
                soundManager.playSelect();
                onChoose(num - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleBoxClick, choices, onChoose, onClose]);

    if (!node) return null;

    const portraitSrc = node.speaker.includes('Elder') || node.speaker.includes('ພໍ່ເຖົ້າຄຳ')
        ? 'assets/ui/portrait_elder.png'
        : node.speaker.includes('Mina')
            ? 'assets/ui/portrait_mina.png'
            : null;

    return (
        <div className="dialogue-overlay" onClick={handleBoxClick}>
            <div
                className="dialogue-box"
                onClick={e =>
                {
                    e.stopPropagation();
                    handleBoxClick();
                }}
            >
                {/* Speaker Avatar & Name Header */}
                <div className="dialogue-header">
                    <div className="dialogue-avatar-frame">
                        {portraitSrc ? (
                            <img src={portraitSrc} alt="" width={48} height={48} className="pixel-art object-cover" style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <span className="dialogue-avatar">{node.avatar || '💬'}</span>
                        )}
                    </div>
                    <div className="dialogue-speaker-wrap">
                        <span className="dialogue-speaker-name">{node.speaker}</span>
                        <span className="dialogue-speaker-sub">ໝູ່ບ້ານໄຊເບີ (Cyber Village)</span>
                    </div>
                    <button
                        aria-label="Close Dialogue"
                        className="skin-close-btn dialogue-close-btn"
                        onClick={e =>
                        {
                            e.stopPropagation();
                            onClose();
                        }}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Dialogue Text Content with Typewriter */}
                <div className="dialogue-body">
                    <p className="dialogue-text">
                        {displayedText}
                        {isTyping && <span className="dialogue-cursor">▌</span>}
                    </p>
                </div>

                {/* Choices or Advance Prompt */}
                {choices.length > 0 && !isTyping ? (
                    <div className="dialogue-choices-list">
                        {choices.map((choice, idx) => (
                            <button
                                key={idx}
                                autoFocus={idx === 0}
                                className="dialogue-choice-btn"
                                onClick={e =>
                                {
                                    e.stopPropagation();
                                    soundManager.playSelect();
                                    onChoose(idx);
                                }}
                                type="button"
                            >
                                <span className="choice-number-badge">[{idx + 1}]</span>
                                <span className="choice-text">{choice.text}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="dialogue-footer-hint">
                        <span>ກົດ [Space], [E] ຫຼື ແຕະເພື່ອຕໍ່ໄປ ➔</span>
                    </div>
                )}
            </div>
        </div>
    );
}
