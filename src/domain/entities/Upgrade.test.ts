import { describe, expect, it } from 'vitest';
import {
    getUpgradeDefinition,
    UPGRADE_CATALOG,
    UpgradeTree,
} from './Upgrade';

describe('Upgrade domain entity & catalog', () =>
{
    it('defines all valid upgrades in catalog', () =>
    {
        expect(UPGRADE_CATALOG.length).toBe(5);
        for (const up of UPGRADE_CATALOG)
        {
            expect(up.id).toBeTruthy();
            expect(up.maxLevel).toBeGreaterThan(0);
            expect(up.prices.length).toBe(up.maxLevel);
            expect(up.icon).toBeTruthy();
        }
    });

    it('retrieves upgrade definition with fallback', () =>
    {
        const def = getUpgradeDefinition('coinMagnet');
        expect(def.id).toBe('coinMagnet');
        expect(def.maxLevel).toBe(2);
    });

    it('initializes UpgradeTree with 0 levels by default', () =>
    {
        const tree = new UpgradeTree();
        expect(tree.getLevel('maxHp')).toBe(0);
        expect(tree.isMaxLevel('maxHp')).toBe(false);
        expect(tree.getCost('maxHp')).toBe(100);
    });

    it('upgrades successfully and increments level and costs', () =>
    {
        const tree = new UpgradeTree();
        expect(tree.upgrade('maxHp')).toBe(true);
        expect(tree.getLevel('maxHp')).toBe(1);
        expect(tree.getCost('maxHp')).toBe(200);

        expect(tree.upgrade('maxHp')).toBe(true);
        expect(tree.getLevel('maxHp')).toBe(2);
        expect(tree.getCost('maxHp')).toBe(350);

        expect(tree.upgrade('maxHp')).toBe(true);
        expect(tree.getLevel('maxHp')).toBe(3);
        expect(tree.isMaxLevel('maxHp')).toBe(true);
        expect(tree.getCost('maxHp')).toBeNull();

        // Cannot upgrade past max
        expect(tree.upgrade('maxHp')).toBe(false);
    });

    it('computes player upgrade stats correctly', () =>
    {
        const tree = new UpgradeTree({
            maxHp: 2,
            weaponPower: 3,
            attackSpeed: 1,
            coinMagnet: 2,
            dash: 1,
        });

        const stats = tree.computeStats();
        expect(stats.bonusMaxHp).toBe(2);
        expect(stats.bonusDamage).toBe(2); // Lv 3 power
        expect(stats.cooldownReductionFactor).toBeCloseTo(0.88);
        expect(stats.magnetRadius).toBe(140);
        expect(stats.hasDash).toBe(true);
    });

    it('resets and loads upgrade levels', () =>
    {
        const tree = new UpgradeTree({ dash: 1, maxHp: 3 });
        tree.reset();
        expect(tree.getLevel('dash')).toBe(0);
        expect(tree.getLevel('maxHp')).toBe(0);

        tree.loadFrom({ maxHp: 1, coinMagnet: 1 });
        expect(tree.getLevel('maxHp')).toBe(1);
        expect(tree.getLevel('coinMagnet')).toBe(1);
    });
});
