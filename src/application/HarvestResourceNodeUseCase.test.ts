import { describe, expect, it } from 'vitest';
import { harvestResourceNodeUseCase, ResourceNodeDefinition } from './HarvestResourceNodeUseCase';
import { Backpack } from '../domain/entities/Backpack';

describe('HarvestResourceNodeUseCase', () =>
{
    const treeNode: ResourceNodeDefinition = {
        id: 'tree-1',
        type: 'tree',
        requiredTool: 'axe',
        toolTier: 1,
        drops: [{ itemId: 'wood', count: 3 }],
    };

    const herbNode: ResourceNodeDefinition = {
        id: 'herb-1',
        type: 'herb',
        requiredTool: null,
        toolTier: 0,
        drops: [{ itemId: 'herb', count: 2 }],
    };

    it('fails to harvest tree when player has no axe', () =>
    {
        const backpack = new Backpack();
        const result = harvestResourceNodeUseCase(treeNode, backpack);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('missing_tool');
        expect(result.requiredTool).toBe('axe');
        expect(backpack.getItemCount('wood')).toBe(0);
    });

    it('successfully harvests tree when player has axe-t1', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('axe-t1', 1);

        const result = harvestResourceNodeUseCase(treeNode, backpack);
        expect(result.success).toBe(true);
        expect(backpack.getItemCount('wood')).toBe(3);
    });

    it('harvests herb by hand without needing any tool', () =>
    {
        const backpack = new Backpack();
        const result = harvestResourceNodeUseCase(herbNode, backpack);

        expect(result.success).toBe(true);
        expect(backpack.getItemCount('herb')).toBe(2);
    });

    it('fails when backpack has no room for drops', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('axe-t1', 1);
        // Fill remaining 19 slots with 1 item each of maxStack 1
        for (let i = 0; i < 19; i++)
        {
            backpack.addItem(`filler-${i}`, 1);
        }

        const result = harvestResourceNodeUseCase(treeNode, backpack);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('backpack_full');
    });
});

