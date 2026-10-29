/**
 * The kinds of Resource node as authored in `public/data/nodes.json`: how they look, what they
 * need and give. A Stage places them by id (`{ "kind": "node", "node": "oak-tree", "x": 300 }`).
 * See "Resource node" in CONTEXT.md.
 */

import { makeValidators } from './validate';

export interface StageDrop
{
    itemId: string;
    count: number;
}

export interface NodeDefinition
{
    id: string;
    /** The verb shown in the prompt, such as "ຕັດຕົ້ນໄມ້". */
    label: string;
    icon: string;
    /** Key of the node's spritesheet in Phaser's texture cache. */
    texture: string;
    /** How close to the node's centre the hero must stand to strike it (px). */
    reach: number;
    requiredTool: string | null;
    toolTier: number;
    /** How many Strikes it takes to deplete the node (see "Strike" in CONTEXT.md). */
    strikes: number;
    drops: StageDrop[];
}

type Validators = ReturnType<typeof makeValidators>;

/** Reads a list of `{ itemId, count }`; `v` names the file in the error message. */
export function parseDrops (v: Validators, value: unknown, path: string): StageDrop[]
{
    return v.asArray(value, path).map((raw, i) =>
    {
        const drop = v.asObject(raw, `${path}[${i}]`);
        const count = v.asNumber(drop.count, `${path}[${i}].count`);
        if (!Number.isInteger(count) || count < 1) v.fail(`${path}[${i}].count`, 'a whole number, at least 1');
        return { itemId: v.asString(drop.itemId, `${path}[${i}].itemId`), count };
    });
}

export function parseNodes (raw: unknown): NodeDefinition[]
{
    const v = makeValidators('nodes.json');
    const nodes = v.asArray(v.asObject(raw, 'root').nodes, 'nodes').map((entry, i): NodeDefinition =>
    {
        const p = `nodes[${i}]`;
        const node = v.asObject(entry, p);
        const strikes = v.asNumber(node.strikes, `${p}.strikes`);
        if (!Number.isInteger(strikes) || strikes < 1) v.fail(`${p}.strikes`, 'a whole number of Strikes, at least 1');
        const reach = v.asNumber(node.reach, `${p}.reach`);
        if (reach <= 0) v.fail(`${p}.reach`, 'more than 0');

        return {
            id: v.asString(node.id, `${p}.id`),
            label: v.asString(node.label, `${p}.label`),
            icon: v.asString(node.icon, `${p}.icon`),
            texture: v.asString(node.texture, `${p}.texture`),
            reach,
            requiredTool: node.requiredTool === null ? null : v.asString(node.requiredTool, `${p}.requiredTool`),
            toolTier: v.asNumber(node.toolTier, `${p}.toolTier`),
            strikes,
            drops: parseDrops(v, node.drops, `${p}.drops`),
        };
    });

    const ids = new Set<string>();
    nodes.forEach((node, i) =>
    {
        if (ids.has(node.id)) v.fail(`nodes[${i}].id`, `unique (${node.id} appears twice)`);
        ids.add(node.id);
    });
    return nodes;
}
