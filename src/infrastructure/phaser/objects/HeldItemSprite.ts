import { heldItemFor } from '../../../domain/entities/HeldItem';
import type { HandAnchor, HandAnchors, HeldArt } from '../../content/HeldItemArt';
import type { Player } from './Player';

/** Skin frames are 32×48 and drawn around the hero's centre. */
const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 48;
const HELD_CANVAS = 32;
const DEFAULT_GRIP = { gripX: 16, gripY: 26 };
/** How long a tool stays in the hand after it was used. */
const TOOL_SHOWN_MS = 600;

const OUTLINE = 0x0f172a;
const SWORD_COLORS: Record<string, { blade: number; edge: number; guard: number }> = {
    'wooden-sword': { blade: 0xb45309, edge: 0xd97706, guard: 0x78350f },
    'iron-sword': { blade: 0x94a3b8, edge: 0xe2e8f0, guard: 0x475569 },
    'crystal-sword': { blade: 0xa855f7, edge: 0xa5f3fc, guard: 0x6d28d9 },
};

export const heldTextureKey = (itemId: string) => `held-${itemId}`;

/**
 * The weapon or tool in the hero's hand, see "Held item" in CONTEXT.md. A separate image that
 * follows the fist of the current skin frame (from `hand-anchors.json`), mirrored when the hero
 * faces left. What is held is decided by the domain's `heldItemFor`; this only draws it.
 */
export class HeldItemSprite
{
    private readonly image: Phaser.GameObjects.Image;
    private shownItemId: string | null = null;
    private toolInUse: string | null = null;
    private toolMsLeft = 0;
    private context = { inVillage: true, equippedWeaponId: 'wooden-sword' };

    constructor (
        private readonly scene: Phaser.Scene,
        private readonly player: Player,
        private readonly anchors: HandAnchors,
        private readonly art: Record<string, HeldArt>
    )
    {
        this.image = scene.add.image(player.x, player.y, '__DEFAULT').setVisible(false);
        scene.events.on('postupdate', this.follow, this);
        scene.events.once('shutdown', () => scene.events.off('postupdate', this.follow, this));
    }

    /** Where the hero is and which weapon is equipped; called every frame by the scene. */
    setContext (inVillage: boolean, equippedWeaponId: string): void
    {
        this.context = { inVillage, equippedWeaponId };
    }

    /** Puts a tool in the hand for a moment (striking a node, repairing a gate). */
    useTool (toolId: string | null): void
    {
        if (!toolId) return;
        this.toolInUse = toolId;
        this.toolMsLeft = TOOL_SHOWN_MS;
    }

    get heldItemId (): string | null
    {
        return this.shownItemId;
    }

    private follow (_time: number, delta: number): void
    {
        const { player, image } = this;

        if (this.toolMsLeft > 0)
        {
            this.toolMsLeft -= delta;
            if (this.toolMsLeft <= 0) this.toolInUse = null;
        }

        const itemId = player.active
            ? heldItemFor({ ...this.context, toolInUse: this.toolInUse })
            : null;

        if (!itemId)
        {
            image.setVisible(false);
            this.shownItemId = null;
            return;
        }

        if (itemId !== this.shownItemId) this.show(itemId);

        const anchor = this.anchorFor(Number(player.frame.name));
        const flip = player.flipX;
        const { gripX, gripY } = this.art[itemId] ?? DEFAULT_GRIP;
        const left = player.x - FRAME_WIDTH / 2;
        const top = player.y - FRAME_HEIGHT / 2;

        // Mirror gripX explicitly when flipped because Phaser's flipX does not mirror originX
        image.setOrigin((flip ? HELD_CANVAS - gripX : gripX) / HELD_CANVAS, gripY / HELD_CANVAS);
        image.setPosition(left + (flip ? FRAME_WIDTH - anchor.x : anchor.x), top + anchor.y);
        image.setAngle(flip ? -anchor.angle : anchor.angle);
        image.setFlipX(flip);
        image.setDepth(player.depth + (anchor.front ? 0.5 : -0.5));
        image.setAlpha(player.alpha);
        image.setVisible(player.visible);
    }

    private anchorFor (frame: number): HandAnchor
    {
        const index = Number.isInteger(frame) && frame >= 0 && frame < this.anchors.frames.length ? frame : 0;
        return this.anchors.overrides[this.player.skinId]?.[index] ?? this.anchors.frames[index];
    }

    private show (itemId: string): void
    {
        const key = heldTextureKey(itemId);
        HeldItemSprite.ensurePlaceholder(this.scene, itemId);
        this.image.setTexture(key);
        this.shownItemId = itemId;
    }

    /** Draws a stand-in pointing straight up with its grip at (16, 26), used until a real PNG exists. */
    static ensurePlaceholder (scene: Phaser.Scene, itemId: string): void
    {
        const key = heldTextureKey(itemId);
        if (scene.textures.exists(key)) return;

        const g = scene.make.graphics({ x: 0, y: 0 });
        const handle = (fromY: number, toY: number, color = 0x78350f) =>
        {
            g.fillStyle(OUTLINE, 1).fillRect(14, fromY - 1, 4, toY - fromY + 2);
            g.fillStyle(color, 1).fillRect(15, fromY, 2, toY - fromY);
        };

        const sword = SWORD_COLORS[itemId];
        if (sword)
        {
            g.fillStyle(OUTLINE, 1).fillRect(13, 1, 6, 21);
            g.fillStyle(sword.blade, 1).fillRect(14, 2, 4, 19);
            g.fillStyle(sword.edge, 1).fillRect(14, 2, 1, 19);
            g.fillStyle(OUTLINE, 1).fillRect(10, 20, 12, 4);
            g.fillStyle(sword.guard, 1).fillRect(11, 21, 10, 2);
            handle(24, 29);
            g.fillStyle(OUTLINE, 1).fillRect(14, 29, 4, 3);
            g.fillStyle(sword.guard, 1).fillRect(15, 30, 2, 1);
        }
        else if (itemId.startsWith('pickaxe'))
        {
            handle(5, 30);
            g.fillStyle(OUTLINE, 1).fillRect(5, 2, 22, 6);
            g.fillStyle(0x94a3b8, 1).fillRect(6, 3, 20, 4);
            g.fillStyle(0xe2e8f0, 1).fillRect(6, 3, 20, 1);
        }
        else if (itemId.startsWith('hammer'))
        {
            handle(9, 30);
            g.fillStyle(OUTLINE, 1).fillRect(9, 1, 14, 10);
            g.fillStyle(0x64748b, 1).fillRect(10, 2, 12, 8);
            g.fillStyle(0x94a3b8, 1).fillRect(10, 2, 12, 2);
        }
        else
        {
            // Axe (and any unknown tool): handle with a blade on the facing side
            handle(3, 30);
            g.fillStyle(OUTLINE, 1).fillRect(16, 2, 10, 11);
            g.fillStyle(0x94a3b8, 1).fillRect(17, 3, 8, 9);
            g.fillStyle(0xe2e8f0, 1).fillRect(24, 3, 1, 9);
        }

        g.generateTexture(key, HELD_CANVAS, HELD_CANVAS);
        g.destroy();
    }
}
