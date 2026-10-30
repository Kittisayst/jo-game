/**
 * Ports — interfaces the domain needs from the outside world (persistence).
 * Infrastructure supplies the concrete implementations; the domain never knows which.
 * See "Port" in CONTEXT.md.
 */

export interface SkinPort
{
    loadActiveSkinId(): string | null;
    saveActiveSkinId(skinId: string): void;
    clear(): void;
}

export interface SettingsData
{
    soundMuted: boolean;
    musicMuted: boolean;
}

export interface SettingsPort
{
    load(): SettingsData;
    save(data: SettingsData): void;
    clear(): void;
}

export interface StageProgressionData
{
    unlockedStages: string[];
    completedStages: string[];
    /** Stages whose end-of-Stage question has paid its Credit; missing in older saves. */
    questionRewardedStages?: string[];
}

export interface StageProgressionPort
{
    load(): StageProgressionData;
    save(data: StageProgressionData): void;
    clear(): void;
}

/** Which save slot the player is using, and wiping one. */
export interface SavePort
{
    getActiveSlot(): string;
    clearSlot(slotId: string): void;
}

/** The current time in milliseconds (real time). A fake in tests makes growth and waiting predictable. */
export interface Clock
{
    now(): number;
}

/** A random number in [0, 1). A fake in tests makes drops predictable. */
export interface Random
{
    next(): number;
}
