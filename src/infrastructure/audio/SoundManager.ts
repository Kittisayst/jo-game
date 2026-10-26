import { DomainEvents } from '../../domain/DomainEvents';
import { LEVEL_COMPLETE_EVENT } from '../../application/CompleteLevelUseCase';
import { COIN_COLLECTED_EVENT } from '../../application/CollectCoinUseCase';
import { ENEMY_DEFEATED_EVENT } from '../../application/DefeatEnemyUseCase';
import {
    PLAYER_DAMAGED_EVENT,
    GAME_OVER_EVENT,
} from '../../application/PlayerTakeDamageUseCase';

/**
 * Procedural retro sound manager built on the browser's Web Audio API.
 * Synthesizes arcade sound effects at runtime without any external sound assets.
 * Lives in the infrastructure layer — see CONTEXT.md.
 */
export class SoundManager
{
    private ctx: AudioContext | null = null;
    private _isMuted = false;
    private initialized = false;

    constructor ()
    {
        // Subscribe to domain events to trigger relevant sounds automatically
        this.bindDomainEvents();

        // Attach user-gesture listener to unlock AudioContext
        if (typeof window !== 'undefined')
        {
            const unlock = () =>
            {
                this.initContext();
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
            };

            window.addEventListener('pointerdown', unlock, { once: true });
            window.addEventListener('keydown', unlock, { once: true });
        }
    }

    private initContext (): void
    {
        if (this.ctx)
        {
            if (this.ctx.state === 'suspended')
            {
                this.ctx.resume();
            }
            return;
        }

        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioContextClass)
        {
            this.ctx = new AudioContextClass();
        }
    }

    private bindDomainEvents (): void
    {
        if (this.initialized) return;
        this.initialized = true;

        DomainEvents.on(COIN_COLLECTED_EVENT, () => this.playCoin());
        DomainEvents.on(ENEMY_DEFEATED_EVENT, () => this.playStomp());
        DomainEvents.on(PLAYER_DAMAGED_EVENT, () => this.playHurt());
        DomainEvents.on(GAME_OVER_EVENT, () => this.playGameOver());
        DomainEvents.on(LEVEL_COMPLETE_EVENT, () => this.playLevelComplete());
    }

    get isMuted (): boolean
    {
        return this._isMuted;
    }

    toggleMute (): boolean
    {
        this._isMuted = !this._isMuted;
        return this._isMuted;
    }

    setMuted (muted: boolean): void
    {
        this._isMuted = muted;
    }

    /**
     * Jump Sound: rising pitch frequency sweep
     */
    playJump (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.11);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Coin Collect Sound: bright two-tone bell chime (B5 -> E6)
     */
    playCoin (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Note 1 (B5: 987.77 Hz)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now);

        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        // Note 2 (E6: 1318.51 Hz)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, now + 0.08);

        gain2.gain.setValueAtTime(0.15, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.28);
    }

    /**
     * Stomp Sound: punchy downward pop/crunch
     */
    playStomp (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    /**
     * Hurt Sound: crunchy buzz down
     */
    playHurt (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.18);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    /**
     * Level Complete Fanfare: triumphant ascending arpeggio (C5 -> E5 -> G5 -> C6)
     */
    playLevelComplete (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        const step = 0.1;
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const duration = idx === notes.length - 1 ? 0.35 : 0.12;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    /**
     * Game Over Sound: sad descending minor sequence
     */
    playGameOver (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const notes = [349.23, 329.63, 293.66, 261.63];
        const step = 0.18;
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const duration = 0.22;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.14, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }
}

export const soundManager = new SoundManager();
