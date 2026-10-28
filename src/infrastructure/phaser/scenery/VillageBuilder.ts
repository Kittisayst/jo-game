import { EventBus } from '../../EventBus';

export interface InteractiveBuilding
{
    x: number;
    label: string;
    action: () => void;
}

const FONT = '"Noto Sans Lao", sans-serif';

/**
 * Draws the Village Hub (buildings, lanterns, signs) and returns the spots the
 * player can press E on. `baseY` is the top of the ground; `forgeOpen` says
 * whether the Forge has been unlocked by passing the Chapter 1 exam.
 */
export function buildVillageScenery (scene: Phaser.Scene, baseY: number, forgeOpen: boolean): InteractiveBuilding[]
{
    const buildings = [
        { x: 320, width: 140, height: 160, roofColor: 0x6366f1, bodyColor: 0x1e293b, icon: '📚', name: 'ຫໍສະໝຸດ (Library)', sub: 'ອ່ານຕຳລາ' },
        { x: 600, width: 160, height: 180, roofColor: 0x3b82f6, bodyColor: 0x0f172a, icon: '🏛️', name: 'ສະຖາບັນ (Academy)', sub: 'ສອບເສັງ & ຝຶກຝົນ' },
        { x: 880, width: 150, height: 150, roofColor: 0x10b981, bodyColor: 0x1e293b, icon: '🔨', name: 'ໂຮງຊ່າງ (Workshop)', sub: 'ສ້າງເຄື່ອງມື' },
        {
            x: 1140,
            width: 150,
            height: 160,
            roofColor: forgeOpen ? 0xf97316 : 0x475569,
            bodyColor: 0x1e293b,
            icon: forgeOpen ? '⚔️' : '🔒',
            name: forgeOpen ? 'ໂຮງຕີເຫຼັກ (Forge)' : 'ໂຮງຕີເຫຼັກ (ລັອກ)',
            sub: forgeOpen ? 'ອັບເກຣດອາວຸດ' : 'ສອບຜ່ານບົດທີ 1 ກ່ອນ',
        },
    ];

    // Background trees
    for (const tx of [180, 460, 740, 1020, 1280])
    {
        const tree = scene.add.graphics();
        tree.setDepth(1);
        tree.fillStyle(0x78350f, 1);
        tree.fillRect(tx - 6, baseY - 50, 12, 50);
        tree.fillStyle(0x15803d, 0.95);
        tree.fillCircle(tx, baseY - 70, 26);
        tree.fillStyle(0x22c55e, 0.9);
        tree.fillCircle(tx - 6, baseY - 76, 18);
    }

    for (const b of buildings)
    {
        const g = scene.add.graphics();
        g.setDepth(1);

        // House body
        g.fillStyle(b.bodyColor, 0.92);
        g.fillRoundedRect(b.x - b.width / 2, baseY - b.height, b.width, b.height, 8);

        // Roof
        g.fillStyle(b.roofColor, 1);
        g.beginPath();
        g.moveTo(b.x - b.width / 2 - 16, baseY - b.height);
        g.lineTo(b.x, baseY - b.height - 45);
        g.lineTo(b.x + b.width / 2 + 16, baseY - b.height);
        g.closePath();
        g.fillPath();

        // Windows
        g.fillStyle(0xfef08a, 0.9);
        g.fillRect(b.x - b.width / 3, baseY - b.height + 30, 24, 24);
        g.fillRect(b.x + b.width / 3 - 24, baseY - b.height + 30, 24, 24);

        // Door
        g.fillStyle(0x78350f, 1);
        g.fillRoundedRect(b.x - 14, baseY - 48, 28, 48, 4);

        // Sign banner above roof
        const sign = scene.add.text(b.x, baseY - b.height - 60, `${b.icon} ${b.name}\n(${b.sub})`, {
            fontFamily: FONT,
            fontSize: '12px',
            color: '#fef08a',
            stroke: '#0f172a',
            strokeThickness: 3,
            align: 'center',
        });
        sign.setOrigin(0.5, 0.5);
        sign.setDepth(2);
    }

    // Lanterns along pathway
    for (const lx of [220, 500, 780, 1060, 1340])
    {
        const post = scene.add.graphics();
        post.setDepth(2);
        post.fillStyle(0x1e293b, 1);
        post.fillRect(lx - 2, baseY - 50, 4, 50);
        post.fillStyle(0xf59e0b, 1);
        post.fillCircle(lx, baseY - 54, 7);
        post.fillStyle(0xfef08a, 0.9);
        post.fillCircle(lx, baseY - 54, 3);
    }

    // Welcome sign
    const welcomeSign = scene.add.text(120, baseY - 80, '🏡 ໝູ່ບ້ານແຫ່ງປັນຍາ\n(Knowledge Village)', {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    });
    welcomeSign.setOrigin(0.5, 0.5);
    welcomeSign.setDepth(2);

    // World Gate Portal at x = 1420
    const portalSign = scene.add.text(1420, baseY - 90, '🌀 ປະຕູມິຕິ (World Gate)\n[E] ເປີດແຜນທີ່ດ່ານ ➡️', {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#38bdf8',
        stroke: '#0284c7',
        strokeThickness: 3,
        align: 'center',
    });
    portalSign.setOrigin(0.5, 0.5);
    portalSign.setDepth(2);

    scene.tweens.add({
        targets: portalSign,
        y: baseY - 96,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    return [
        { x: 320, label: '📚 [E] ເຂົ້າຫໍສະໝຸດ (Library)', action: () => EventBus.emit('open-library') },
        { x: 600, label: '🏛️ [E] ເຂົ້າສະຖາບັນ (Academy)', action: () => EventBus.emit('open-academy') },
        { x: 880, label: '🔨 [E] ເຂົ້າໂຮງຊ່າງ (Workshop)', action: () => EventBus.emit('open-workshop') },
        {
            x: 1140,
            label: forgeOpen
                ? '⚔️ [E] ເຂົ້າໂຮງຕີເຫຼັກ (Forge)'
                : '🔒 [E] ໂຮງຕີເຫຼັກ (ຕ້ອງສອບເສັງບົດທີ 1 ຜ່ານກ່ອນ)',
            action: () => EventBus.emit('open-forge'),
        },
        { x: 1420, label: '🌀 [E] ເລືອກດ່ານຜະຈົນໄພ (World Map)', action: () => EventBus.emit('open-stage-map') },
    ];
}
