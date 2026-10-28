import { describe, expect, it } from 'vitest';
import { EquipmentState } from './EquipmentState';

describe('EquipmentState Entity', () =>
{
    it('initializes with wooden-sword at base damage 12', () =>
    {
        const equip = new EquipmentState();
        expect(equip.equippedWeaponId).toBe('wooden-sword');
        expect(equip.currentAttackPower).toBe(12);
        expect(equip.canUpgradeWeapon('wooden-sword')).toBe(false);
    });

    it('equips weapons and computes tiered damage with upgrades', () =>
    {
        const equip = new EquipmentState();
        expect(equip.equipWeapon('iron-sword')).toBe(true);
        expect(equip.equippedWeaponId).toBe('iron-sword');
        expect(equip.currentAttackPower).toBe(22); // Level 0

        // Upgrade to +1
        expect(equip.upgradeWeapon('iron-sword')).toBe(true);
        expect(equip.getUpgradeLevel('iron-sword')).toBe(1);
        expect(equip.currentAttackPower).toBe(27); // 22 + 5

        // Upgrade to +2
        expect(equip.upgradeWeapon('iron-sword')).toBe(true);
        expect(equip.currentAttackPower).toBe(32); // 22 + 10

        // Upgrade to +3 (max)
        expect(equip.upgradeWeapon('iron-sword')).toBe(true);
        expect(equip.currentAttackPower).toBe(38); // 22 + 16

        // Cannot upgrade beyond +3
        expect(equip.canUpgradeWeapon('iron-sword')).toBe(false);
        expect(equip.upgradeWeapon('iron-sword')).toBe(false);
    });

    it('rejects invalid weapon IDs and maintains state on snapshot restore', () =>
    {
        const equip = new EquipmentState();
        expect(equip.equipWeapon('unknown-sword')).toBe(false);
        expect(equip.equippedWeaponId).toBe('wooden-sword');

        equip.equipWeapon('crystal-sword');
        equip.upgradeWeapon('crystal-sword');

        const snapshot = equip.toSnapshot();
        const restored = EquipmentState.fromSnapshot(snapshot);

        expect(restored.equippedWeaponId).toBe('crystal-sword');
        expect(restored.getUpgradeLevel('crystal-sword')).toBe(1);
        expect(restored.currentAttackPower).toBe(46); // 38 + 8
    });

    it('exposes combat stats of the equipped sword, scaling with tier and range', () =>
    {
        const equip = new EquipmentState();
        const wooden = equip.equippedStats;
        expect(wooden).toEqual({ id: 'wooden-sword', damage: 12, cooldownMs: 380, range: 48 });

        equip.equipWeapon('crystal-sword');
        const crystal = equip.equippedStats;
        expect(crystal.damage).toBe(38);
        expect(crystal.range).toBeGreaterThan(wooden.range);
        expect(crystal.cooldownMs).toBeLessThan(wooden.cooldownMs);
    });
});
