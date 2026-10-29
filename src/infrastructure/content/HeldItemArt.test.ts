import { describe, expect, it } from 'vitest';
import items from '../../../public/data/items.json';
import handAnchors from '../../../public/data/hand-anchors.json';
import { parseHandAnchors, parseHeldArt, SKIN_FRAME_COUNT } from './HeldItemArt';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe('held item art', () =>
{
    it('gives every weapon and tool a grip in the hand', () =>
    {
        const art = parseHeldArt(items);
        const holdable = items.filter(i => i.category === 'weapon' || i.category === 'tool').map(i => i.id);

        expect(Object.keys(art).sort()).toEqual(holdable.sort());
    });

    it('rejects a grip outside the 32×32 canvas', () =>
    {
        const broken = copy(items) as { held?: { gripX: number } }[];
        broken.find(i => i.held)!.held!.gripX = 40;

        expect(() => parseHeldArt(broken)).toThrow(/held\.gripX must be inside the 32×32 canvas/);
    });

    it('reads one hand anchor per skin frame', () =>
    {
        expect(parseHandAnchors(handAnchors).frames).toHaveLength(SKIN_FRAME_COUNT);
    });

    it('rejects a table with a missing frame or an anchor off the frame', () =>
    {
        const short = copy(handAnchors);
        short.frames.pop();
        expect(() => parseHandAnchors(short)).toThrow(/frames must be exactly 16 entries/);

        const off = copy(handAnchors);
        off.frames[3].y = 60;
        expect(() => parseHandAnchors(off)).toThrow(/frames\[3\]\.x must be inside the 32×48 frame/);
    });

    it('reads per-skin overrides', () =>
    {
        const withOverride = { ...copy(handAnchors), overrides: { 'neon-ninja': { 13: { x: 26, y: 24, angle: 90, front: true } } } };

        expect(parseHandAnchors(withOverride).overrides['neon-ninja'][13].x).toBe(26);
    });
});
