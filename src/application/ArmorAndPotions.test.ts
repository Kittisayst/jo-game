import { describe, expect, it } from 'vitest';
import { ActiveEffects } from '../domain/entities/ActiveEffects';
import { Backpack } from '../domain/entities/Backpack';
import { AttackCooldown } from '../domain/entities/Combat';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { Health } from '../domain/entities/Health';
import { ItemCatalog, ItemDefinition } from '../domain/entities/ItemCatalog';
import { DomainEvents } from '../domain/DomainEvents';
import { deathWearWornArmorUseCase, equipArmorUseCase, unequipArmorUseCase, WornArmorContext } from './ArmorUseCases';
import { drinkPotionUseCase, POTION_DRUNK_EVENT, potionEffectOf } from './DrinkPotionUseCase';
import { performAttackUseCase } from './PerformAttackUseCase';
import { playerTakeDamageUseCase } from './PlayerTakeDamageUseCase';
import { ITEM_BROKEN_EVENT } from './WearItemUseCase';

const piece = (id: string, extra: Partial<ItemDefinition>): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'armor', maxStack: 1, icon: '', durability: 10, ...extra,
});
const potion = (id: string, extra: Partial<ItemDefinition>): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'consumable', maxStack: 20, icon: '', ...extra,
});

const catalog = new ItemCatalog([
    piece('helmet', { slot: 'head', armorHearts: 1 }),
    piece('helmet-2', { slot: 'head', armorHearts: 2 }),
    piece('chest', { slot: 'body', armorHearts: 2 }),
    potion('heal', { healAmount: 1 }),
    potion('strength', { effect: 'strength', durationSec: 60 }),
    potion('speed', { effect: 'speed', durationSec: 60 }),
    potion('armor', { effect: 'armor', amount: 1 }),
    potion('kit', {}),
    { id: 'iron-sword', name: 's', nameEn: 's', description: '', category: 'weapon', maxStack: 1, icon: '', durability: 10 },
]);

const setup = () =>
{
    const backpack = new Backpack([], catalog);
    const context: WornArmorContext = { equipment: new EquipmentState(), health: new Health(), catalog };
    return { backpack, context, ...context };
};

describe('putting Armor on and taking it off', () =>
{
    it('moves the piece out of the Backpack, so it takes no slot, and gives its Armor hearts', () =>
    {
        const { backpack, context, health, equipment } = setup();
        backpack.addItem('helmet', 1);

        expect(equipArmorUseCase('helmet', backpack, context)).toEqual({ success: true, replacedItemId: null });

        expect(backpack.usedSlotsCount).toBe(0);
        expect(equipment.getArmor('head')).toEqual({ itemId: 'helmet' });
        expect(health.maxArmor).toBe(1);
        expect(health.armor).toBe(1);
    });

    it('swaps a piece in the same place and puts the old one back with its wear', () =>
    {
        const { backpack, context, health, equipment } = setup();
        backpack.addItem('helmet', 1);
        equipArmorUseCase('helmet', backpack, context);
        equipment.setArmorDurability('head', 4);
        backpack.addItem('helmet-2', 1);

        expect(equipArmorUseCase('helmet-2', backpack, context)).toEqual({ success: true, replacedItemId: 'helmet' });

        expect(backpack.getDurability('helmet')?.current).toBe(4);
        expect(health.maxArmor).toBe(2);
    });

    it('refuses what is not Armor and what is not in the Backpack', () =>
    {
        const { backpack, context } = setup();
        backpack.addItem('iron-sword', 1);

        expect(equipArmorUseCase('iron-sword', backpack, context)).toEqual({ success: false, reason: 'not_armor' });
        expect(equipArmorUseCase('helmet', backpack, context)).toEqual({ success: false, reason: 'not_in_backpack' });
    });

    it('takes a piece off into the Backpack and takes its hearts away', () =>
    {
        const { backpack, context, health, equipment } = setup();
        backpack.addItem('chest', 1);
        equipArmorUseCase('chest', backpack, context);
        equipment.setArmorDurability('body', 7);

        expect(unequipArmorUseCase('body', backpack, context)).toEqual({ success: true, itemId: 'chest' });

        expect(backpack.getDurability('chest')?.current).toBe(7);
        expect(health.maxArmor).toBe(0);
        expect(health.armor).toBe(0);
        expect(unequipArmorUseCase('body', backpack, context)).toEqual({ success: false, reason: 'nothing_worn' });
    });

    it('does not take a piece off when the Backpack is full', () =>
    {
        const { backpack, context, equipment } = setup();
        backpack.addItem('chest', 1);
        equipArmorUseCase('chest', backpack, context);
        for (let i = 0; i < backpack.maxSlots; i++) backpack.addItem('iron-sword', 1);

        expect(unequipArmorUseCase('body', backpack, context)).toEqual({ success: false, reason: 'backpack_full' });
        expect(equipment.getArmor('body')).not.toBeNull();
    });
});

