import { describe, expect, it } from 'vitest';
import stages from '../../../public/data/stages.json';
import nodesJson from '../../../public/data/nodes.json';
import { parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { parseNodes } from './NodeCatalog';
import { BIOMES, generateLevel, placePool } from './StageGenerator';
import {
    ENEMY_TERRAIN_CLEARANCE, isNearTerrain, NODE_TERRAIN_CLEARANCE, SPIKE_TERRAIN_CLEARANCE, terrainHeightAt, terrainProblem,
} from './LevelTerrain';

const WORLD = 2400;

describe('terrainProblem', () =>
{
    it('accepts steps of at most one tile and a hill', () =>
    {
        expect(terrainProblem(WORLD, undefined)).toBeNull();
        expect(terrainProblem(WORLD, [{ x: 600, width: 192, height: 64 }])).toBeNull();
        expect(terrainProblem(WORLD, [
            { x: 600, width: 128, height: 64 }, { x: 728, width: 192, height: 128 }, { x: 920, width: 128, height: 64 },
        ])).toBeNull();
    });

    it('refuses what is not whole tiles, too tall, or in the wrong place', () =>
    {
        expect(terrainProblem(WORLD, [{ x: 600, width: 100, height: 64 }])).toMatch(/whole number of tiles/);
        expect(terrainProblem(WORLD, [{ x: 600, width: 128, height: 256 }])).toMatch(/height 256/);
        expect(terrainProblem(WORLD, [{ x: 100, width: 128, height: 64 }])).toMatch(/from the start/);
        expect(terrainProblem(WORLD, [{ x: WORLD - 300, width: 128, height: 64 }])).toMatch(/from the end/);
        expect(terrainProblem(WORLD, [{ x: 600, width: 128, height: 64 }, { x: 700, width: 128, height: 64 }])).toMatch(/overlaps/);
        expect(terrainProblem(WORLD, [{ x: 900, width: 128, height: 64 }], [{ x: 1100, width: 100 }])).toMatch(/pit/);
    });

    it('refuses a wall nobody can climb by steps', () =>
    {
        expect(terrainProblem(WORLD, [{ x: 600, width: 128, height: 128 }])).toMatch(/more than one tile/);
        // A step beside it makes it climbable
        expect(terrainProblem(WORLD, [{ x: 600, width: 128, height: 64 }, { x: 728, width: 128, height: 128 }])).toBeNull();
        // A gap between two blocks is the ground again, so the second is not climbable from the first
        expect(terrainProblem(WORLD, [{ x: 600, width: 128, height: 64 }, { x: 760, width: 128, height: 192 }])).toMatch(/more than one tile/);
    });

    it('reads the height of the ground', () =>
    {
        const terrain = [{ x: 600, width: 128, height: 64 }, { x: 728, width: 192, height: 128 }];
        expect(terrainHeightAt(terrain, 100)).toBe(0);
        expect(terrainHeightAt(terrain, 650)).toBe(64);
        expect(terrainHeightAt(terrain, 800)).toBe(128);
        expect(terrainHeightAt(terrain, 920)).toBe(0);
        expect(isNearTerrain(terrain, 560, 60)).toBe(true);
        expect(isNearTerrain(terrain, 540, 60)).toBe(false);
    });
});

describe('generated raised ground', () =>
{
    it('is sound, clear of platforms, pits and spikes, in 500 Stages of each biome', () =>
    {
        let withTerrain = 0;
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 500; seed++)
            {
                const spec = { biome, seed, screens: 2 + (seed % 5), pits: seed % 3, terrain: 1 + (seed % 3) };
                const { level, pits, terrain } = generateLevel(spec);
                const label = `${biome} seed ${seed}`;
                expect(terrainProblem(level.worldWidth, level.terrain, pits), label).toBeNull();
                expect(terrain.length <= 3 * 5, label).toBe(true);
                for (const block of terrain)
                {
                    for (const platform of level.platforms)
                    {
                        // Nothing is wider than a platform's half plus the block: no platform floats over or into a block
                        expect(platform.x + 80 <= block.x || platform.x - 80 >= block.x + block.width, `${label} platform ${platform.x}`).toBe(true);
                    }
                    for (const spike of level.spikes ?? []) expect(isNearTerrain([block], spike.x, SPIKE_TERRAIN_CLEARANCE), `${label} spike ${spike.x}`).toBe(false);
                }
                if (terrain.length > 0) withTerrain++;
            }
        }
        // Most Stages have room for at least one piece
        expect(withTerrain).toBeGreaterThan(1000);
    });

    it('keeps nodes and enemies off the blocks', () =>
    {
        for (let seed = 0; seed < 200; seed++)
        {
            const generated = generateLevel({ biome: 'forest', seed, screens: 5, pits: 1, terrain: 2 });
            const placed = placePool(generated, { nodes: ['node-a', 'node-b'], nodeCount: 4, enemies: ['e'], enemyCount: 4 }, seed);
            for (const n of placed.nodes) expect(isNearTerrain(generated.level.terrain, n.x, NODE_TERRAIN_CLEARANCE), `seed ${seed} node ${n.x}`).toBe(false);
            for (const e of placed.enemies) expect(isNearTerrain(generated.level.terrain, e.x, ENEMY_TERRAIN_CLEARANCE), `seed ${seed} enemy ${e.x}`).toBe(false);
        }
    });

    it('lays a Stage out as before when no raised ground is asked for', () =>
    {
        for (let seed = 0; seed < 50; seed++)
        {
            const plain = generateLevel({ biome: 'forest', seed, screens: 4, pits: 1 });
            const asked = generateLevel({ biome: 'forest', seed, screens: 4, pits: 1, terrain: 2 });
            // Same platforms, pits and node ground; only the spikes beside a block may go
            expect(asked.level.platforms).toEqual(plain.level.platforms);
            expect(asked.level.pits).toEqual(plain.level.pits);
            expect(plain.level.terrain).toBeUndefined();
        }
    });
});

describe('raised ground in stages.json', () =>
{
    const parsed = parseStageDefinitions(stages, parseNodes(nodesJson));

    it('is in the early forest Stages that ask for it and is never in a Stage that cannot have it', () =>
    {
        for (const number of [2, 3, 4])
        {
            const stage = parsed.find(s => s.number === number)!;
            expect(stage.generated?.terrain.length, `Stage ${number}`).toBeGreaterThan(0);
        }
        for (const stage of parsed)
        {
            if (stage.number === 1 || stage.number % 5 === 0) expect(stage.generated?.terrain ?? [], `Stage ${stage.number}`).toEqual([]);
        }
    });

    it('is refused in the first Stage and fails clearly when it does not fit', () =>
    {
        const copy = (): typeof stages & { stages: { number: number; layout: { generate: Record<string, unknown> } }[] } => JSON.parse(JSON.stringify(stages));
        const first = copy();
        first.stages[0].layout = JSON.parse(JSON.stringify(first.stages[1].layout));
        expect(() => parseStageDefinitions(first, parseNodes(nodesJson))).toThrow(/no raised ground in the first Stage/);

        const bad = copy();
        bad.stages[1].layout.generate.terrain = 9;
        expect(() => parseStageDefinitions(bad, parseNodes(nodesJson))).toThrow(/terrain must be a whole number of raised-ground pieces, 0 to 3/);
    });
});
