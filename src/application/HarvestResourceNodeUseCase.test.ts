import { describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { harvestResourceNodeUseCase, RESOURCE_HARVESTED_EVENT, ResourceNodeDefinition } from './HarvestResourceNodeUseCase';
import { Backpack, BACKPACK_MAX_SLOTS } from '../domain/entities/Backpack';
import { ResourceNode } from '../domain/entities/ResourceNode';

describe('HarvestResourceNodeUseCase', () =>
{
    const treeDefinition: ResourceNodeDefinition = {
        id: 'tree-1',
        type: 'tree',
        requiredTool: 'axe',
        toolTier: 1,
        drops: [{ itemId: 'wood', count: 3 }],
    };

    const herbDefinition: ResourceNodeDefinition = {
        id: 'herb-1',
        type: 'herb',
        requiredTool: null,
        toolTier: 0,
        drops: [{ itemId: 'herb', count: 2 }],
    };

    const backpackWithAxe = () =>
    {
        const backpack = new Backpack();
        backpack.addItem('axe-t1', 1);
        return backpack;
    };

    it('fails to strike a tree when the player has no axe, and does not count the Strike', () =>
    {
        const backpack = new Backpack();
        const tree = new ResourceNode(3);
        const result = harvestResourceNodeUseCase(treeDefinition, tree, backpack);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('missing_tool');
        expect(result.requiredTool).toBe('axe');
        expect(tree.strikesTaken).toBe(0);
        expect(backpack.getItemCount('wood')).toBe(0);
    });

    it('gives no Materials until the third Strike fells a tree', () =>
    {
        const backpack = backpackWithAxe();
        const tree = new ResourceNode(3);

        const first = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(first).toMatchObject({ success: true, completed: false, strikesTaken: 1, strikesNeeded: 3, drops: [] });
        expect(backpack.getItemCount('wood')).toBe(0);

        const second = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(second).toMatchObject({ success: true, completed: false, strikesTaken: 2 });
        expect(backpack.getItemCount('wood')).toBe(0);

        const third = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(third).toMatchObject({ success: true, completed: true, strikesTaken: 3 });
        expect(third.drops).toEqual([{ itemId: 'wood', count: 3 }]);
        expect(backpack.getItemCount('wood')).toBe(3);
    });

    it('announces the harvest once, on the last Strike only', () =>
    {
        const backpack = backpackWithAxe();
        const tree = new ResourceNode(3);
        const harvested: string[] = [];
        const listener = (payload: { nodeId: string }) => harvested.push(payload.nodeId);
        DomainEvents.on(RESOURCE_HARVESTED_EVENT, listener);

        try
        {
            harvestResourceNodeUseCase(treeDefinition, tree, backpack);
            harvestResourceNodeUseCase(treeDefinition, tree, backpack);
            expect(harvested).toEqual([]);

            harvestResourceNodeUseCase(treeDefinition, tree, backpack);
            expect(harvested).toEqual(['tree-1']);
        }
        finally
        {
            DomainEvents.off(RESOURCE_HARVESTED_EVENT, listener);
        }
    });

    it('harvests herb by hand with a single Strike and no tool', () =>
    {
        const backpack = new Backpack();
        const result = harvestResourceNodeUseCase(herbDefinition, new ResourceNode(1), backpack);

        expect(result).toMatchObject({ success: true, completed: true });
        expect(backpack.getItemCount('herb')).toBe(2);
    });

    it('refuses every Strike while the backpack cannot hold the Materials, without counting them', () =>
    {
        const backpack = backpackWithAxe();
        // Fill the remaining 19 slots with 1 item each of maxStack 1
        for (let i = 0; i < BACKPACK_MAX_SLOTS - 1; i++)
        {
            backpack.addItem(`filler-${i}`, 1);
        }
        const tree = new ResourceNode(3);

        const first = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(first.success).toBe(false);
        expect(first.reason).toBe('backpack_full');
        expect(tree.strikesTaken).toBe(0);
    });

    it('keeps the Strikes already made when the backpack fills up before the last one', () =>
    {
        const backpack = backpackWithAxe();
        const tree = new ResourceNode(3);
        harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        harvestResourceNodeUseCase(treeDefinition, tree, backpack);

        for (let i = 0; i < BACKPACK_MAX_SLOTS - 1; i++)
        {
            backpack.addItem(`filler-${i}`, 1);
        }

        const blocked = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(blocked.reason).toBe('backpack_full');
        expect(tree.strikesTaken).toBe(2);
    });

    it('does nothing to a node that is already depleted', () =>
    {
        const backpack = backpackWithAxe();
        const tree = new ResourceNode(1);
        harvestResourceNodeUseCase(treeDefinition, tree, backpack);

        const again = harvestResourceNodeUseCase(treeDefinition, tree, backpack);
        expect(again.success).toBe(false);
        expect(again.reason).toBe('depleted');
        expect(backpack.getItemCount('wood')).toBe(3);
    });
});
