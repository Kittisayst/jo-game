import { GameStatsData, SettingsData, StageProgressionData } from '../ports';
import { DEFAULT_WEAPON_ID, WEAPON_CATALOG } from './Weapon';
import { UPGRADE_CATALOG, UpgradeType } from './Upgrade';
import { getItemDefinition } from './Inventory';
import { AchievementProgress } from './Achievement';

export const CURRENT_SAVE_VERSION = 3;

export interface SaveGameSnapshot
{
    version: number;
    timestamp: number;
    slotId: string;
    gameStats: GameStatsData;
    activeSkinId: string;
    settings: SettingsData;
    stageProgression: StageProgressionData;
    wallet: {
        balance: number;
    };
    weapons: {
        owned: string[];
        equippedId: string;
    };
    upgrades: Record<string, number>;
    inventory: Record<string, number>;
    achievements?: Record<string, AchievementProgress>;
}

export function createDefaultSaveSnapshot (slotId = 'slot_1'): SaveGameSnapshot
{
    return {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        slotId,
        gameStats: {
            highScore: 0,
            bestTimeSeconds: null,
        },
        activeSkinId: 'cyber-blue',
        settings: {
            soundMuted: false,
            musicMuted: false,
        },
        stageProgression: {
            unlockedStages: ['village', 'level-1'],
            completedStages: [],
        },
        wallet: {
            balance: 50, // Starting gift
        },
        weapons: {
            owned: [DEFAULT_WEAPON_ID],
            equippedId: DEFAULT_WEAPON_ID,
        },
        upgrades: {
            maxHp: 0,
            weaponPower: 0,
            attackSpeed: 0,
            coinMagnet: 0,
            dash: 0,
        },
        inventory: {},
        achievements: {},
    };
}

/**
 * Validates and migrates an unknown input data into a clean, verified SaveGameSnapshot (version 3).
 * Defensively converts legacy v1 & v2 snapshots to v3 without data loss.
 */
