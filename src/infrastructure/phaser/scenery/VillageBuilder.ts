import { soundManager } from '../../audio/SoundManager';
import { canSleep } from '../../../application/SleepUseCase';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';

export interface InteractiveBuilding
{
    x: number;
    label: string;
    action: () => void;
}

const FONT = '"Noto Sans Lao", sans-serif';
const FORGE_X = 1140;
/** Where the lanterns along the path stand (they shine at night, see `DayNightOverlay.addLight`). */
export const VILLAGE_LANTERN_XS = [225, 495, 765, 1030, 1360];
/** How high above the ground a lantern's flame is. */
export const VILLAGE_LANTERN_FLAME_HEIGHT = 54;
/** The Bed stands past the World Gate, at the east end of the village. */
const BED_X = 1535;
const QUEST_BOARD_X = 510;
const FORGE_OPEN_LABEL = '⚔️ [E] ເຂົ້າໂຮງຕີເຫຼັກ (Forge)';

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
    let forgeImage: Phaser.GameObjects.Image | undefined;
    let forgeSign: Phaser.GameObjects.Text | undefined;
    for (const b of buildings)
    {
        let image: Phaser.GameObjects.Image | undefined;
        if (scene.textures.exists(b.textureKey))
        {
            image = scene.add.image(b.x, baseY + 2, b.textureKey).setOrigin(0.5, 1).setDepth(1.5);
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

        if (b.x === FORGE_X)
        {
            forgeImage = image;
            forgeSign = sign;
        }
    }

    // Mina's Skin Boutique Stall at x = 1295 (behind NPC Mina at x = 1290)
    if (scene.textures.exists('stall-mina'))
    {
        scene.add.image(1295, baseY + 2, 'stall-mina').setOrigin(0.5, 1).setDepth(1.5);
    }

    // Lanterns along pathway
    for (const lx of VILLAGE_LANTERN_XS)
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
    addQuestBoard(scene, QUEST_BOARD_X, baseY);
    addBed(scene, BED_X, baseY);
    addDungeonEntrance(scene, 1460, baseY);
    addTrainingDummy(scene, 1720, baseY);
    addWaterWell(scene, 1860, baseY);
    addLoreMonument(scene, 2000, baseY);
    addWatchtowerVisuals(scene, 2250, baseY);
    addVillageShrine(scene, 2360, baseY);

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

    const forge: InteractiveBuilding = {
        x: FORGE_X,
        label: forgeOpen ? FORGE_OPEN_LABEL : '🔒 [E] ໂຮງຕີເຫຼັກ (ຕ້ອງສອບເສັງບົດທີ 1 ຜ່ານກ່ອນ)',
        action: () => EventBus.emit('open-forge'),
    };

    // Passing the Book 1 exam opens the Forge for good: take the padlock off without rebuilding the village
    if (!forgeOpen)
    {
        const unlockForge = (): void =>
        {
            forge.label = FORGE_OPEN_LABEL;
            if (forgeImage?.active && scene.textures.exists('building-forge-open')) forgeImage.setTexture('building-forge-open');
            forgeSign?.setText('⚔️ ໂຮງຕີເຫຼັກ (Forge)\n(ອັບເກຣດອາວຸດ)');
        };
        EventBus.once('book-exam-passed', unlockForge);
        scene.events.once('shutdown', () => EventBus.off('book-exam-passed', unlockForge));
    }

    return [
        { x: 320, label: '📚 [E] ເຂົ້າຫໍສະໝຸດ (Library)', action: () => EventBus.emit('open-library') },
        { x: 600, label: '🏛️ [E] ເຂົ້າສະຖາບັນ (Academy)', action: () => EventBus.emit('open-academy') },
        { x: 880, label: '🔨 [E] ເຂົ້າໂຮງຊ່າງ (Workshop)', action: () => EventBus.emit('open-workshop') },
        forge,
        { x: 235, label: '📦 [E] ເປີດຫີບເກັບຂອງ (Storage)', action: () => EventBus.emit('open-storage') },
        {
            x: QUEST_BOARD_X,
            get label (): string
            {
                const claimable = entities.questBoard.claimableCount;
                return claimable > 0
                    ? `📜 [E] ກະດານພາລະກິດ (✨ ພ້ອມຮັບ ${claimable} ລາງວັນ!)`
                    : '📜 [E] ກວດເບິ່ງກະດານພາລະກິດ (Quest Board)';
            },
            action: () => EventBus.emit('open-quest-board'),
        },
        {
            x: BED_X,
            // Read again every time the prompt shows: it changes with the time of day
            get label (): string
            {
                return canSleep(entities.worldTime)
                    ? '🛏️ [E] ນອນຈົນເຊົ້າ (ຟື້ນຫົວໃຈ ແລະຂ້າມຄືນ)'
                    : '🛏️ ຕຽງ: ນອນໄດ້ຕອນຕາເວັນຕົກ ຫາກາງຄືນ';
            },
            action: () => EventBus.emit('sleep-at-bed'),
        },
        { x: 1010, label: '🌱 [E] ເຂົ້າສວນຜັກ (Garden)', action: () => EventBus.emit('change-level', 'garden') },
        { x: 1460, label: '🗝️ [E] ລົງສູ່ຄຸກໃຕ້ດິນບູຮານ (Dungeon)', action: () => EventBus.emit('change-level', 'dungeon') },
        { x: 1420, label: '🌀 [E] ເລືອກດ່ານຜະຈົນໄພ (World Map)', action: () => EventBus.emit('open-stage-map') },
        {
            x: 1720,
            label: '🎯 [E] ທົດສອບອາວຸດ (Training Dummy)',
            action: () => {
                const weaponId = entities.equipment.equippedWeaponId;
                const weaponDef = weaponId ? entities.itemCatalog.get(weaponId) : undefined;
                const damage = weaponDef?.attack ?? 5;
                soundManager.playSlash();
                scene.cameras.main.shake(80, 0.003);
                const toast = scene.add.text(1720, baseY - 60, `💥 ${weaponDef?.name ?? 'ມືເປົ່າ'} ໂຈມຕີ! ${damage} DMG!`, {
                    fontFamily: FONT,
                    fontSize: '13px',
                    color: '#fde047',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: baseY - 100,
                    alpha: 0,
                    duration: 1200,
                    onComplete: () => toast.destroy(),
                });
            },
        },
        {
            x: 1860,
            label: '💧 [E] ຕັກນ້ຳສ້າງບູຮານ (Village Well)',
            action: () => {
                entities.health.heal(1);
                soundManager.playPowerUp();
                const toast = scene.add.text(1860, baseY - 70, '✨ ດື່ມນ້ຳສ້າງບູຮານ! ຟື້ນຟູ 1 ຫົວໃຈ ແລະ ສົດຊື່ນ', {
                    fontFamily: FONT,
                    fontSize: '13px',
                    color: '#38bdf8',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: baseY - 110,
                    alpha: 0,
                    duration: 1600,
                    onComplete: () => toast.destroy(),
                });
            },
        },
        {
            x: 2000,
            label: '🗿 [E] ອ່ານສີລາຈາລຶກບູຮານ (Lore Monument)',
            action: () => {
                soundManager.playSelect();
                const toast = scene.add.text(2000, baseY - 90, '📜 "ແດນປັນຍາທັງ 3: ຮາດແວ, ເນັດເວີກ ແລະ ເຄີນເນລ ລໍຖ້າຜູ້ກ້າ!"', {
                    fontFamily: FONT,
                    fontSize: '12px',
                    color: '#c084fc',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: baseY - 130,
                    alpha: 0,
                    duration: 2500,
                    onComplete: () => toast.destroy(),
                });
            },
        },
        {
            x: 2250,
            label: '🔭 [E] ສ່ອງກ້ອງຊົມວິວດິນແດນ (Scenic View)',
            action: () => {
                soundManager.playReward();
                scene.cameras.main.shake(100, 0.003);
                const toast = scene.add.text(2250, 430 - 40, '🔭 ເຫັນຍອດເຂົາບູຮານ ແລະ ດິນແດນອັນກວ້າງໃຫຍ່ໄກສຸດສາຍຕາ!', {
                    fontFamily: FONT,
                    fontSize: '12px',
                    color: '#fbbf24',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: 430 - 80,
                    alpha: 0,
                    duration: 2200,
                    onComplete: () => toast.destroy(),
                });
            },
        },
        {
            x: 2360,
            label: '⛩️ [E] ສັກກາລະສານປົກປ້ອງໝູ່ບ້ານ (Village Shrine)',
            action: () => {
                soundManager.playCoin();
                soundManager.playPowerUp();
                const toast = scene.add.text(2360, baseY - 80, '✨ ຂໍພອນສຳເລັດ! ໄດ້ຮັບພອນແຫ່ງຄວາມກ້າຫານ ແລະ ໂຊກລາບ', {
                    fontFamily: FONT,
                    fontSize: '12px',
                    color: '#fef08a',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: baseY - 120,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => toast.destroy(),
                });
            },
        },
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

/** A bed with a blue blanket and a pillow. */
function addBed (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // frame and legs
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(x - 36, baseY - 30, 72, 12, 3);
    g.fillRect(x - 36, baseY - 30, 6, 30);
    g.fillRect(x + 30, baseY - 44, 6, 44);
    // mattress, blanket, pillow
    g.fillStyle(0xe2e8f0, 1);
    g.fillRoundedRect(x - 30, baseY - 40, 60, 12, 4);
    g.fillStyle(0x3b82f6, 1);
    g.fillRoundedRect(x - 6, baseY - 42, 36, 14, 4);
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(x - 28, baseY - 46, 20, 10, 5);
    addLabel(scene, x, baseY - 66, '🛏️ ຕຽງນອນ (Bed)', '#bfdbfe', '#1e3a8a');
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

function addQuestBoard (scene: Phaser.Scene, x: number, baseY: number): void
{
    if (scene.textures.exists('quest-board'))
    {
        scene.add.image(x, baseY + 2, 'quest-board').setOrigin(0.5, 1).setDepth(2);
    }
    const sign = scene.add.text(x, baseY - 70, '📜 ກະດານພາລະກິດ (Quest Board)\n[E] ເບິ່ງພາລະກິດ', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
    });
    sign.setOrigin(0.5, 0.5);
    sign.setDepth(2.5);

    scene.tweens.add({
        targets: sign,
        y: baseY - 76,
        duration: 950,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });
}

function addDungeonEntrance (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.5);
    // Dark stone archway
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x - 28, baseY - 64, 56, 64, 8);
    // Dark cellar cavern opening
    g.fillStyle(0x020617, 1);
    g.fillRoundedRect(x - 20, baseY - 52, 40, 52, 6);
    // Torch beside arch
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 26, baseY - 44, 4, 16);
    g.fillStyle(0xf59e0b, 1);
    g.fillCircle(x - 24, baseY - 46, 5);
    // Sign above arch
    scene.add.text(x, baseY - 74, '🗝️ ຄຸກໃຕ້ດິນ (Dungeon)', {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#f87171',
        stroke: '#450a0a',
        strokeThickness: 3,
        align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(2.5);
}

function addTrainingDummy (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // Wooden post
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 3, baseY - 50, 6, 50);
    g.fillRect(x - 18, baseY - 38, 36, 6);
    // Straw armor body
    g.fillStyle(0xca8a04, 1);
    g.fillRoundedRect(x - 12, baseY - 44, 24, 26, 4);
    // Target bullseye
    g.fillStyle(0xef4444, 1);
    g.fillCircle(x, baseY - 31, 6);
    g.fillStyle(0xf8fafc, 1);
    g.fillCircle(x, baseY - 31, 3);
    addLabel(scene, x, baseY - 62, '🎯 ຫຸ່ນເຟືອງ (Training Dummy)', '#fef08a', '#451a03');
}

