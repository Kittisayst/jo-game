import { canSleep } from '../../../application/SleepUseCase';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';
import type { InteractiveBuilding } from './VillageBuilder';

const FONT = '"Noto Sans Lao", sans-serif';

export const COTTAGE_BED_X = 980;
export const COTTAGE_CHEST_X = 320;
export const COTTAGE_WARDROBE_X = 520;
export const COTTAGE_FRONT_DOOR_X = 140;
export const COTTAGE_BACK_DOOR_X = 1160;

/**
 * Draws the Hero's Cottage Interior (warm wooden walls, cozy fireplace, bed,
 * storage chest, wardrobe/skin boutique, front door to village, and backdoor to garden).
 */
export function buildCottageInterior (scene: Phaser.Scene, baseY: number): InteractiveBuilding[]
{
    const roomWidth = 1280;
    const ceilingY = 120;

    // 1. Room Background & Wooden Walls
    const bg = scene.add.graphics();
    bg.setDepth(0.5);

    // Warm wooden wall panels
    bg.fillStyle(0x3e2723, 1);
    bg.fillRect(0, 0, roomWidth, baseY);

    bg.fillStyle(0x4e342e, 1);
    for (let x = 0; x < roomWidth; x += 64)
    {
        bg.fillRect(x + 2, ceilingY, 60, baseY - ceilingY);
        bg.lineStyle(1, 0x27160c, 0.8);
        bg.strokeRect(x + 2, ceilingY, 60, baseY - ceilingY);
    }

    // Ceiling beam
    bg.fillStyle(0x27160c, 1);
    bg.fillRect(0, ceilingY - 20, roomWidth, 24);

    // Floor baseboard & dark hardwood floor
    bg.fillStyle(0x1b0e07, 1);
    bg.fillRect(0, baseY - 8, roomWidth, 8);

    // 2. Windows with light beams
    const drawWindow = (wx: number) => {
        const win = scene.add.graphics().setDepth(0.8);
        win.fillStyle(0x0f172a, 1);
        win.fillRoundedRect(wx - 40, ceilingY + 50, 80, 100, 8);
        win.fillStyle(0x38bdf8, 0.85); // sky outside
        win.fillRect(wx - 36, ceilingY + 54, 72, 92);
        // Window frame & cross
        win.fillStyle(0x5d4037, 1);
        win.fillRect(wx - 4, ceilingY + 54, 8, 92);
        win.fillRect(wx - 36, ceilingY + 96, 72, 8);
        win.lineStyle(4, 0x3e2723, 1);
        win.strokeRoundedRect(wx - 40, ceilingY + 50, 80, 100, 8);

        // Sunlight ray on floor
        const ray = scene.add.graphics().setDepth(0.9);
        ray.fillStyle(0xfef08a, 0.12);
        ray.fillTriangle(wx - 36, ceilingY + 100, wx + 36, ceilingY + 100, wx + 90, baseY);
    };
    drawWindow(420);
    drawWindow(860);

    // 3. Warm Woven Rug in the center
    const rug = scene.add.graphics().setDepth(1);
    rug.fillStyle(0x991b1b, 0.9);
    rug.fillRoundedRect(640 - 180, baseY - 12, 360, 12, 6);
    rug.fillStyle(0xf59e0b, 0.95);
    rug.fillRoundedRect(640 - 160, baseY - 10, 320, 8, 4);

    // 4. Cozy Stone Fireplace & Chimney (x = 740)
    const fireX = 740;
    const fp = scene.add.graphics().setDepth(1.2);
    // Stone chimney
    fp.fillStyle(0x475569, 1);
    fp.fillRect(fireX - 45, ceilingY - 10, 90, baseY - ceilingY + 10);
    fp.fillStyle(0x334155, 1);
    fp.fillRect(fireX - 35, baseY - 80, 70, 80);
    // Hearth opening
    fp.fillStyle(0x0f172a, 1);
    fp.fillRoundedRect(fireX - 25, baseY - 60, 50, 60, 6);
    // Firewood
    fp.fillStyle(0x78350f, 1);
    fp.fillRect(fireX - 18, baseY - 16, 36, 12);

    // Animated Fire
    const fireG = scene.add.graphics().setDepth(1.5);
    const updateFire = () => {
        fireG.clear();
        fireG.fillStyle(0xf97316, 1);
        fireG.fillTriangle(fireX - 14, baseY - 14, fireX + 14, baseY - 14, fireX, baseY - 42);
        fireG.fillStyle(0xfef08a, 0.9);
        fireG.fillTriangle(fireX - 8, baseY - 14, fireX + 8, baseY - 14, fireX, baseY - 34);
    };
    updateFire();
    scene.tweens.add({
        targets: fireG,
        scaleY: 1.15,
        scaleX: 0.92,
        yoyo: true,
        duration: 250,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    // Warm glow from fireplace
    const fireLight = scene.add.circle(fireX, baseY - 30, 90, 0xf97316, 0.18).setDepth(1.1);
    scene.tweens.add({
        targets: fireLight,
        radius: 105,
        alpha: 0.25,
        yoyo: true,
        duration: 400,
        repeat: -1,
    });

    // 5. Hanging Chandelier / Lantern
    const lanternX = 640;
    const lG = scene.add.graphics().setDepth(1.4);
    lG.lineStyle(2, 0x1e293b, 1);
    lG.lineBetween(lanternX, ceilingY - 10, lanternX, ceilingY + 35);
    lG.fillStyle(0xf59e0b, 1);
    lG.fillCircle(lanternX, ceilingY + 40, 10);
    lG.fillStyle(0xfef08a, 0.8);
    lG.fillCircle(lanternX, ceilingY + 40, 5);

    // 6. Interactive Props:
    // A. Front Door to Village (x = 140)
    const doorFront = scene.add.graphics().setDepth(1.3);
    doorFront.fillStyle(0x5c2e0b, 1);
    doorFront.fillRoundedRect(COTTAGE_FRONT_DOOR_X - 30, baseY - 105, 60, 105, 6);
    doorFront.fillStyle(0x3e1f07, 1);
    doorFront.fillRoundedRect(COTTAGE_FRONT_DOOR_X - 25, baseY - 100, 50, 95, 4);
    doorFront.fillStyle(0xfbbf24, 1);
    doorFront.fillCircle(COTTAGE_FRONT_DOOR_X + 15, baseY - 50, 4); // brass handle

    scene.add.text(COTTAGE_FRONT_DOOR_X, baseY - 125, '🚪 ປະຕູໜ້າບ້ານ\n[E] ອອກໄປໝູ່ບ້ານ', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    // B. Storage Chest (x = 320)
    if (scene.textures.exists('storage-chest'))
    {
        scene.add.image(COTTAGE_CHEST_X, baseY + 2, 'storage-chest').setOrigin(0.5, 1).setDepth(2);
    }
    else
    {
        const chestG = scene.add.graphics().setDepth(1.3);
        chestG.fillStyle(0x92400e, 1);
        chestG.fillRoundedRect(COTTAGE_CHEST_X - 13, baseY - 18, 26, 18, 3);
        chestG.fillStyle(0xfbbf24, 1);
        chestG.fillRect(COTTAGE_CHEST_X - 2, baseY - 11, 4, 5);
    }

    scene.add.text(COTTAGE_CHEST_X, baseY - 30, '📦 ຫີບເກັບຂອງ (Storage)', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#38bdf8',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    // C. Wardrobe / Skin Boutique Cabinet (x = 520)
    const wardG = scene.add.graphics().setDepth(1.3);
    wardG.fillStyle(0x4a2e1b, 1);
    wardG.fillRoundedRect(COTTAGE_WARDROBE_X - 32, baseY - 120, 64, 120, 6);
    wardG.fillStyle(0x6b4423, 1);
    wardG.fillRect(COTTAGE_WARDROBE_X - 28, baseY - 114, 26, 108);
    wardG.fillRect(COTTAGE_WARDROBE_X + 2, baseY - 114, 26, 108);
    wardG.fillStyle(0xfbbf24, 1);
    wardG.fillCircle(COTTAGE_WARDROBE_X - 6, baseY - 60, 3);
    wardG.fillCircle(COTTAGE_WARDROBE_X + 6, baseY - 60, 3);

    scene.add.text(COTTAGE_WARDROBE_X, baseY - 140, '👗 ຕູ້ປ່ຽນຊຸດ\n[E] ເລືອກຊຸດ Skin', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#f472b6',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    // D. Cozy Bed (x = 980)
    const bedG = scene.add.graphics().setDepth(1.3);
    // Bed frame
    bedG.fillStyle(0x5c2e0b, 1);
    bedG.fillRect(COTTAGE_BED_X - 50, baseY - 48, 10, 48); // headboard
    bedG.fillRect(COTTAGE_BED_X + 40, baseY - 28, 10, 28); // footboard
    bedG.fillRect(COTTAGE_BED_X - 45, baseY - 24, 90, 14); // frame
    // Mattress & Quilt
    bedG.fillStyle(0x3b82f6, 1);
    bedG.fillRoundedRect(COTTAGE_BED_X - 40, baseY - 36, 80, 22, 4);
    bedG.fillStyle(0x93c5fd, 1);
    bedG.fillRoundedRect(COTTAGE_BED_X - 10, baseY - 36, 50, 22, 4);
    // Pillow
    bedG.fillStyle(0xf8fafc, 1);
    bedG.fillRoundedRect(COTTAGE_BED_X - 38, baseY - 44, 24, 14, 3);

    const bedSign = scene.add.text(COTTAGE_BED_X, baseY - 70, '', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    const updateBedSign = () => {
        bedSign.setText(canSleep(entities.worldTime)
            ? '🛏️ ຕຽງນອນ\n[E] ນອນຈົນເຊົ້າ (ຟື້ນເລືອດ)'
            : '🛏️ ຕຽງນອນ\n(ນອນໄດ້ຕອນຄ່ຳ-ກາງຄືນ)');
    };
    updateBedSign();

    // E. Back Door to Garden (x = 1160)
    const doorBack = scene.add.graphics().setDepth(1.3);
    doorBack.fillStyle(0x166534, 1);
    doorBack.fillRoundedRect(COTTAGE_BACK_DOOR_X - 30, baseY - 105, 60, 105, 6);
    doorBack.fillStyle(0x22c55e, 0.4);
    doorBack.fillRoundedRect(COTTAGE_BACK_DOOR_X - 25, baseY - 100, 50, 95, 4);
    doorBack.fillStyle(0xfbbf24, 1);
    doorBack.fillCircle(COTTAGE_BACK_DOOR_X + 15, baseY - 50, 4);

    scene.add.text(COTTAGE_BACK_DOOR_X, baseY - 125, '🌱 ປະຕູຫຼັງບ້ານ\n[E] ອອກໄປສວນຜັກ', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#86efac',
        stroke: '#052e16',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5).setDepth(2.5);

    return [
        {
            x: COTTAGE_FRONT_DOOR_X,
            label: '🚪 [E] ອອກໄປໜ້າບ້ານ (Return to Village)',
            action: () => EventBus.emit('change-level', 'village'),
        },
        {
            x: COTTAGE_CHEST_X,
            label: '📦 [E] ເປີດຫີບເກັບຂອງ (Storage)',
            action: () => EventBus.emit('open-storage'),
        },
        {
            x: COTTAGE_WARDROBE_X,
            label: '👗 [E] ຕູ້ປ່ຽນຊຸດ (Wardrobe Skin)',
            action: () => EventBus.emit('start-dialogue', 'skin_shop'),
        },
        {
            x: COTTAGE_BED_X,
            get label (): string
            {
                return canSleep(entities.worldTime)
                    ? '🛏️ [E] ນອນຈົນເຊົ້າ (ຟື້ນຫົວໃຈ ແລະຂ້າມຄືນ)'
                    : '🛏️ ຕຽງ: ນອນໄດ້ຕອນຕາເວັນຕົກ ຫາກາງຄືນ';
            },
            action: () => EventBus.emit('sleep-at-bed'),
        },
        {
            x: COTTAGE_BACK_DOOR_X,
            label: '🌱 [E] ອອກໄປສວນຜັກ (Garden)',
            action: () => EventBus.emit('change-level', 'garden'),
        },
    ];
}

