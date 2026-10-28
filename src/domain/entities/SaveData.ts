import { GameStatsData, SettingsData, StageProgressionData } from '../ports';
import { DEFAULT_WEAPON_ID, WEAPON_CATALOG } from './Weapon';
import { AchievementProgress } from './Achievement';
import { BookProgressSnapshot } from './Book';
import { BackpackSlotSnapshot } from './Backpack';
import { EquipmentSnapshot } from './EquipmentState';
import { DailyPracticeProgressSnapshot } from './Quiz';

export const CURRENT_SAVE_VERSION = 5;
export const STARTER_BOOK_CREDIT_RESERVE = 20;

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
    achievements?: Record<string, AchievementProgress>;

    // Version 4 Knowledge Quest fields
    books?: Record<string, BookProgressSnapshot>;
    backpack?: BackpackSlotSnapshot[];
    equipment?: EquipmentSnapshot;
    practiceStats?: DailyPracticeProgressSnapshot;
    repairedGates?: string[];
    forgeUnlocked?: boolean;
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
            balance: STARTER_BOOK_CREDIT_RESERVE,
        },
        weapons: {
            owned: [DEFAULT_WEAPON_ID],
            equippedId: DEFAULT_WEAPON_ID,
        },
        achievements: {},

        // Version 5 Knowledge Quest defaults (Buy-to-Read: books start unpurchased)
        books: {
            'book-ch1': {
                bookId: 'book-ch1',
                unlocked: false,
                readPages: [],
                examPassed: false,
                bestScore: 0,
                attempts: 0,
            },
        },
        backpack: [
            { slotIndex: 0, itemId: 'wooden-sword', count: 1 },
            // Trees need an axe and the axe recipe needs wood, so the player must start with one
            { slotIndex: 1, itemId: 'axe-t1', count: 1 },
        ],
        equipment: {
            equippedWeaponId: 'wooden-sword',
            upgradeLevels: {},
        },
        practiceStats: {
            lastPracticeDate: '',
            practiceCountToday: 0,
            questionStats: {},
        },
        repairedGates: [],
        forgeUnlocked: false,
    };
}

/**
 * Validates and migrates an unknown input data into a clean, verified SaveGameSnapshot (version 4).
 * Defensively converts legacy v1, v2 & v3 snapshots to v4 without data loss.
 */
