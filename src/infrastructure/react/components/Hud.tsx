import { formatTime } from '../utils/formatTime';
import { getLevelItem } from '../../phaser/levelCatalog';

export interface HudProps
{
    currentLevel: string;
    lives: number;
    maxLives: number;
    coinsCount: number;
    score: number;
    elapsedSeconds: number;
    highScore: number;
    starTimer: number;
    springTimer: number;
    isGamePaused: boolean;
    bossHp: number | null;
    bossMaxHp: number;
    onTogglePause: () => void;
}

export function Hud ({
    currentLevel,
    lives,
    maxLives,
    coinsCount,
    score,
    elapsedSeconds,
    highScore,
    starTimer,
    springTimer,
    isGamePaused,
    bossHp,
    bossMaxHp,
    onTogglePause,
}: HudProps)
{
    const levelLabel = getLevelItem(currentLevel)?.hudLabel || currentLevel;

    const isVillage = currentLevel === 'village';

    return (
        <>
            <div className="game-hud">
                <div className="hud-badge level-badge">
                    <span className="badge-icon">🚩</span>
                    <span className="badge-label">{levelLabel}</span>
                </div>
                <div className="hud-badge lives-badge">
                    <span className="badge-icon">
                        {'❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, maxLives - lives))}
                    </span>
                </div>

                {!isVillage && (
                    <>
                        <div className="hud-badge coin-badge">
                            <span className="badge-icon">🪙</span>
                            <span className="badge-label">Coins</span>
                            <span className="badge-value">{coinsCount}</span>
                        </div>
                        <div className="hud-badge score-badge">
                            <span className="badge-icon">⭐</span>
                            <span className="badge-label">Score</span>
                            <span className="badge-value">{score}</span>
                        </div>
                        <div className="hud-badge timer-badge">
                            <span className="badge-icon">⏱️</span>
                            <span className="badge-value">{formatTime(elapsedSeconds)}</span>
                        </div>
                        <div className="hud-badge high-score-badge">
                            <span className="badge-icon">🏆</span>
                            <span className="badge-label">Best</span>
                            <span className="badge-value">{highScore}</span>
                        </div>
                    </>
                )}

                {starTimer > 0 && (
                    <div className="hud-badge star-power-badge">
                        <span className="badge-icon">⭐</span>
                        <span className="badge-label">Star</span>
                        <span className="badge-value">{starTimer}s</span>
                    </div>
                )}

                {springTimer > 0 && (
                    <div className="hud-badge spring-power-badge">
                        <span className="badge-icon">⚡</span>
                        <span className="badge-label">Jump+</span>
                        <span className="badge-value">{springTimer}s</span>
                    </div>
                )}

                <button
                    id="hud-menu-btn"
                    className={`hud-badge hud-menu-btn ${isGamePaused ? 'paused-active' : ''}`}
                    onClick={(e) =>
                    {
                        e.preventDefault();
                        e.stopPropagation();
                        onTogglePause();
                    }}
                    title="In-Game Menu & Pause (Esc / P)"
                    type="button"
                >
                    <span className="badge-icon">{isGamePaused ? '▶️' : '⏸️'}</span>
                    <span className="badge-label">{isGamePaused ? 'ສືບຕໍ່' : 'ເມນູ (Menu)'}</span>
                </button>
            </div>

            {(currentLevel === 'level-3' || bossHp !== null) && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">👑 KING SLIME</span>
                        <span className="boss-hp-number">{(bossHp ?? 5)} / {bossMaxHp} HP</span>
                    </div>
                    <div className="boss-hp-bar">
                        <div
                            className="boss-hp-fill"
                            style={{ width: `${Math.max(0, ((bossHp ?? 5) / bossMaxHp) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
