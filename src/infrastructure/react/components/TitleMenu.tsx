import { useEffect, useMemo, useRef, useState } from 'react';

export interface TitleMenuProps
{
    walletBalance?: number;
    /** True once the player has done anything: the first item then reads "Continue" and "New Game" appears. */
    hasProgress?: boolean;
    /** True while a screen opened from this menu (settings, skins, stage map) is on top; keys are ignored then. */
    isBlocked?: boolean;
    onStartGame: (stageKey?: string) => void;
    onNewGame: () => void;
    onOpenStageSelect: () => void;
    onOpenSettings: () => void;
}

interface MenuItem
{
    id: string;
    icon: string;
    label: string;
    hint: string;
    primary?: boolean;
    action: () => void;
}

const MOTE_COUNT = 26;

/** Floating specks of light, laid out once so the title does not jump when it re-renders. */
function makeMotes ()
{
    return Array.from({ length: MOTE_COUNT }, (_, i) =>
    {
        const seed = (n: number) => Math.abs(Math.sin((i + 1) * n)) % 1;
        return {
            left: `${Math.round(seed(12.9898) * 100)}%`,
            size: 3 + Math.round(seed(78.233) * 5),
            duration: 11 + Math.round(seed(37.719) * 14),
            delay: -Math.round(seed(4.1414) * 24),
            warm: seed(9.1) > 0.35,
        };
    });
}

/**
 * The start screen: a full-screen picture with the game's name and a list of choices, like
 * most games. Up/Down (or W/S) moves, Enter confirms, and the mouse works as usual.
 */
export function TitleMenu ({
    walletBalance = 0,
    hasProgress = false,
    isBlocked = false,
    onStartGame,
    onNewGame,
    onOpenStageSelect,
    onOpenSettings,
}: TitleMenuProps)
{
    const items: MenuItem[] = [
        {
            id: 'btn-play-game',
            icon: '▶',
            label: hasProgress ? 'ສືບຕໍ່ເກມ (Continue)' : 'ເຂົ້າເກມ (Play Game)',
            hint: hasProgress
                ? 'ກັບຄືນໝູ່ບ້ານ ແລະເດີນທາງຕໍ່ຈາກຈຸດທີ່ບັນທຶກໄວ້'
                : 'ເລີ່ມທີ່ໝູ່ບ້ານປັນຍາ: ຊື້ປຶ້ມ ອ່ານ ແລ້ວສອບເພື່ອປົດລັອກສູດສ້າງອາວຸດ',
            primary: true,
            action: () => onStartGame('village'),
        },
        ...(hasProgress
            ? [{
                id: 'menu-new-game-btn',
                icon: '✦',
                label: 'ເກມໃໝ່ (New Game)',
                hint: 'ເລີ່ມໃໝ່ທັງໝົດ ຄວາມຄືບໜ້າໃນຊ່ອງ Save ນີ້ຈະຖືກລຶບ',
                action: onNewGame,
            }]
            : []),
        {
            id: 'menu-stage-select-btn',
            icon: '⚑',
            label: 'ເລືອກດ່ານ (Stage Map)',
            hint: 'ເປີດແຜນທີ່ ແລະເລືອກດ່ານທີ່ປົດລັອກແລ້ວ',
            action: onOpenStageSelect,
        },
        {
            id: 'menu-settings-btn',
            icon: '⚙',
            label: 'ຕັ້ງຄ່າ & Save (Settings)',
            hint: 'ສຽງ, Save/Load 3 ຊ່ອງ ແລະການນຳເຂົ້າ/ສົ່ງອອກ',
            action: onOpenSettings,
        },
    ];

    const [selected, setSelected] = useState(0);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const motes = useMemo(makeMotes, []);

    // Keep the highlighted item the focused one, so Enter and Space use the browser's own button handling
    useEffect(() =>
    {
        if (!isBlocked) buttonRefs.current[selected]?.focus({ preventScroll: true });
    }, [selected, isBlocked, items.length]);

    useEffect(() =>
    {
        const onKeyDown = (e: KeyboardEvent) =>
        {
            if (isBlocked) return;

            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')
            {
                e.preventDefault();
                setSelected(prev => (prev + 1) % items.length);
            }
            else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')
            {
                e.preventDefault();
                setSelected(prev => (prev - 1 + items.length) % items.length);
            }
            else if (e.key === 'Enter' && document.activeElement === document.body)
            {
                // Focus was lost (for example after closing a screen): Enter still confirms
                e.preventDefault();
                items[Math.min(selected, items.length - 1)].action();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    const current = items[Math.min(selected, items.length - 1)];

    return (
        <div className="title-screen" role="dialog" aria-modal="true" aria-label="Main Menu">
            <div className="title-bg" aria-hidden="true" />
            <div className="title-shade" aria-hidden="true" />
            <div className="title-motes" aria-hidden="true">
                {motes.map((m, i) => (
                    <span
                        key={i}
                        className={`title-mote ${m.warm ? 'warm' : 'cool'}`}
                        style={{
                            left: m.left,
                            width: m.size,
                            height: m.size,
                            animationDuration: `${m.duration}s`,
                            animationDelay: `${m.delay}s`,
                        }}
                    />
                ))}
            </div>

            <div className="title-credit" title="Credit ຂອງເຈົ້າ">
                <span className="title-credit-label">🎓 Credit</span>
                <strong>{walletBalance}</strong>
            </div>

            <main className="title-content">
                <header className="title-logo">
                    <span className="title-eyebrow">
                        <img src="assets/ui/logo_crest.png" alt="" width={36} height={36} className="pixel-art" />
                        <span>KNOWLEDGE QUEST</span>
                    </span>
                    <h1 className="title-name">ພະຈົນໄພຄວາມຮູ້</h1>
                    <p className="title-tagline">ຮຽນຮູ້ · ສ້າງ · ສຳຫຼວດ · ກັບບ້ານ</p>
                </header>

                <nav className="title-menu" aria-label="Menu">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            id={item.id}
                            ref={el => { buttonRefs.current[index] = el; }}
                            className={`title-menu-item${index === selected ? ' is-selected' : ''}${item.primary ? ' is-primary' : ''}`}
                            style={{ ['--i' as string]: index } as React.CSSProperties}
                            onClick={item.action}
                            onMouseEnter={() => setSelected(index)}
                            onFocus={() => setSelected(index)}
                            type="button"
                        >
                            <span className="title-menu-icon" aria-hidden="true">{item.icon}</span>
                            <span className="title-menu-label">{item.label}</span>
                            <span className="title-menu-arrow" aria-hidden="true">▸</span>
                        </button>
                    ))}
                </nav>

                <p className="title-hint" aria-live="polite">{current.hint}</p>
            </main>

            <footer className="title-footer">
                <span><kbd>↑</kbd><kbd>↓</kbd> ເລືອກ</span>
                <span><kbd>Enter</kbd> ຢືນຢັນ</span>
                <span className="title-footer-game">ໃນເກມ: <kbd>A</kbd><kbd>D</kbd> ຍ່າງ · <kbd>Space</kbd> ໂດດ · <kbd>J</kbd> ຟັນ · <kbd>E</kbd> ໂຕ້ຕອບ</span>
            </footer>
        </div>
    );
}
