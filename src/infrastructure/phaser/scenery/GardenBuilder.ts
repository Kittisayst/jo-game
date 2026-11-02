import {
    expandGardenUseCase, growMinutesOf, harvestPlotUseCase, nextPlotCost,
} from '../../../application/GardenUseCases';
import { MAX_PLOTS } from '../../../domain/entities/Garden';
import { soundManager } from '../../audio/SoundManager';
import { clock, entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { EventBus } from '../../EventBus';
import { showLootNotification } from '../effects/FloatingText';
import type { InteractiveBuilding } from './VillageBuilder';

const FONT = '"Noto Sans Lao", sans-serif';
const FIRST_PLOT_X = 350;
const PLOT_SPACING = 95;
const EXPAND_X = 1500;
const VILLAGE_EXIT_X = 60;
const COTTAGE_EXIT_X = 180;
const WATER_BARREL_X = 265;
/** Far enough from the hero that a Plot not bought yet never offers E. */
const OFF_MAP_X = -9999;

export type GardenChange = 'planted' | 'harvested' | 'expanded';

export interface GardenView
{
    /** Everything the hero can press E on: the Plots, the sign that buys another Plot, the exits. */
    buildings: InteractiveBuilding[];
    /** Redraws every Plot from the Garden (call it after a change and twice a second for the growing). */
    refresh: () => void;
}

const formatTime = (ms: number): string =>
{
    const seconds = Math.max(1, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Draws the upgraded Garden:
 * - 2 Clear Exits: Door back to Hero Cottage (x=180) and Gate to Village (x=60)
 * - Decorative wooden fence, fruit trees, flower clusters, and water barrel prop
 * - Interactive soil plots and garden expansion signboard
 */
export function buildGarden (scene: Phaser.Scene, baseY: number, onChanged: (change: GardenChange) => void): GardenView
{
    const { garden, backpack, itemCatalog } = entities;
    const minutesOf = growMinutesOf(itemCatalog);
    const nameOf = (id: string) => itemCatalog.get(id)?.name ?? id;

    // 1. Rustic Garden Fence across the background
    const fence = scene.add.graphics().setDepth(1.2);
    fence.fillStyle(0x8b5a2b, 1);
    fence.lineStyle(2, 0x4a2e12, 1);
    for (let fx = 0; fx < 1600; fx += 32)
    {
        // Fence pickets
        fence.fillRect(fx + 4, baseY - 28, 8, 28);
        fence.strokeRect(fx + 4, baseY - 28, 8, 28);
    }
    // Horizontal fence rails
    fence.fillRect(0, baseY - 20, 1600, 4);
    fence.strokeRect(0, baseY - 20, 1600, 4);
    fence.fillRect(0, baseY - 10, 1600, 4);
    fence.strokeRect(0, baseY - 10, 1600, 4);

    // 2. Fruit Trees & Flora Scenery
    const drawTree = (tx: number) => {
        const tree = scene.add.graphics().setDepth(1.3);
        // Trunk
        tree.fillStyle(0x5c3a1e, 1);
        tree.fillRect(tx - 8, baseY - 60, 16, 60);
        // Foliage
        tree.fillStyle(0x22c55e, 1);
        tree.fillCircle(tx, baseY - 75, 32);
        tree.fillStyle(0x15803d, 1);
        tree.fillCircle(tx - 12, baseY - 80, 20);
        tree.fillCircle(tx + 14, baseY - 70, 22);
        // Apples
        tree.fillStyle(0xef4444, 1);
        tree.fillCircle(tx - 10, baseY - 70, 4);
        tree.fillCircle(tx + 8, baseY - 85, 4);
        tree.fillCircle(tx + 2, baseY - 62, 4);
    };
    drawTree(15);
    drawTree(1560);

    // Flower clusters
    const flowers = ['🌸', '🌼', '🌷', '🌺'];
    for (let fx = 80; fx < 1550; fx += 130)
    {
        const fl = flowers[Math.floor(Math.sin(fx) * flowers.length) % flowers.length];
        scene.add.text(fx, baseY - 14, fl, { fontSize: '14px' }).setOrigin(0.5, 1).setDepth(1.4);
    }

    // 3. Two Exits:
    // Exit A: Gate to Village (x = 60)
    scene.add.text(VILLAGE_EXIT_X, baseY - 78, '🏡 ອອກສູ່ໜ້າໝູ່ບ້ານ', {
        fontFamily: FONT, fontSize: '12px', color: '#fef08a', stroke: '#0f172a', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);
    scene.add.text(VILLAGE_EXIT_X, baseY - 40, '⛩️', { fontSize: '32px' }).setOrigin(0.5).setDepth(2);

    // Exit B: Door to Hero Cottage (x = 180)
    scene.add.text(COTTAGE_EXIT_X, baseY - 78, '🚪 ເຂົ້າຫຼັງບ້ານ (Cottage)', {
        fontFamily: FONT, fontSize: '12px', color: '#93c5fd', stroke: '#0f172a', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);
    scene.add.text(COTTAGE_EXIT_X, baseY - 40, '🚪', { fontSize: '34px' }).setOrigin(0.5).setDepth(2);

    // 4. Water Barrel / Garden Well prop (x = 265)
    const barrel = scene.add.graphics().setDepth(1.5);
    barrel.fillStyle(0x78350f, 1);
    barrel.fillRoundedRect(WATER_BARREL_X - 16, baseY - 32, 32, 32, 4);
    barrel.fillStyle(0x38bdf8, 0.9);
    barrel.fillCircle(WATER_BARREL_X, baseY - 28, 10);
    scene.add.text(WATER_BARREL_X, baseY - 38, '🪣', { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    scene.add.text(WATER_BARREL_X, baseY - 50, 'ຖັງນ້ຳສວນ', {
        fontFamily: FONT, fontSize: '11px', color: '#bae6fd', stroke: '#0f172a', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    // Title banner
    scene.add.text(600, baseY - 130, '🌱 ສວນຜັກຫຼັງບ້ານ (Hero Garden)\nປູກພືດຜັກ, ເກັບກ່ຽວຜົນຜະລິດ ແລະ ນຳໄປປຸງຢາ ຫຼື ຂາຍ', {
        fontFamily: FONT, fontSize: '14px', color: '#86efac', stroke: '#052e16', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    // 5. Plots of soil
    const soils: Phaser.GameObjects.Graphics[] = [];
    const crops: Phaser.GameObjects.Text[] = [];

    for (let i = 0; i < MAX_PLOTS; i++)
    {
        const x = FIRST_PLOT_X + i * PLOT_SPACING;
        const soil = scene.add.graphics().setDepth(1.5);
        soil.fillStyle(0x3f2a1d, 1);
        soil.fillRoundedRect(x - 38, baseY - 14, 76, 18, 5);
        soil.fillStyle(0x6b4423, 1);
        soil.fillRoundedRect(x - 34, baseY - 12, 68, 12, 4);
        soil.lineStyle(2, 0x1c1009, 1);
        soil.strokeRoundedRect(x - 38, baseY - 14, 76, 18, 5);
        soils.push(soil);

        crops.push(scene.add.text(x, baseY - 16, '', { fontSize: '36px' }).setOrigin(0.5, 1).setDepth(2));
    }

    // 6. Garden Expansion Signboard
    scene.add.text(EXPAND_X, baseY - 34, '🪧', { fontSize: '34px' }).setOrigin(0.5).setDepth(2);

    const refresh = (): void =>
    {
        const now = clock.now();
        for (let i = 0; i < MAX_PLOTS; i++)
        {
            const owned = i < garden.plotCount;
            soils[i].setVisible(owned);
            if (!owned)
            {
                crops[i].setText('');
                continue;
            }
            const status = garden.statusOf(i, now, minutesOf);
            if (status.state === 'empty') crops[i].setText('');
            else if (status.state === 'growing') crops[i].setText('🌱');
            else crops[i].setText(itemCatalog.get(itemCatalog.get(status.seedItemId)?.plant?.harvest[0]?.itemId ?? '')?.icon ?? '🌿');
        }
    };

    const say = (x: number, text: string, color: string): void =>
    {
        showLootNotification(scene, x, baseY - 50, text, color);
    };

    const harvest = (index: number, x: number): void =>
    {
        const result = harvestPlotUseCase(index, garden, backpack, itemCatalog, clock);
        if (!result.success)
        {
            soundManager.playHurt();
            if (result.reason === 'backpack_full') say(x, '⚠️ ກະເປົາເຕັມ', '#fbbf24');
            return;
        }
        soundManager.playCoin();
        say(x, result.harvest.map(d => `+${d.count} ${nameOf(d.itemId)}`).join(', '), '#22c55e');
        refresh();
        onChanged('harvested');
    };

    const plots: InteractiveBuilding[] = Array.from({ length: MAX_PLOTS }, (_, i) =>
    {
        const x = FIRST_PLOT_X + i * PLOT_SPACING;
        return {
            get x () { return i < garden.plotCount ? x : OFF_MAP_X; },
            get label () {
                const status = garden.statusOf(i, clock.now(), minutesOf);
                if (status.state === 'empty') return `🌱 [E] ປູກເມັດ (ແປງ ${i + 1})`;
                if (status.state === 'growing') return `🌱 ${nameOf(status.seedItemId)} ໃຫຍ່ໃນ ${formatTime(status.remainingMs)}`;
                return `✅ [E] ເກັບຜົນ (ແປງ ${i + 1})`;
            },
            action: () =>
            {
                const status = garden.statusOf(i, clock.now(), minutesOf);
                if (status.state === 'empty') EventBus.emit('open-garden', i);
                else if (status.state === 'ready') harvest(i, x);
            },
        };
    });

    const expand: InteractiveBuilding = {
        x: EXPAND_X,
        get label () {
            const cost = nextPlotCost(garden, getGameContent().gardenExpansions);
            if (cost === null) return `🪧 ສວນໃຫຍ່ສຸດແລ້ວ (${garden.plotCount} ແປງ)`;
            return `🪧 [E] ຂະຫຍາຍເປັນ ${garden.plotCount + 1} ແປງ: ${cost.map(c => `${nameOf(c.itemId)} ${backpack.getItemCount(c.itemId)}/${c.count}`).join(', ')}`;
        },
        action: () =>
        {
            const result = expandGardenUseCase(garden, backpack, getGameContent().gardenExpansions);
            if (!result.success)
            {
                soundManager.playHurt();
                say(EXPAND_X, '⚠️ ວັດຖຸດິບບໍ່ພໍ', '#fbbf24');
                return;
            }
            soundManager.playPowerUp();
            say(EXPAND_X, `🌱 ສວນມີ ${garden.plotCount} ແປງ`, '#22c55e');
            refresh();
            onChanged('expanded');
        },
    };

    const villageExit: InteractiveBuilding = {
        x: VILLAGE_EXIT_X,
        label: '🏡 [E] ອອກສູ່ໜ້າໝູ່ບ້ານ (Village)',
        action: () => EventBus.emit('change-level', 'village'),
    };

    const cottageExit: InteractiveBuilding = {
        x: COTTAGE_EXIT_X,
        label: '🚪 [E] ກັບເຂົ້າຫຼັງບ້ານ (Hero Cottage)',
        action: () => EventBus.emit('change-level', 'cottage'),
    };

    const waterBarrel: InteractiveBuilding = {
        x: WATER_BARREL_X,
        label: '💧 [E] ຖັງນ້ຳຫົດສວນ (Water Bucket)',
        action: () => {
            soundManager.playPotionDrink();
            say(WATER_BARREL_X, '💧 ຕັກນ້ຳຫົດແປງຜັກສົດຊື່ນ!', '#38bdf8');
        },
    };

    refresh();
    return { buildings: [villageExit, cottageExit, waterBarrel, ...plots, expand], refresh };
}
