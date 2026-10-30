import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { AttackCooldown } from '../domain/entities/Combat';
import { DomainEvents } from '../domain/DomainEvents';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { ItemCatalog, ItemDefinition } from '../domain/entities/ItemCatalog';
import { ResourceNode } from '../domain/entities/ResourceNode';
import { harvestResourceNodeUseCase } from './HarvestResourceNodeUseCase';
import { performAttackUseCase } from './PerformAttackUseCase';
import { repairItemUseCase, RepairRecipe } from './RepairItemUseCase';
import { returnToVillageUseCase } from './ReturnToVillageUseCase';
import { ITEM_BROKEN_EVENT, ITEM_REPAIRED_EVENT, ITEM_WORN_EVENT, ItemWornPayload } from './WearItemUseCase';

const item = (id: string, extra: Partial<ItemDefinition> = {}): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'weapon', maxStack: 1, icon: '', ...extra,
});

const catalog = new ItemCatalog([
    item('iron-sword', { durability: 10 }),
    item('axe-t1', { category: 'tool', toolType: 'axe', tier: 1, durability: 10 }),
    item('wooden-sword'),
    item('wood', { category: 'material', maxStack: 99 }),
    item('iron-ore', { category: 'material', maxStack: 99 }),
]);

const makeBackpack = () => new Backpack([], catalog);
const tree = { id: 'tree', type: 'oak-tree', requiredTool: 'axe', toolTier: 1, drops: [{ itemId: 'wood', count: 3 }] };

const listen = <T>(event: string) =>
{
    const heard: T[] = [];
    const listener = (payload: T) => heard.push(payload);
    DomainEvents.on(event, listener);
    return { heard, stop: () => DomainEvents.off(event, listener) };
};

describe('attacking with a sword that wears', () =>
{
    it('takes one Durability per swing and does full damage while it is not broken', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);
        const equipment = new EquipmentState('iron-sword');

        const attack = performAttackUseCase(equipment, new AttackCooldown(), backpack)!;

        expect(attack.damage).toBe(22);
        expect(attack.durabilityState).toBe('ok');
        expect(backpack.getDurability('iron-sword')?.current).toBe(9);
    });

    it('hits for half once the sword is broken, and the sword stays', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 10);
        const equipment = new EquipmentState('iron-sword');

        const attack = performAttackUseCase(equipment, new AttackCooldown(), backpack)!;

        expect(attack.damage).toBe(11);
        expect(attack.durabilityState).toBe('broken');
        expect(backpack.getItemCount('iron-sword')).toBe(1);
        expect(backpack.getDurability('iron-sword')?.current).toBe(0);
    });

    it('never wears the wooden sword, nor when no Backpack is given', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('wooden-sword', 1);
        backpack.addItem('iron-sword', 1);

        expect(performAttackUseCase(new EquipmentState('wooden-sword'), new AttackCooldown(), backpack)!.durabilityState).toBeUndefined();
        expect(performAttackUseCase(new EquipmentState('iron-sword'), new AttackCooldown())!.damage).toBe(22);
        expect(backpack.getDurability('iron-sword')?.current).toBe(10);
    });

    it('announces the wear, the warning and the break once', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);
        const equipment = new EquipmentState('iron-sword');
        const worn = listen<ItemWornPayload>(ITEM_WORN_EVENT);
        const broken = listen<{ itemId: string }>(ITEM_BROKEN_EVENT);

        for (let i = 0; i < 12; i++) performAttackUseCase(equipment, new AttackCooldown(), backpack);
        worn.stop();
        broken.stop();

        // Ten swings wear it; the two after that find it already broken and wear nothing
        expect(worn.heard).toHaveLength(10);
        expect(worn.heard.filter(w => w.previousState === 'ok' && w.state === 'low')).toHaveLength(1);
        expect(broken.heard).toEqual([{ itemId: 'iron-sword' }]);
    });
});

