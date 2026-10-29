import { DomainEvents } from '../../domain/DomainEvents';
import {
    PLAYER_DAMAGED_EVENT,
    PLAYER_DIED_EVENT,
} from '../../application/PlayerTakeDamageUseCase';
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
import { EventBus } from '../EventBus';

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

// Title Theme melody (Cyberpunk synth arpeggio, ambient and mysterious)
const TITLE_MELODY = [
    261.63, 0, 392.00, 0, 523.25, 0, 659.25, 0,
    783.99, 659.25, 523.25, 392.00, 440.00, 0, 523.25, 0,
    349.23, 0, 440.00, 0, 523.25, 0, 659.25, 0,
    587.33, 523.25, 440.00, 392.00, 329.63, 0, 392.00, 0,
];

// Title Theme bassline (deep pulsing cyber drone)
const TITLE_BASS = [
    65.41, 65.41, 130.81, 130.81, 65.41, 65.41, 130.81, 130.81,
    87.31, 87.31, 174.61, 174.61, 87.31, 87.31, 174.61, 174.61,
    73.42, 73.42, 146.83, 146.83, 73.42, 73.42, 146.83, 146.83,
    98.00, 98.00, 196.00, 196.00, 65.41, 65.41, 130.81, 0,
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
    private isDucked = false;
    private initialized = false;

    private bgmIntervalId: number | null = null;
    private nextNoteTime = 0;
    private currentStep = 0;
    private currentTheme: 'adventure' | 'boss' | 'title' = 'adventure';
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
            const bgmVolume = this._isMusicMuted ? 0 : (this.isDucked ? 0.012 : 0.045);
            this.bgmGain.gain.setValueAtTime(bgmVolume, this.ctx.currentTime);
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

        DomainEvents.on(PLAYER_DAMAGED_EVENT, () => this.playHurt());
        DomainEvents.on(PLAYER_DIED_EVENT, () =>
        {
            this.stopBgm();
            this.playGameOver();
        });
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
        EventBus.on('dialogue-open-state', (isActive: boolean) => this.setDucked(isActive));
    }

    // --- BGM Engine ---

    startBgm (theme: 'adventure' | 'boss' | 'title' = 'adventure'): void
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
            const isTitle = this.currentTheme === 'title';
            const tempo = isBoss ? 165 : (isTitle ? 120 : 138);
            const secondsPerBeat = 60 / tempo;
            const stepDuration = secondsPerBeat / 4; // 16th notes

            while (this.nextNoteTime < this.ctx.currentTime + 0.18)
            {
                this.playStep(this.currentStep, this.nextNoteTime, this.currentTheme);
                this.nextNoteTime += stepDuration;
                const totalSteps = isBoss
                    ? BOSS_MELODY.length
                    : (isTitle ? TITLE_MELODY.length : ADVENTURE_MELODY.length);
                this.currentStep = (this.currentStep + 1) % totalSteps;
            }
        }, 35);
    }

    private playStep (step: number, time: number, theme: 'adventure' | 'boss' | 'title'): void
    {
        if (!this.ctx || !this.bgmGain) return;

        const isBoss = theme === 'boss';
        const isTitle = theme === 'title';
        const melodyTrack = isBoss ? BOSS_MELODY : (isTitle ? TITLE_MELODY : ADVENTURE_MELODY);
        const bassTrack = isBoss ? BOSS_BASS : (isTitle ? TITLE_BASS : ADVENTURE_BASS);
        const noteDuration = isBoss ? 0.09 : (isTitle ? 0.14 : 0.11);

        // Play melody note if not rest (0)
        const melodyFreq = melodyTrack[step % melodyTrack.length];
        if (melodyFreq > 0)
        {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            osc.type = isBoss ? 'sawtooth' : (isTitle ? 'sine' : 'square');
            osc.frequency.setValueAtTime(melodyFreq, time);

            noteGain.gain.setValueAtTime(isTitle ? 0.28 : 0.35, time);
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

            bassOsc.type = isTitle ? 'sine' : 'triangle';
            bassOsc.frequency.setValueAtTime(bassFreq, time);

            bassGain.gain.setValueAtTime(isTitle ? 0.4 : 0.5, time);
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
            const targetVolume = this._isMusicMuted ? 0 : (this.isDucked ? 0.012 : 0.045);
            this.bgmGain.gain.setValueAtTime(targetVolume, this.ctx.currentTime);
        }
    }

    /**
     * Duck BGM volume when dialogue or cutscenes are active (sidechain audio ducking)
     */
    setDucked (ducked: boolean): void
    {
        this.isDucked = ducked;
        if (this.bgmGain && this.ctx && !this._isMusicMuted)
        {
            const targetVolume = ducked ? 0.012 : 0.045;
            const now = this.ctx.currentTime;
            this.bgmGain.gain.cancelScheduledValues(now);
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
            this.bgmGain.gain.linearRampToValueAtTime(targetVolume, now + (ducked ? 0.15 : 0.4));
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
     * Game Start Fanfare / Warp Sound: ascending retro chime sweep
     */
    playGameStart (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            const start = now + idx * 0.055;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.04, start + 0.14);

            gain.gain.setValueAtTime(0.22, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(start);
            osc.stop(start + 0.18);
        });
    }

    /**
     * Jump Sound: rising pitch sweep with subtle organic pitch randomization
     */
    playJump (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const pitchFactor = 1 + (Math.random() - 0.5) * 0.08;
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 * pitchFactor, now);
        osc.frequency.exponentialRampToValueAtTime(400 * pitchFactor, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Coin Sound: classic 2-tone ping with harmonic pitch variation
     */
    playCoin (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const pitchFactor = 1 + (Math.random() - 0.5) * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77 * pitchFactor, now);
        osc.frequency.setValueAtTime(1318.51 * pitchFactor, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    /**
     * Footstep Sound: gentle soft pat with pitch randomization
     */
    playFootstep (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        const baseFreq = 120 + (Math.random() - 0.5) * 30;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.035);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);

        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(filter);
        filter.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.035);
    }

    /**
     * Landing Sound: low punchy thud with exponential sweep
     */
    playLand (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    /**
     * Dialogue Text Blip: cute retro speech chirp with organic pitch jitter
     */
    playDialogueBlip (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const pitch = 360 + (Math.random() - 0.5) * 50;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.15, now + 0.022);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.022);
    }

    /**
     * UI Select Sound: bright rising selection chime
     */
    playSelect (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.06);
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

    /**
     * Weapon Slash Sound: crisp blade cutting through air
     */
    playSlash (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Blaster Fire Sound: laser pew shot
     */

    /**
     * Thunder Hammer Impact: heavy bass shockwave
     */

    /**
     * Cyber Disc Whirr: high spinning metallic oscillation
     */

    /**
     * Dash Sound: quick air-burst whoosh
     */

    /**
     * Shop Purchase Sound: double coin chime of success
     */
    playBuy (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [659.25, 987.77];
        notes.forEach((freq, idx) =>
        {
            if (!this.ctx) return;
            const startTime = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(startTime);
            osc.stop(startTime + 0.18);
        });
    }

    /**
     * Use Consumable Item Sound: celestial sparkle shimmer
     */

    /**
     * Bomb Explosion Sound: deep rumble punch
     */

    /**
     * Toxic Slime Spit Sound: rapid pitch-bending acid squirt
     */
    playSpit (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    /**
     * Armored Slime Metallic Clink Sound: bright steel deflection ping
     */
    playClink (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Dual high-pitch strike for metallic ping resonance
        const freqs = [1850, 2480];
        freqs.forEach((freq) =>
        {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.12);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            this.connectOutput(gain);

            osc.start(now);
            osc.stop(now + 0.12);
        });
    }

    /**
     * Flying Drone Slime Flutter Sound: high electronic hover flutter
     */
    playDroneBuzz (): void
    {
        if (this._isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(420, now + 0.05);
        osc.frequency.linearRampToValueAtTime(320, now + 0.10);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

        osc.connect(gain);
        this.connectOutput(gain);

        osc.start(now);
        osc.stop(now + 0.10);
    }
}

export const soundManager = new SoundManager();
