import type { GateRequirements } from '../../../application/RepairBrokenGateUseCase';
import { ResourceNode } from '../../../domain/entities/ResourceNode';
import type {
    ResourceNodeType,
    StageDefinition,
    StageGate,
    StageResourceNode,
    StageWaypoint,
} from '../stages/StageDefinition';

const FONT = '"Noto Sans Lao", sans-serif';

/** A gatherable node standing in a Zone; `harvested` flips once its last Strike has landed. */
export interface ResourceNodeView extends StageResourceNode {
    y: number;
    /** The domain's count of Strikes taken so far. */
    progress: ResourceNode;
    /** Shakes the node when a Strike lands without felling it. */
    shakeOnStrike: () => void;
    /** Updates the node's visual from intact to harvested (stump / rubble / cut stems). */
    markHarvestedVisual: () => void;
    /** Interaction prompt shown while the player stands next to it. */
    label: string;
    /** How close to the node's centre the hero must stand to strike it (px). */
    reach: number;
    harvested: boolean;
}

export interface WaypointView {
    x: number;
    y: number;
    name: string;
}

/**
 * `reach`: the hero's tool is about 30 px long, so the hero must stand about that close to the
 * edge of the node's art: half its width plus a few px. A node is not struck from outside its own picture.
 */
const NODE_PROMPTS: Record<ResourceNodeType, { emoji: string; verb: string; textureKey: string; reach: number }> = {
    'tree': { emoji: '🪵', verb: 'ຕັດຕົ້ນໄມ້', textureKey: 'node-tree', reach: 44 },
    'herb': { emoji: '🌿', verb: 'ເກັບສະໝຸນໄພ', textureKey: 'node-herb', reach: 30 },
    'stone': { emoji: '🪨', verb: 'ທຸບຫີນ', textureKey: 'node-stone', reach: 34 },
    'iron-vein': { emoji: '⛏️', verb: 'ຂຸດແຮ່ເຫຼັກ', textureKey: 'node-iron-vein', reach: 38 },
};

