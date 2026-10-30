import { describe, expect, it } from 'vitest';
import { ActiveEffects, SPEED_POTION_MULTIPLIER, STRENGTH_DAMAGE_MULTIPLIER } from './ActiveEffects';
import { armorHeartsOf, armorSpeedBonusOf } from './Armor';
import { EquipmentState } from './EquipmentState';
import { Health } from './Health';
import { ItemCatalog, ItemDefinition } from './ItemCatalog';

const armor = (id: string, extra: Partial<ItemDefinition>): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'armor', maxStack: 1, icon: '', durability: 10, ...extra,
});

const catalog = new ItemCatalog([
    armor('helmet', { slot: 'head', armorHearts: 1 }),
    armor('chest', { slot: 'body', armorHearts: 2 }),
    armor('boots', { slot: 'feet', armorHearts: 1, speedBonus: 0.1 }),
]);

describe('Armor hearts of what is worn', () =>
{
    it('adds up the hearts of the worn pieces', () =>
    {
        const pieces = [{ itemId: 'helmet' }, { itemId: 'chest' }, { itemId: 'boots' }];

        expect(armorHeartsOf(pieces, catalog)).toBe(4);
        expect(armorHeartsOf([], catalog)).toBe(0);
    });

    it('counts a Broken piece for nothing, in hearts and in speed', () =>
    {
        const pieces = [{ itemId: 'chest', durability: 0 }, { itemId: 'boots', durability: 0 }];

        expect(armorHeartsOf(pieces, catalog)).toBe(0);
        expect(armorSpeedBonusOf(pieces, catalog)).toBe(0);
        expect(armorSpeedBonusOf([{ itemId: 'boots', durability: 3 }], catalog)).toBeCloseTo(0.1);
    });

    it('ignores an item that is not Armor', () =>
    {
        expect(armorHeartsOf([{ itemId: 'nothing' }], catalog)).toBe(0);
    });
});

describe('Health with Armor hearts', () =>
{
    it('loses an Armor heart before a heart of Health', () =>
    {
        const health = new Health();
        health.syncMaxArmor(2);
        expect(health.armor).toBe(2);

        expect(health.takeDamage()).toBe(false);
        expect(health.armor).toBe(1);
        expect(health.current).toBe(3);

        health.takeDamage();
        health.takeDamage();
        expect(health.armor).toBe(0);
        expect(health.current).toBe(2);
    });

    it('is only dead when the hearts of Health run out, after the Armor', () =>
    {
        const health = new Health();
        health.syncMaxArmor(1);

        expect([1, 2, 3, 4].map(() => health.takeDamage())).toEqual([false, false, false, true]);
        expect(health.isDead).toBe(true);
    });

    it('gains the hearts of a piece when it goes on and loses them when it comes off or breaks', () =>
    {
        const health = new Health();
        health.syncMaxArmor(1);
        health.syncMaxArmor(3);
        expect(health.armor).toBe(3);

        health.takeDamage();
        health.syncMaxArmor(1);
        expect(health.maxArmor).toBe(1);
        expect(health.armor).toBe(0);

        health.syncMaxArmor(0);
        expect(health.armor).toBe(0);
    });

    it('gets the Armor hearts back when reset (the hero is home)', () =>
    {
        const health = new Health();
        health.syncMaxArmor(2);
        health.takeDamage();
        health.takeDamage();
        health.takeDamage();

        health.reset();

        expect(health.current).toBe(3);
        expect(health.armor).toBe(2);
    });

    it('takes an armor potion as extra hearts that a reset removes again, with a limit', () =>
    {
        const health = new Health();
        health.syncMaxArmor(1);
        health.addBonusArmor(1);
        expect(health.armor).toBe(2);

        health.addBonusArmor(10);
        expect(health.armor).toBe(4);

        health.reset();
        expect(health.armor).toBe(1);
    });

    it('does not revive a dead hero with an armor potion', () =>
    {
        const health = new Health(0);
        health.addBonusArmor(1);

        expect(health.armor).toBe(0);
    });
});

describe('Armor on EquipmentState', () =>
{
    it('wears a piece per place and hands back the one it replaces', () =>
    {
        const equipment = new EquipmentState();

        expect(equipment.equipArmor('head', { itemId: 'helmet' })).toBeNull();
        expect(equipment.equipArmor('head', { itemId: 'helmet', durability: 4 })).toEqual({ itemId: 'helmet' });
        expect(equipment.getArmor('head')).toEqual({ itemId: 'helmet', durability: 4 });
        expect(equipment.getArmor('body')).toBeNull();
    });

    it('takes a piece off and lists what is worn in head, body, feet order', () =>
    {
        const equipment = new EquipmentState();
        equipment.equipArmor('feet', { itemId: 'boots' });
        equipment.equipArmor('head', { itemId: 'helmet' });

        expect(equipment.wornArmor.map(w => w.slot)).toEqual(['head', 'feet']);
        expect(equipment.unequipArmor('head')).toEqual({ itemId: 'helmet' });
        expect(equipment.unequipArmor('head')).toBeNull();
    });

    it('saves and loads the worn pieces with their Durability', () =>
    {
        const equipment = new EquipmentState();
        equipment.equipArmor('body', { itemId: 'chest' });
        equipment.setArmorDurability('body', 6);

        const loaded = new EquipmentState();
        loaded.loadFromSnapshot(equipment.toSnapshot());

        expect(loaded.getArmor('body')).toEqual({ itemId: 'chest', durability: 6 });
    });

    it('loads an old snapshot that has no Armor', () =>
    {
        const loaded = new EquipmentState();
        loaded.equipArmor('head', { itemId: 'helmet' });
        loaded.loadFromSnapshot({ equippedWeaponId: 'wooden-sword', upgradeLevels: {} });

        expect(loaded.wornArmor).toEqual([]);
    });
});

describe('ActiveEffects', () =>
{
    it('runs a timed effect down with game time and then removes it', () =>
    {
        const effects = new ActiveEffects();
        effects.apply('speed', 60);

        expect(effects.speedMultiplier).toBe(SPEED_POTION_MULTIPLIER);
        effects.tick(59_000);
        expect(effects.has('speed')).toBe(true);
        expect(effects.active).toEqual([{ effect: 'speed', remainingSeconds: 1 }]);
        effects.tick(1_000);
        expect(effects.has('speed')).toBe(false);
        expect(effects.speedMultiplier).toBe(1);
    });

    it('has a damage multiplier only while strength runs', () =>
    {
        const effects = new ActiveEffects();

        expect(effects.damageMultiplier).toBe(1);
        effects.apply('strength', 10);
        expect(effects.damageMultiplier).toBe(STRENGTH_DAMAGE_MULTIPLIER);
    });

    it('restarts the time when the same effect is drunk again, and runs several at once', () =>
    {
        const effects = new ActiveEffects();
        effects.apply('strength', 60);
        effects.apply('speed', 30);
        effects.tick(20_000);
        effects.apply('strength', 60);

        expect(effects.active).toEqual([
            { effect: 'strength', remainingSeconds: 60 },
            { effect: 'speed', remainingSeconds: 10 },
        ]);
    });

    it('ignores a zero duration and clears everything on request', () =>
    {
        const effects = new ActiveEffects();
        effects.apply('speed', 0);
        expect(effects.hasAny).toBe(false);

        effects.apply('speed', 5);
        effects.clear();
        expect(effects.hasAny).toBe(false);
    });
});
