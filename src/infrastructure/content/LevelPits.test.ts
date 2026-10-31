import { describe, expect, it } from 'vitest';
import nodesJson from '../../../public/data/nodes.json';
import stages from '../../../public/data/stages.json';
import { parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { groundSpans, isNearPit, nearestPit, pitProblem, PIT_START_MARGIN, PIT_END_MARGIN, PIT_WIDTHS } from './LevelPits';
import { parseNodes } from './NodeCatalog';
import { BIOMES, ENEMY_PIT_CLEARANCE, generateLevel, NODE_PIT_CLEARANCE, PIT_PLATFORM_CLEARANCE, PIT_PIT_CLEARANCE, PIT_SPIKE_CLEARANCE, placePool, placePits } from './StageGenerator';
import { maxLeapGap } from '../phaser/physicsConstants';

describe('pits of a level', () =>
{
    it('cuts the ground into the stretches between the pits', () =>
    {
        expect(groundSpans(1600)).toEqual([[0, 1600]]);
        expect(groundSpans(1600, [{ x: 600, width: 100 }])).toEqual([[0, 600], [700, 1600]]);
        // Out of order, and two pits
        expect(groundSpans(2000, [{ x: 1200, width: 110 }, { x: 500, width: 90 }])).toEqual([[0, 500], [590, 1200], [1310, 2000]]);
    });

    it('says whether an x is over a pit or near one', () =>
    {
        const pits = [{ x: 600, width: 100 }];
        expect(isNearPit(pits, 650)).toBe(true);
        expect(isNearPit(pits, 599)).toBe(false);
        expect(isNearPit(pits, 599, 20)).toBe(true);
        expect(isNearPit(pits, 720, 20)).toBe(false);
        expect(isNearPit(pits, 719, 20)).toBe(true);
        expect(isNearPit(undefined, 650, 20)).toBe(false);
        expect(isNearPit([], 650, 20)).toBe(false);
    });

    it('finds the nearest pit by its edges', () =>
    {
        const pits = [{ x: 600, width: 100 }, { x: 1200, width: 90 }];
        expect(nearestPit(pits, 500)).toBe(pits[0]);
        expect(nearestPit(pits, 650)).toBe(pits[0]);
        expect(nearestPit(pits, 1000)).toBe(pits[1]);
        expect(nearestPit([], 10)).toBeUndefined();
    });

    it('says what is wrong with the pits of a hand-made level', () =>
    {
        expect(pitProblem(2000, undefined)).toBeNull();
        expect(pitProblem(2000, [{ x: 800, width: 110 }, { x: 1300, width: 90 }])).toBeNull();
        expect(pitProblem(2000, [{ x: 800, width: 10 }])).toMatch(/width/);
        expect(pitProblem(2000, [{ x: 50, width: 100 }])).toMatch(/200 px from both ends/);
        expect(pitProblem(2000, [{ x: 1850, width: 100 }])).toMatch(/200 px from both ends/);
        expect(pitProblem(2000, [{ x: 800, width: 100 }, { x: 950, width: 100 }])).toMatch(/200 px from the pit before/);
        expect(pitProblem(2000, [{ x: Number.NaN, width: 100 }])).toMatch(/number/);
    });
});

describe('generated pits', () =>
{
    const SAFE_GAP = maxLeapGap(0) * 0.65;

    it('use only widths that an easy jump crosses', () =>
    {
        for (const width of PIT_WIDTHS) expect(width, `width ${width}`).toBeLessThanOrEqual(SAFE_GAP);
    });

    it('give the same pits for the same seed, and a Stage without pits is laid out as before', () =>
    {
        const a = generateLevel({ biome: 'forest', seed: 7, screens: 3, pits: 2 });
        const b = generateLevel({ biome: 'forest', seed: 7, screens: 3, pits: 2 });
        expect(a.level.pits).toEqual(b.level.pits);

        const plain = generateLevel({ biome: 'forest', seed: 7, screens: 3 });
        expect(plain.level.pits).toBeUndefined();
        expect(plain.pits).toEqual([]);
        expect(a.level.platforms).toEqual(plain.level.platforms);
        // The pits only take the place of spikes near them
        for (const spike of a.level.spikes ?? []) expect(plain.level.spikes).toContainEqual(spike);
    });

    it('stand in the middle of the Stage, clear of platforms and of each other, for 500 seeds in each biome', () =>
    {
        let found = 0;
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 500; seed++)
            {
                const screens = 2 + (seed % 4);
                const { level, exitX, pits } = generateLevel({ biome, seed, screens, pits: 3 });
                const label = `${biome} seed ${seed}`;
                expect(pitProblem(level.worldWidth, level.pits), label).toBeNull();
                found += pits.length;
                for (const pit of pits)
                {
                    expect(pit.x, label).toBeGreaterThanOrEqual(PIT_START_MARGIN);
                    expect(pit.x + pit.width, label).toBeLessThanOrEqual(exitX - PIT_END_MARGIN);
                    for (const platform of level.platforms)
                    {
                        const apart = platform.x + PIT_PLATFORM_CLEARANCE <= pit.x || platform.x - PIT_PLATFORM_CLEARANCE >= pit.x + pit.width;
                        expect(apart, `${label}: platform ${platform.x} and pit ${pit.x}`).toBe(true);
                    }
                    for (const spike of level.spikes ?? [])
                    {
                        const apart = spike.x + PIT_SPIKE_CLEARANCE <= pit.x || spike.x - PIT_SPIKE_CLEARANCE >= pit.x + pit.width;
                        expect(apart, `${label}: spike ${spike.x} and pit ${pit.x}`).toBe(true);
                    }
                }
                for (let i = 1; i < pits.length; i++) expect(pits[i].x - (pits[i - 1].x + pits[i - 1].width), label).toBeGreaterThanOrEqual(PIT_PIT_CLEARANCE);
            }
        }
        expect(found).toBeGreaterThan(2000);
    });

    it('come back fewer than asked when the Stage has no room, and none when none are asked', () =>
    {
        expect(placePits(5, 1, [], 900).length).toBeLessThan(5);
        expect(generateLevel({ biome: 'cave', seed: 1, screens: 2, pits: 0 }).pits).toEqual([]);
    });

    it('keep every node and enemy of a spawn pool clear of them', () =>
    {
        for (let seed = 0; seed < 100; seed++)
        {
            const generated = generateLevel({ biome: 'forest', seed, screens: 4, pits: 3 });
            const placed = placePool(generated, { nodes: ['oak-tree'], nodeCount: 4, enemies: ['forest-slime'], enemyCount: 3 }, seed);
            for (const node of placed.nodes) expect(isNearPit(generated.level.pits, node.x, NODE_PIT_CLEARANCE), `seed ${seed} node ${node.x}`).toBe(false);
            for (const enemy of placed.enemies) expect(isNearPit(generated.level.pits, enemy.x, ENEMY_PIT_CLEARANCE), `seed ${seed} enemy ${enemy.x}`).toBe(false);
        }
    });
});

