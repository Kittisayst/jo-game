import { describe, expect, it } from 'vitest';
import {
    CURRENT_SAVE_VERSION,
    createDefaultSaveSnapshot,
    migrateSaveSnapshot,
} from './SaveData';

describe('SaveData Domain Entity & Migration', () =>
{
    it('creates a clean default snapshot with CURRENT_SAVE_VERSION (v7)', () =>
    {
        const defaultSave = createDefaultSaveSnapshot('slot_1');
        expect(defaultSave.version).toBe(CURRENT_SAVE_VERSION);
        expect(defaultSave.version).toBe(7);
        expect(defaultSave.slotId).toBe('slot_1');
        expect(defaultSave.activeSkinId).toBe('cyber-blue');
        expect(defaultSave.ownedSkins).toEqual(['cyber-blue']);
        expect(defaultSave.settings.soundMuted).toBe(false);
        expect(defaultSave.stageProgression.unlockedStages).toEqual(['village', 'stage-001']);
        expect(defaultSave.stageProgression.completedStages).toEqual([]);
        expect(defaultSave.stageProgression.questionRewardedStages).toEqual([]);

        // Exactly enough Credit for the first textbook; books start unpurchased
        expect(defaultSave.wallet.balance).toBe(20);
        expect(defaultSave.books['book-ch1'].unlocked).toBe(false);
        expect(defaultSave.backpack).toEqual([
            { slotIndex: 0, itemId: 'wooden-sword', count: 1 },
            { slotIndex: 1, itemId: 'axe-t1', count: 1 },
            { slotIndex: 2, itemId: 'herb-potion', count: 2 },
        ]);
        expect(defaultSave.equipment.equippedWeaponId).toBe('wooden-sword');
        expect(defaultSave.forgeUnlocked).toBe(false);
    });

    it('returns default snapshot when given null or non-object input', () =>
    {
        const saveFromNull = migrateSaveSnapshot(null, 'slot_2');
        expect(saveFromNull.slotId).toBe('slot_2');
        expect(saveFromNull.version).toBe(CURRENT_SAVE_VERSION);

        const saveFromString = migrateSaveSnapshot('corrupted_string', 'slot_3');
        expect(saveFromString.slotId).toBe('slot_3');
        expect(saveFromString.wallet.balance).toBe(20);
    });

    it('starts older platformer saves fresh but keeps the settings', () =>
    {
        const legacy = {
            version: 5,
            highScore: 1250,
            gameStats: { highScore: 1250, bestTimeSeconds: 30 },
            wallet: { balance: 900 },
            weapons: { owned: ['cyber-saber', 'thunder-hammer'], equippedId: 'thunder-hammer' },
            settings: { soundMuted: true, musicMuted: false },
            activeSkinId: 'neon-ninja',
            books: { 'book-ch1': { bookId: 'book-ch1', unlocked: true, readPages: [1, 2], examPassed: true } },
        };

        const migrated = migrateSaveSnapshot(legacy, 'slot_1');

        expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
        expect(migrated.settings.soundMuted).toBe(true);
        expect(migrated.activeSkinId).toBe('cyber-blue');
        expect(migrated.ownedSkins).toEqual(['cyber-blue']);
        expect(migrated.wallet.balance).toBe(20);
        expect(migrated.books['book-ch1'].unlocked).toBe(false);
        expect(migrated.equipment.equippedWeaponId).toBe('wooden-sword');
        expect('weapons' in migrated).toBe(false);
        expect('gameStats' in migrated).toBe(false);
    });

    it('keeps v7 progress and enforces the starter-book Credit guard only while the book is unbought', () =>
    {
        const untouched = migrateSaveSnapshot({ version: 7, wallet: { balance: 5 } }, 'slot_1');
        expect(untouched.books['book-ch1'].unlocked).toBe(false);
        expect(untouched.wallet.balance).toBe(20);

        const bought = migrateSaveSnapshot({
            version: 7,
            wallet: { balance: 5 },
            books: { 'book-ch1': { bookId: 'book-ch1', unlocked: true, readPages: [1, 2], examPassed: false } },
        }, 'slot_1');
        expect(bought.books['book-ch1'].unlocked).toBe(true);
        expect(bought.books['book-ch1'].readPages).toEqual([1, 2]);
        expect(bought.wallet.balance).toBe(5);
    });

    it('keeps the daily resit reward date and gate repairs', () =>
    {
        const migrated = migrateSaveSnapshot({
            version: 7,
            books: {
                'book-ch1': { bookId: 'book-ch1', unlocked: true, examPassed: true, lastResitRewardDate: '2026-10-28' },
            },
            repairedGates: ['gate-ch1', 42],
        }, 'slot_1');

        expect(migrated.books['book-ch1'].lastResitRewardDate).toBe('2026-10-28');
        expect(migrated.repairedGates).toEqual(['gate-ch1']);
        expect(migrated.forgeUnlocked).toBe(true);
    });

    it('filters out invalid skins, stage keys and equipment defensively', () =>
    {
        const maliciousData = {
            version: 7,
            activeSkinId: 'hacked_skin',
            stageProgression: {
                unlockedStages: ['village', 'level-1', 'invalid_debug_stage'],
                completedStages: ['unknown_stage', 'stage-001'],
            },
            wallet: { balance: -50 },
            equipment: { equippedWeaponId: 'hacked_laser_death_ray', upgradeLevels: { 'iron-sword': -3, x: 'bad' } },
            backpack: [
                { slotIndex: 0, itemId: 'wood', count: 5.9 },
                { slotIndex: 1, itemId: 'stone', count: 0 },
                'junk',
            ],
        };

        const sanitized = migrateSaveSnapshot(maliciousData);

        expect(sanitized.activeSkinId).toBe('cyber-blue');
        expect(sanitized.stageProgression.unlockedStages).toEqual(['village', 'stage-001']);
        expect(sanitized.stageProgression.completedStages).toEqual(['stage-001']);
        expect(sanitized.wallet.balance).toBe(20);
        expect(sanitized.equipment.equippedWeaponId).toBe('wooden-sword');
        expect(sanitized.equipment.upgradeLevels).toEqual({ 'iron-sword': 0 });
        expect(sanitized.backpack).toEqual([{ slotIndex: 0, itemId: 'wood', count: 5 }]);
    });

    it('only lets the player wear skins they own', () =>
    {
        const owned = migrateSaveSnapshot({ version: 7, activeSkinId: 'neon-ninja', ownedSkins: ['neon-ninja', 'bogus', 7] });
        expect(owned.ownedSkins).toEqual(['cyber-blue', 'neon-ninja']);
        expect(owned.activeSkinId).toBe('neon-ninja');

        const notBought = migrateSaveSnapshot({ version: 7, activeSkinId: 'golden-runner' });
        expect(notBought.ownedSkins).toEqual(['cyber-blue']);
        expect(notBought.activeSkinId).toBe('cyber-blue');
    });
});

