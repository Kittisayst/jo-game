import { DomainEvents } from '../../domain/DomainEvents';
import { LEVEL_COMPLETE_EVENT } from '../../application/CompleteLevelUseCase';
import { COIN_COLLECTED_EVENT } from '../../application/CollectCoinUseCase';
import { ENEMY_DEFEATED_EVENT } from '../../application/DefeatEnemyUseCase';
import {
    PLAYER_DAMAGED_EVENT,
    GAME_OVER_EVENT,
} from '../../application/PlayerTakeDamageUseCase';
import { POWERUP_COLLECTED_EVENT } from '../../application/CollectPowerUpUseCase';
import {
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
} from '../../application/DamageBossUseCase';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
} from '../../application/TogglePauseUseCase';
import {
    SETTINGS_CHANGED_EVENT,
    SettingsChangedPayload,
} from '../../application/UpdateSettingsUseCase';

// Adventure melody notes (C major energetic 8-bit chiptune)
const ADVENTURE_MELODY = [
    523.25, 0, 659.25, 0, 783.99, 880.00, 783.99, 0,
    659.25, 0, 587.33, 0, 523.25, 659.25, 783.99, 0,
    880.00, 0, 783.99, 0, 659.25, 587.33, 523.25, 0,
    587.33, 0, 659.25, 0, 523.25, 0, 0, 0,
];

// Adventure bassline (driving groove)
const ADVENTURE_BASS = [
    130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 220.00, 196.00,
    174.61, 174.61, 196.00, 196.00, 130.81, 130.81, 196.00, 130.81,
    220.00, 220.00, 196.00, 196.00, 174.61, 174.61, 130.81, 130.81,
    146.83, 146.83, 196.00, 196.00, 130.81, 196.00, 130.81, 0,
];

// Boss Battle melody (D minor syncopated intense battle chiptune)
const BOSS_MELODY = [
    587.33, 698.46, 880.00, 1174.66, 1108.73, 1174.66, 880.00, 698.46,
    830.61, 880.00, 698.46, 587.33, 659.25, 698.46, 659.25, 554.37,
    587.33, 0, 880.00, 0, 1174.66, 0, 1108.73, 0,
    880.00, 830.61, 880.00, 698.46, 587.33, 554.37, 587.33, 0,
];

// Boss Battle driving bass (relentless pulse)
const BOSS_BASS = [
    73.42, 146.83, 73.42, 146.83, 87.31, 174.61, 87.31, 174.61,
    103.83, 207.65, 103.83, 207.65, 110.00, 220.00, 69.30, 138.59,
    73.42, 73.42, 146.83, 146.83, 87.31, 87.31, 174.61, 174.61,
    110.00, 110.00, 103.83, 103.83, 73.42, 146.83, 73.42, 0,
];

/**
 * Procedural retro sound manager built on the browser's Web Audio API.
 * Synthesizes arcade sound effects and 8-bit chiptune background music at runtime.
 * Lives in the infrastructure layer — see CONTEXT.md.
 */
export class SoundManager
{
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private bgmGain: GainNode | null = null;
    private _isMuted = false;
    private _isMusicMuted = false;
    private initialized = false;

