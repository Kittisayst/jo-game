import { ARMOR_SLOTS, ArmorSlot, WornPiece } from './Armor';
import type { CraftingJobSnapshot } from './CraftingQueue';
import type { GardenSnapshot } from './Garden';
import { MOVEMENT_ABILITY_IDS, MovementAbilityId } from './MovementAbilities';
import { MAX_SKILL_RANK, SKILL_SLOT_COUNT, SkillProgressionSnapshot } from './SkillProgression';
import { MAX_TOOL_LEVEL } from './ToolUpgrades';
import { HERO_LEVEL_CAP, type HeroLevelSnapshot } from './HeroLevel';
import { STAT_IDS, type StatsSnapshot } from './HeroStats';
import type { PendingReward } from './PendingRewards';
import { TutorialSnapshot } from './TutorialProgress';
import { SettingsData, StageProgressionData } from '../ports';
import { BookProgressSnapshot } from './Book';
import { BackpackSlotSnapshot } from './Backpack';
import { EquipmentSnapshot, WEAPON_CONFIGS } from './EquipmentState';
import { DailyPracticeProgressSnapshot } from './Quiz';
import { AVAILABLE_SKINS } from './Skin';
import { ALWAYS_UNLOCKED_STAGES } from './StageProgression';
import { isStageId } from './StageNumber';

export const CURRENT_SAVE_VERSION = 7;
export const STARTER_BOOK_CREDIT_RESERVE = 20;

/** Herb potions a new player starts with. */
export const STARTER_POTION_COUNT = 2;

