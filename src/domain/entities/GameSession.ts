import { Score } from './Score';
import { Lives } from './Lives';
import { PowerUpState } from './PowerUp';

export interface GameSessionSnapshot
{
    score: number;
    lives: number;
    maxLives: number;
    coins: number;
    levelId: string;
    elapsedSeconds: number;
    elapsedMs: number;
    isGameOver: boolean;
    starActive: boolean;
    starSeconds: number;
    springActive: boolean;
    springSeconds: number;
}

/**
 * Domain entity representing an active gameplay session across levels.
 * Aggregate root consolidating Score, Lives, PowerUpState, Coins, and Speedrun time.
 * Pure business logic (no Phaser, no DOM, no storage) — see "Domain layer" in CONTEXT.md.
 */
export class GameSession
{
    readonly score: Score;
    readonly lives: Lives;
    readonly powerUps: PowerUpState;

    private _coins: number = 0;
    private _levelId: string;
    private _elapsedMs: number = 0;

    constructor (
        initialLevelId = 'level-1',
        initialScore = 0,
        initialLives = 3,
        initialCoins = 0,
        initialElapsedMs = 0
    )
    {
        this._levelId = initialLevelId;
        this.score = new Score(initialScore);
        this.lives = new Lives(initialLives, 3);
        this._coins = Math.max(0, initialCoins);
        this._elapsedMs = Math.max(0, initialElapsedMs);
        this.powerUps = new PowerUpState();
    }

    get levelId (): string
    {
        return this._levelId;
    }

    setLevelId (levelId: string): void
    {
        this._levelId = levelId;
    }

    get coins (): number
    {
        return this._coins;
    }

    addCoin (amount = 1): number
    {
        if (amount > 0)
        {
            this._coins += amount;
        }
        return this._coins;
    }

    get elapsedMs (): number
    {
        return this._elapsedMs;
    }

    get elapsedSeconds (): number
    {
        return +(this._elapsedMs / 1000).toFixed(1);
    }

    get isGameOver (): boolean
    {
        return this.lives.isDead;
    }

    tick (deltaMs: number): {
        elapsedSeconds: number;
        starExpired: boolean;
        springExpired: boolean;
    }
    {
        if (deltaMs > 0 && !this.isGameOver)
        {
            this._elapsedMs += deltaMs;
        }

        const { starExpired, springExpired } = this.powerUps.tick(deltaMs);

        return {
            elapsedSeconds: this.elapsedSeconds,
            starExpired,
            springExpired,
        };
    }

    resetRun (levelId = 'level-1'): void
    {
        this._levelId = levelId;
        this.score.reset();
        this.lives.reset();
        this._coins = 0;
        this._elapsedMs = 0;
        this.powerUps.reset();
    }

    resetLevel (levelId = this._levelId): void
    {
        this._levelId = levelId;
        this.powerUps.reset();
    }

    getSnapshot (): GameSessionSnapshot
    {
        return {
            score: this.score.value,
            lives: this.lives.current,
            maxLives: this.lives.max,
            coins: this._coins,
            levelId: this._levelId,
            elapsedSeconds: this.elapsedSeconds,
            elapsedMs: this._elapsedMs,
            isGameOver: this.isGameOver,
            starActive: this.powerUps.isStarActive,
            starSeconds: this.powerUps.starRemainingSeconds,
            springActive: this.powerUps.isSpringActive,
            springSeconds: this.powerUps.springRemainingSeconds,
        };
    }
}