describe('harvesting with a tool that wears', () =>
{
    it('wears the tool by one per counted Strike', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('axe-t1', 1);
        const progress = new ResourceNode(3);

        const result = harvestResourceNodeUseCase(tree, progress, backpack);

        expect(result).toMatchObject({ success: true, completed: false, toolState: 'ok' });
        expect(backpack.getDurability('axe-t1')?.current).toBe(9);
    });

    it('does not wear the tool for a Strike that was refused', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('axe-t1', 1);
        for (let i = 0; i < 99; i++) backpack.addItem('iron-ore', 99);
        const full = harvestResourceNodeUseCase(tree, new ResourceNode(3), backpack);

        expect(full.success).toBe(false);
        expect(backpack.getDurability('axe-t1')?.current).toBe(10);
    });

    it('takes twice the Strikes with a broken tool', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('axe-t1', 1);
        backpack.wearItem('axe-t1', 10);
        const progress = new ResourceNode(3);

        let strikes = 0;
        let last = harvestResourceNodeUseCase(tree, progress, backpack);
        strikes++;
        while (!last.completed && strikes < 20)
        {
            last = harvestResourceNodeUseCase(tree, progress, backpack);
            strikes++;
        }

        expect(strikes).toBe(6);
        expect(last).toMatchObject({ completed: true, toolState: 'broken' });
        expect(backpack.getItemCount('wood')).toBe(3);
        expect(backpack.getItemCount('axe-t1')).toBe(1);
    });

    it('still takes a tool that never wears at face value', () =>
    {
        const noWear = new ItemCatalog([item('axe-t1', { category: 'tool' }), item('wood', { category: 'material', maxStack: 99 })]);
        const backpack = new Backpack([], noWear);
        backpack.addItem('axe-t1', 1);
        const progress = new ResourceNode(3);

        const result = harvestResourceNodeUseCase(tree, progress, backpack);

        expect(result.toolState).toBeUndefined();
        expect(progress.strikesTaken).toBe(1);
    });
});

describe('dying', () =>
{
    it('wears a tenth off every weapon and tool, besides losing half the Materials', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);
        backpack.addItem('axe-t1', 1);
        backpack.addItem('wood', 10);

        const result = returnToVillageUseCase('death', backpack);

        expect(result.wornItems.map(w => w.itemId)).toEqual(['iron-sword', 'axe-t1']);
        expect(backpack.getDurability('iron-sword')?.current).toBe(9);
        expect(backpack.getItemCount('wood')).toBe(5);
    });

    it('wears nothing in a safe Stage, on a safe waypoint trip or on an emergency retreat', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);

        expect(returnToVillageUseCase('safe_waypoint', backpack).wornItems).toEqual([]);
        expect(returnToVillageUseCase('emergency_retreat', backpack).wornItems).toEqual([]);
        expect(backpack.getDurability('iron-sword')?.current).toBe(10);
    });
});

describe('repairItemUseCase', () =>
{
    const recipes: RepairRecipe[] = [{ itemId: 'iron-sword', building: 'forge', ingredients: [{ itemId: 'iron-ore', count: 3 }] }];

    const wornSword = () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 10);
        return backpack;
    };

    it('takes the Materials and gives the item its full Durability back', () =>
    {
        const backpack = wornSword();
        backpack.addItem('iron-ore', 5);
        const repaired = listen<{ itemId: string }>(ITEM_REPAIRED_EVENT);

        const result = repairItemUseCase('iron-sword', recipes, backpack);
        repaired.stop();

        expect(result).toEqual({ success: true });
        expect(backpack.getDurability('iron-sword')).toMatchObject({ current: 10, state: 'ok' });
        expect(backpack.getItemCount('iron-ore')).toBe(2);
        expect(repaired.heard).toEqual([{ itemId: 'iron-sword' }]);
    });

    it('takes nothing when a Material is missing', () =>
    {
        const backpack = wornSword();
        backpack.addItem('iron-ore', 2);

        expect(repairItemUseCase('iron-sword', recipes, backpack)).toEqual({ success: false, reason: 'insufficient_ingredients' });
        expect(backpack.getItemCount('iron-ore')).toBe(2);
        expect(backpack.getDurability('iron-sword')?.current).toBe(0);
    });

    it('refuses an item that is not worn, missing, or has no recipe', () =>
    {
        const fresh = makeBackpack();
        fresh.addItem('iron-sword', 1);
        fresh.addItem('iron-ore', 9);
        expect(repairItemUseCase('iron-sword', recipes, fresh)).toEqual({ success: false, reason: 'not_worn' });
        expect(fresh.getItemCount('iron-ore')).toBe(9);

        expect(repairItemUseCase('iron-sword', recipes, makeBackpack())).toEqual({ success: false, reason: 'not_in_backpack' });
        expect(repairItemUseCase('axe-t1', recipes, fresh)).toEqual({ success: false, reason: 'no_recipe' });
    });
});