describe('Stage question rewards in a save', () =>
{
    it('keeps the rewarded Stages, drops anything that is not a Stage, and accepts a save without the field', () =>
    {
        const withRewards = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            stageProgression: { unlockedStages: ['stage-001'], completedStages: [], questionRewardedStages: ['stage-002', 'nonsense', 7] },
        });
        expect(withRewards.stageProgression.questionRewardedStages).toEqual(['stage-002']);

        const without = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            stageProgression: { unlockedStages: ['stage-001'], completedStages: [] },
        });
        expect(without.stageProgression.questionRewardedStages).toEqual([]);
    });
});

describe('Tutorial hints in a save', () =>
{
    it('starts a new game with every hint still to do', () =>
    {
        expect(createDefaultSaveSnapshot().tutorial).toEqual({ done: [], dismissed: false });
    });

    it('keeps what was done and whether the player skipped, dropping anything that is not an id', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            tutorial: { done: ['move', 5, 'herb'], dismissed: true },
        });

        expect(saved.tutorial).toEqual({ done: ['move', 'herb'], dismissed: true, triggered: [] });
    });

    it('gives no hints to a save from before they existed that already has progress', () =>
    {
        const veteran = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            stageProgression: { unlockedStages: ['stage-001', 'stage-002'], completedStages: ['stage-001'] },
        });
        expect(veteran.tutorial.dismissed).toBe(true);

        const newcomer = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION });
        expect(newcomer.tutorial).toEqual({ done: [], dismissed: false, triggered: [] });
    });
});

describe('Durability in a save', () =>
{
    it('keeps how worn a weapon is, leaves a never-worn one without the field and ignores nonsense', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            backpack: [
                { slotIndex: 0, itemId: 'iron-sword', count: 1, durability: 37.9 },
                { slotIndex: 1, itemId: 'axe-t1', count: 1 },
                { slotIndex: 2, itemId: 'pickaxe-t1', count: 1, durability: 'lots' },
                { slotIndex: 3, itemId: 'crystal-sword', count: 1, durability: -5 },
            ],
        });

        expect(saved.backpack).toEqual([
            { slotIndex: 0, itemId: 'iron-sword', count: 1, durability: 37 },
            { slotIndex: 1, itemId: 'axe-t1', count: 1 },
            { slotIndex: 2, itemId: 'pickaxe-t1', count: 1 },
            { slotIndex: 3, itemId: 'crystal-sword', count: 1, durability: 0 },
        ]);
    });
});

