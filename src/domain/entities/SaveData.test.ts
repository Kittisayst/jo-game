import { describe, expect, it } from 'vitest';
import {
    CURRENT_SAVE_VERSION,
    createDefaultSaveSnapshot,
    migrateSaveSnapshot,
} from './SaveData';

describe('SaveData Domain Entity & Migration', () =>
{
    it('creates a clean default snapshot with CURRENT_SAVE_VERSION (v3)', () =>
    {
        const defaultSave = createDefaultSaveSnapshot('slot_1');
        expect(defaultSave.version).toBe(CURRENT_SAVE_VERSION);
        expect(defaultSave.version).toBe(3);
        expect(defaultSave.slotId).toBe('slot_1');
        expect(defaultSave.gameStats.highScore).toBe(0);
        expect(defaultSave.gameStats.bestTimeSeconds).toBeNull();
        expect(defaultSave.activeSkinId).toBe('cyber-blue');
        expect(defaultSave.settings.soundMuted).toBe(false);
        expect(defaultSave.stageProgression.unlockedStages).toEqual(['village', 'level-1']);
        expect(defaultSave.stageProgression.completedStages).toEqual([]);

        // v3 properties
        expect(defaultSave.wallet.balance).toBe(50);
        expect(defaultSave.weapons.owned).toEqual(['cyber-saber']);
        expect(defaultSave.weapons.equippedId).toBe('cyber-saber');
        expect(defaultSave.upgrades.maxHp).toBe(0);
        expect(defaultSave.inventory).toEqual({});
    });

    it('returns default snapshot when given null or non-object input', () =>
    {
        const saveFromNull = migrateSaveSnapshot(null, 'slot_2');
        expect(saveFromNull.slotId).toBe('slot_2');
        expect(saveFromNull.version).toBe(CURRENT_SAVE_VERSION);

        const saveFromString = migrateSaveSnapshot('corrupted_string', 'slot_3');
        expect(saveFromString.slotId).toBe('slot_3');
        expect(saveFromString.gameStats.highScore).toBe(0);
        expect(saveFromString.wallet.balance).toBe(50);
    });

    it('migrates legacy flat schema to version 3 successfully', () =>
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
            upgrades: {
                maxHp: 9999,
            },
            inventory: {
                'invalid-item': 50,
                'heal-potion': 100, // exceeds maxStack of 3
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

        // Upgrades clamped to maxLevel (maxHp is 3)
        expect(sanitized.upgrades.maxHp).toBe(3);

        // Inventory clamped
        expect(sanitized.inventory['invalid-item']).toBeUndefined();
        expect(sanitized.inventory['heal-potion']).toBe(3);
    });
});