    private bgmIntervalId: number | null = null;
    private nextNoteTime = 0;
    private currentStep = 0;
    private currentTheme: 'adventure' | 'boss' = 'adventure';
    private isBgmRunning = false;

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
                if (this.isBgmRunning)
                {
                    this.startBgmLoop();
                }
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
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this._isMuted ? 0 : 1, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this._isMusicMuted ? 0 : 0.045, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);
        }
    }

    private connectOutput (node: AudioNode): void
    {
        if (this.masterGain)
        {
            node.connect(this.masterGain);
        }
        else if (this.ctx)
        {
            node.connect(this.ctx.destination);
        }
    }

    private bindDomainEvents (): void
    {
        if (this.initialized) return;
        this.initialized = true;

        DomainEvents.on(COIN_COLLECTED_EVENT, () => this.playCoin());
        DomainEvents.on(ENEMY_DEFEATED_EVENT, () => this.playStomp());
        DomainEvents.on(PLAYER_DAMAGED_EVENT, () => this.playHurt());
        DomainEvents.on(GAME_OVER_EVENT, () =>
        {
            this.stopBgm();
            this.playGameOver();
        });
        DomainEvents.on(LEVEL_COMPLETE_EVENT, () =>
        {
            this.stopBgm();
            this.playLevelComplete();
        });
        DomainEvents.on(POWERUP_COLLECTED_EVENT, () => this.playPowerUp());
        DomainEvents.on(BOSS_DAMAGED_EVENT, () => this.playBossHit());
        DomainEvents.on(BOSS_DEFEATED_EVENT, () =>
        {
            this.stopBgm();
            this.playBossDefeat();
        });
        DomainEvents.on(GAME_PAUSED_EVENT, () =>
        {
            this.pauseBgm();
            this.playPause();
        });
        DomainEvents.on(GAME_RESUMED_EVENT, () =>
        {
            this.resumeBgm();
            this.playResume();
        });
        DomainEvents.on<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, ({ soundMuted, musicMuted }) =>
        {
            this.setMuted(soundMuted);
            this.setMusicMuted(musicMuted);
        });
    }

    // --- BGM Engine ---

    startBgm (theme: 'adventure' | 'boss' = 'adventure'): void
    {
        this.currentTheme = theme;
        this.isBgmRunning = true;
        this.initContext();

        if (this.ctx && this.ctx.state === 'running')
        {
            this.startBgmLoop();
        }
    }

    stopBgm (): void
    {
        this.isBgmRunning = false;
        if (this.bgmIntervalId !== null)
        {
            window.clearInterval(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }
    }

    pauseBgm (): void
    {
        if (this.bgmIntervalId !== null)
        {
            window.clearInterval(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }
    }

    resumeBgm (): void
    {
        if (!this.isBgmRunning) return;
        this.initContext();
        if (this.ctx && this.ctx.state === 'running')
        {
            this.startBgmLoop();
        }
    }

    private startBgmLoop (): void
    {
        if (!this.ctx) return;
        if (this.bgmIntervalId !== null)
        {
            window.clearInterval(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }

        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.currentStep = 0;

        this.bgmIntervalId = window.setInterval(() =>
        {
            if (!this.ctx || !this.isBgmRunning) return;

            const isBoss = this.currentTheme === 'boss';
            const tempo = isBoss ? 165 : 138;
            const secondsPerBeat = 60 / tempo;
            const stepDuration = secondsPerBeat / 4; // 16th notes

            while (this.nextNoteTime < this.ctx.currentTime + 0.18)
            {
                this.playStep(this.currentStep, this.nextNoteTime, this.currentTheme);
                this.nextNoteTime += stepDuration;
                const totalSteps = isBoss ? BOSS_MELODY.length : ADVENTURE_MELODY.length;
                this.currentStep = (this.currentStep + 1) % totalSteps;
            }
        }, 35);
    }

    private playStep (step: number, time: number, theme: 'adventure' | 'boss'): void
    {
        if (!this.ctx || !this.bgmGain) return;

        const isBoss = theme === 'boss';
        const melodyTrack = isBoss ? BOSS_MELODY : ADVENTURE_MELODY;
        const bassTrack = isBoss ? BOSS_BASS : ADVENTURE_BASS;
        const noteDuration = isBoss ? 0.09 : 0.11;

        // Play melody note if not rest (0)
        const melodyFreq = melodyTrack[step % melodyTrack.length];
        if (melodyFreq > 0)
        {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            osc.type = isBoss ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(melodyFreq, time);

            noteGain.gain.setValueAtTime(0.35, time);
            noteGain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

            osc.connect(noteGain);
            noteGain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + noteDuration);
        }

        // Play bass note
        const bassFreq = bassTrack[step % bassTrack.length];
        if (bassFreq > 0)
        {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();

            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(bassFreq, time);

            bassGain.gain.setValueAtTime(0.5, time);
            bassGain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration * 0.9);

            bassOsc.connect(bassGain);
            bassGain.connect(this.bgmGain);

            bassOsc.start(time);
            bassOsc.stop(time + noteDuration * 0.9);
        }
    }

    get isMusicMuted (): boolean
    {
        return this._isMusicMuted;
    }

    get isMuted (): boolean
    {
        return this._isMuted;
    }

    /** Applied from SETTINGS_CHANGED_EVENT — `Settings` (domain) is the source of truth. */
    setMusicMuted (muted: boolean): void
    {
        this._isMusicMuted = muted;
        if (this.bgmGain && this.ctx)
        {
            this.bgmGain.gain.setValueAtTime(this._isMusicMuted ? 0 : 0.045, this.ctx.currentTime);
        }
    }

    /** Applied from SETTINGS_CHANGED_EVENT — `Settings` (domain) is the source of truth. */
    setMuted (muted: boolean): void
    {
        this._isMuted = muted;
        if (this.masterGain && this.ctx)
        {
            this.masterGain.gain.setValueAtTime(this._isMuted ? 0 : 1, this.ctx.currentTime);
        }
    }

    // --- SFX Synthesizers ---

    /**
     * Power-Up Sound: cheerful 3-tone arpeggio (G5 -> C6 -> E6)
     */
    playPowerUp (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [783.99, 1046.50, 1318.51];
        const step = 0.08;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.16, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + 0.18);
        });
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
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Coin Sound: classic 2-tone ping (B5 -> E6)
     */
    playCoin (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    /**
     * Stomp Sound: descending crunch punch (280Hz -> 80Hz)
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
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    /**
     * Hurt Sound: low distorted impact
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
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Level Complete Sound: triumphant retro fanfare (C5 -> E5 -> G5 -> C6)
     */
    playLevelComplete (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        const step = 0.12;
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const duration = idx === notes.length - 1 ? 0.45 : 0.15;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            this.connectOutput(gain);

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
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    /**
     * Boss Hit Sound: heavy bass rumble impact
     */
    playBossHit (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    /**
     * Boss Defeat Sound: grand victory explosion and fanfare
     */
    playBossDefeat (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        const step = 0.1;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const duration = idx === notes.length - 1 ? 0.6 : 0.16;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    /**
     * Pause Sound: futuristic descending chime
     */
    playPause (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [659.25, 440.00];
        const step = 0.08;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + 0.12);
        });
    }

    /**
     * Resume Sound: cheerful rising chime
     */
    playResume (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [440.00, 659.25];
        const step = 0.08;

        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * step;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + 0.12);
        });
    }
}

export const soundManager = new SoundManager();
