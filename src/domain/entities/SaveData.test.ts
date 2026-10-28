import { describe, expect, it } from 'vitest';
import {
    CURRENT_SAVE_VERSION,
    createDefaultSaveSnapshot,
    migrateSaveSnapshot,
} from './SaveData';

describe('SaveData Domain Entity & Migration', () =>
{
    it('creates a clean default snapshot with CURRENT_SAVE_VERSION (v5)', () =>
    {
        const defaultSave = createDefaultSaveSnapshot('slot_1');
        expect(defaultSave.version).toBe(CURRENT_SAVE_VERSION);
        expect(defaultSave.version).toBe(5);
        expect(defaultSave.slotId).toBe('slot_1');
        expect(defaultSave.gameStats.highScore).toBe(0);
        expect(defaultSave.gameStats.bestTimeSeconds).toBeNull();
        expect(defaultSave.activeSkinId).toBe('cyber-blue');
        expect(defaultSave.settings.soundMuted).toBe(false);
        expect(defaultSave.stageProgression.unlockedStages).toEqual(['village', 'level-1']);
        expect(defaultSave.stageProgression.completedStages).toEqual([]);

        // Legacy properties
        expect(defaultSave.wallet.balance).toBe(20);
        expect(defaultSave.weapons.owned).toEqual(['cyber-saber']);
        expect(defaultSave.weapons.equippedId).toBe('cyber-saber');

        // v5 Buy-to-Read properties (books start unpurchased)
        expect(defaultSave.books?.['book-ch1']?.unlocked).toBe(false);
        expect(defaultSave.backpack).toEqual([
            { slotIndex: 0, itemId: 'wooden-sword', count: 1 },
            { slotIndex: 1, itemId: 'axe-t1', count: 1 },
        ]);
        expect(defaultSave.equipment?.equippedWeaponId).toBe('wooden-sword');
        expect(defaultSave.forgeUnlocked).toBe(false);
    });

    it('returns default snapshot when given null or non-object input', () =>
    {
        const saveFromNull = migrateSaveSnapshot(null, 'slot_2');
        expect(saveFromNull.slotId).toBe('slot_2');
        expect(saveFromNull.version).toBe(CURRENT_SAVE_VERSION);

        const saveFromString = migrateSaveSnapshot('corrupted_string', 'slot_3');
        expect(saveFromString.slotId).toBe('slot_3');
        expect(saveFromString.gameStats.highScore).toBe(0);
        expect(saveFromString.wallet.balance).toBe(20);
    });

    it('migrates legacy flat schema to version 4 successfully', () =>
    {
        const legacyData = {
            highScore: 1250,
            unlockedStages: ['village', 'level-1', 'level-2'],
            completedStages: ['level-1'],
            soundMuted: true,
            activeSkinId: 'neon-ninja',
        };

        const migrated = migrateSaveSnapshot(legacyData, 'slot_1');

        expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
        expect(migrated.gameStats.highScore).toBe(1250);
        expect(migrated.activeSkinId).toBe('neon-ninja');
        expect(migrated.settings.soundMuted).toBe(true);
        expect(migrated.settings.musicMuted).toBe(false);
        expect(migrated.stageProgression.unlockedStages).toContain('level-2');
        expect(migrated.stageProgression.completedStages).toContain('level-1');

        // v3 migration bonus: 50 + 1250/5 = 300
        expect(migrated.wallet.balance).toBe(300);
        expect(migrated.weapons.owned).toContain('cyber-saber');
        expect(migrated.weapons.equippedId).toBe('cyber-saber');

        // v5 properties initialized safely (books start unpurchased)
        expect(migrated.books?.['book-ch1']?.unlocked).toBe(false);
        expect(migrated.equipment?.equippedWeaponId).toBe('wooden-sword');
    });

    it('migrates v4 untouched book-ch1 to unpurchased and enforces >= 20 Credit softlock guard', () =>
    {
        const v4Untouched = {
            version: 4,
            wallet: { balance: 5 },
            books: {
                'book-ch1': {
                    bookId: 'book-ch1',
                    unlocked: true,
                    readPages: [],
                    examPassed: false,
                    bestScore: 0,
                    attempts: 0,
                },
            },
        };

        const migratedUntouched = migrateSaveSnapshot(v4Untouched, 'slot_1');
        expect(migratedUntouched.version).toBe(5);
        expect(migratedUntouched.books?.['book-ch1']?.unlocked).toBe(false);
        expect(migratedUntouched.wallet.balance).toBe(20); // topped up to starter book reserve

        // Whereas if player already read pages or passed exam in v4, keep unlocked = true
        const v4Active = {
            version: 4,
            wallet: { balance: 5 },
            books: {
                'book-ch1': {
                    bookId: 'book-ch1',
                    unlocked: true,
                    readPages: [1, 2],
                    examPassed: false,
                    bestScore: 0,
                    attempts: 0,
                },
            },
        };

        const migratedActive = migrateSaveSnapshot(v4Active, 'slot_1');
        expect(migratedActive.books?.['book-ch1']?.unlocked).toBe(true);
        expect(migratedActive.wallet.balance).toBe(5);

        // And if version === 5 and book-ch1 was just purchased (unlocked: true, readPages: []), preserve unlocked: true
        const v5JustBought = {
            version: 5,
            wallet: { balance: 30 },
            books: {
                'book-ch1': {
                    bookId: 'book-ch1',
                    unlocked: true,
                    readPages: [],
                    examPassed: false,
                    bestScore: 0,
                    attempts: 0,
                },
            },
        };

        const migratedV5 = migrateSaveSnapshot(v5JustBought, 'slot_1');
        expect(migratedV5.books?.['book-ch1']?.unlocked).toBe(true);
        expect(migratedV5.wallet.balance).toBe(30);
    });

    it('filters out invalid skins, weapons, and invalid stage keys defensively', () =>
    {
        const maliciousData = {
            activeSkinId: 'hacked_skin',
            stageProgression: {
                unlockedStages: ['village', 'level-1', 'invalid_debug_stage'],
                completedStages: ['unknown_stage'],
            },
            gameStats: {
                highScore: -999,
                bestTimeSeconds: -10,
            },
            weapons: {
                owned: ['hacked_laser_death_ray'],
                equippedId: 'hacked_laser_death_ray',
            },
        };

        const sanitized = migrateSaveSnapshot(maliciousData);

        expect(sanitized.activeSkinId).toBe('cyber-blue');
        expect(sanitized.stageProgression.unlockedStages).toEqual(['village', 'level-1']);
        expect(sanitized.stageProgression.completedStages).toEqual([]);
        expect(sanitized.gameStats.highScore).toBe(0);
        expect(sanitized.gameStats.bestTimeSeconds).toBeNull();

        // Weapons sanitized
        expect(sanitized.weapons.owned).toEqual(['cyber-saber']);
        expect(sanitized.weapons.equippedId).toBe('cyber-saber');

    });
});
