import { describe, expect, it } from 'vitest';
import scenery from '../../../public/data/scenery.json';
import { generateLevel, BIOMES } from './StageGenerator';
import { parseScenery, themeTextures } from './SceneryCatalog';
import { DECOR_MIN_GAP, placeDecor, seedOf } from './SceneryDecor';

const theme = parseScenery(scenery).forest;
// Every image under public/assets, by path relative to public (a test cannot reach the disk without node types)
const images = new Set(Object.keys(import.meta.glob('../../../public/assets/**/*.png')).map(f => f.replace('../../../public/', '')));

describe('scenery.json', () =>
{
    it('parses and names only images that exist', () =>
    {
        const catalog = parseScenery(scenery);
        expect(Object.keys(catalog)).toContain('forest');
        for (const t of Object.values(catalog))
        {
            for (const texture of themeTextures(t))
            {
                expect(images.has(texture.path), texture.path).toBe(true);
            }
        }
    });

    it('only themes a scenery the generator knows', () =>
    {
        for (const name of Object.keys(parseScenery(scenery))) expect(BIOMES as readonly string[]).toContain(name);
    });

    it('names the file and path of a mistake', () =>
    {
        const bad = JSON.parse(JSON.stringify(scenery));
        bad.themes.forest.decor.items[0].weight = 0;
        expect(() => parseScenery(bad)).toThrow(/scenery\.json: themes\.forest\.decor\.items\[0\]\.weight/);

        const dup = JSON.parse(JSON.stringify(scenery));
        dup.themes.forest.decor.items[1].key = dup.themes.forest.decor.items[0].key;
        expect(() => parseScenery(dup)).toThrow(/key/);

        const far = JSON.parse(JSON.stringify(scenery));
        far.themes.forest.backdrop[0].scroll = 2;
        expect(() => parseScenery(far)).toThrow(/scroll/);

        const colour = JSON.parse(JSON.stringify(scenery));
        colour.themes.forest.soil.upper = 'brown';
        expect(() => parseScenery(colour)).toThrow(/#rrggbb/);
    });
});

describe('placeDecor', () =>
{
    it('is the same every time for the same seed, and differs for another', () =>
    {
        const a = placeDecor(theme, { worldWidth: 3200 }, seedOf('stage-002'));
        const b = placeDecor(theme, { worldWidth: 3200 }, seedOf('stage-002'));
        const c = placeDecor(theme, { worldWidth: 3200 }, seedOf('stage-003'));
        expect(a).toEqual(b);
        expect(a).not.toEqual(c);
        expect(a.length).toBeGreaterThan(10);
    });

    it('keeps clear of what must stay clear, and pieces apart', () =>
    {
        const avoid = [{ x: 600, clear: 120 }, { x: 1500, clear: 90 }];
        const pits = [{ x: 900, width: 100 }];
        const spikes = [{ x: 2000 }];
        for (let seed = 1; seed <= 100; seed++)
        {
            const placed = placeDecor(theme, { worldWidth: 3200, avoid, pits, spikes }, seed);
            for (const p of placed)
            {
                expect(Math.abs(p.x - 600)).toBeGreaterThanOrEqual(120);
                expect(Math.abs(p.x - 1500)).toBeGreaterThanOrEqual(90);
                expect(p.x < 870 || p.x > 1030).toBe(true);
                expect(Math.abs(p.x - 2000)).toBeGreaterThanOrEqual(60);
                expect(theme.decor.items.some(k => k.id === p.id)).toBe(true);
            }
            for (let i = 1; i < placed.length; i++) expect(placed[i].x - placed[i - 1].x).toBeGreaterThanOrEqual(DECOR_MIN_GAP);
        }
    });

    it('uses a hand-made list as written, and none when it is empty or perScreen is 0', () =>
    {
        const authored = [{ id: 'tree', x: 300 }, { id: 'nothing-like-this', x: 400 }, { id: 'tuft', x: 500, flip: true }];
        expect(placeDecor(theme, { worldWidth: 3200, authored }, 1)).toEqual([{ id: 'tree', x: 300 }, { id: 'tuft', x: 500, flip: true }]);
        expect(placeDecor(theme, { worldWidth: 3200, authored: [] }, 1)).toEqual([]);
        expect(placeDecor(theme, { worldWidth: 3200, perScreen: 0 }, 1)).toEqual([]);
    });

    it('never changes the layout of a generated Stage', () =>
    {
        const plain = generateLevel({ biome: 'forest', seed: 42, screens: 4, pits: 1 });
        const withDecor = generateLevel({ biome: 'forest', seed: 42, screens: 4, pits: 1, decor: 3 });
        expect(withDecor.level.decorPerScreen).toBe(3);
        expect({ ...withDecor.level, decorPerScreen: undefined }).toEqual({ ...plain.level, decorPerScreen: undefined });
        expect(plain.level.decorPerScreen).toBeUndefined();
    });
});