function addWaterWell (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // Stone base
    g.fillStyle(0x475569, 1);
    g.fillRoundedRect(x - 22, baseY - 32, 44, 32, 5);
    g.fillStyle(0x1e293b, 1);
    g.fillRect(x - 18, baseY - 30, 36, 4);
    // Posts & gabled canopy
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 18, baseY - 62, 5, 32);
    g.fillRect(x + 13, baseY - 62, 5, 32);
    g.fillStyle(0xb45309, 1);
    g.fillTriangle(x - 26, baseY - 60, x, baseY - 78, x + 26, baseY - 60);
    // Bucket
    g.fillStyle(0xd97706, 1);
    g.fillRect(x - 5, baseY - 42, 10, 10);
    addLabel(scene, x, baseY - 88, '💧 ນ້ຳສ້າງບູຮານ (Village Well)', '#7dd3fc', '#0c4a6e');
}

function addLoreMonument (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // Pedestal
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x - 20, baseY - 12, 40, 12, 3);
    // Obelisk
    g.fillStyle(0x475569, 1);
    g.fillRect(x - 12, baseY - 72, 24, 60);
    g.fillTriangle(x - 12, baseY - 72, x, baseY - 88, x + 12, baseY - 72);
    // Glowing runes
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(x - 4, baseY - 60, 8, 3);
    g.fillRect(x - 6, baseY - 50, 12, 3);
    g.fillRect(x - 4, baseY - 40, 8, 3);
    addLabel(scene, x, baseY - 98, '🗿 ສີລາຈາລຶກ (History Monument)', '#d8b4fe', '#3b0764');
}