describe('taking a hit with Armor', () =>
{
    it('lets the Armor heart take it, and wears every worn piece by one', () =>
    {
        const { backpack, context, health, equipment } = setup();
        backpack.addItem('helmet', 1);
        backpack.addItem('chest', 1);
        equipArmorUseCase('helmet', backpack, context);
        equipArmorUseCase('chest', backpack, context);

        playerTakeDamageUseCase(health, context);

        expect(health.current).toBe(3);
        expect(health.armor).toBe(2);
        expect(equipment.getArmor('head')?.durability).toBe(9);
        expect(equipment.getArmor('body')?.durability).toBe(9);
    });

    it('loses the hearts of a piece that breaks, and says so', () =>
    {
        const { backpack, context, health, equipment } = setup();
        backpack.addItem('chest', 1);
        equipArmorUseCase('chest', backpack, context);
        equipment.setArmorDurability('body', 1);
        const broken: unknown[] = [];
        const listener = (payload: unknown) => broken.push(payload);
        DomainEvents.on(ITEM_BROKEN_EVENT, listener);

        playerTakeDamageUseCase(health, context);
        DomainEvents.off(ITEM_BROKEN_EVENT, listener);

        expect(broken).toEqual([{ itemId: 'chest' }]);
        expect(health.maxArmor).toBe(0);
        expect(health.armor).toBe(0);
        expect(health.current).toBe(3);
    });

    it('still works with no Armor worn', () =>
    {
        const { health, context } = setup();

        playerTakeDamageUseCase(health, context);

        expect(health.current).toBe(2);
    });

    it('wears the worn Armor a tenth when the hero dies', () =>
    {
        const { backpack, context, equipment } = setup();
        backpack.addItem('helmet', 1);
        equipArmorUseCase('helmet', backpack, context);

        deathWearWornArmorUseCase(context);

        expect(equipment.getArmor('head')?.durability).toBe(9);
    });
});

describe('drinking Potions', () =>
{
    const drink = (id: string, backpack: Backpack, health = new Health(), effects = new ActiveEffects()) =>
        ({ result: drinkPotionUseCase(catalog.get(id), backpack, health, effects), health, effects });

    it('knows which items are Potions', () =>
    {
        expect([potionEffectOf(catalog.get('heal')), potionEffectOf(catalog.get('strength')), potionEffectOf(catalog.get('armor'))])
            .toEqual(['heal', 'strength', 'armor']);
        expect(potionEffectOf(catalog.get('kit'))).toBeNull();
        expect(potionEffectOf(undefined)).toBeNull();
    });

    it('heals a hurt hero and is spent, but stays when the hero is at full health', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('heal', 2);
        const health = new Health();

        expect(drink('heal', backpack, health).result).toEqual({ success: false, reason: 'already_full' });
        expect(backpack.getItemCount('heal')).toBe(2);

        health.takeDamage();
        expect(drink('heal', backpack, health).result).toEqual({ success: true, effect: 'heal' });
        expect(health.current).toBe(3);
        expect(backpack.getItemCount('heal')).toBe(1);
    });

    it('starts a timed effect for the potion duration and does not stack, only restarts', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('strength', 2);
        const effects = new ActiveEffects();

        drink('strength', backpack, new Health(), effects);
        effects.tick(30_000);
        drink('strength', backpack, new Health(), effects);

        expect(effects.active).toEqual([{ effect: 'strength', remainingSeconds: 60 }]);
        expect(backpack.getItemCount('strength')).toBe(0);
    });

    it('gives Armor hearts for an armor potion', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('armor', 1);
        const health = new Health();

        expect(drink('armor', backpack, health).result).toEqual({ success: true, effect: 'armor' });
        expect(health.armor).toBe(1);
    });

    it('refuses what is missing, what is not a Potion and a dead hero', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('kit', 1);
        backpack.addItem('speed', 1);

        expect(drink('speed', new Backpack([], catalog)).result).toEqual({ success: false, reason: 'not_in_backpack' });
        expect(drink('kit', backpack).result).toEqual({ success: false, reason: 'not_a_potion' });
        expect(drink('speed', backpack, new Health(0)).result).toEqual({ success: false, reason: 'dead' });
        expect(backpack.getItemCount('speed')).toBe(1);
    });

    it('announces what was drunk', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('speed', 1);
        const heard: unknown[] = [];
        const listener = (payload: unknown) => heard.push(payload);
        DomainEvents.on(POTION_DRUNK_EVENT, listener);

        drink('speed', backpack);
        DomainEvents.off(POTION_DRUNK_EVENT, listener);

        expect(heard).toEqual([{ itemId: 'speed', effect: 'speed' }]);
    });
});

describe('strength and wear together', () =>
{
    const swing = (durabilityLeft: number, strong: boolean) =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 10 - durabilityLeft);
        const effects = new ActiveEffects();
        if (strong) effects.apply('strength', 60);
        return performAttackUseCase(new EquipmentState('iron-sword'), new AttackCooldown(), backpack, effects)!.damage;
    };

    it('adds half to the damage of a healthy sword', () =>
    {
        expect(swing(10, false)).toBe(22);
        expect(swing(10, true)).toBe(33);
    });

    it('applies both to a Broken sword: half first, then the strength bonus', () =>
    {
        expect(swing(0, false)).toBe(11);
        expect(swing(0, true)).toBe(17);
    });
});
