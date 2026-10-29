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
 * points (degrees, 0 = up, positive = towards the facing side), whether it is drawn in front of the
 * body, and whether it is put away in that frame (e.g. when fainting).
 */
export interface HandAnchor
{
    x: number;
    y: number;
    angle: number;
    front: boolean;
    hidden: boolean;
}

/** One row of the skin sheet: an animation. Frame numbers are `row * columns + column`. */
export interface PlayerAnimation
{
    row: number;
    frames: number;
    fps: number;
    loop: boolean;
}

export interface PlayerAnimations
{
    frame: { width: number; height: number; columns: number };
    animations: Record<string, PlayerAnimation>;
    /** The hand anchor of every cell of the sheet by frame number; null for unused cells. */
    anchors: (HandAnchor | null)[];
}

/** Every skin sheet has these rows; the game code asks for them by name. */
export const REQUIRED_ANIMATIONS = ['idle', 'run', 'air', 'attack', 'tool', 'wall', 'hurt', 'faint'] as const;
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

export function parsePlayerAnimations (raw: unknown): PlayerAnimations
{
    const v = makeValidators('player-animations.json');
    const root = v.asObject(raw, 'root');

    const frameSpec = v.asObject(root.frame, 'frame');
    const frame = {
        width: v.asNumber(frameSpec.width, 'frame.width'),
        height: v.asNumber(frameSpec.height, 'frame.height'),
        columns: v.asNumber(frameSpec.columns, 'frame.columns'),
    };
    if (frame.width !== FRAME_WIDTH || frame.height !== FRAME_HEIGHT) v.fail('frame', `${FRAME_WIDTH}×${FRAME_HEIGHT} per cell`);
    if (!Number.isInteger(frame.columns) || frame.columns < 1) v.fail('frame.columns', 'a whole number, at least 1');

    const animations: Record<string, PlayerAnimation> = {};
    const anchors: (HandAnchor | null)[] = [];
    const rowsSeen = new Set<number>();

    for (const [name, rawAnim] of Object.entries(v.asObject(root.animations, 'animations')))
    {
        const p = `animations.${name}`;
        const a = v.asObject(rawAnim, p);
        const row = v.asNumber(a.row, `${p}.row`);
        const frames = v.asNumber(a.frames, `${p}.frames`);
        if (!Number.isInteger(row) || row < 0) v.fail(`${p}.row`, 'a whole number, at least 0');
        if (rowsSeen.has(row)) v.fail(`${p}.row`, 'a row no other animation uses');
        rowsSeen.add(row);
        if (!Number.isInteger(frames) || frames < 1 || frames > frame.columns) v.fail(`${p}.frames`, `between 1 and ${frame.columns}`);
        const fps = v.asNumber(a.fps, `${p}.fps`);
        if (fps < 0) v.fail(`${p}.fps`, 'at least 0');
        animations[name] = { row, frames, fps, loop: v.asBoolean(a.loop, `${p}.loop`) };

        const list = v.asArray(a.anchors, `${p}.anchors`);
        if (list.length !== frames) v.fail(`${p}.anchors`, `exactly ${frames} entries, one per frame`);
        list.forEach((rawAnchor, i) =>
        {
            const ap = `${p}.anchors[${i}]`;
            const an = v.asObject(rawAnchor, ap);
            const x = v.asNumber(an.x, `${ap}.x`);
            const y = v.asNumber(an.y, `${ap}.y`);
            if (x < 0 || x > FRAME_WIDTH || y < 0 || y > FRAME_HEIGHT) v.fail(`${ap}.x`, `inside the ${FRAME_WIDTH}×${FRAME_HEIGHT} frame`);
            const angle = v.asNumber(an.angle, `${ap}.angle`);
            if (angle < -180 || angle > 180) v.fail(`${ap}.angle`, 'between -180 and 180');
            anchors[row * frame.columns + i] = {
                x, y, angle,
                front: v.asBoolean(an.front, `${ap}.front`),
                hidden: an.hidden === undefined ? false : v.asBoolean(an.hidden, `${ap}.hidden`),
            };
        });
    }

    for (const required of REQUIRED_ANIMATIONS)
    {
        if (!animations[required]) v.fail(`animations.${required}`, 'present: the game needs this animation');
    }
    for (let i = 0; i < anchors.length; i++) anchors[i] ??= null;

    return { frame, animations, anchors };
}