function addWatchtowerVisuals (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.4);
    // Tower wooden legs & cross braces
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 40, baseY - 170, 8, 170);
    g.fillRect(x + 32, baseY - 170, 8, 170);
    g.lineStyle(4, 0x78350f, 1);
    g.lineBetween(x - 36, baseY - 20, x + 36, baseY - 90);
    g.lineBetween(x + 36, baseY - 20, x - 36, baseY - 90);
    g.lineBetween(x - 36, baseY - 90, x + 36, baseY - 160);
    g.lineBetween(x + 36, baseY - 90, x - 36, baseY - 160);
    // Deck floor & railing
    g.fillStyle(0x92400e, 1);
    g.fillRect(x - 50, baseY - 175, 100, 10);
    g.fillRect(x - 48, baseY - 200, 6, 25);
    g.fillRect(x + 42, baseY - 200, 6, 25);
    g.fillRect(x - 48, baseY - 202, 96, 5);
    // Telescope
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(x, baseY - 188, 4);
    g.fillRect(x - 2, baseY - 192, 14, 5);
    addLabel(scene, x, baseY - 216, '🔭 ຫໍສັງເກດການ (Lookout Tower)', '#fde047', '#451a03');
}

function addVillageShrine (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // Shrine Torii pillars
    g.fillStyle(0x991b1b, 1);
    g.fillRect(x - 26, baseY - 70, 7, 70);
    g.fillRect(x + 19, baseY - 70, 7, 70);
    // Roof beam
    g.fillStyle(0xb91c1c, 1);
    g.fillRoundedRect(x - 34, baseY - 78, 68, 10, 3);
    g.fillRect(x - 28, baseY - 64, 56, 5);
    // Sacred golden bell
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(x, baseY - 50, 7);
    g.fillRect(x - 4, baseY - 44, 8, 4);
    addLabel(scene, x, baseY - 90, '⛩️ ສານປົກປ້ອງໝູ່ບ້ານ (Village Shrine)', '#fef08a', '#450a0a');
}
