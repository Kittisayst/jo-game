/**
 * `public/data/scenery.json`: how a Stage looks (backdrop layers, ground tile, platform art and decor) by scenery
 * name. The scene reads it, so a new look is a JSON entry plus images, not code.
 */

import { makeValidators } from './validate';

export interface TextureRef
{
    key: string;
    path: string;
}

export type BackdropAnchor = 'sky' | 'ground';

export interface BackdropLayer extends TextureRef
{
    /** How much of the camera's movement the layer follows: 0 stays fixed, 1 moves with the world. */
    scroll: number;
    /** `sky` stays put on the screen (the sky, the clouds); `ground` rides with the world's height so the layer's
     *  foot stays on the ground line, however the camera is lifted or zoomed. */
    anchor: BackdropAnchor;
    /** Where the layer's top is in the world (px), for an `anchor` of `ground`: the foot of the art at 612 lands on the ground at 656. */
    offsetY: number;
}

export type DecorLayer = 'back' | 'front';

export interface DecorKind extends TextureRef
{
    id: string;
    /** `back` is drawn behind the ground and the hero, `front` just in front of the ground (still behind the hero). */
    layer: DecorLayer;
    /** Chance of this kind next to the others (a whole number, at least 1). */
    weight: number;
    /** How far the sprite sinks into the ground (px), so its base looks planted. */
    offsetY: number;
}

export interface SceneryTheme
{
    backdrop: BackdropLayer[];
    ground: TextureRef;
    platform: TextureRef;
    /** The rock body of a raised ground block (under its grass-topped `ground` tile); tiles in both directions. */
    wall: TextureRef;
    /** Colours (0xRRGGBB) of the soil under the ground, the upper part and the deeper part. */
    soil: { upper: number; lower: number };
    decor: { perScreen: number; items: DecorKind[] };
}

export type SceneryCatalog = Record<string, SceneryTheme>;

const DECOR_LAYERS: readonly DecorLayer[] = ['back', 'front'];
const ANCHORS: readonly BackdropAnchor[] = ['sky', 'ground'];

function hexColor (v: ReturnType<typeof makeValidators>, value: unknown, path: string): number
{
    const text = v.asString(value, path);
    if (!/^#[0-9a-fA-F]{6}$/.test(text)) v.fail(path, 'a colour written #rrggbb');
    return parseInt(text.slice(1), 16);
}

export function parseScenery (raw: unknown): SceneryCatalog
{
    const v = makeValidators('scenery.json');
    const themes = v.asObject(v.asObject(raw, 'root').themes, 'themes');
    const keys = new Map<string, string>();

    const texture = (value: unknown, path: string): TextureRef =>
    {
        const entry = v.asObject(value, path);
        const key = v.asString(entry.key, `${path}.key`);
        const file = v.asString(entry.path, `${path}.path`);
        const known = keys.get(key);
        // The same key may be listed twice only for the same image (two themes sharing a tile)
        if (known !== undefined && known !== file) v.fail(`${path}.key`, `a key used for one image only ("${key}" is also ${known})`);
        keys.set(key, file);
        return { key, path: file };
    };

    const catalog: SceneryCatalog = {};
    for (const name of Object.keys(themes))
    {
        const p = `themes.${name}`;
        const theme = v.asObject(themes[name], p);

        const backdrop = v.asArray(theme.backdrop, `${p}.backdrop`).map((layer, i) =>
        {
            const lp = `${p}.backdrop[${i}]`;
            const entry = v.asObject(layer, lp);
            const scroll = v.asNumber(entry.scroll, `${lp}.scroll`);
            if (scroll < 0 || scroll > 1) v.fail(`${lp}.scroll`, 'between 0 and 1');
            const anchor = entry.anchor === undefined ? 'sky' : v.asOneOf(entry.anchor, ANCHORS, `${lp}.anchor`);
            const offsetY = entry.offsetY === undefined ? 0 : v.asNumber(entry.offsetY, `${lp}.offsetY`);
            return { ...texture(layer, lp), scroll, anchor, offsetY };
        });
        if (backdrop.length === 0) v.fail(`${p}.backdrop`, 'at least one layer');

        const decor = v.asObject(theme.decor, `${p}.decor`);
        const perScreen = v.asNumber(decor.perScreen, `${p}.decor.perScreen`);
        if (perScreen < 0 || perScreen > 20) v.fail(`${p}.decor.perScreen`, 'between 0 and 20');
        const ids = new Set<string>();
        const items = v.asArray(decor.items, `${p}.decor.items`).map((item, i) =>
        {
            const ip = `${p}.decor.items[${i}]`;
            const entry = v.asObject(item, ip);
            const id = v.asString(entry.id, `${ip}.id`);
            if (ids.has(id)) v.fail(`${ip}.id`, `unique ("${id}" is listed twice)`);
            ids.add(id);
            const weight = v.asNumber(entry.weight, `${ip}.weight`);
            if (!Number.isInteger(weight) || weight < 1) v.fail(`${ip}.weight`, 'a whole number, at least 1');
            const offsetY = entry.offsetY === undefined ? 0 : v.asNumber(entry.offsetY, `${ip}.offsetY`);
            return { id, ...texture(entry, ip), layer: v.asOneOf(entry.layer, DECOR_LAYERS, `${ip}.layer`), weight, offsetY };
        });
        if (perScreen > 0 && items.length === 0) v.fail(`${p}.decor.items`, 'at least one kind when perScreen is above 0');

        const soil = v.asObject(theme.soil, `${p}.soil`);
        catalog[name] = {
            backdrop,
            soil: { upper: hexColor(v, soil.upper, `${p}.soil.upper`), lower: hexColor(v, soil.lower, `${p}.soil.lower`) },
            wall: texture(theme.wall, `${p}.wall`),
            ground: texture(theme.ground, `${p}.ground`), platform: texture(theme.platform, `${p}.platform`),
            decor: { perScreen, items },
        };
    }
    return catalog;
}

/** Every texture a theme needs, once each, for the Preloader. */
export function themeTextures (theme: SceneryTheme): TextureRef[]
{
    const all = [...theme.backdrop, theme.ground, theme.wall, theme.platform, ...theme.decor.items];
    const seen = new Set<string>();
    return all.filter(t => (seen.has(t.key) ? false : (seen.add(t.key), true))).map(t => ({ key: t.key, path: t.path }));
}
