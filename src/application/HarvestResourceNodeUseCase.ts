import { Backpack } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';
import { ResourceNode } from '../domain/entities/ResourceNode';
import { findTool } from '../domain/entities/HeldItem';
import { DurabilityState, strikeWeightFor } from '../domain/entities/Durability';
import { wearItemUseCase } from './WearItemUseCase';

export const RESOURCE_HARVESTED_EVENT = 'resource-harvested';

export interface ResourceDrop
{
    itemId: string;
    count: number;
}

export interface ResourceNodeDefinition
{
    id: string;
    type: string; // the node kind from nodes.json, such as 'oak-tree' or 'iron-vein'
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
    reason?: 'missing_tool' | 'backpack_full' | 'depleted';
    requiredTool?: string | null;
    /** True when this Strike was the last one and the Materials were handed over. */
    completed?: boolean;
    strikesTaken?: number;
    strikesNeeded?: number;
    /** How worn the tool was for this Strike; a Broken tool counts half a Strike. Missing for a tool that never wears. */
    toolState?: DurabilityState;
    drops: ResourceDrop[];
}

/**
 * One Strike on a Resource node. The Strike is refused, and not counted, when the tool is missing
 * or the Backpack cannot hold the Materials; otherwise the node gets one step closer to depleted
 * and gives its Materials on the last Strike.
 */
export function harvestResourceNodeUseCase (
    node: ResourceNodeDefinition,
    progress: ResourceNode,
    backpack: Backpack
): HarvestResult
{
    if (progress.isDepleted)
    {
        return { success: false, reason: 'depleted', drops: [] };
    }

    // 1. Check tool requirement
    let toolId: string | null = null;
    if (node.requiredTool)
    {
        toolId = findTool(backpack, node.requiredTool);

        if (toolId === null)
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

    // 3. Count the Strike (half of one with a Broken tool) and wear the tool; only the last Strike gives the Materials
    const toolReading = toolId ? backpack.getDurability(toolId) : null;
    progress.registerStrike(toolReading ? strikeWeightFor(toolReading.state) : 1);
    if (toolId && toolReading) wearItemUseCase(backpack, toolId);
    const strikeInfo = {
        strikesTaken: progress.strikesTaken,
        strikesNeeded: progress.strikesNeeded,
        ...(toolReading ? { toolState: toolReading.state } : {}),
    };

    if (!progress.isDepleted)
    {
        return { success: true, completed: false, ...strikeInfo, drops: [] };
    }

    // 4. Add drops to backpack
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
        completed: true,
        ...strikeInfo,
        drops: node.drops,
    };
}