/** The village and the 100 numbered Stages are the only places progress can be saved for. */
const isValidStageKey = (key: string): boolean => key === 'village' || isStageId(key);
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
    books: Record<string, BookProgressSnapshot>;
    backpack: BackpackSlotSnapshot[];
    equipment: EquipmentSnapshot;
    practiceStats: DailyPracticeProgressSnapshot;
    repairedGates: string[];
    forgeUnlocked: boolean;
    /** The Garden's Plots. Missing in older saves. */
    garden: GardenSnapshot;
    /** The Workshop/Forge job in progress or waiting to be collected. Missing in older saves. */
    crafting: CraftingJobSnapshot | null;
    /** The movement abilities unlocked (the Dash always). Missing in older saves. */
    movement: MovementAbilityId[];
    /** The active skills learned and the two skill slots. Missing in older saves. */
    skills: SkillProgressionSnapshot;
    /** How far each tool (by item id) is upgraded, +1 to +3. Missing in older saves. */
    toolUpgrades: Record<string, number>;
    /** The Hero Level, the XP towards the next one and the Stat points not spent. Missing in older saves. */
    heroLevel: HeroLevelSnapshot;
    /** The Stat points spent on each Stat. Missing in older saves. */
    heroStats: StatsSnapshot;
    /** What is in the Storage chest. Missing in older saves. */
    storage: BackpackSlotSnapshot[];
    /** When each small plant was last harvested (key = Stage id + node id, value = ms). Missing in older saves. */
    plantRegrowth: Record<string, number>;
    /** Story Materials waiting for room in the Backpack. Missing in older saves. */
    pendingRewards: PendingReward[];
    /** Realms opened by placing Portal blocks, always including Realm 1. Missing in older saves. */
    openedRealms: number[];
    /** The Potion chosen to be drunk with R, or null. Missing in older saves. */
    quickSlotItemId: string | null;
    /** Hints of the first Stage that were done, and whether the player skipped them. Missing in older saves. */
    tutorial: TutorialSnapshot;
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
            questionRewardedStages: [],
        },
        // Exactly enough Credit to buy the first textbook, so a new player can never get stuck
        wallet: {
            balance: STARTER_BOOK_CREDIT_RESERVE,
        },
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
            // The forest has no healing and touching an enemy costs a heart, so a new player starts with two potions
            { slotIndex: 2, itemId: 'herb-potion', count: STARTER_POTION_COUNT },
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
        tutorial: { done: [], dismissed: false },
        quickSlotItemId: null,
        openedRealms: [1],
        pendingRewards: [],
        plantRegrowth: {},
        garden: { plotCount: 6, plots: [null, null, null, null, null, null] },
        crafting: null,
        movement: ['dash'],
        skills: { unlocked: [], equipped: [null, null], ranks: {} },
        toolUpgrades: {},
        heroLevel: { level: 1, xp: 0, unspentPoints: 0 },
        heroStats: { attack: 0, hearts: 0, guard: 0, agility: 0 },
        storage: [],
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
 * Validates an unknown input into a clean, verified SaveGameSnapshot (version 7).
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
        ? value.filter((s): s is string => typeof s === 'string' && isValidStageKey(s))
        : [];
    const unlockedStages = Array.from(new Set([...ALWAYS_UNLOCKED_STAGES, ...stageList(rawProg.unlockedStages)]));
    const completedStages = Array.from(new Set(stageList(rawProg.completedStages)));
    const questionRewardedStages = Array.from(new Set(stageList(rawProg.questionRewardedStages)));

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
                backpack.push({
                    slotIndex: s.slotIndex,
                    itemId: s.itemId,
                    count: Math.floor(s.count),
                    ...(typeof s.durability === 'number' && !isNaN(s.durability) ? { durability: Math.max(0, Math.floor(s.durability)) } : {}),
                });
            }
        }
    }

    // Equipment
    const rawEquip = asRecord(data.equipment);
    const equippedWeaponId = typeof rawEquip.equippedWeaponId === 'string' && WEAPON_CONFIGS[rawEquip.equippedWeaponId]
        ? rawEquip.equippedWeaponId
        : DEFAULT_WEAPON_ID;
    // Armor being worn: only the three known places, each with an item id and optionally what is left of it
    const rawArmor = asRecord(rawEquip.armor);
    const armor: Partial<Record<ArmorSlot, WornPiece>> = {};
    for (const slot of ARMOR_SLOTS)
    {
        const piece = asRecord(rawArmor[slot]);
        if (typeof piece.itemId === 'string' && piece.itemId.length > 0)
        {
            armor[slot] = {
                itemId: piece.itemId,
                ...(typeof piece.durability === 'number' && !isNaN(piece.durability) ? { durability: Math.max(0, Math.floor(piece.durability)) } : {}),
            };
        }
    }
    const quickSlotItemId = typeof data.quickSlotItemId === 'string' && data.quickSlotItemId.length > 0 ? data.quickSlotItemId : null;
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

    // A save made before the hints existed belongs to someone who already knows how to play: no hints for them
    const rawTutorial = asRecord(data.tutorial);
    const hasProgress = completedStages.length > 0 || books['book-ch1'].unlocked;
    const tutorial: TutorialSnapshot = {
        done: Array.isArray(rawTutorial.done) ? rawTutorial.done.filter((id): id is string => typeof id === 'string') : [],
        dismissed: typeof rawTutorial.dismissed === 'boolean' ? rawTutorial.dismissed : data.tutorial === undefined && hasProgress,
        triggered: Array.isArray(rawTutorial.triggered) ? rawTutorial.triggered.filter((id): id is string => typeof id === 'string') : [],
    };
    // The Garden: any number of Plots from 6 to 12, each empty or a Seed with the time it was planted
    const rawGarden = asRecord(data.garden);
    const plotCount = Math.min(12, Math.max(6, wholeNumber(rawGarden.plotCount, 6)));
    const garden: GardenSnapshot = {
        plotCount,
        plots: Array.from({ length: plotCount }, (_, i) =>
        {
            const plot = asRecord((Array.isArray(rawGarden.plots) ? rawGarden.plots : [])[i]);
            return typeof plot.seedItemId === 'string' && plot.seedItemId.length > 0 && typeof plot.plantedAtMs === 'number' && Number.isFinite(plot.plantedAtMs)
                ? { seedItemId: plot.seedItemId, plantedAtMs: plot.plantedAtMs }
                : null;
        }),
    };
    const rawJob = asRecord(data.crafting);
    const crafting: CraftingJobSnapshot | null =
        typeof rawJob.recipeId === 'string' && typeof rawJob.resultItemId === 'string'
        && typeof rawJob.resultCount === 'number' && rawJob.resultCount >= 1
        && typeof rawJob.totalMs === 'number' && rawJob.totalMs > 0 && typeof rawJob.remainingMs === 'number'
            ? {
                recipeId: rawJob.recipeId,
                resultItemId: rawJob.resultItemId,
                resultCount: Math.floor(rawJob.resultCount),
                totalMs: rawJob.totalMs,
                remainingMs: Math.min(rawJob.totalMs, Math.max(0, rawJob.remainingMs)),
            }
            : null;
    const movement: MovementAbilityId[] = MOVEMENT_ABILITY_IDS.filter(id =>
        id === 'dash' || (Array.isArray(data.movement) && data.movement.includes(id)));
    const rawSkills = asRecord(data.skills);
    const unlockedSkills = Array.isArray(rawSkills.unlocked)
        ? Array.from(new Set(rawSkills.unlocked.filter((id): id is string => typeof id === 'string' && id.length > 0)))
        : [];
    const equippedSkills: (string | null)[] = Array.from({ length: SKILL_SLOT_COUNT }, (_, i) =>
    {
        const id = Array.isArray(rawSkills.equipped) ? rawSkills.equipped[i] : null;
        return typeof id === 'string' && unlockedSkills.includes(id) ? id : null;
    });
    const skillRanks: Record<string, number> = {};
    for (const [id, rank] of Object.entries(asRecord(rawSkills.ranks)))
    {
        if (unlockedSkills.includes(id) && typeof rank === 'number' && Number.isInteger(rank) && rank >= 2 && rank <= MAX_SKILL_RANK) skillRanks[id] = rank;
    }
    const skills: SkillProgressionSnapshot = { unlocked: unlockedSkills, equipped: equippedSkills, ranks: skillRanks };
    const toolUpgrades: Record<string, number> = {};
    for (const [id, level] of Object.entries(asRecord(data.toolUpgrades)))
    {
        if (typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= MAX_TOOL_LEVEL) toolUpgrades[id] = level;
    }
    const rawHero = asRecord(data.heroLevel);
    const wholeIn = (value: unknown, min: number, max: number, fallback: number): number =>
        typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
    const heroLevel: HeroLevelSnapshot = {
        level: wholeIn(rawHero.level, 1, HERO_LEVEL_CAP, 1),
        xp: wholeIn(rawHero.xp, 0, Number.MAX_SAFE_INTEGER, 0),
        unspentPoints: wholeIn(rawHero.unspentPoints, 0, 10000, 0),
    };
    const rawStats = asRecord(data.heroStats);
    const heroStats = { attack: 0, hearts: 0, guard: 0, agility: 0 } as StatsSnapshot;
    for (const id of STAT_IDS) heroStats[id] = wholeIn(rawStats[id], 0, 1000, 0);
    const storage: BackpackSlotSnapshot[] = [];
    for (const slot of Array.isArray(data.storage) ? data.storage : [])
    {
        const s = asRecord(slot);
        if (typeof s.slotIndex === 'number' && s.slotIndex >= 0 && s.slotIndex < 40 && typeof s.itemId === 'string' && typeof s.count === 'number' && s.count > 0)
        {
            storage.push({
                slotIndex: Math.floor(s.slotIndex),
                itemId: s.itemId,
                count: Math.floor(s.count),
                ...(typeof s.durability === 'number' && !isNaN(s.durability) ? { durability: Math.max(0, Math.floor(s.durability)) } : {}),
            });
        }
    }
    const plantRegrowth: Record<string, number> = {};
    for (const [key, at] of Object.entries(asRecord(data.plantRegrowth)))
    {
        if (typeof at === 'number' && Number.isFinite(at)) plantRegrowth[key] = at;
    }
    const pendingRewards: PendingReward[] = [];
    for (const entry of Array.isArray(data.pendingRewards) ? data.pendingRewards : [])
    {
        const e = asRecord(entry);
        if (typeof e.itemId === 'string' && e.itemId.length > 0 && typeof e.count === 'number' && e.count >= 1)
        {
            pendingRewards.push({ itemId: e.itemId, count: Math.floor(e.count) });
        }
    }
    const openedRealms = Array.from(new Set([1, ...(Array.isArray(data.openedRealms) ? data.openedRealms : [])
        .filter((n): n is number => Number.isInteger(n) && n >= 2 && n <= 10)])).sort((a, b) => a - b);

    return {
        version: CURRENT_SAVE_VERSION,
        timestamp,
        slotId,
        activeSkinId,
        ownedSkins,
        settings,
        stageProgression: { unlockedStages, completedStages, questionRewardedStages },
        wallet: { balance },
        books,
        backpack,
        equipment: { equippedWeaponId, upgradeLevels, armor },
        practiceStats,
        repairedGates,
        forgeUnlocked,
        tutorial,
        quickSlotItemId,
        openedRealms,
        pendingRewards,
        plantRegrowth,
        garden,
        crafting,
        movement,
        skills,
        toolUpgrades,
        heroLevel,
        heroStats,
        storage,
    };
}
