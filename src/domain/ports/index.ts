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
}

export interface StageProgressionPort
{
    load(): StageProgressionData;
    save(data: StageProgressionData): void;
    clear(): void;
}

