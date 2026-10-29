import { describe, expect, it } from 'vitest';
import items from '../../../public/data/items.json';
import playerAnimations from '../../../public/data/player-animations.json';
import { parseHeldArt, parsePlayerAnimations, REQUIRED_ANIMATIONS } from './HeldItemArt';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
// The skin sheets as data URLs, so the test can read their size from the PNG header
const sheetFiles = Object.entries(import.meta.glob<string>('../../../public/assets/characters/player-skin-*.png', { query: '?inline', import: 'default', eager: true }));
/** Width and height of a PNG data URL, read from its header. */
const pngSize = (dataUrl: string): [number, number] =>
{
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1].slice(0, 44)), ch => ch.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    return [view.getUint32(16), view.getUint32(20)];
};
const heldFiles = new Set(
    Object.keys(import.meta.glob('../../../public/assets/held/*')).map(p => p.replace('../../../public/', ''))
);

describe('held item art', () =>
{
    it('gives every weapon and tool a grip in the hand', () =>
    {
        const art = parseHeldArt(items);
        const holdable = items.filter(i => i.category === 'weapon' || i.category === 'tool').map(i => i.id);

        expect(Object.keys(art).sort()).toEqual(holdable.sort());
    });

    it('points every held image to an existing file in public/assets/held/', () =>
    {
        const art = parseHeldArt(items);
        for (const [id, entry] of Object.entries(art))
        {
            if (entry.image)
            {
                expect(heldFiles.has(entry.image), `${id} -> ${entry.image}`).toBe(true);
            }
        }
    });

    it('rejects a grip outside the 32×32 canvas', () =>
    {
        const broken = copy(items) as { held?: { gripX: number } }[];
        broken.find(i => i.held)!.held!.gripX = 40;

        expect(() => parseHeldArt(broken)).toThrow(/held\.gripX must be inside the 32×32 canvas/);
    });

    describe('player animations', () =>
    {
        it('reads the eight animation rows and an anchor for every frame', () =>
        {
            const sheet = parsePlayerAnimations(playerAnimations);

            expect(Object.keys(sheet.animations)).toEqual([...REQUIRED_ANIMATIONS]);
            for (const [name, animation] of Object.entries(sheet.animations))
            {
                for (let i = 0; i < animation.frames; i++)
                {
                    expect(sheet.anchors[animation.row * sheet.frame.columns + i], `${name} frame ${i}`).not.toBeNull();
                }
            }
        });

        it('has a skin sheet on disk as big as the grid for every skin', () =>
        {
            const sheet = parsePlayerAnimations(playerAnimations);
            const rows = Math.max(...Object.values(sheet.animations).map(a => a.row)) + 1;

            expect(sheetFiles.length).toBe(4);
            for (const [file, dataUrl] of sheetFiles)
            {
                expect(pngSize(dataUrl), file).toEqual([sheet.frame.columns * sheet.frame.width, rows * sheet.frame.height]);
            }
        });

        it('rejects an animation without anchors for all its frames', () =>
        {
            const broken = copy(playerAnimations);
            broken.animations.run.anchors.pop();

            expect(() => parsePlayerAnimations(broken)).toThrow(/animations\.run\.anchors must be exactly 8 entries/);
        });

        it('rejects a missing required animation', () =>
        {
            const broken = copy(playerAnimations) as { animations: Record<string, unknown> };
            delete broken.animations.faint;

            expect(() => parsePlayerAnimations(broken)).toThrow(/animations\.faint must be present/);
        });

        it('rejects two animations on one row and more frames than columns', () =>
        {
            const sameRow = copy(playerAnimations);
            sameRow.animations.run.row = sameRow.animations.idle.row;
            expect(() => parsePlayerAnimations(sameRow)).toThrow(/animations\.run\.row must be a row no other animation uses/);

            const tooMany = copy(playerAnimations);
            tooMany.animations.idle.frames = 9;
            expect(() => parsePlayerAnimations(tooMany)).toThrow(/animations\.idle\.frames must be between 1 and 8/);
        });

        it('rejects an anchor off the 32×48 frame', () =>
        {
            const off = copy(playerAnimations);
            off.animations.idle.anchors[1].y = 60;

            expect(() => parsePlayerAnimations(off)).toThrow(/anchors\[1\]\.x must be inside the 32×48 frame/);
        });
    });
});