function titleCase(itemId: string): string {
    return itemId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function nodePrompt(node: StageResourceNode): string {
    const { emoji, verb } = NODE_PROMPTS[node.type];
    const gains = node.drops.map(d => `+${d.count} ${titleCase(d.itemId)}`).join(', ');
    const strikes = node.strikes > 1 ? ` ×${node.strikes}` : '';
    return `${emoji} [E] ${verb}${strikes} (${gains})`;
}

function createNodeVisual(
    scene: Phaser.Scene,
    node: StageResourceNode,
    baseY: number
): { shakeOnStrike: () => void; markHarvestedVisual: () => void } {
    const { textureKey } = NODE_PROMPTS[node.type];

    if (scene.textures.exists(textureKey)) {
        const sprite = scene.add.sprite(node.x, baseY + 2, textureKey, 0);
        sprite.setOrigin(0.5, 1);
        sprite.setDepth(2);

        return {
            shakeOnStrike: () => {
                scene.tweens.add({
                    targets: sprite,
                    angle: { from: -4, to: 4 },
                    duration: 55,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut',
                    onComplete: () => sprite.setAngle(0),
                });
            },
            markHarvestedVisual: () => {
                sprite.setFrame(1);
                scene.tweens.add({
                    targets: sprite,
                    scaleX: 1.15,
                    scaleY: 0.85,
                    duration: 90,
                    yoyo: true,
                    ease: 'Quad.easeOut',
                });
            },
        };
    }

    // Procedural fallback when running without Preloader
    const g = scene.add.graphics();
    g.setDepth(2);
    g.fillStyle(0x16a34a, 1);
    g.fillCircle(node.x, baseY - 24, 18);
    return { shakeOnStrike: () => undefined, markHarvestedVisual: () => g.clear() };
}

function addWaypoint(scene: Phaser.Scene, wp: StageWaypoint, baseY: number): WaypointView {
    if (scene.textures.exists('waypoint-shrine')) {
        if (!scene.anims.exists('waypoint-shrine-pulse')) {
            scene.anims.create({
                key: 'waypoint-shrine-pulse',
                frames: scene.anims.generateFrameNumbers('waypoint-shrine', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1,
            });
        }
        const shrine = scene.add.sprite(wp.x, baseY + 2, 'waypoint-shrine', 0);
        shrine.setOrigin(0.5, 1);
        shrine.setDepth(2);
        shrine.play('waypoint-shrine-pulse');
    }
    else {
        const orb = scene.add.graphics();
        orb.setDepth(2);
        orb.fillStyle(0x06b6d4, 0.85);
        orb.fillCircle(wp.x, baseY - 35, 18);
    }

    const label = scene.add.text(wp.x, baseY - 94, wp.label, {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#67e8f9',
        stroke: '#083344',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(2.5);

    scene.tweens.add({
        targets: label,
        y: baseY - 100,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    return { x: wp.x, y: baseY - 35, name: wp.name };
}

/** The broken gate between the cavern and the boss arena; blocks the player until repaired. */
export class BrokenGate {
    readonly gateId: string;
    readonly requirements: GateRequirements;
    readonly x: number;
    readonly y: number;
    wall?: Phaser.Physics.Arcade.StaticGroup;

    private readonly sprite?: Phaser.GameObjects.Sprite;
    private readonly fallbackGraphic?: Phaser.GameObjects.Graphics;
    private readonly labelText: Phaser.GameObjects.Text;

    constructor(private readonly scene: Phaser.Scene, definition: StageGate, private readonly baseY: number) {
        this.gateId = definition.id;
        this.requirements = { requiredTool: definition.requiredTool, requiredItem: definition.requiredItem };
        this.x = definition.x;
        this.y = baseY - 70;

        if (scene.textures.exists('gate-ch1')) {
            this.sprite = scene.add.sprite(this.x, baseY + 2, 'gate-ch1', 0);
            this.sprite.setOrigin(0.5, 1);
            this.sprite.setDepth(2);
        }
        else {
            this.fallbackGraphic = scene.add.graphics();
            this.fallbackGraphic.setDepth(2);
        }

        this.labelText = scene.add.text(this.x, baseY - 172, '', {
            fontFamily: FONT,
            fontSize: '13px',
            color: '#fde047',
            stroke: '#0f172a',
            strokeThickness: 3,
            align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(3);
    }

    redraw(isRepaired: boolean): void {
        const { baseY, x: gx } = this;

        if (this.sprite) {
            this.sprite.setFrame(isRepaired ? 1 : 0);
        }
        else if (this.fallbackGraphic) {
            this.fallbackGraphic.clear();
            this.fallbackGraphic.fillStyle(isRepaired ? 0x10b981 : 0x78350f, 1);
            this.fallbackGraphic.fillRect(gx - 30, baseY - 120, 60, 120);
        }

        if (!isRepaired) {
            this.labelText.setText('🚪 ປະຕູຫັກພັງ (Broken Gate)\n[E] ໃຊ້ຄ້ອນ + ຊຸດສ້ອມແປງ');
            this.labelText.setColor('#fde047');

            if (!this.wall) {
                this.wall = this.scene.physics.add.staticGroup();
                const wallSprite = this.scene.physics.add.staticSprite(gx, baseY - 60, '');
                wallSprite.setSize(40, 120);
                wallSprite.setVisible(false);
                this.wall.add(wallSprite);
            }
        }
        else {
            this.labelText.setText('✨ ປະຕູສ້ອມແປງແລ້ວ! (Open)\nທາງຜ່ານສູ່ Zone C');
            this.labelText.setColor('#86efac');
        }
    }

    /** Opens the way: removes the invisible wall and redraws the repaired gate. */
    repair(): void {
        this.wall?.clear(true, true);
        this.redraw(true);
    }
}

export interface BuiltStage {
    resourceNodes: ResourceNodeView[];
    waypoints: WaypointView[];
    brokenGate?: BrokenGate;
}

/**
 * Draws a Stage's scenery from its definition: zone signs, waypoints, resource
 * nodes, the broken gate and the miniboss / boss banners. Enemies and the boss
 * themselves are spawned by the scene. `baseY` is the top of the ground.
 */
export function buildStageScenery(
    scene: Phaser.Scene,
    stage: StageDefinition,
    baseY: number,
    repairedGateIds: ReadonlySet<string>
): BuiltStage {
    const built: BuiltStage = { resourceNodes: [], waypoints: [] };

    for (const zone of stage.zones) {
        if (zone.waypoint) {
            built.waypoints.push(addWaypoint(scene, zone.waypoint, baseY));
        }

        for (const node of zone.resourceNodes ?? []) {
            const { shakeOnStrike, markHarvestedVisual } = createNodeVisual(scene, node, baseY);

            built.resourceNodes.push({
                ...node,
                y: baseY - 30,
                progress: new ResourceNode(node.strikes),
                shakeOnStrike,
                markHarvestedVisual,
                label: nodePrompt(node),
                reach: NODE_PROMPTS[node.type].reach,
                harvested: false,
            });
        }

        if (zone.sign) {
            if (scene.textures.exists('signpost')) {
                scene.add.image(zone.sign.x, baseY + 2, 'signpost').setOrigin(0.5, 1).setDepth(1.8);
            }

            scene.add.text(zone.sign.x, baseY - 74, zone.sign.text, {
                fontFamily: FONT,
                fontSize: '13px',
                color: zone.sign.color ?? '#86efac',
                stroke: zone.sign.stroke ?? '#064e3b',
                strokeThickness: 3,
                align: 'center',
            }).setOrigin(0.5, 0.5).setDepth(2.5);
        }

        for (const spawn of zone.enemySpawns ?? []) {
            if (!spawn.sign) continue;

            const sign = scene.add.text(spawn.x, baseY - 96, spawn.sign, {
                fontFamily: FONT,
                fontSize: '12px',
                color: '#f87171',
                stroke: '#450a0a',
                strokeThickness: 3,
                align: 'center',
            }).setOrigin(0.5, 0.5).setDepth(2.5);

            scene.tweens.add({
                targets: sign,
                y: baseY - 102,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        if (zone.gate) {
            const gate = new BrokenGate(scene, zone.gate, baseY);
            gate.redraw(repairedGateIds.has(zone.gate.id));
            built.brokenGate = gate;
        }

        if (zone.bossSpawn?.banner) {
            const banner = scene.add.text(zone.bossSpawn.x, 115, zone.bossSpawn.banner, {
                fontFamily: FONT,
                fontSize: '15px',
                color: '#fef08a',
                fontStyle: 'bold',
                align: 'center',
                stroke: '#7c3aed',
                strokeThickness: 3,
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                padding: { x: 14, y: 6 },
            }).setOrigin(0.5, 0.5).setDepth(2.5);

            scene.tweens.add({
                targets: banner,
                y: 122,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    return built;
}
