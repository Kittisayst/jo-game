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
