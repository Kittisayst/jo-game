import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EventBus } from '../../EventBus';

export interface VirtualTouchControlsProps {
    visible?: boolean;
}

export const VirtualTouchControls: React.FC<VirtualTouchControlsProps> = ({ visible = true }) =>
{
    const [isTouchEnvironment, setIsTouchEnvironment] = useState(false);
    const [activeButtons, setActiveButtons] = useState<{
        left: boolean;
        right: boolean;
        jump: boolean;
        interact: boolean;
        attack: boolean;
        cycle: boolean;
        dash: boolean;
    }>({
        left: false,
        right: false,
        jump: false,
        interact: false,
        attack: false,
        cycle: false,
        dash: false,
    });

    const inputRef = useRef({ left: false, right: false, up: false });

    // Detect touch capability or mobile/tablet viewport
    useEffect(() =>
    {
        const evaluateDevice = () =>
        {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
            setIsTouchEnvironment(hasTouch);
        };

        evaluateDevice();
        window.addEventListener('resize', evaluateDevice);
        return () => window.removeEventListener('resize', evaluateDevice);
    }, []);

    const emitCurrentInputs = useCallback(() =>
    {
        EventBus.emit('virtual-input', {
            left: inputRef.current.left,
            right: inputRef.current.right,
            up: inputRef.current.up,
        });
    }, []);

    // Clean up inputs if component unmounts or visibility turns off
    useEffect(() =>
    {
        if (!visible)
        {
            inputRef.current = { left: false, right: false, up: false };
            setActiveButtons({
                left: false,
                right: false,
                jump: false,
                interact: false,
                attack: false,
                cycle: false,
                dash: false,
            });
            emitCurrentInputs();
        }
    }, [visible, emitCurrentInputs]);

    // Handle blur or losing focus
    useEffect(() =>
    {
        const handleBlur = () =>
        {
            inputRef.current = { left: false, right: false, up: false };
            setActiveButtons({
                left: false,
                right: false,
                jump: false,
                interact: false,
                attack: false,
                cycle: false,
                dash: false,
            });
            emitCurrentInputs();
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [emitCurrentInputs]);

    const triggerHaptic = (ms = 12) =>
    {
        try
        {
            if ('vibrate' in navigator && typeof navigator.vibrate === 'function')
            {
                navigator.vibrate(ms);
            }
        }
        catch
        {
            // Ignore vibrate failures on unsupported browsers
        }
    };

    const handlePointerDown = (
        action: 'left' | 'right' | 'jump',
        e: React.PointerEvent<HTMLButtonElement>,
    ) =>
    {
        e.preventDefault();
        try
        {
            e.currentTarget.setPointerCapture(e.pointerId);
        }
        catch
        {
            // Pointer capture fallback
        }

        triggerHaptic(12);

        if (action === 'jump')
        {
            inputRef.current.up = true;
            setActiveButtons(prev => ({ ...prev, jump: true }));
        }
        else
        {
            inputRef.current[action] = true;
            setActiveButtons(prev => ({ ...prev, [action]: true }));
        }

        emitCurrentInputs();
    };

    const handlePointerUp = (
        action: 'left' | 'right' | 'jump',
        e: React.PointerEvent<HTMLButtonElement>,
    ) =>
    {
        e.preventDefault();
        try
        {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
            {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        }
        catch
        {
            // Ignore capture release error
        }

        if (action === 'jump')
        {
            inputRef.current.up = false;
            setActiveButtons(prev => ({ ...prev, jump: false }));
        }
        else
        {
            inputRef.current[action] = false;
            setActiveButtons(prev => ({ ...prev, [action]: false }));
        }

        emitCurrentInputs();
    };

    const handleInteractTap = (e: React.PointerEvent<HTMLButtonElement>) =>
    {
        e.preventDefault();
        triggerHaptic(18);
        setActiveButtons(prev => ({ ...prev, interact: true }));
        EventBus.emit('virtual-interact');

        setTimeout(() =>
        {
            setActiveButtons(prev => ({ ...prev, interact: false }));
        }, 150);
    };

    const handleAttackTap = (e: React.PointerEvent<HTMLButtonElement>) =>
    {
        e.preventDefault();
        triggerHaptic(20);
        setActiveButtons(prev => ({ ...prev, attack: true }));
        EventBus.emit('virtual-attack');

        setTimeout(() =>
        {
            setActiveButtons(prev => ({ ...prev, attack: false }));
        }, 120);
    };

    const handleCycleWeaponTap = (e: React.PointerEvent<HTMLButtonElement>) =>
    {
        e.preventDefault();
        triggerHaptic(15);
        setActiveButtons(prev => ({ ...prev, cycle: true }));
        EventBus.emit('virtual-cycle-weapon');

        setTimeout(() =>
        {
            setActiveButtons(prev => ({ ...prev, cycle: false }));
        }, 120);
    };

    if (!visible || !isTouchEnvironment)
    {
        return null;
    }

    return (
        <div
            aria-label="Mobile Virtual Touch Controls"
            className="virtual-touch-controls"
            role="region"
        >
            {/* Left D-Pad Controls */}
            <div className="virtual-touch-cluster-left">
                <button
                    aria-label="ໄປຊ້າຍ (Move Left)"
                    className={`virtual-touch-btn virtual-touch-dpad-left ${activeButtons.left ? 'is-active' : ''}`}
                    onPointerCancel={e => handlePointerUp('left', e)}
                    onPointerDown={e => handlePointerDown('left', e)}
                    onPointerLeave={e => handlePointerUp('left', e)}
                    onPointerUp={e => handlePointerUp('left', e)}
                    type="button"
                >
                    <svg
                        fill="none"
                        height="26"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        width="26"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className="virtual-touch-label">ຊ້າຍ</span>
                </button>

                <button
                    aria-label="ໄປຂວາ (Move Right)"
                    className={`virtual-touch-btn virtual-touch-dpad-right ${activeButtons.right ? 'is-active' : ''}`}
                    onPointerCancel={e => handlePointerUp('right', e)}
                    onPointerDown={e => handlePointerDown('right', e)}
                    onPointerLeave={e => handlePointerUp('right', e)}
                    onPointerUp={e => handlePointerUp('right', e)}
                    type="button"
                >
                    <svg
                        fill="none"
                        height="26"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        width="26"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="virtual-touch-label">ຂວາ</span>
                </button>
            </div>

            {/* Right Action Controls: Attack, Cycle, Dash, Talk, Jump */}
            <div className="virtual-touch-cluster-right">
                <button
                    aria-label="ປ່ຽນອາວຸດ (Switch Weapon)"
                    className={`virtual-touch-btn virtual-touch-cycle ${activeButtons.cycle ? 'is-active' : ''}`}
                    onPointerDown={handleCycleWeaponTap}
                    title="Switch Weapon [Q]"
                    type="button"
                >
                    <span className="virtual-touch-icon">🔀</span>
                    <span className="virtual-touch-label">[Q]</span>
                </button>

                <button
                    aria-label="ລົມກັນ ຫຼື ເປີດ (Interact / Talk)"
                    className={`virtual-touch-btn virtual-touch-interact ${activeButtons.interact ? 'is-active' : ''}`}
                    onPointerDown={handleInteractTap}
                    type="button"
                >
                    <span className="virtual-touch-icon">💬</span>
                    <span className="virtual-touch-label">[E]</span>
                </button>

                <button
                    aria-label="ໂຈມຕີ (Attack)"
                    className={`virtual-touch-btn virtual-touch-attack ${activeButtons.attack ? 'is-active' : ''}`}
                    onPointerDown={handleAttackTap}
                    title="Attack [J]"
                    type="button"
                >
                    <span className="virtual-touch-icon">⚔️</span>
                    <span className="virtual-touch-label font-bold">ໂຈມຕີ</span>
                </button>

                <button
                    aria-label="ໂດດ (Jump)"
                    className={`virtual-touch-btn virtual-touch-jump ${activeButtons.jump ? 'is-active' : ''}`}
                    onPointerCancel={e => handlePointerUp('jump', e)}
                    onPointerDown={e => handlePointerDown('jump', e)}
                    onPointerLeave={e => handlePointerUp('jump', e)}
                    onPointerUp={e => handlePointerUp('jump', e)}
                    type="button"
                >
                    <svg
                        fill="none"
                        height="28"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.8"
                        viewBox="0 0 24 24"
                        width="28"
                    >
                        <polyline points="17 11 12 6 7 11" />
                        <polyline points="17 18 12 13 7 18" />
                    </svg>
                    <span className="virtual-touch-label font-bold">ໂດດ</span>
                </button>
            </div>
        </div>
    );
};

export default VirtualTouchControls;
