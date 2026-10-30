import { describe, expect, it } from 'vitest';
import villageLevel from '../../../public/assets/levels/village.json';
import stages from '../../../public/data/stages.json';
import nodesJson from '../../../public/data/nodes.json';
import { isStageReady, parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { parseNodes } from './NodeCatalog';
import { BIOMES, generateLevel } from './StageGenerator';
import { MAX_JUMP_RISE, MOVE_SPEED, JUMP_SPEED, GRAVITY_Y, PLATFORM_SURFACE_OFFSET } from '../phaser/physicsConstants';

/**
 * A platform nobody can jump onto is just decoration. These checks use the real jump numbers to make sure
 * every platform can be reached from the ground, or from another platform, with room to spare.
 */
const GROUND_TOP = 656;
const PLATFORM_HALF_WIDTH = 80;
const MOVING_PLATFORM_SURFACE_OFFSET = 12;
/** Use only this share of the highest jump, so a normal player can make it without perfect timing. */
const SAFE_RISE = MAX_JUMP_RISE * 0.85;
/** Sideways distance covered in the air by a jump: speed × time up and down. */
const AIR_DISTANCE = MOVE_SPEED * ((2 * JUMP_SPEED) / GRAVITY_Y);
/** The edge-to-edge gap one jump can bridge, again with a margin. */
const SAFE_GAP = AIR_DISTANCE * 0.5;

interface Surface { x: number; top: number; halfWidth: number; label: string }

type LevelData = {
    platforms: { x: number; y: number }[];
    movingPlatforms?: { x: number; y: number; distanceX?: number; distanceY?: number }[];
    spikes?: { x: number; y: number }[];
};

const levelFiles = Object.entries(
    import.meta.glob<LevelData>('../../../public/assets/levels/stage-*.json', { eager: true, import: 'default' })
).map(([path, level]) => ({ name: path.split('/').pop()!, level }));

/** Every built Stage as the game reads it: parsed from stages.json, with its level from a file or from the generator. */
const builtStages = parseStageDefinitions(stages, parseNodes(nodesJson)).filter(isStageReady);
const stageLevels = builtStages.map(stage => ({
    name: stage.id,
    stage,
    level: stage.generated
        ? (stage.generated.level as LevelData & { worldWidth: number })
        : (levelFiles.find(f => f.name === `${stage.id}.json`)!.level as LevelData & { worldWidth: number }),
}));

function surfacesOf (level: LevelData): Surface[]
{
    const fixed = level.platforms.map(p => ({
        x: p.x, top: p.y - PLATFORM_SURFACE_OFFSET, halfWidth: PLATFORM_HALF_WIDTH, label: `platform at x=${p.x}`,
    }));
    // A mover sweeps sideways; treat its whole path as the area it covers
    const moving = (level.movingPlatforms ?? []).map(p => ({
        x: p.x + (p.distanceX ?? 0) / 2,
        top: p.y - MOVING_PLATFORM_SURFACE_OFFSET,
        halfWidth: 70 + (p.distanceX ?? 0) / 2,
        label: `moving platform at x=${p.x}`,
    }));
    return [...fixed, ...moving];
}

function unreachable (level: LevelData): string[]
{
    const surfaces = surfacesOf(level);
    const reachable = new Set<Surface>();
    const canStepFrom = (fromTop: number, fromX: number, fromHalf: number, to: Surface) =>
    {
        const rise = fromTop - to.top;
        const gap = Math.abs(to.x - fromX) - fromHalf - to.halfWidth;
        return rise <= SAFE_RISE && gap <= SAFE_GAP;
    };

    // Start from the ground, then keep adding whatever can be reached from what is already reachable
    let grew = true;
    while (grew)
    {
        grew = false;
        for (const surface of surfaces)
        {
            if (reachable.has(surface)) continue;
            const fromGround = GROUND_TOP - surface.top <= SAFE_RISE;
            const fromPlatform = [...reachable].some(from => canStepFrom(from.top, from.x, from.halfWidth, surface));
            if (fromGround || fromPlatform)
            {
                reachable.add(surface);
                grew = true;
            }
        }
    }
    return surfaces.filter(s => !reachable.has(s)).map(s => s.label);
}

describe('level layout', () =>
{
    it('uses jump numbers that make sense', () =>
    {
        expect(MAX_JUMP_RISE).toBeGreaterThan(90);
        expect(MAX_JUMP_RISE).toBeLessThan(130);
    });

    it('lets the hero reach every platform in the village and in every built Stage', () =>
    {
        expect(unreachable(villageLevel as LevelData)).toEqual([]);
        expect(stageLevels.length).toBe(stages.stages.filter(s => s.status === 'ready').length);
        for (const { name, level } of stageLevels) expect(unreachable(level), name).toEqual([]);
    });

    it('lets the hero reach every platform of 500 generated Stages in each biome', () =>
    {
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 500; seed++)
            {
                const { level } = generateLevel({ biome, seed, screens: 2 + (seed % 4) });
                expect(unreachable(level), `${biome} seed ${seed}`).toEqual([]);
            }
        }
    });

    it('keeps everything of a built Stage inside its world and its exit before the end', () =>
    {
        for (const { name, stage, level } of stageLevels)
        {
            for (const zone of stage.zones)
            {
                const xs = [
                    ...zone.resourceNodes.map(n => n.x),
                    ...zone.enemySpawns.map(e => e.x),
                    ...zone.waypoints.map(w => w.x),
                    ...zone.signs.map(sign => sign.x),
                    ...(zone.exit ? [zone.exit.x] : []),
                    ...(zone.bossSpawn ? [zone.bossSpawn.x] : []),
                ];
                for (const x of xs) expect(x, name).toBeLessThan(level.worldWidth);
            }
        }
    });

    it('keeps the enemies of a generated Stage away from its spikes', () =>
    {
        for (const { name, stage, level } of stageLevels.filter(l => l.stage.generated))
        {
            for (const enemy of stage.zones.flatMap(z => z.enemySpawns))
            {
                for (const spike of level.spikes ?? []) expect(Math.abs(spike.x - enemy.x), name).toBeGreaterThanOrEqual(150);
            }
        }
    });

    it('gives the platforms of a Stage that has any a way up, not just one low step', () =>
    {
        for (const { name, level } of stageLevels.filter(l => l.level.platforms.length > 0))
        {
            const tops = surfacesOf(level).map(s => s.top);
            expect(tops.some(top => GROUND_TOP - top > 120), name).toBe(true);
        }
    });

    it('would catch a platform that is too high to jump onto', () =>
    {
        const tooHigh: LevelData = { platforms: [{ x: 300, y: 480 }] };
        expect(unreachable(tooHigh)).toEqual(['platform at x=300']);
    });

    it('keeps spikes away from anything the hero has to stand next to', () =>
    {
        for (const { stage, level } of stageLevels)
        {
            const standingSpots = stage.zones.flatMap(z => [
                ...z.resourceNodes.map(n => n.x),
                ...z.waypoints.map(w => w.x),
                ...(z.gate ? [z.gate.x] : []),
            ]);

            for (const spike of level.spikes ?? [])
            {
                const nearest = Math.min(...standingSpots.map(x => Math.abs(x - spike.x)));
                expect(nearest, `stage ${stage.number}: spike at x=${spike.x}`).toBeGreaterThanOrEqual(90);
            }
        }
    });
});