describe('pits in stages.json', () =>
{
    const parse = (data: unknown) => parseStageDefinitions(data, parseNodes(nodesJson));
    const copy = () => JSON.parse(JSON.stringify(stages)) as { stages: { number: number; layout: { generate: Record<string, unknown> } }[] };

    it('are in the Stages that ask for them, never in the first Stage or a Mini-boss or Boss Stage', () =>
    {
        const parsed = parse(stages);
        const withPits = parsed.filter(s => (s.generated?.pits.length ?? 0) > 0);
        expect(withPits.length).toBeGreaterThanOrEqual(15);
        for (const stage of withPits)
        {
            expect(stage.number, `Stage ${stage.number}`).not.toBe(1);
            expect(stage.number % 5, `Stage ${stage.number} is a Mini-boss or Boss Stage`).not.toBe(0);
        }
    });

    it('make a Stage give as many pits as it asks for (or fail with a clear message)', () =>
    {
        const data = copy();
        const stage3 = data.stages.find(s => s.number === 3)!;
        stage3.layout.generate.pits = 4;
        expect(() => parse(data)).toThrow(/stages\[2\]\.layout\.generate\.pits must be 4 pits that fit this Stage/);
        stage3.layout.generate.pits = 9;
        expect(() => parse(data)).toThrow(/pits must be a whole number of pits, 0 to 4/);
        stage3.layout.generate.pits = 'x';
        expect(() => parse(data)).toThrow(/pits/);
    });

    it('are refused in the first Stage', () =>
    {
        const data = copy();
        const stage2 = data.stages.find(s => s.number === 2)!;
        const stage1 = data.stages.find(s => s.number === 1)!;
        // Stage 1 is hand-made: give it a generated layout with a pit to see the rule
        stage1.layout = JSON.parse(JSON.stringify(stage2.layout));
        stage1.layout.generate.pits = 1;
        expect(() => parse(data)).toThrow(/no pits in the first Stage/);
    });
});
