import type { GateRequirements } from '../../../application/RepairBrokenGateUseCase';
import type {
    ResourceNodeType,
    StageDefinition,
    StageGate,
    StageResourceNode,
    StageWaypoint,
} from '../stages/StageDefinition';

const FONT = '"Noto Sans Lao", sans-serif';

/** A gatherable node standing in a Zone; `harvested` flips once the player takes it. */
export interface ResourceNodeView extends StageResourceNode
{
    y: number;
    graphic: Phaser.GameObjects.Graphics;
    /** Interaction prompt shown while the player stands next to it. */
    label: string;
    harvested: boolean;
}

export interface WaypointView
{
    x: number;
    y: number;
    name: string;
}

const NODE_PROMPTS: Record<ResourceNodeType, { emoji: string; verb: string }> = {
    'tree': { emoji: '🪵', verb: 'ຕັດຕົ້ນໄມ້' },
    'herb': { emoji: '🌿', verb: 'ເກັບສະໝຸນໄພ' },
    'stone': { emoji: '🪨', verb: 'ທຸບຫີນ' },
    'iron-vein': { emoji: '⛏️', verb: 'ຂຸດແຮ່ເຫຼັກ' },
};

function titleCase (itemId: string): string
{
    return itemId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function nodePrompt (node: StageResourceNode): string
{
    const { emoji, verb } = NODE_PROMPTS[node.type];
    const gains = node.drops.map(d => `+${d.count} ${titleCase(d.itemId)}`).join(', ');
    return `${emoji} [E] ${verb} (${gains})`;
}

function drawNode (g: Phaser.GameObjects.Graphics, node: StageResourceNode, baseY: number): void
{
    const x = node.x;

    switch (node.type)
    {
        case 'tree':
            g.fillStyle(0x78350f, 1);
            g.fillRect(x - 10, baseY - 70, 20, 70);
            g.fillStyle(0x16a34a, 0.95);
            g.fillCircle(x, baseY - 90, 36);
            g.fillStyle(0x22c55e, 0.9);
            g.fillCircle(x - 8, baseY - 100, 24);
            break;
        case 'herb':
            g.fillStyle(0x16a34a, 1);
            g.fillRect(x - 2, baseY - 20, 4, 20);
            g.fillStyle(0x4ade80, 0.95);
            g.fillCircle(x, baseY - 24, 12);
            g.fillCircle(x - 6, baseY - 20, 8);
            g.fillCircle(x + 6, baseY - 20, 8);
            break;
        case 'stone':
            g.fillStyle(0x64748b, 1);
            g.fillCircle(x, baseY - 20, 22);
            g.fillStyle(0x94a3b8, 0.9);
            g.fillCircle(x - 5, baseY - 24, 12);
            break;
        case 'iron-vein':
            g.fillStyle(0x475569, 1);
            g.fillCircle(x, baseY - 24, 26);
            g.fillStyle(0xd97706, 1);
            g.fillTriangle(x - 12, baseY - 32, x - 2, baseY - 48, x + 8, baseY - 32);
            g.fillStyle(0xf59e0b, 1);
            g.fillTriangle(x, baseY - 24, x + 12, baseY - 40, x + 18, baseY - 24);
            break;
    }
}

function addWaypoint (scene: Phaser.Scene, wp: StageWaypoint, baseY: number): WaypointView
{
    const orb = scene.add.graphics();
    orb.setDepth(2);
    orb.fillStyle(0x06b6d4, 0.85);
    orb.fillCircle(wp.x, baseY - 35, 18);
    orb.lineStyle(2, 0x67e8f9, 1);
    orb.strokeCircle(wp.x, baseY - 35, 22);

    const label = scene.add.text(wp.x, baseY - 70, wp.label, {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#67e8f9',
        stroke: '#083344',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(2);

    scene.tweens.add({
        targets: [orb, label],
        y: '-=6',
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    return { x: wp.x, y: baseY - 35, name: wp.name };
}

/** The broken gate between the cavern and the boss arena; blocks the player until repaired. */
export class BrokenGate
{
    readonly gateId: string;
    readonly requirements: GateRequirements;
    readonly x: number;
    readonly y: number;
    wall?: Phaser.Physics.Arcade.StaticGroup;

    private readonly graphic: Phaser.GameObjects.Graphics;
    private readonly labelText: Phaser.GameObjects.Text;

    constructor (private readonly scene: Phaser.Scene, definition: StageGate, private readonly baseY: number)
    {
        this.gateId = definition.id;
        this.requirements = { requiredTool: definition.requiredTool, requiredItem: definition.requiredItem };
        this.x = definition.x;
        this.y = baseY - 70;

        this.graphic = scene.add.graphics();
        this.graphic.setDepth(2);

        this.labelText = scene.add.text(this.x, baseY - 130, '', {
            fontFamily: FONT,
            fontSize: '13px',
            color: '#fde047',
            stroke: '#713f12',
            strokeThickness: 3,
            align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(3);
    }

    redraw (isRepaired: boolean): void
    {
        const { baseY, x: gx, graphic: g } = this;
        g.clear();

        if (!isRepaired)
        {
            g.fillStyle(0x78350f, 1);
            g.fillRect(gx - 30, baseY - 120, 60, 120);
            g.fillStyle(0x334155, 1);
            g.fillRect(gx - 26, baseY - 110, 52, 12);
            g.fillRect(gx - 26, baseY - 60, 52, 12);
            g.lineStyle(3, 0xf59e0b, 1);
            g.strokeRect(gx - 30, baseY - 120, 60, 120);

            g.fillStyle(0xef4444, 1);
            g.fillCircle(gx, baseY - 70, 12);

            this.labelText.setText('🚪 ປະຕູຫັກພັງ (Broken Gate)\n[E] ໃຊ້ຄ້ອນ + ຊຸດສ້ອມແປງ');

            if (!this.wall)
            {
                this.wall = this.scene.physics.add.staticGroup();
                const wallSprite = this.scene.physics.add.staticSprite(gx, baseY - 60, '');
                wallSprite.setSize(40, 120);
                wallSprite.setVisible(false);
                this.wall.add(wallSprite);
            }
        }
        else
        {
            g.fillStyle(0x1e293b, 0.9);
            g.fillRect(gx - 40, baseY - 140, 18, 140);
            g.fillRect(gx + 22, baseY - 140, 18, 140);
            g.fillStyle(0x10b981, 1);
            g.fillRoundedRect(gx - 44, baseY - 150, 88, 16, 4);

            this.labelText.setText('✨ ປະຕູສ້ອມແປງແລ້ວ! (Open)\nທາງຜ່ານສູ່ Zone C');
            this.labelText.setColor('#86efac');
        }
    }

    /** Opens the way: removes the invisible wall and redraws the repaired gate. */
    repair (): void
    {
        this.wall?.clear(true, true);
        this.redraw(true);
    }
}

export interface BuiltStage
{
    resourceNodes: ResourceNodeView[];
    waypoints: WaypointView[];
    brokenGate?: BrokenGate;
}

/**
 * Draws a Stage's scenery from its definition: zone signs, waypoints, resource
 * nodes, the broken gate and the miniboss / boss banners. Enemies and the boss
 * themselves are spawned by the scene. `baseY` is the top of the ground.
 */
export function buildStageScenery (
    scene: Phaser.Scene,
    stage: StageDefinition,
    baseY: number,
    repairedGateIds: ReadonlySet<string>
): BuiltStage
{
    const built: BuiltStage = { resourceNodes: [], waypoints: [] };

    for (const zone of stage.zones)
    {
        if (zone.waypoint)
        {
            built.waypoints.push(addWaypoint(scene, zone.waypoint, baseY));
        }

        for (const node of zone.resourceNodes ?? [])
        {
            const graphic = scene.add.graphics();
            graphic.setDepth(2);
            drawNode(graphic, node, baseY);

            built.resourceNodes.push({
                ...node,
                y: baseY - 30,
                graphic,
                label: nodePrompt(node),
                harvested: false,
            });
        }

        if (zone.sign)
        {
            scene.add.text(zone.sign.x, baseY - 110, zone.sign.text, {
                fontFamily: FONT,
                fontSize: '13px',
                color: zone.sign.color ?? '#86efac',
                stroke: zone.sign.stroke ?? '#064e3b',
                strokeThickness: 3,
                align: 'center',
            }).setOrigin(0.5, 0.5).setDepth(2);
        }

        for (const spawn of zone.enemySpawns ?? [])
        {
            if (!spawn.sign) continue;

            const sign = scene.add.text(spawn.x, baseY - 80, spawn.sign, {
                fontFamily: FONT,
                fontSize: '12px',
                color: '#f87171',
                stroke: '#450a0a',
                strokeThickness: 3,
                align: 'center',
            }).setOrigin(0.5, 0.5).setDepth(2);

            scene.tweens.add({
                targets: sign,
                y: baseY - 86,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        if (zone.gate)
        {
            const gate = new BrokenGate(scene, zone.gate, baseY);
            gate.redraw(repairedGateIds.has(zone.gate.id));
            built.brokenGate = gate;
        }

        if (zone.bossSpawn?.banner)
        {
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
            }).setOrigin(0.5, 0.5).setDepth(2);

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
