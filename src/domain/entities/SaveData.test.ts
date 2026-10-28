import { describe, expect, it } from 'vitest';
import {
    CURRENT_SAVE_VERSION,
    createDefaultSaveSnapshot,
    migrateSaveSnapshot,
} from './SaveData';

describe('SaveData Domain Entity & Migration', () =>
{
    it('creates a clean default snapshot with CURRENT_SAVE_VERSION (v6)', () =>
    {
        const defaultSave = createDefaultSaveSnapshot('slot_1');
        expect(defaultSave.version).toBe(CURRENT_SAVE_VERSION);
        expect(defaultSave.version).toBe(6);
        expect(defaultSave.slotId).toBe('slot_1');
        expect(defaultSave.activeSkinId).toBe('cyber-blue');
        expect(defaultSave.settings.soundMuted).toBe(false);
        expect(defaultSave.stageProgression.unlockedStages).toEqual(['village', 'stage-ch1']);
        expect(defaultSave.stageProgression.completedStages).toEqual([]);

        // Exactly enough Credit for the first textbook; books start unpurchased
        expect(defaultSave.wallet.balance).toBe(20);
        expect(defaultSave.books['book-ch1'].unlocked).toBe(false);
        expect(defaultSave.backpack).toEqual([
            { slotIndex: 0, itemId: 'wooden-sword', count: 1 },
            { slotIndex: 1, itemId: 'axe-t1', count: 1 },
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

    it('starts older platformer saves fresh but keeps settings and the chosen skin', () =>
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
        expect(migrated.activeSkinId).toBe('neon-ninja');
        expect(migrated.wallet.balance).toBe(20);
        expect(migrated.books['book-ch1'].unlocked).toBe(false);
        expect(migrated.equipment.equippedWeaponId).toBe('wooden-sword');
        expect('weapons' in migrated).toBe(false);
        expect('gameStats' in migrated).toBe(false);
    });

    it('keeps v6 progress and enforces the starter-book Credit guard only while the book is unbought', () =>
    {
        const untouched = migrateSaveSnapshot({ version: 6, wallet: { balance: 5 } }, 'slot_1');
        expect(untouched.books['book-ch1'].unlocked).toBe(false);
        expect(untouched.wallet.balance).toBe(20);

        const bought = migrateSaveSnapshot({
            version: 6,
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
            version: 6,
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
            version: 6,
            activeSkinId: 'hacked_skin',
            stageProgression: {
                unlockedStages: ['village', 'level-1', 'invalid_debug_stage'],
                completedStages: ['unknown_stage', 'stage-ch1'],
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
        expect(sanitized.stageProgression.unlockedStages).toEqual(['village', 'stage-ch1']);
        expect(sanitized.stageProgression.completedStages).toEqual(['stage-ch1']);
        expect(sanitized.wallet.balance).toBe(20);
        expect(sanitized.equipment.equippedWeaponId).toBe('wooden-sword');
        expect(sanitized.equipment.upgradeLevels).toEqual({ 'iron-sword': 0 });
        expect(sanitized.backpack).toEqual([{ slotIndex: 0, itemId: 'wood', count: 5 }]);
    });
});
