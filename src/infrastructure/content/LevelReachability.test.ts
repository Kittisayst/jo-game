import { describe, expect, it } from 'vitest';
import villageLevel from '../../../public/assets/levels/village.json';
import stages from '../../../public/data/stages.json';
import nodesJson from '../../../public/data/nodes.json';
import skillsJson from '../../../public/data/skills.json';
import { isStageReady, parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { parseNodes } from './NodeCatalog';
import { BIOMES, generateLevel, SECRET_GAPS } from './StageGenerator';
import { MAX_JUMP_RISE, MOVE_SPEED, JUMP_SPEED, GRAVITY_Y, PLATFORM_SURFACE_OFFSET, maxLeapGap } from '../phaser/physicsConstants';

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
/** What the air dash adds to a leap: the Dash speed for its duration, with no gravity (see `maxLeapGap`). */
const DASH_DISTANCE = (skillsJson.movement.dash.speed * skillsJson.movement.dash.durationMs) / 1000;

interface Surface { x: number; top: number; halfWidth: number; label: string }

type LevelData = {
    platforms: { x: number; y: number }[];
    secretPlatforms?: { x: number; y: number }[];
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

/** Every platform except the secret ledge (that one is checked on its own: only the air dash reaches it). */
function surfacesOf (level: LevelData): Surface[]
{
    const secret = level.secretPlatforms ?? [];
    const fixed = level.platforms.filter(p => !secret.some(s => s.x === p.x && s.y === p.y)).map(p => ({
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
                // The reward of the secret ledge stands high above the ground, so a spike below it is no danger
                ...z.resourceNodes.filter(n => !n.secret).map(n => n.x),
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

/**
 * The secret ledge: no plain jump reaches it (not from the ground, not from any platform, with a 10% margin for a
 * lucky player), and a jump with the air dash at its top reaches it from at least one platform, with 10% to spare.
 * Returns what is wrong, or nothing.
 */
function secretLedgeProblems (level: LevelData): string[]
{
    const problems: string[] = [];
    const secrets = level.secretPlatforms ?? [];
    const others = surfacesOf(level);
    for (const ledge of secrets)
    {
        const top = ledge.y - PLATFORM_SURFACE_OFFSET;
        if (GROUND_TOP - top <= MAX_JUMP_RISE) problems.push(`ledge x=${ledge.x} can be jumped to from the ground`);
        let dashFrom = false;
        for (const from of others)
        {
            const rise = from.top - top;
            const gap = Math.abs(ledge.x - from.x) - from.halfWidth - PLATFORM_HALF_WIDTH;
            if (gap <= maxLeapGap(rise) * 1.1) problems.push(`ledge x=${ledge.x} can be jumped to from the ${from.label}`);
            if (rise <= SAFE_RISE && gap > maxLeapGap(rise) * 1.1 && gap <= maxLeapGap(rise, DASH_DISTANCE) * 0.9) dashFrom = true;
        }
        if (!dashFrom) problems.push(`ledge x=${ledge.x} cannot be reached even with the air dash`);
    }
    return problems;
}

describe('secret ledges', () =>
{
    it('uses gaps that a jump to the ledge cannot cross and a jump with the air dash can, with room to spare', () =>
    {
        // The ledge is 72 px above its launch platform (a high step)
        const rise = 72;
        expect(maxLeapGap(rise)).toBeGreaterThan(120);
        expect(maxLeapGap(rise, DASH_DISTANCE)).toBeGreaterThan(maxLeapGap(rise) + 80);
        for (const gap of SECRET_GAPS)
        {
            expect(gap, `gap ${gap}`).toBeGreaterThan(maxLeapGap(rise) * 1.1);
            expect(gap, `gap ${gap}`).toBeLessThanOrEqual(maxLeapGap(rise, DASH_DISTANCE) * 0.9);
        }
        // Too high for a jump from the ground or from a low step
        expect(maxLeapGap(152)).toBe(-Infinity);
    });

    it('gives Stages 11 to 14 and 16 to 19 a ledge with exactly one reward on it, reachable only with the air dash', () =>
    {
        const withSecret = stageLevels.filter(l => l.stage.generated?.secret);
        expect(withSecret.map(l => l.stage.number)).toEqual([11, 12, 13, 14, 16, 17, 18, 19]);
        for (const { name, stage, level } of withSecret)
        {
            const rewards = stage.zones.flatMap(z => z.resourceNodes).filter(n => n.secret);
            expect(rewards, name).toHaveLength(1);
            expect(rewards[0].surfaceY, name).toBe(stage.generated!.secret!.surfaceY);
            expect(secretLedgeProblems(level), name).toEqual([]);
        }
    });

    it('builds a ledge that only the air dash reaches in every generated Stage that has room for one', () =>
    {
        let built = 0;
        for (const biome of BIOMES)
        {
            for (let seed = 0; seed < 500; seed++)
            {
                const screens = 2 + (seed % 4);
                const { level, secret } = generateLevel({ biome, seed, screens, secret: true });
                if (!secret) continue;
                built++;
                expect(level.secretPlatforms, `${biome} seed ${seed}`).toEqual([{ x: secret.x, y: secret.surfaceY + PLATFORM_SURFACE_OFFSET }]);
                expect(secretLedgeProblems(level), `${biome} seed ${seed}`).toEqual([]);
                expect(unreachable(level), `${biome} seed ${seed}`).toEqual([]);
            }
        }
        expect(built).toBeGreaterThan(400);
    });

    it('lays a Stage out as before when no ledge is asked for', () =>
    {
        for (let seed = 0; seed < 50; seed++)
        {
            const plain = generateLevel({ biome: 'cave', seed, screens: 4 });
            const withLedge = generateLevel({ biome: 'cave', seed, screens: 4, secret: true });
            expect(plain.level.secretPlatforms).toBeUndefined();
            expect(plain.secret).toBeUndefined();
            // The ledge is only added: everything else is the same
            expect(withLedge.level.platforms.slice(0, plain.level.platforms.length)).toEqual(plain.level.platforms);
            expect(withLedge.level.spikes).toEqual(plain.level.spikes);
        }
    });
});
