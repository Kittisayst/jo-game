import {
    SaveGameSnapshot,
    createDefaultSaveSnapshot,
    migrateSaveSnapshot,
} from '../../domain/entities/SaveData';
import {
    readJsonSafe,
    readString,
    removeKey,
    writeJsonAtomic,
    writeString,
} from './safeStorage';

export const SAVE_SLOTS = ['slot_1', 'slot_2', 'slot_3'] as const;
export type SaveSlotId = (typeof SAVE_SLOTS)[number] | 'autosave';

const ACTIVE_SLOT_KEY = 'jo_active_slot_id';
const SLOT_KEY_PREFIX = 'jo_save_';

export interface SlotMetadata
{
    slotId: SaveSlotId;
    label: string;
    exists: boolean;
    timestamp: number | null;
    highScore: number;
    completedStagesCount: number;
    activeSkinId: string;
    walletBalance: number;
}

export class SaveManager
{
    private lastAutoSaveTime = 0;

    getActiveSlot (): SaveSlotId
    {
        const saved = readString(ACTIVE_SLOT_KEY);
        if (saved && (SAVE_SLOTS.includes(saved as (typeof SAVE_SLOTS)[number]) || saved === 'autosave'))
        {
            return saved as SaveSlotId;
        }
        return 'slot_1';
    }

    setActiveSlot (slotId: SaveSlotId): void
    {
        writeString(ACTIVE_SLOT_KEY, slotId);
    }

    save (snapshot: SaveGameSnapshot, targetSlot?: SaveSlotId): void
    {
        const slot = targetSlot ?? this.getActiveSlot();
        const payload: SaveGameSnapshot = {
            ...snapshot,
            slotId: slot,
            timestamp: Date.now(),
        };

        writeJsonAtomic(`${SLOT_KEY_PREFIX}${slot}`, payload);
    }

    load (slotId?: SaveSlotId): SaveGameSnapshot
    {
        const slot = slotId ?? this.getActiveSlot();
        const raw = readJsonSafe<unknown>(`${SLOT_KEY_PREFIX}${slot}`);

        if (raw)
        {
            return migrateSaveSnapshot(raw, slot);
        }

        // If slot 1 has no master save, check legacy keys
        if (slot === 'slot_1')
        {
            return this.loadLegacyOrMigrate(slot);
        }

        return createDefaultSaveSnapshot(slot);
    }

    /**
     * Auto-save on milestones (level complete, skin equip, etc.)
     * Throttled to at most once every 3 seconds to avoid disk churn.
     */
    autoSave (snapshot: SaveGameSnapshot, force = false): void
    {
        const now = Date.now();
        if (!force && now - this.lastAutoSaveTime < 3000)
        {
            return;
        }
        this.lastAutoSaveTime = now;

        // Write to both autosave slot and current active slot
        this.save(snapshot, 'autosave');
        const activeSlot = this.getActiveSlot();
        if (activeSlot !== 'autosave')
        {
            this.save(snapshot, activeSlot);
        }
    }

    listSlots (): SlotMetadata[]
    {
        const allSlots: SaveSlotId[] = ['slot_1', 'slot_2', 'slot_3', 'autosave'];
        return allSlots.map(slotId =>
        {
            const raw = readJsonSafe<unknown>(`${SLOT_KEY_PREFIX}${slotId}`);
            let label = 'Slot 1 (Main)';
            if (slotId === 'slot_2') label = 'Slot 2';
            if (slotId === 'slot_3') label = 'Slot 3';
            if (slotId === 'autosave') label = 'Autosave ⚡';

            if (!raw)
            {
                return {
                    slotId,
                    label,
                    exists: false,
                    timestamp: null,
                    highScore: 0,
                    completedStagesCount: 0,
                    activeSkinId: 'cyber-blue',
                    walletBalance: 0,
                };
            }

            const snap = migrateSaveSnapshot(raw, slotId);
            return {
                slotId,
                label,
                exists: true,
                timestamp: snap.timestamp,
                highScore: snap.gameStats.highScore,
                completedStagesCount: snap.stageProgression.completedStages.length,
                activeSkinId: snap.activeSkinId,
                walletBalance: snap.wallet.balance,
            };
        });
    }

    exportSlotToString (slotId: SaveSlotId): string
    {
        const snapshot = this.load(slotId);
        const json = JSON.stringify(snapshot);
        try
        {
            return btoa(encodeURIComponent(json));
        }
        catch
        {
            return json;
        }
    }

    importSlotFromString (dataString: string, targetSlot: SaveSlotId): boolean
    {
        if (!dataString || typeof dataString !== 'string') return false;

        let jsonString = dataString.trim();
        try
        {
            jsonString = decodeURIComponent(atob(jsonString));
        }
        catch
        {
            // If not base64, try direct JSON parsing
        }

        try
        {
            const parsed = JSON.parse(jsonString);
            const migrated = migrateSaveSnapshot(parsed, targetSlot);
            this.save(migrated, targetSlot);
            return true;
        }
        catch
        {
            return false;
        }
    }

    clearSlot (slotId: SaveSlotId): void
    {
        removeKey(`${SLOT_KEY_PREFIX}${slotId}`);
    }

    private loadLegacyOrMigrate (slotId: SaveSlotId): SaveGameSnapshot
    {
        const legacyStats = readJsonSafe<{ highScore?: number; bestTimeSeconds?: number | null }>('jo_game_stats_v1');
        const legacySkin = readString('jo_active_skin');
        const legacySettings = readJsonSafe<{ soundMuted?: boolean; musicMuted?: boolean }>('jo_settings_v1');
        const legacyProgression = readJsonSafe<{ unlockedStages?: string[]; completedStages?: string[] }>('jo_stage_progression_v1');

        if (!legacyStats && !legacySkin && !legacySettings && !legacyProgression)
        {
            return createDefaultSaveSnapshot(slotId);
        }

        const legacyRaw = {
            slotId,
            highScore: legacyStats?.highScore ?? 0,
            bestTimeSeconds: legacyStats?.bestTimeSeconds ?? null,
            activeSkinId: legacySkin ?? 'cyber-blue',
            settings: {
                soundMuted: legacySettings?.soundMuted ?? false,
                musicMuted: legacySettings?.musicMuted ?? false,
            },
            stageProgression: {
                unlockedStages: legacyProgression?.unlockedStages ?? ['village', 'level-1'],
                completedStages: legacyProgression?.completedStages ?? [],
            },
        };

        const snapshot = migrateSaveSnapshot(legacyRaw, slotId);

        // Persist the migrated snapshot into slot 1
        this.save(snapshot, slotId);
        return snapshot;
    }
}

export const saveManager = new SaveManager();
