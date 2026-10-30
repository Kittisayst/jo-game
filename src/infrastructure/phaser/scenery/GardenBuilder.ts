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
const FIRST_PLOT_X = 300;
const PLOT_SPACING = 100;
const EXPAND_X = 1500;
const EXIT_X = 60;
/** Far enough from the hero that a Plot not bought yet never offers E. */
const OFF_MAP_X = -9999;

export type GardenChange = 'planted' | 'harvested' | 'expanded';

export interface GardenView
{
    /** Everything the hero can press E on: the Plots, the sign that buys another Plot, the way home. */
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
 * Draws the Garden: Plots of soil on the ground (each one is a spot to press E), the sign that adds a Plot and
 * the way back to the village. The rules are in `GardenUseCases`; planting asks React for the Seed (`open-garden`).
 */
export function buildGarden (scene: Phaser.Scene, baseY: number, onChanged: (change: GardenChange) => void): GardenView
{
    const { garden, backpack, itemCatalog } = entities;
    const minutesOf = growMinutesOf(itemCatalog);
    const nameOf = (id: string) => itemCatalog.get(id)?.name ?? id;

    // Where the hero is welcome
    scene.add.text(EXIT_X, baseY - 78, '🏡 ກັບໝູ່ບ້ານ', {
        fontFamily: FONT, fontSize: '13px', color: '#fef08a', stroke: '#0f172a', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);
    scene.add.text(EXIT_X, baseY - 40, '🚪', { fontSize: '34px' }).setOrigin(0.5).setDepth(2);

    scene.add.text(190, baseY - 130, '🌱 ສວນຜັກ (Garden)\nຍ່າງໄປຫາແປງ ແລ້ວກົດ E ເພື່ອປູກ ຫຼືເກັບ', {
        fontFamily: FONT, fontSize: '14px', color: '#86efac', stroke: '#052e16', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    const soils: Phaser.GameObjects.Graphics[] = [];
    const crops: Phaser.GameObjects.Text[] = [];

    for (let i = 0; i < MAX_PLOTS; i++)
    {
        const x = FIRST_PLOT_X + i * PLOT_SPACING;
        const soil = scene.add.graphics().setDepth(1.5);
        soil.fillStyle(0x3f2a1d, 1);
        soil.fillRoundedRect(x - 36, baseY - 12, 72, 16, 5);
        soil.fillStyle(0x6b4423, 1);
        soil.fillRoundedRect(x - 32, baseY - 10, 64, 9, 4);
        soil.lineStyle(2, 0x1c1009, 1);
        soil.strokeRoundedRect(x - 36, baseY - 12, 72, 16, 5);
        soils.push(soil);

        crops.push(scene.add.text(x, baseY - 16, '', { fontSize: '36px' }).setOrigin(0.5, 1).setDepth(2));
    }

    // The sign that buys another Plot (Materials, never Credit)
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

    const exit: InteractiveBuilding = {
        x: EXIT_X,
        label: '🏡 [E] ກັບໝູ່ບ້ານ',
        action: () => EventBus.emit('change-level', 'village'),
    };

    refresh();
    return { buildings: [exit, ...plots, expand], refresh };
}
