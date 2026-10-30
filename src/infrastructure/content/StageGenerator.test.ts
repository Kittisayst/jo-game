import { describe, expect, it } from 'vitest';
import {
    BIOMES, ENEMY_SPIKE_CLEARANCE, generateLevel, GenerateSpec, NODE_SPIKE_CLEARANCE, placePool, SCREEN_WIDTH,
} from './StageGenerator';

const POOL = { nodes: ['oak-tree', 'wild-herb'], nodeCount: 6, enemies: ['forest-slime'], enemyCount: 3 };

describe('generateLevel', () =>
{
    it('gives the same Stage for the same seed and a different one for another seed', () =>
    {
        const spec: GenerateSpec = { biome: 'forest', seed: 3, screens: 2 };
        expect(generateLevel(spec)).toEqual(generateLevel({ ...spec }));
        expect(generateLevel(spec)).not.toEqual(generateLevel({ ...spec, seed: 4 }));
    });

    it('is as wide as its screens, with the exit before the end and the biome as scenery', () =>
    {
        const { level, exitX } = generateLevel({ biome: 'cave', seed: 7, screens: 3 });
        expect(level.worldWidth).toBe(3 * SCREEN_WIDTH);
        expect(level.scenery).toBe('cave');
        expect(exitX).toBeLessThan(level.worldWidth);
        expect(exitX).toBeGreaterThan(level.worldWidth - 200);
    });

    it('keeps every platform and spike inside the world, with a high step to climb', () =>
    {
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 300; seed++)
            {
                const { level, exitX } = generateLevel({ biome, seed, screens: 2 + (seed % 3) });
                for (const p of level.platforms)
                {
                    expect(p.x, `${biome} ${seed}`).toBeGreaterThan(80);
                    expect(p.x + 80, `${biome} ${seed}`).toBeLessThan(level.worldWidth);
                }
                for (const s of level.spikes ?? [])
                {
                    expect(s.x, `${biome} ${seed}`).toBeGreaterThan(400);
                    expect(s.x, `${biome} ${seed}`).toBeLessThan(exitX - 200);
                }
                expect(level.platforms.some(p => p.y <= 512), `${biome} ${seed}`).toBe(true);
            }
        }
    });

    it('refuses an unknown biome, a fractional seed and a Stage that is too wide or narrow', () =>
    {
        expect(() => generateLevel({ biome: 'desert' as never, seed: 1, screens: 2 })).toThrow(/biome/);
        expect(() => generateLevel({ biome: 'forest', seed: 1.5, screens: 2 })).toThrow(/seed/);
        expect(() => generateLevel({ biome: 'forest', seed: 1, screens: 1 })).toThrow(/screens/);
        expect(() => generateLevel({ biome: 'forest', seed: 1, screens: 9 })).toThrow(/screens/);
    });
});

describe('placePool', () =>
{
    it('places every node and enemy clear of the spikes and of the start and exit', () =>
    {
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 500; seed++)
            {
                const generated = generateLevel({ biome, seed, screens: 2 });
                const placed = placePool(generated, POOL, seed);
                const spikes = (generated.level.spikes ?? []).map(s => s.x);

                expect(placed.nodes, `${biome} ${seed}`).toHaveLength(6);
                expect(placed.enemies, `${biome} ${seed}`).toHaveLength(3);
                for (const node of placed.nodes)
                {
                    expect(node.x).toBeGreaterThanOrEqual(300);
                    expect(node.x).toBeLessThanOrEqual(generated.exitX - 150);
                    for (const sx of spikes) expect(Math.abs(sx - node.x), `${biome} ${seed}`).toBeGreaterThanOrEqual(NODE_SPIKE_CLEARANCE);
                }
                for (const enemy of placed.enemies)
                {
                    for (const sx of spikes) expect(Math.abs(sx - enemy.x), `${biome} ${seed}`).toBeGreaterThanOrEqual(ENEMY_SPIKE_CLEARANCE);
                }
            }
        }
    });

    it('uses every listed kind at least once, never puts two nodes on the same spot and is repeatable', () =>
    {
        const generated = generateLevel({ biome: 'forest', seed: 3, screens: 2 });
        const placed = placePool(generated, POOL, 3);
        expect(new Set(placed.nodes.map(n => n.id))).toEqual(new Set(['oak-tree', 'wild-herb']));
        expect(new Set(placed.nodes.map(n => n.x)).size).toBe(placed.nodes.length);
        expect(placePool(generated, POOL, 3)).toEqual(placed);
    });

    it('fails loudly when the Stage is too short for the items', () =>
    {
        const generated = generateLevel({ biome: 'forest', seed: 1, screens: 2 });
        expect(() => placePool(generated, { ...POOL, nodeCount: 20 }, 1)).toThrow(/do not fit/);
    });
});