export function migrateSaveSnapshot (raw: unknown, fallbackSlotId = 'slot_1'): SaveGameSnapshot
{
    if (!raw || typeof raw !== 'object')
    {
        return createDefaultSaveSnapshot(fallbackSlotId);
    }

    const data = raw as Record<string, unknown>;

    // 1. Validate or extract GameStats
    const rawStats = (data.gameStats && typeof data.gameStats === 'object' ? data.gameStats : {}) as Record<string, unknown>;
    const highScore = typeof rawStats.highScore === 'number' && !isNaN(rawStats.highScore)
        ? Math.max(0, Math.floor(rawStats.highScore))
        : (typeof data.highScore === 'number' ? Math.max(0, Math.floor(data.highScore)) : 0);
    const bestTimeSeconds = typeof rawStats.bestTimeSeconds === 'number' && !isNaN(rawStats.bestTimeSeconds) && rawStats.bestTimeSeconds > 0
        ? rawStats.bestTimeSeconds
        : null;

    // 2. Validate or extract Active Skin
    const validSkins = ['cyber-blue', 'neon-ninja', 'cyber-knight', 'golden-runner'];
    let activeSkinId = typeof data.activeSkinId === 'string' ? data.activeSkinId : 'cyber-blue';
    if (!validSkins.includes(activeSkinId))
    {
        activeSkinId = 'cyber-blue';
    }

    // 3. Validate or extract Settings
    const rawSettings = (data.settings && typeof data.settings === 'object' ? data.settings : {}) as Record<string, unknown>;
    const soundMuted = Boolean(rawSettings.soundMuted ?? data.soundMuted ?? false);
    const musicMuted = Boolean(rawSettings.musicMuted ?? data.musicMuted ?? false);

    // 4. Validate or extract Stage Progression
    const rawProg = (data.stageProgression && typeof data.stageProgression === 'object' ? data.stageProgression : {}) as Record<string, unknown>;
    const unlockedRaw = Array.isArray(rawProg.unlockedStages)
        ? rawProg.unlockedStages
        : (Array.isArray(data.unlockedStages) ? data.unlockedStages : ['village', 'level-1']);
    const completedRaw = Array.isArray(rawProg.completedStages)
        ? rawProg.completedStages
        : (Array.isArray(data.completedStages) ? data.completedStages : []);

    const validStageKeys = ['village', 'level-1', 'level-2', 'level-3'];
    const unlockedStages = Array.from(new Set(
        ['village', 'level-1', ...unlockedRaw.filter((s): s is string => typeof s === 'string' && validStageKeys.includes(s))]
    ));
    const completedStages = Array.from(new Set(
        completedRaw.filter((s): s is string => typeof s === 'string' && validStageKeys.includes(s))
    ));

    // 5. Validate or migrate Wallet (v3)
    const rawWallet = (data.wallet && typeof data.wallet === 'object' ? data.wallet : {}) as Record<string, unknown>;
    let balance = 0;
    if (typeof rawWallet.balance === 'number' && !isNaN(rawWallet.balance))
    {
        balance = Math.max(0, Math.floor(rawWallet.balance));
    }
    else
    {
        // Conversion bonus for existing legacy players: starting 50 + 20% of their highScore
        balance = 50 + Math.floor(highScore / 5);
    }

    // 6. Validate or migrate Weapons (v3)
    const rawWeapons = (data.weapons && typeof data.weapons === 'object' ? data.weapons : {}) as Record<string, unknown>;
    const validWeaponIds = WEAPON_CATALOG.map(w => w.id);
    const ownedWeaponsRaw = Array.isArray(rawWeapons.owned) ? rawWeapons.owned : [DEFAULT_WEAPON_ID];
    const owned = Array.from(new Set(
        [DEFAULT_WEAPON_ID, ...ownedWeaponsRaw.filter((id): id is string => typeof id === 'string' && validWeaponIds.includes(id))]
    ));

    let equippedId = typeof rawWeapons.equippedId === 'string' ? rawWeapons.equippedId : DEFAULT_WEAPON_ID;
    if (!owned.includes(equippedId))
    {
        equippedId = DEFAULT_WEAPON_ID;
    }

    // 7. Validate or migrate Upgrades (v3)
    const rawUpgrades = (data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {}) as Record<string, unknown>;
    const upgrades: Record<string, number> = {};
    for (const def of UPGRADE_CATALOG)
    {
        const val = rawUpgrades[def.id];
        const num = typeof val === 'number' && !isNaN(val) ? Math.floor(val) : 0;
        upgrades[def.id] = Math.max(0, Math.min(def.maxLevel, num));
    }

    // 8. Validate or migrate Inventory (v3)
    const rawInventory = (data.inventory && typeof data.inventory === 'object' ? data.inventory : {}) as Record<string, unknown>;
    const inventory: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawInventory))
    {
        const itemDef = getItemDefinition(key);
        if (itemDef && typeof val === 'number' && !isNaN(val) && val > 0)
        {
            inventory[key] = Math.min(itemDef.maxStack, Math.floor(val));
        }
    }

    // 9. Validate or migrate Achievements
    const rawAchievements = (data.achievements && typeof data.achievements === 'object' ? data.achievements : {}) as Record<string, unknown>;
    const achievements: Record<string, AchievementProgress> = {};
    for (const [key, val] of Object.entries(rawAchievements))
    {
        if (val && typeof val === 'object')
        {
            const a = val as Record<string, unknown>;
            achievements[key] = {
                progress: typeof a.progress === 'number' && !isNaN(a.progress) ? Math.max(0, Math.floor(a.progress)) : 0,
                unlocked: Boolean(a.unlocked),
                claimed: Boolean(a.claimed),
                unlockedAt: typeof a.unlockedAt === 'number' ? a.unlockedAt : null,
            };
        }
    }

    const slotId = typeof data.slotId === 'string' && data.slotId.trim() ? data.slotId.trim() : fallbackSlotId;
    const timestamp = typeof data.timestamp === 'number' && data.timestamp > 0 ? data.timestamp : Date.now();

    return {
        version: CURRENT_SAVE_VERSION,
        timestamp,
        slotId,
        gameStats: {
            highScore,
            bestTimeSeconds,
        },
        activeSkinId,
        settings: {
            soundMuted,
            musicMuted,
        },
        stageProgression: {
            unlockedStages,
            completedStages,
        },
        wallet: {
            balance,
        },
        weapons: {
            owned,
            equippedId,
        },
        upgrades: upgrades as Record<UpgradeType, number>,
        inventory,
        achievements,
    };
}