describe('Armor and the Quick slot in a save', () =>
{
    it('starts a new game with nothing worn and an empty Quick slot', () =>
    {
        const save = createDefaultSaveSnapshot();

        expect(save.quickSlotItemId).toBeNull();
        expect(save.equipment.armor ?? {}).toEqual({});
    });

    it('keeps the worn pieces with their Durability and the Quick slot', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            equipment: {
                equippedWeaponId: 'wooden-sword',
                upgradeLevels: {},
                armor: { head: { itemId: 'iron-helmet', durability: 41.7 }, body: { itemId: 'iron-chestplate' } },
            },
            quickSlotItemId: 'speed-potion',
        });

        expect(saved.equipment.armor).toEqual({
            head: { itemId: 'iron-helmet', durability: 41 },
            body: { itemId: 'iron-chestplate' },
        });
        expect(saved.quickSlotItemId).toBe('speed-potion');
    });

    it('ignores a place that does not exist, a piece without an id and a Quick slot that is not text', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            equipment: { armor: { hands: { itemId: 'gloves' }, head: { durability: 3 }, feet: 'boots' } },
            quickSlotItemId: 42,
        });

        expect(saved.equipment.armor).toEqual({});
        expect(saved.quickSlotItemId).toBeNull();
    });

    it('loads a save from before Armor existed', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, equipment: { equippedWeaponId: 'wooden-sword', upgradeLevels: {} } });

        expect(saved.equipment.armor).toEqual({});
        expect(saved.quickSlotItemId).toBeNull();
    });
});

describe('Opened Realms in a save', () =>
{
    it('always has Realm 1 and keeps the Realms that were opened in order', () =>
    {
        expect(createDefaultSaveSnapshot().openedRealms).toEqual([1]);
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, openedRealms: [3, 2] }).openedRealms).toEqual([1, 2, 3]);
    });

    it('drops anything that is not a Realm and loads a save without the field', () =>
    {
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, openedRealms: [2, 11, 0, 'x', 2.5] }).openedRealms).toEqual([1, 2]);
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).openedRealms).toEqual([1]);
    });
});

describe('Waiting story Materials in a save', () =>
{
    it('starts empty, keeps what waits and drops nonsense', () =>
    {
        expect(createDefaultSaveSnapshot().pendingRewards).toEqual([]);

        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            pendingRewards: [
                { itemId: 'portal-shard-green', count: 3.9 },
                { itemId: 'boss-core', count: 0 },
                { itemId: 7, count: 2 },
                'x',
            ],
        });

        expect(saved.pendingRewards).toEqual([{ itemId: 'portal-shard-green', count: 3 }]);
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).pendingRewards).toEqual([]);
    });
});

describe('Plant regrowth in a save', () =>
{
    it('starts empty, keeps the harvest times and drops anything that is not a time', () =>
    {
        expect(createDefaultSaveSnapshot().plantRegrowth).toEqual({});

        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            plantRegrowth: { 'stage-001:wild-herb-420': 1700000000000, bad: 'x', worse: null, inf: Infinity },
        });

        expect(saved.plantRegrowth).toEqual({ 'stage-001:wild-herb-420': 1700000000000 });
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).plantRegrowth).toEqual({});
    });
});

describe('The Garden and the Storage chest in a save', () =>
{
    it('starts with six empty Plots and an empty chest', () =>
    {
        const save = createDefaultSaveSnapshot();

        expect(save.garden.plotCount).toBe(6);
        expect(save.garden.plots).toEqual([null, null, null, null, null, null]);
        expect(save.storage).toEqual([]);
    });

    it('keeps the planted Seeds and what is in the chest, with Durability', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            garden: { plotCount: 7, plots: [{ seedItemId: 'herb-seed', plantedAtMs: 1700000000000 }, null, null, null, null, null, { seedItemId: 'fiber-seed', plantedAtMs: 5 }] },
            storage: [{ slotIndex: 39, itemId: 'wood', count: 12 }, { slotIndex: 0, itemId: 'iron-sword', count: 1, durability: 40.5 }],
        });

        expect(saved.garden.plotCount).toBe(7);
        expect(saved.garden.plots[0]).toEqual({ seedItemId: 'herb-seed', plantedAtMs: 1700000000000 });
        expect(saved.garden.plots[6]).toEqual({ seedItemId: 'fiber-seed', plantedAtMs: 5 });
        expect(saved.storage).toEqual([
            { slotIndex: 39, itemId: 'wood', count: 12 },
            { slotIndex: 0, itemId: 'iron-sword', count: 1, durability: 40 },
        ]);
    });

    it('repairs nonsense: Plot count out of range, broken Plots, chest slots that do not exist', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            garden: { plotCount: 99, plots: [{ seedItemId: 7, plantedAtMs: 1 }, 'x'] },
            storage: [{ slotIndex: 40, itemId: 'wood', count: 1 }, { slotIndex: 1, itemId: 'wood', count: 0 }, { slotIndex: 2, itemId: 'wood', count: 3 }],
        });

        expect(saved.garden.plotCount).toBe(12);
        expect(saved.garden.plots.every(plot => plot === null)).toBe(true);
        expect(saved.storage).toEqual([{ slotIndex: 2, itemId: 'wood', count: 3 }]);
    });

    it('loads a save from before the Garden existed', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION });

        expect(saved.garden.plotCount).toBe(6);
        expect(saved.storage).toEqual([]);
    });
});

