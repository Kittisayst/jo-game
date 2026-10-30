import { EventBus } from '../../EventBus';

export interface InteractiveBuilding
{
    x: number;
    label: string;
    action: () => void;
}

const FONT = '"Noto Sans Lao", sans-serif';

/**
 * Draws the Village Hub (buildings, Mina's stall, animated World Gate, trees, lanterns, signs)
 * using pixel-art sprites anchored cleanly on `baseY` (with procedural fallback if unloaded),
 * and returns the spots the player can press E on.
 */
export function buildVillageScenery (scene: Phaser.Scene, baseY: number, forgeOpen: boolean): InteractiveBuilding[]
{
    const buildings = [
        {
            x: 320,
            textureKey: 'building-library',
            width: 160,
            height: 192,
            roofColor: 0x6366f1,
            bodyColor: 0x1e293b,
            icon: '📚',
            name: 'ຫໍສະໝຸດ (Library)',
            sub: 'ອ່ານຕຳລາ',
        },
        {
            x: 600,
            textureKey: 'building-academy',
            width: 176,
            height: 208,
            roofColor: 0x3b82f6,
            bodyColor: 0x0f172a,
            icon: '🏛️',
            name: 'ສະຖາບັນ (Academy)',
            sub: 'ສອບເສັງ & ຝຶກຝົນ',
        },
        {
            x: 880,
            textureKey: 'building-workshop',
            width: 160,
            height: 176,
            roofColor: 0x10b981,
            bodyColor: 0x1e293b,
            icon: '🔨',
            name: 'ໂຮງຊ່າງ (Workshop)',
            sub: 'ສ້າງເຄື່ອງມື',
        },
        {
            x: 1140,
            textureKey: forgeOpen ? 'building-forge-open' : 'building-forge-locked',
            width: 168,
            height: 192,
            roofColor: forgeOpen ? 0xf97316 : 0x475569,
            bodyColor: 0x1e293b,
            icon: forgeOpen ? '⚔️' : '🔒',
            name: forgeOpen ? 'ໂຮງຕີເຫຼັກ (Forge)' : 'ໂຮງຕີເຫຼັກ (ລັອກ)',
            sub: forgeOpen ? 'ອັບເກຣດອາວຸດ' : 'ສອບຜ່ານບົດທີ 1 ກ່ອນ',
        },
    ];

    // Background village trees
    for (const tx of [185, 445, 740])
    {
        if (scene.textures.exists('village-tree'))
        {
            scene.add.image(tx, baseY + 2, 'village-tree').setOrigin(0.5, 1).setDepth(1);
        }
        else
        {
            const tree = scene.add.graphics();
            tree.setDepth(1);
            tree.fillStyle(0x78350f, 1);
            tree.fillRect(tx - 6, baseY - 50, 12, 50);
            tree.fillStyle(0x15803d, 0.95);
            tree.fillCircle(tx, baseY - 70, 26);
        }
    }

    // Main village buildings
    for (const b of buildings)
    {
        if (scene.textures.exists(b.textureKey))
        {
            scene.add.image(b.x, baseY + 2, b.textureKey).setOrigin(0.5, 1).setDepth(1.5);
        }
        else
        {
            const g = scene.add.graphics();
            g.setDepth(1.5);
            g.fillStyle(b.bodyColor, 0.92);
            g.fillRoundedRect(b.x - b.width / 2, baseY - b.height, b.width, b.height, 8);
            g.fillStyle(b.roofColor, 1);
            g.fillTriangle(b.x - b.width / 2 - 12, baseY - b.height, b.x, baseY - b.height - 40, b.x + b.width / 2 + 12, baseY - b.height);
        }

        const sign = scene.add.text(b.x, baseY - b.height - 18, `${b.icon} ${b.name}\n(${b.sub})`, {
            fontFamily: FONT,
            fontSize: '12px',
            color: '#fef08a',
            stroke: '#0f172a',
            strokeThickness: 3,
            align: 'center',
        });
        sign.setOrigin(0.5, 0.5);
        sign.setDepth(2.5);
    }

    // Mina's Skin Boutique Stall at x = 1295 (behind NPC Mina at x = 1290)
    if (scene.textures.exists('stall-mina'))
    {
        scene.add.image(1295, baseY + 2, 'stall-mina').setOrigin(0.5, 1).setDepth(1.5);
    }

    // Lanterns along pathway
    for (const lx of [225, 495, 765, 1030, 1360])
    {
        if (scene.textures.exists('village-lantern'))
        {
            scene.add.image(lx, baseY + 2, 'village-lantern').setOrigin(0.5, 1).setDepth(2);
        }
        else
        {
            const post = scene.add.graphics();
            post.setDepth(2);
            post.fillStyle(0x1e293b, 1);
            post.fillRect(lx - 2, baseY - 50, 4, 50);
            post.fillStyle(0xf59e0b, 1);
            post.fillCircle(lx, baseY - 54, 7);
        }
    }

    // The Garden door (x = 1010) and the Storage chest (x = 235): drawn with shapes until real art replaces them
    addGardenDoor(scene, 1010, baseY);
    addStorageChest(scene, 235, baseY);

    // Welcome signpost & text at village entrance (x = 120)
    if (scene.textures.exists('signpost'))
    {
        scene.add.image(120, baseY + 2, 'signpost').setOrigin(0.5, 1).setDepth(2);
    }

    const welcomeSign = scene.add.text(120, baseY - 68, '🏡 ໝູ່ບ້ານແຫ່ງປັນຍາ\n(Knowledge Village)', {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    });
    welcomeSign.setOrigin(0.5, 0.5);
    welcomeSign.setDepth(2.5);

    // Animated World Gate Portal at x = 1420
    if (scene.textures.exists('world-gate'))
    {
        if (!scene.anims.exists('world-gate-swirl'))
        {
            scene.anims.create({
                key: 'world-gate-swirl',
                frames: scene.anims.generateFrameNumbers('world-gate', { start: 0, end: 3 }),
                frameRate: 7,
                repeat: -1,
            });
        }
        const gateSprite = scene.add.sprite(1420, baseY + 2, 'world-gate', 0);
        gateSprite.setOrigin(0.5, 1);
        gateSprite.setDepth(1.8);
        gateSprite.play('world-gate-swirl');
    }

    const portalSign = scene.add.text(1420, baseY - 174, '🌀 ປະຕູມິຕິ (World Gate)\n[E] ເປີດແຜນທີ່ດ່ານ ➡️', {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#38bdf8',
        stroke: '#083344',
        strokeThickness: 3,
        align: 'center',
    });
    portalSign.setOrigin(0.5, 0.5);
    portalSign.setDepth(2.5);

    scene.tweens.add({
        targets: portalSign,
        y: baseY - 180,
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
        { x: 235, label: '📦 [E] ເປີດຫີບເກັບຂອງ (Storage)', action: () => EventBus.emit('open-storage') },
        { x: 1010, label: '🌱 [E] ເຂົ້າສວນຜັກ (Garden)', action: () => EventBus.emit('open-garden') },
        { x: 1420, label: '🌀 [E] ເລືອກດ່ານຜະຈົນໄພ (World Map)', action: () => EventBus.emit('open-stage-map') },
    ];
}

function addLabel (scene: Phaser.Scene, x: number, y: number, text: string, color: string, stroke: string): void
{
    scene.add.text(x, y, text, {
        fontFamily: FONT,
        fontSize: '12px',
        color,
        stroke,
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(2.5);
}

/** An arch of wood with leaves, the way into the Garden. */
function addGardenDoor (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 38, baseY - 100, 10, 100);
    g.fillRect(x + 28, baseY - 100, 10, 100);
    g.fillRect(x - 42, baseY - 108, 84, 12);
    g.fillStyle(0x16a34a, 1);
    g.fillCircle(x - 33, baseY - 108, 11);
    g.fillCircle(x + 33, baseY - 108, 11);
    g.fillCircle(x, baseY - 114, 13);
    g.fillStyle(0x22c55e, 0.9);
    g.fillRect(x - 28, baseY - 96, 56, 96);
    addLabel(scene, x, baseY - 134, '🌱 ສວນຜັກ (Garden)\n[E] ເຂົ້າສວນ', '#86efac', '#064e3b');
}

/** A wooden chest with an iron band. */
function addStorageChest (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x92400e, 1);
    g.fillRoundedRect(x - 26, baseY - 34, 52, 34, 4);
    g.fillStyle(0xb45309, 1);
    g.fillRoundedRect(x - 28, baseY - 46, 56, 16, 6);
    g.fillStyle(0x64748b, 1);
    g.fillRect(x - 4, baseY - 46, 8, 46);
    g.fillStyle(0xfacc15, 1);
    g.fillRect(x - 3, baseY - 26, 6, 8);
    addLabel(scene, x, baseY - 66, '📦 ຫີບເກັບຂອງ (Storage)\n[E] ເປີດຫີບ', '#fde68a', '#451a03');
}
