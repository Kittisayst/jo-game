import { describe, expect, it } from 'vitest';
import stageLevel from '../../../public/assets/levels/stage-ch1.json';
import villageLevel from '../../../public/assets/levels/village.json';
import stages from '../../../public/data/stages.json';
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

    it('lets the hero reach every platform in the village and in Chapter 1', () =>
    {
        expect(unreachable(villageLevel as LevelData)).toEqual([]);
        expect(unreachable(stageLevel as LevelData)).toEqual([]);
    });

    it('gives the Chapter 1 platforms a way up, not just one low step', () =>
    {
        const tops = surfacesOf(stageLevel as LevelData).map(s => s.top);
        expect(tops.some(top => GROUND_TOP - top > 120)).toBe(true);
    });

    it('would catch a platform that is too high to jump onto', () =>
    {
        const tooHigh: LevelData = { platforms: [{ x: 300, y: 480 }] };
        expect(unreachable(tooHigh)).toEqual(['platform at x=300']);
    });

    it('keeps spikes away from anything the hero has to stand next to', () =>
    {
        const standingSpots: number[] = [];
        for (const stage of stages)
        {
            for (const zone of stage.zones as { resourceNodes?: { x: number }[]; waypoint?: { x: number }; gate?: { x: number } }[])
            {
                standingSpots.push(...(zone.resourceNodes ?? []).map(n => n.x));
                if (zone.waypoint) standingSpots.push(zone.waypoint.x);
                if (zone.gate) standingSpots.push(zone.gate.x);
            }
        }

        for (const spike of (stageLevel as LevelData).spikes ?? [])
        {
            const nearest = Math.min(...standingSpots.map(x => Math.abs(x - spike.x)));
            expect(nearest, `spike at x=${spike.x}`).toBeGreaterThanOrEqual(90);
        }
    });
});
