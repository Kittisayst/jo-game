import { SettingsData, StageProgressionData } from '../ports';
import { AchievementProgress } from './Achievement';
import { BookProgressSnapshot } from './Book';
import { BackpackSlotSnapshot } from './Backpack';
import { EquipmentSnapshot, WEAPON_CONFIGS } from './EquipmentState';
import { DailyPracticeProgressSnapshot } from './Quiz';
import { AVAILABLE_SKINS } from './Skin';
import { ALWAYS_UNLOCKED_STAGES } from './StageProgression';

export const CURRENT_SAVE_VERSION = 6;
export const STARTER_BOOK_CREDIT_RESERVE = 20;

const VALID_STAGE_KEYS = ['village', 'stage-ch1'];
const VALID_SKIN_IDS = AVAILABLE_SKINS.map(skin => skin.id);
const DEFAULT_SKIN_ID = 'cyber-blue';
const DEFAULT_WEAPON_ID = 'wooden-sword';

export interface SaveGameSnapshot
{
    version: number;
    timestamp: number;
    slotId: string;
    activeSkinId: string;
    /** Skins bought with Credit. The free default skin is always owned. */
    ownedSkins: string[];
    settings: SettingsData;
    stageProgression: StageProgressionData;
    wallet: {
        balance: number;
    };
    achievements?: Record<string, AchievementProgress>;
    books: Record<string, BookProgressSnapshot>;
    backpack: BackpackSlotSnapshot[];
    equipment: EquipmentSnapshot;
    practiceStats: DailyPracticeProgressSnapshot;
    repairedGates: string[];
    forgeUnlocked: boolean;
}