describe('The crafting job in a save', () =>
{
    it('keeps a job in progress and starts with none in an older save', () =>
    {
        const job = { recipeId: 'recipe-iron-sword', resultItemId: 'iron-sword', resultCount: 1, totalMs: 30000, remainingMs: 12000 };
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, crafting: job }).crafting).toEqual(job);
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).crafting).toBeNull();
    });

    it('clamps the time left and throws out a broken job', () =>
    {
        const over = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, crafting: { recipeId: 'r', resultItemId: 'x', resultCount: 1, totalMs: 1000, remainingMs: 99999 } });
        expect(over.crafting?.remainingMs).toBe(1000);
        const broken = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, crafting: { recipeId: 7, resultItemId: 'x', resultCount: 0, totalMs: -1, remainingMs: 'a' } });
        expect(broken.crafting).toBeNull();
    });
});

describe('Movement abilities in a save', () =>
{
    it('always has the Dash, keeps known abilities and drops the rest', () =>
    {
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).movement).toEqual(['dash']);
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, movement: ['double-jump', 'fly', 3] }).movement).toEqual(['dash', 'double-jump']);
    });
});

describe('Skills in a save', () =>
{
    it('keeps learned skills and their slots, drops what is not learned', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, skills: { unlocked: ['power-wave', 'power-wave', 7], equipped: ['ghost', 'power-wave'] } });
        expect(saved.skills).toEqual({ unlocked: ['power-wave'], equipped: [null, 'power-wave'], ranks: {} });
    });

    it('starts with none in an older save', () =>
    {
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).skills).toEqual({ unlocked: [], equipped: [null, null], ranks: {} });
    });
});

describe('Tool upgrades in a save', () =>
{
    it('keeps levels 1 to 3 and drops the rest', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, toolUpgrades: { 'axe-t1': 2, 'pickaxe-t1': 9, 'axe-t2': 'x', 'hammer-t1': 1.5 } });
        expect(saved.toolUpgrades).toEqual({ 'axe-t1': 2 });
    });

    it('starts with none in an older save', () =>
    {
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).toolUpgrades).toEqual({});
    });
});

describe('Skill ranks in a save', () =>
{
    it('keeps ranks 2 and 3 of learned skills and drops the rest', () =>
    {
        const saved = migrateSaveSnapshot({
            version: CURRENT_SAVE_VERSION,
            skills: { unlocked: ['power-wave'], equipped: ['power-wave', null], ranks: { 'power-wave': 3, ping: 2, other: 'x' } },
        });
        expect(saved.skills.ranks).toEqual({ 'power-wave': 3 });
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, skills: { unlocked: ['a'], ranks: { a: 7 } } }).skills.ranks).toEqual({});
    });
});

describe('Hero Level in a save', () =>
{
    it('keeps a valid level, XP and points and starts an older save at level 1', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, heroLevel: { level: 37, xp: 120, unspentPoints: 4 } });
        expect(saved.heroLevel).toEqual({ level: 37, xp: 120, unspentPoints: 4 });
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).heroLevel).toEqual({ level: 1, xp: 0, unspentPoints: 0 });
    });

    it('drops values out of range or not whole numbers', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, heroLevel: { level: 151, xp: -1, unspentPoints: 2.5 } });
        expect(saved.heroLevel).toEqual({ level: 1, xp: 0, unspentPoints: 0 });
    });
});

describe('Hero Stats in a save', () =>
{
    it('keeps the points of each Stat and starts an older save at 0', () =>
    {
        const saved = migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION, heroStats: { attack: 7, hearts: 10, guard: 'x', agility: -1, fly: 3 } });
        expect(saved.heroStats).toEqual({ attack: 7, hearts: 10, guard: 0, agility: 0 });
        expect(migrateSaveSnapshot({ version: CURRENT_SAVE_VERSION }).heroStats).toEqual({ attack: 0, hearts: 0, guard: 0, agility: 0 });
    });
});
