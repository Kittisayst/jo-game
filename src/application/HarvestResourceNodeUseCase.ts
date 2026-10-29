import { Backpack } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';

export const RESOURCE_HARVESTED_EVENT = 'resource-harvested';

export interface ResourceDrop
{
    itemId: string;
    count: number;
}

export interface ResourceNodeDefinition
{
    id: string;
    type: string; // 'tree' | 'stone' | 'iron-vein' | 'herb'
    requiredTool: string | null; // e.g. 'axe' | 'pickaxe' | 'hammer'
    toolTier: number;
    drops: ResourceDrop[];
}

export interface ResourceHarvestedPayload
{
    nodeId: string;
    nodeType: string;
    drops: ResourceDrop[];
}

export interface HarvestResult
{
    success: boolean;
    reason?: 'missing_tool' | 'backpack_full';
    requiredTool?: string | null;
    drops: ResourceDrop[];
}

export function harvestResourceNodeUseCase (
    node: ResourceNodeDefinition,
    backpack: Backpack
): HarvestResult
{
    // 1. Check tool requirement
    if (node.requiredTool)
    {
        // Check if player has the matching tool in backpack (e.g. 'axe-t1' has 'axe')
        const allSlots = backpack.getAllSlots();
        const hasMatchingTool = allSlots.some(s =>
        {
            if (!s) return false;
            // Tool IDs follow pattern: axe-t1, pickaxe-t1, hammer-t1
            return s.itemId.startsWith(node.requiredTool!);
        });

        if (!hasMatchingTool)
        {
            return {
                success: false,
                reason: 'missing_tool',
                requiredTool: node.requiredTool,
                drops: [],
            };
        }
    }

    // 2. Check backpack capacity
    for (const drop of node.drops)
    {
        if (!backpack.canAddItem(drop.itemId, drop.count))
        {
            return {
                success: false,
                reason: 'backpack_full',
                drops: [],
            };
        }
    }

    // 3. Add drops to backpack
    for (const drop of node.drops)
    {
        backpack.addItem(drop.itemId, drop.count);
    }

    DomainEvents.emit<ResourceHarvestedPayload>(RESOURCE_HARVESTED_EVENT, {
        nodeId: node.id,
        nodeType: node.type,
        drops: node.drops,
    });

    return {
        success: true,
        drops: node.drops,
    };
}