export function createDefaultSaveSnapshot (slotId = 'slot_1'): SaveGameSnapshot
{
    return {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        slotId,
        activeSkinId: DEFAULT_SKIN_ID,
        ownedSkins: [DEFAULT_SKIN_ID],
        settings: {
            soundMuted: false,
            musicMuted: false,
        },
        stageProgression: {
            unlockedStages: [...ALWAYS_UNLOCKED_STAGES],
            completedStages: [],
        },
        // Exactly enough Credit to buy the first textbook, so a new player can never get stuck
        wallet: {
            balance: STARTER_BOOK_CREDIT_RESERVE,
        },
        achievements: {},
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
            equippedWeaponId: DEFAULT_WEAPON_ID,
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

function asRecord (value: unknown): Record<string, unknown>
{
    return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
}

function wholeNumber (value: unknown, fallback = 0): number
{
    return typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.floor(value)) : fallback;
}

/**
 * Validates an unknown input into a clean, verified SaveGameSnapshot (version 6).
 * Saves older than v6 come from the platformer prototype (coins, score, shop, old weapons) and
 * are intentionally not carried over: only the settings survive.
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

    const slotId = typeof data.slotId === 'string' && data.slotId.trim() ? data.slotId.trim() : fallbackSlotId;
    const timestamp = typeof data.timestamp === 'number' && data.timestamp > 0 ? data.timestamp : Date.now();


    const rawSettings = asRecord(data.settings);
    const settings: SettingsData = {
        soundMuted: Boolean(rawSettings.soundMuted ?? data.soundMuted ?? false),
        musicMuted: Boolean(rawSettings.musicMuted ?? data.musicMuted ?? false),
    };

    if (rawVersion < CURRENT_SAVE_VERSION)
    {
        return { ...createDefaultSaveSnapshot(slotId), timestamp, settings };
    }

    // Skins are bought with Credit, so only owned skins can be worn
    const ownedSkins = Array.from(new Set([DEFAULT_SKIN_ID, ...(Array.isArray(data.ownedSkins) ? data.ownedSkins : [])
        .filter((id): id is string => typeof id === 'string' && VALID_SKIN_IDS.includes(id))]));
    const activeSkinId = typeof data.activeSkinId === 'string' && ownedSkins.includes(data.activeSkinId)
        ? data.activeSkinId
        : DEFAULT_SKIN_ID;

    // Stage progression
    const rawProg = asRecord(data.stageProgression);
    const stageList = (value: unknown): string[] => Array.isArray(value)
        ? value.filter((s): s is string => typeof s === 'string' && VALID_STAGE_KEYS.includes(s))
        : [];
    const unlockedStages = Array.from(new Set([...ALWAYS_UNLOCKED_STAGES, ...stageList(rawProg.unlockedStages)]));
    const completedStages = Array.from(new Set(stageList(rawProg.completedStages)));

    // Achievements (hidden for now, kept so they can return as learning achievements)
    const achievements: Record<string, AchievementProgress> = {};
    for (const [key, val] of Object.entries(asRecord(data.achievements)))
    {
        if (val && typeof val === 'object')
        {
            const a = val as Record<string, unknown>;
            achievements[key] = {
                progress: wholeNumber(a.progress),
                unlocked: Boolean(a.unlocked),
                claimed: Boolean(a.claimed),
                unlockedAt: typeof a.unlockedAt === 'number' ? a.unlockedAt : null,
            };
        }
    }

    // Books
    const books: Record<string, BookProgressSnapshot> = {
        'book-ch1': createDefaultSaveSnapshot().books['book-ch1'],
    };
    for (const [bookId, value] of Object.entries(asRecord(data.books)))
    {
        if (value && typeof value === 'object')
        {
            const b = value as Record<string, unknown>;
            books[bookId] = {
                bookId,
                unlocked: Boolean(b.unlocked),
                readPages: Array.isArray(b.readPages)
                    ? b.readPages.filter((p): p is number => typeof p === 'number' && p > 0)
                    : [],
                examPassed: Boolean(b.examPassed),
                bestScore: wholeNumber(b.bestScore),
                attempts: wholeNumber(b.attempts),
                lastResitRewardDate: typeof b.lastResitRewardDate === 'string' ? b.lastResitRewardDate : null,
            };
        }
    }

    // Wallet (Credit only)
    let balance = wholeNumber(asRecord(data.wallet).balance, STARTER_BOOK_CREDIT_RESERVE);
    // Softlock guard: a player who has not bought the first textbook must be able to afford it
    if (!books['book-ch1'].unlocked && balance < STARTER_BOOK_CREDIT_RESERVE)
    {
        balance = STARTER_BOOK_CREDIT_RESERVE;
    }

    // Backpack
    const backpack: BackpackSlotSnapshot[] = [];
    for (const slot of Array.isArray(data.backpack) ? data.backpack : [])
    {
        if (slot && typeof slot === 'object')
        {
            const s = slot as Record<string, unknown>;
            if (typeof s.slotIndex === 'number' && typeof s.itemId === 'string' && typeof s.count === 'number' && s.count > 0)
            {
                backpack.push({ slotIndex: s.slotIndex, itemId: s.itemId, count: Math.floor(s.count) });
            }
        }
    }

    // Equipment
    const rawEquip = asRecord(data.equipment);
    const equippedWeaponId = typeof rawEquip.equippedWeaponId === 'string' && WEAPON_CONFIGS[rawEquip.equippedWeaponId]
        ? rawEquip.equippedWeaponId
        : DEFAULT_WEAPON_ID;
    const upgradeLevels: Record<string, number> = {};
    for (const [weaponId, level] of Object.entries(asRecord(rawEquip.upgradeLevels)))
    {
        if (typeof level === 'number' && !isNaN(level))
        {
            upgradeLevels[weaponId] = Math.max(0, Math.floor(level));
        }
    }

    // Daily practice
    const rawPractice = asRecord(data.practiceStats);
    const practiceStats: DailyPracticeProgressSnapshot = {
        lastPracticeDate: typeof rawPractice.lastPracticeDate === 'string' ? rawPractice.lastPracticeDate : '',
        practiceCountToday: wholeNumber(rawPractice.practiceCountToday),
        questionStats: asRecord(rawPractice.questionStats) as DailyPracticeProgressSnapshot['questionStats'],
    };

    const repairedGates = Array.isArray(data.repairedGates)
        ? data.repairedGates.filter((g): g is string => typeof g === 'string')
        : [];
    const forgeUnlocked = Boolean(data.forgeUnlocked ?? books['book-ch1'].examPassed);

    return {
        version: CURRENT_SAVE_VERSION,
        timestamp,
        slotId,
        activeSkinId,
        ownedSkins,
        settings,
        stageProgression: { unlockedStages, completedStages },
        wallet: { balance },
        achievements,
        books,
        backpack,
        equipment: { equippedWeaponId, upgradeLevels },
        practiceStats,
        repairedGates,
        forgeUnlocked,
    };
}
