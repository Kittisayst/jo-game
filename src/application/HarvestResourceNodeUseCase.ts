import { Backpack } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';
import { ResourceNode } from '../domain/entities/ResourceNode';
import { findTool, toolTierOf } from '../domain/entities/HeldItem';
import { PlantRegrowth } from '../domain/entities/PlantRegrowth';
import type { Clock, Random } from '../domain/ports';
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
    /** A Seed this plant may drop when it is depleted (chance 0 to 1). */
    seed?: { itemId: string; chance: number };
    /** A small plant: minutes of real time before it can be harvested again (it stays a Sapling meanwhile). */
    regrowMinutes?: number;
}

/** What `harvestResourceNodeUseCase` needs besides the node: chance, time and where plants are remembered. */
export interface HarvestContext
{
    random?: Random;
    clock?: Clock;
    regrowth?: PlantRegrowth;
    /** The Stage the node stands in, to tell its plant apart from the same kind of plant elsewhere. */
    stageId?: string;
    /** How much one Strike with this tool counts (an upgraded tool counts for more than 1). */
    toolStrikeWeight?: (toolId: string) => number;
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
    /** The tier the node asks for, when the carried tool is of a lower tier (a node of tier 1 asks for nothing special). */
    requiredTier?: number;
    /** True when this Strike was the last one and the Materials were handed over. */
    completed?: boolean;
    strikesTaken?: number;
    strikesNeeded?: number;
    /** The Seed this last Strike dropped, when one did and it fitted in the Backpack. */
    seed?: ResourceDrop;
    /** True when the plant is now a Sapling and grows back after `regrowMinutes`. */
    regrowing?: boolean;
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
    backpack: Backpack,
    context: HarvestContext = {}
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

        if (toolId === null || toolTierOf(toolId) < node.toolTier)
        {
            return {
                success: false,
                reason: 'missing_tool',
                requiredTool: node.requiredTool,
                ...(node.toolTier > 1 ? { requiredTier: node.toolTier } : {}),
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
    progress.registerStrike((toolReading ? strikeWeightFor(toolReading.state) : 1) * (toolId ? context.toolStrikeWeight?.(toolId) ?? 1 : 1));
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

    // 5. A plant may drop a Seed (best effort: it is lost when the Backpack has no room for it)
    let seed: ResourceDrop | undefined;
    if (node.seed && (context.random ?? { next: Math.random }).next() < node.seed.chance)
    {
        const { added } = backpack.addItem(node.seed.itemId, 1);
        if (added > 0) seed = { itemId: node.seed.itemId, count: added };
    }

    // 6. A small plant becomes a Sapling: remember when, so it stays one for its minutes (even with the game closed)
    let regrowing = false;
    if (node.regrowMinutes && context.regrowth && context.clock && context.stageId)
    {
        context.regrowth.markHarvested(PlantRegrowth.keyOf(context.stageId, node.id), context.clock.now());
        regrowing = true;
    }

    DomainEvents.emit<ResourceHarvestedPayload>(RESOURCE_HARVESTED_EVENT, {
        nodeId: node.id,
        nodeType: node.type,
        drops: seed ? [...node.drops, seed] : node.drops,
    });

    return {
        success: true,
        completed: true,
        ...strikeInfo,
        drops: node.drops,
        ...(seed ? { seed } : {}),
        ...(regrowing ? { regrowing } : {}),
    };
}

