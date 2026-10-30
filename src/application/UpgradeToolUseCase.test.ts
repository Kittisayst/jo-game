import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { ResourceNode } from '../domain/entities/ResourceNode';
import { ToolUpgrades } from '../domain/entities/ToolUpgrades';
import { toolStrikeWeight, ToolUpgradeRecipe, upgradeToolUseCase } from './UpgradeToolUseCase';

const recipes: ToolUpgradeRecipe[] = [
    { id: 'u1', targetToolId: 'axe-t1', targetLevel: 1, building: 'workshop', strikeWeight: 1.5, ingredients: [{ itemId: 'wood', count: 10 }, { itemId: 'stone', count: 5 }] },
    { id: 'u2', targetToolId: 'axe-t1', targetLevel: 2, building: 'workshop', strikeWeight: 2, ingredients: [{ itemId: 'wood', count: 15 }] },
    { id: 'u3', targetToolId: 'axe-t1', targetLevel: 3, building: 'workshop', strikeWeight: 3, ingredients: [{ itemId: 'wood', count: 25 }] },
];

function pack (): Backpack
{
    const backpack = new Backpack();
    backpack.addItem('axe-t1', 1);
    backpack.addItem('wood', 60);
    backpack.addItem('stone', 10);
    return backpack;
}

describe('ToolUpgrades', () =>
{
    it('goes up one level at a time to +3', () =>
    {
        const upgrades = new ToolUpgrades();
        expect(upgrades.getLevel('axe-t1')).toBe(0);
        expect([upgrades.upgrade('axe-t1'), upgrades.upgrade('axe-t1'), upgrades.upgrade('axe-t1'), upgrades.upgrade('axe-t1')]).toEqual([true, true, true, false]);
        expect(upgrades.getLevel('axe-t1')).toBe(3);
        expect(upgrades.canUpgrade('axe-t1')).toBe(false);
        expect(upgrades.canUpgrade('pickaxe-t1')).toBe(true);
    });

    it('round-trips a snapshot and drops bad levels', () =>
    {
        const upgrades = new ToolUpgrades();
        upgrades.upgrade('axe-t1');
        const copy = new ToolUpgrades();
        copy.loadFrom(upgrades.toSnapshot());
        expect(copy.getLevel('axe-t1')).toBe(1);
        copy.loadFrom({ 'axe-t1': 9, 'pickaxe-t1': 1.5, 'axe-t2': 2 });
        expect(copy.toSnapshot()).toEqual({ 'axe-t2': 2 });
        copy.loadFrom(undefined);
        expect(copy.toSnapshot()).toEqual({});
    });
});

describe('upgradeToolUseCase', () =>
{
    it('takes the Materials and raises the tool', () =>
    {
        const backpack = pack();
        const upgrades = new ToolUpgrades();
        expect(upgradeToolUseCase('axe-t1', recipes, upgrades, backpack)).toEqual({ success: true, newLevel: 1, strikeWeight: 1.5 });
        expect(backpack.getItemCount('wood')).toBe(50);
        expect(backpack.getItemCount('stone')).toBe(5);
        expect(upgrades.getLevel('axe-t1')).toBe(1);
    });

    it('needs the tool, the Materials, a next level and a recipe', () =>
    {
        const noTool = new Backpack();
        noTool.addItem('wood', 60);
        expect(upgradeToolUseCase('axe-t1', recipes, new ToolUpgrades(), noTool)).toEqual({ success: false, reason: 'not_owned' });

        const poor = pack();
        poor.removeItem('stone', 10);
        const upgrades = new ToolUpgrades();
        expect(upgradeToolUseCase('axe-t1', recipes, upgrades, poor)).toEqual({ success: false, reason: 'insufficient_ingredients' });
        expect(poor.getItemCount('wood')).toBe(60);
        expect(upgrades.getLevel('axe-t1')).toBe(0);

        expect(upgradeToolUseCase('axe-t1', [], new ToolUpgrades(), pack())).toEqual({ success: false, reason: 'no_matching_recipe' });

        const full = new ToolUpgrades();
        for (let i = 0; i < 3; i++) full.upgrade('axe-t1');
        expect(upgradeToolUseCase('axe-t1', recipes, full, pack())).toEqual({ success: false, reason: 'max_level' });
    });
});

describe('toolStrikeWeight', () =>
{
    it('is 1 for a plain tool and the recipe weight of the level reached', () =>
    {
        const upgrades = new ToolUpgrades();
        expect(toolStrikeWeight(upgrades, recipes, 'axe-t1')).toBe(1);
        upgrades.upgrade('axe-t1');
        expect(toolStrikeWeight(upgrades, recipes, 'axe-t1')).toBe(1.5);
        upgrades.upgrade('axe-t1');
        upgrades.upgrade('axe-t1');
        expect(toolStrikeWeight(upgrades, recipes, 'axe-t1')).toBe(3);
        expect(toolStrikeWeight(upgrades, recipes, 'pickaxe-t1')).toBe(1);
    });

    it('makes a tree fall in fewer Strikes: 3 Strikes plain, 2 at +1, 1 at +3', () =>
    {
        const strikesToFell = (level: number): number =>
        {
            const upgrades = new ToolUpgrades();
            for (let i = 0; i < level; i++) upgrades.upgrade('axe-t1');
            const node = new ResourceNode(3);
            let strikes = 0;
            while (!node.isDepleted) { node.registerStrike(toolStrikeWeight(upgrades, recipes, 'axe-t1')); strikes++; }
            return strikes;
        };
        expect([0, 1, 2, 3].map(strikesToFell)).toEqual([3, 2, 2, 1]);
    });
});