export function migrateSaveSnapshot (raw: unknown, fallbackSlotId = 'slot_1'): SaveGameSnapshot
{
    if (!raw || typeof raw !== 'object')
    {
        return createDefaultSaveSnapshot(fallbackSlotId);
    }

    const data = raw as Record<string, unknown>;
    const rawVersion = typeof data.version === 'number' && !isNaN(data.version)
        ? Math.floor(data.version)
        : 1;

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

    const validStageKeys = ['village', 'level-1', 'level-2', 'level-3', 'stage-ch1'];
    const unlockedStages = Array.from(new Set(
        ['village', ...unlockedRaw.filter((s): s is string => typeof s === 'string' && validStageKeys.includes(s))]
    ));
    if (!unlockedStages.includes('level-1'))
    {
        unlockedStages.push('level-1');
    }

    const completedStages = Array.from(new Set(
        completedRaw.filter((s): s is string => typeof s === 'string' && validStageKeys.includes(s))
    ));

    // 5. Validate or migrate Wallet (v3 legacy bonus: 50 + highScore/5)
    const rawWallet = (data.wallet && typeof data.wallet === 'object' ? data.wallet : {}) as Record<string, unknown>;
    let balance = 50;
    if (typeof rawWallet.balance === 'number' && !isNaN(rawWallet.balance))
    {
        balance = Math.max(0, Math.floor(rawWallet.balance));
    }
    else
    {
        balance = 50 + Math.floor(highScore / 5);
    }

    // 6. Validate or migrate Weapons
    const rawWeapons = (data.weapons && typeof data.weapons === 'object' ? data.weapons : {}) as Record<string, unknown>;
    const validWeaponIds = [...WEAPON_CATALOG.map(w => w.id), 'wooden-sword', 'iron-sword', 'crystal-sword'];
    const ownedWeaponsRaw = Array.isArray(rawWeapons.owned) ? rawWeapons.owned : [DEFAULT_WEAPON_ID];
    const owned = Array.from(new Set(
        [DEFAULT_WEAPON_ID, ...ownedWeaponsRaw.filter((id): id is string => typeof id === 'string' && validWeaponIds.includes(id))]
    ));

    let equippedId = typeof rawWeapons.equippedId === 'string' ? rawWeapons.equippedId : DEFAULT_WEAPON_ID;
    if (!owned.includes(equippedId))
    {
        equippedId = DEFAULT_WEAPON_ID;
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

    // 10. Validate or migrate Books (v5 Buy-to-Read)
    const rawBooks = (data.books && typeof data.books === 'object' ? data.books : {}) as Record<string, unknown>;
    const books: Record<string, BookProgressSnapshot> = {};

    books['book-ch1'] = {
        bookId: 'book-ch1',
        unlocked: false,
        readPages: [],
        examPassed: false,
        bestScore: 0,
        attempts: 0,
    };

    for (const [bId, bVal] of Object.entries(rawBooks))
    {
        if (bVal && typeof bVal === 'object')
        {
            const b = bVal as Record<string, unknown>;
            const readPages = Array.isArray(b.readPages)
                ? b.readPages.filter((p): p is number => typeof p === 'number' && p > 0)
                : [];
            const examPassed = Boolean(b.examPassed);

            // v4 -> v5 migration: reset untouched free-default book-ch1 to unpurchased
            let unlocked = Boolean(b.unlocked);
            if (rawVersion < 5 && bId === 'book-ch1' && !examPassed && readPages.length === 0)
            {
                unlocked = false;
            }

            books[bId] = {
                bookId: bId,
                unlocked,
                readPages,
                examPassed,
                bestScore: typeof b.bestScore === 'number' ? Math.max(0, Math.floor(b.bestScore)) : 0,
                attempts: typeof b.attempts === 'number' ? Math.max(0, Math.floor(b.attempts)) : 0,
                lastResitRewardDate: typeof b.lastResitRewardDate === 'string' ? b.lastResitRewardDate : null,
            };
        }
    }

    // Softlock guard: ensure player has enough Credit (>= 20) to buy starter textbook if unpurchased
    if (!books['book-ch1']?.unlocked && balance < STARTER_BOOK_CREDIT_RESERVE)
    {
        balance = STARTER_BOOK_CREDIT_RESERVE;
    }

    // 11. Validate or migrate Backpack (v4)
    const backpackRaw = Array.isArray(data.backpack) ? data.backpack : [];
    const backpack: BackpackSlotSnapshot[] = [];
    for (const slot of backpackRaw)
    {
        if (slot && typeof slot === 'object')
        {
            const s = slot as Record<string, unknown>;
            if (typeof s.slotIndex === 'number' && typeof s.itemId === 'string' && typeof s.count === 'number' && s.count > 0)
            {
                backpack.push({
                    slotIndex: s.slotIndex,
                    itemId: s.itemId,
                    count: Math.floor(s.count),
                });
            }
        }
    }

    // 12. Validate or migrate Equipment (v4)
    const rawEquip = (data.equipment && typeof data.equipment === 'object' ? data.equipment : {}) as Record<string, unknown>;
    const equippedWeaponId = typeof rawEquip.equippedWeaponId === 'string' ? rawEquip.equippedWeaponId : 'wooden-sword';
    const upgradeLevelsRaw = (rawEquip.upgradeLevels && typeof rawEquip.upgradeLevels === 'object' ? rawEquip.upgradeLevels : {}) as Record<string, unknown>;
    const upgradeLevels: Record<string, number> = {};
    for (const [wId, lv] of Object.entries(upgradeLevelsRaw))
    {
        if (typeof lv === 'number' && !isNaN(lv))
        {
            upgradeLevels[wId] = Math.max(0, Math.floor(lv));
        }
    }
    const equipment: EquipmentSnapshot = {
        equippedWeaponId,
        upgradeLevels,
    };

    // 13. Validate or migrate Practice Stats (v4)
    const rawPractice = (data.practiceStats && typeof data.practiceStats === 'object' ? data.practiceStats : {}) as Record<string, unknown>;
    const practiceStats: DailyPracticeProgressSnapshot = {
        lastPracticeDate: typeof rawPractice.lastPracticeDate === 'string' ? rawPractice.lastPracticeDate : '',
        practiceCountToday: typeof rawPractice.practiceCountToday === 'number' ? Math.max(0, Math.floor(rawPractice.practiceCountToday)) : 0,
        questionStats: (rawPractice.questionStats && typeof rawPractice.questionStats === 'object' ? rawPractice.questionStats : {}) as DailyPracticeProgressSnapshot['questionStats'],
    };

    // 14. Repaired gates and forge status (v4)
    const repairedGates = Array.isArray(data.repairedGates)
        ? data.repairedGates.filter((g): g is string => typeof g === 'string')
        : [];
    const forgeUnlocked = Boolean(data.forgeUnlocked ?? books['book-ch1']?.examPassed ?? false);

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
        achievements,

        books,
        backpack,
        equipment,
        practiceStats,
        repairedGates,
        forgeUnlocked,
    };
}
