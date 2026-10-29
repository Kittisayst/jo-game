import { harvestResourceNodeUseCase } from '../../../application/HarvestResourceNodeUseCase';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { describeDrops, showLootNotification } from '../effects/FloatingText';
import type { NPC } from '../objects/NPC';
import type { BrokenGate, ResourceNodeView, WaypointView } from '../scenery/StageBuilder';
import type { InteractiveBuilding } from '../scenery/VillageBuilder';
import type { Game } from '../scenes/Game';

/** Everything in the current level the player can press E on. */
export interface Interactables
{
    buildings: InteractiveBuilding[];
    waypoints: WaypointView[];
    resourceNodes: ResourceNodeView[];
    brokenGate?: BrokenGate;
    /** People to talk to, each with the prompt shown while the hero is close enough. */
    villagers: { npc: NPC; prompt: string }[];
}

/**
 * The "press E" part of the scene: finds what is next to the hero, shows its prompt
 * above the hero, and runs the action when E is pressed. Order of priority is
 * buildings, waypoints, the broken gate, resource nodes, then villagers.
 */
export class InteractionController
{
    private readonly promptText: Phaser.GameObjects.Text;
    private activeInteraction: (() => void) | null = null;

    constructor (private readonly scene: Game, private readonly interactables: Interactables)
    {
        this.promptText = scene.add.text(0, 0, '', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#fef08a',
            stroke: '#0f172a',
            strokeThickness: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: { x: 8, y: 4 },
        });
        this.promptText.setOrigin(0.5, 1);
        this.promptText.setDepth(30);
        this.promptText.setVisible(false);
    }

    /** E was pressed (keyboard or the touch button). */
    interact (): void
    {
        if (this.scene.isDialogueActive) return;

        if (this.activeInteraction)
        {
            this.activeInteraction();
            return;
        }

        const villager = this.interactables.villagers.find(v => v.npc.isInteractable);
        if (villager)
        {
            villager.npc.triggerInteraction();
        }
    }

    /** Called every frame: updates the prompt and which action E will run. */
    update (): void
    {
        const { scene, promptText } = this;

        if (!scene.player || scene.isDialogueActive || scene.health.isDead)
        {
            promptText.setVisible(false);
            this.activeInteraction = null;
            return;
        }

        const px = scene.player.x;
        const py = scene.player.y;
        const show = (x: number, label: string, action: () => void) =>
        {
            promptText.setText(label);
            promptText.setPosition(x, py - 40);
            promptText.setVisible(true);
            this.activeInteraction = action;
        };

        // 1. Village buildings
        if (scene.currentLevelKey === 'village')
        {
            for (const b of this.interactables.buildings)
            {
                if (Math.abs(px - b.x) < 70)
                {
                    show(b.x, b.label, b.action);
                    return;
                }
            }
        }

        // 2. Waypoints
        for (const wp of this.interactables.waypoints)
        {
            if (Math.abs(px - wp.x) < 70)
            {
                show(wp.x, `🌀 [E] ${wp.name}`, () => EventBus.emit('open-waypoint', wp.name));
                return;
            }
        }

        // 3. Broken gate
        const gate = this.interactables.brokenGate;
        if (gate && !entities.repairedGates.has(gate.gateId) && Math.abs(px - gate.x) < 80)
        {
            show(
                gate.x,
                '🚪 [E] ສ້ອມແປງປະຕູໃຫຍ່ (Repair Gate)',
                () => EventBus.emit('open-gate-repair', gate.gateId, gate.requirements)
            );
            return;
        }

        // 4. Resource nodes
        for (const node of this.interactables.resourceNodes)
        {
            if (!node.harvested && Math.abs(px - node.x) < 65)
            {
                show(node.x, node.label, () => this.harvest(node));
                return;
            }
        }

        // 5. NPCs
        const villager = this.interactables.villagers.find(v => v.npc.isInteractable);
        if (villager)
        {
            show(villager.npc.x, villager.prompt, () => villager.npc.triggerInteraction());
            return;
        }

        promptText.setVisible(false);
        this.activeInteraction = null;
    }

    private harvest (node: ResourceNodeView): void
    {
        const { scene } = this;
        const result = harvestResourceNodeUseCase(node, entities.backpack);

        if (result.success)
        {
            soundManager.playCoin();
            node.harvested = true;
            node.graphic.clear();
            scene.particleManager.emitCelebration(node.x, node.y - 20);

            EventBus.emit('backpack-changed');
            showLootNotification(scene, node.x, node.y - 30, `🎒 ${describeDrops(result.drops)}`, '#22c55e');
            return;
        }

        soundManager.playClink();
        if (result.reason === 'missing_tool')
        {
            showLootNotification(scene, node.x, node.y - 30, `⚠️ ຕ້ອງການ ${node.requiredTool?.toUpperCase()}!`, '#f59e0b');
        }
        else if (result.reason === 'backpack_full')
        {
            showLootNotification(scene, node.x, node.y - 30, '⚠️ ກະເປົາເຕັມ (20/20)!', '#ef4444');
        }
    }
}
