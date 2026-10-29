import { makeValidators } from './validate';

/** How an item is drawn in the hero's hand: its image (optional, a placeholder is drawn without) and grip point. */
export interface HeldArt
{
    image?: string;
    gripX: number;
    gripY: number;
}

/**
 * Where the hero's fist is in one skin frame (32×48, from the top-left), which way the held item
 * points (degrees, 0 = up, positive = towards the facing side) and whether it is drawn in front of the body.
 */
export interface HandAnchor
{
    x: number;
    y: number;
    angle: number;
    front: boolean;
}

export interface HandAnchors
{
    frames: HandAnchor[];
    /** Per-skin corrections, by skin id and frame number. */
    overrides: Record<string, Record<number, HandAnchor>>;
}

export const SKIN_FRAME_COUNT = 16;
const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 48;
const HELD_CANVAS = 32;

/** Reads the `held` blocks of `items.json`, keyed by item id. */
export function parseHeldArt (raw: unknown): Record<string, HeldArt>
{
    const v = makeValidators('items.json');
    const result: Record<string, HeldArt> = {};

    v.asArray(raw, 'root').forEach((entry, i) =>
    {
        const item = v.asObject(entry, `items[${i}]`);
        if (item.held === undefined) return;

        const p = `items[${i}].held`;
        const held = v.asObject(item.held, p);
        const gripX = v.asNumber(held.gripX, `${p}.gripX`);
        const gripY = v.asNumber(held.gripY, `${p}.gripY`);
        if (gripX < 0 || gripX > HELD_CANVAS || gripY < 0 || gripY > HELD_CANVAS) v.fail(`${p}.gripX`, `inside the ${HELD_CANVAS}×${HELD_CANVAS} canvas`);

        result[v.asString(item.id, `items[${i}].id`)] = { image: v.optionalString(held.image, `${p}.image`), gripX, gripY };
    });

    return result;
}

export function parseHandAnchors (raw: unknown): HandAnchors
{
    const v = makeValidators('hand-anchors.json');
    const root = v.asObject(raw, 'root');

    const parseAnchor = (value: unknown, p: string): HandAnchor =>
    {
        const a = v.asObject(value, p);
        const x = v.asNumber(a.x, `${p}.x`);
        const y = v.asNumber(a.y, `${p}.y`);
        if (x < 0 || x > FRAME_WIDTH || y < 0 || y > FRAME_HEIGHT) v.fail(`${p}.x`, `inside the ${FRAME_WIDTH}×${FRAME_HEIGHT} frame`);
        const angle = v.asNumber(a.angle, `${p}.angle`);
        if (angle < -180 || angle > 180) v.fail(`${p}.angle`, 'between -180 and 180');
        return { x, y, angle, front: v.asBoolean(a.front, `${p}.front`) };
    };

    const frames = v.asArray(root.frames, 'frames').map((f, i) => parseAnchor(f, `frames[${i}]`));
    if (frames.length !== SKIN_FRAME_COUNT) v.fail('frames', `exactly ${SKIN_FRAME_COUNT} entries, one per skin frame`);

    const overrides: HandAnchors['overrides'] = {};
    if (root.overrides !== undefined)
    {
        const bySkin = v.asObject(root.overrides, 'overrides');
        for (const [skinId, rawFrames] of Object.entries(bySkin))
        {
            overrides[skinId] = {};
            for (const [frame, anchor] of Object.entries(v.asObject(rawFrames, `overrides.${skinId}`)))
            {
                const n = Number(frame);
                if (!Number.isInteger(n) || n < 0 || n >= SKIN_FRAME_COUNT) v.fail(`overrides.${skinId}.${frame}`, 'a frame number 0–15');
                overrides[skinId][n] = parseAnchor(anchor, `overrides.${skinId}.${frame}`);
            }
        }
    }

    return { frames, overrides };
}
