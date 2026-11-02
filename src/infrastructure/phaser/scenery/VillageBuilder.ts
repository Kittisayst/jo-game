import { Math as PhaserMath } from 'phaser';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';

export interface InteractiveBuilding
{
    x: number;
    label: string;
    action: () => void;
}

const FONT = '"Noto Sans Lao", sans-serif';
/** The Smithy (Workshop and Forge in one building). */
export const SMITHY_X = 3100;
/** Where the lanterns along the path stand across the 7,000px village span. */
export const VILLAGE_LANTERN_XS = [200, 520, 880, 1380, 2050, 2750, 3250, 3500, 3750, 4200, 4850, 5500, 6100, 6650];
/** How high above the ground a lantern's flame is. */
export const VILLAGE_LANTERN_FLAME_HEIGHT = 54;
export const COTTAGE_X = 360;
export const FRONT_CHEST_X = 240;
export const SIDE_GARDEN_DOOR_X = 480;
export const QUEST_BOARD_X = 620;
export const WORLD_GATE_X = 3600;

/**
 * Draws the Expanded Village Hub (7,000px):
 * - Hero Cottage as Building #1 (x = 360) with outdoor chest (x = 240) and side garden door (x = 480)
 * - Quest Board (x = 620) next to cottage
 * - Doubled distance between Library (1050), Academy (1700), Smithy (3100), with Grandma Chanthy and her shop at x = 2480
 * - Animated World Gate Portal right in the village center (x = 3600)
 * - Dungeon Entrance removed from village
 * - Wandering pets (Lucky & Clucky) and lively scenery across 7,000px
 */
export function buildVillageScenery (scene: Phaser.Scene, baseY: number): InteractiveBuilding[]
{
    const buildings = [
        {
            x: 1050,
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
            x: 1700,
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
            x: SMITHY_X,
            textureKey: 'building-forge-open',
            width: 168,
            height: 192,
            roofColor: 0xf97316,
            bodyColor: 0x1e293b,
            icon: '⚒️',
            name: 'ໂຮງຊ່າງ (Smithy)',
            sub: 'ເຄື່ອງມື · ອາວຸດ · ສ້ອມແປງ',
        },
    ];

    // Background village trees across 7000px
    const TREE_POSITIONS = [180, 420, 800, 1350, 1900, 2700, 3200, 3750, 4250, 4850, 5450, 6100, 6650];
    for (const tx of TREE_POSITIONS)
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

    // Main village buildings (Library, Academy, Smithy)
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

    // Mina's Skin Boutique Stall at x = 3350 (Center Market)
    if (scene.textures.exists('stall-mina'))
    {
        scene.add.image(3350, baseY + 2, 'stall-mina').setOrigin(0.5, 1).setDepth(1.5);
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

    // 1. Building #1: Hero's Cottage (x = 360)
    addHeroCottage(scene, COTTAGE_X, baseY);

    // 2. Outdoor Storage Chest in front of Cottage (x = 240)
    addStorageChest(scene, FRONT_CHEST_X, baseY);

    // 3. Side Garden Gate beside Cottage (x = 480)
    addGardenDoor(scene, SIDE_GARDEN_DOOR_X, baseY);

    // 4. Quest Board right next to Cottage & Garden Gate (x = 620)
    addQuestBoard(scene, QUEST_BOARD_X, baseY);

    // 5. Village Pets (Lucky at 3450, Clucky at 980) with Wandering AI
    const pets = addVillagePets(scene, baseY);

    // 5.1 Pet Companion Stall (x = 3520)
    addPetStall(scene, 3520, baseY);

    // 6. Ambient Props & East Wing Landmarks
    addStoneLanterns(scene, baseY);
    addVillageAmbienceEffects(scene, baseY);
    addTrainingDummy(scene, 4620, baseY);
    addWaterWell(scene, 5200, baseY);
    addLoreMonument(scene, 5800, baseY);
    addWatchtowerVisuals(scene, 6400, baseY);
    addVillageShrine(scene, 6850, baseY);

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

    // Animated World Gate Portal in the CENTER OF THE VILLAGE (x = 3600)
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
        const gateSprite = scene.add.sprite(WORLD_GATE_X, baseY + 2, 'world-gate', 0);
        gateSprite.setOrigin(0.5, 1);
        gateSprite.setDepth(1.8);
        gateSprite.play('world-gate-swirl');
    }

    const portalSign = scene.add.text(WORLD_GATE_X, baseY - 174, '🌀 ປະຕູມິຕິ (World Gate)\n[E] ເປີດແຜນທີ່ດ່ານ ➡️', {
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

    const smithy: InteractiveBuilding = {
        x: SMITHY_X,
        label: '⚒️ [E] ເຂົ້າໂຮງຊ່າງ (Smithy: ເຄື່ອງມື · ອາວຸດ · ສ້ອມແປງ)',
        action: () => EventBus.emit('open-smithy'),
    };

    return [
        {
            x: COTTAGE_X,
            label: '🏡 [E] ເຂົ້າເຮືອນພັກ (Hero Cottage)',
            action: () => EventBus.emit('change-level', 'cottage'),
        },
        {
            x: FRONT_CHEST_X,
            label: '📦 [E] ເປີດຫີບເກັບຂອງ (Storage)',
            action: () => EventBus.emit('open-storage'),
        },
        {
            x: SIDE_GARDEN_DOOR_X,
            label: '🌱 [E] ເຂົ້າສວນຜັກ (Garden)',
            action: () => EventBus.emit('change-level', 'garden'),
        },
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
        { x: 1050, label: '📚 [E] ເຂົ້າຫໍສະໝຸດ (Library)', action: () => EventBus.emit('open-library') },
        { x: 1700, label: '🏛️ [E] ເຂົ້າສະຖາບັນ (Academy)', action: () => EventBus.emit('open-academy') },
        smithy,
        pets.dogInteractive,
        pets.chickenInteractive,
        { x: 3520, label: '🐾 [E] ຮ້ານສັດລ້ຽງ (Pet Companion Stall)', action: () => EventBus.emit('open-pet-shop') },
        { x: WORLD_GATE_X, label: '🌀 [E] ເລືອກດ່ານຜະຈົນໄພ (World Map)', action: () => EventBus.emit('open-stage-map') },
        {
            x: 4620,
            label: '🎯 [E] ທົດສອບອາວຸດ (Training Dummy)',
            action: () => {
                const weaponId = entities.equipment.equippedWeaponId;
                const weaponDef = weaponId ? entities.itemCatalog.get(weaponId) : undefined;
                const damage = weaponDef?.baseDamage ?? 5;
                soundManager.playSlash();
                scene.cameras.main.shake(80, 0.003);
                const toast = scene.add.text(4620, baseY - 60, `💥 ${weaponDef?.name ?? 'ມືເປົ່າ'} ໂຈມຕີ! ${damage} DMG!`, {
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
            x: 5200,
            label: '💧 [E] ຕັກນ້ຳສ້າງບູຮານ (Village Well)',
            action: () => {
                entities.health.heal(1);
                soundManager.playPowerUp();
                const toast = scene.add.text(5200, baseY - 70, '✨ ດື່ມນ້ຳສ້າງບູຮານ! ຟື້ນຟູ 1 ຫົວໃຈ ແລະ ສົດຊື່ນ', {
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
            x: 5800,
            label: '🗿 [E] ອ່ານສີລາຈາລຶກບູຮານ (Lore Monument)',
            action: () => {
                soundManager.playSelect();
                const toast = scene.add.text(5800, baseY - 90, '📜 "ແດນປັນຍາທັງ 3: ຮາດແວ, ເນັດເວີກ ແລະ ເຄີນເນລ ລໍຖ້າຜູ້ກ້າ!"', {
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
            x: 6400,
            label: '🔭 [E] ສ່ອງກ້ອງຊົມວິວດິນແດນ (Scenic View)',
            action: () => {
                soundManager.playReward();
                scene.cameras.main.shake(100, 0.003);
                const toast = scene.add.text(6400, baseY - 90, '🔭 ເຫັນຍອດເຂົາບູຮານ ແລະ ດິນແດນອັນກວ້າງໃຫຍ່ໄກສຸດສາຍຕາ!', {
                    fontFamily: FONT,
                    fontSize: '12px',
                    color: '#fbbf24',
                    stroke: '#0f172a',
                    strokeThickness: 3,
                }).setOrigin(0.5, 0.5).setDepth(20);
                scene.tweens.add({
                    targets: toast,
                    y: baseY - 130,
                    alpha: 0,
                    duration: 2200,
                    onComplete: () => toast.destroy(),
                });
            },
        },
        {
            x: 6850,
            label: '⛩️ [E] ສັກກາລະສານປົກປ້ອງໝູ່ບ້ານ (Village Shrine)',
            action: () => {
                soundManager.playCoin();
                soundManager.playPowerUp();
                const toast = scene.add.text(6850, baseY - 80, '✨ ຂໍພອນສຳເລັດ! ໄດ້ຮັບພອນແຫ່ງຄວາມກ້າຫານ ແລະ ໂຊກລາບ', {
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

/** Side Arch Gate beside Hero's cottage leading into Garden */
function addGardenDoor (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 30, baseY - 90, 8, 90);
    g.fillRect(x + 22, baseY - 90, 8, 90);
    g.fillRect(x - 34, baseY - 98, 68, 10);
    g.fillStyle(0x16a34a, 1);
    g.fillCircle(x - 26, baseY - 98, 9);
    g.fillCircle(x + 26, baseY - 98, 9);
    g.fillCircle(x, baseY - 104, 11);
    g.fillStyle(0x22c55e, 0.85);
    g.fillRect(x - 22, baseY - 86, 44, 86);
    addLabel(scene, x, baseY - 120, '🌱 ປະຕູຂ້າງບ້ານໄປສວນ\n[E] ເຂົ້າສວນຜັກ', '#86efac', '#064e3b');
}

/** Hero's Cozy Cottage (Building #1) */
function addHeroCottage (scene: Phaser.Scene, x: number, baseY: number): void
{
    if (scene.textures.exists('building-cottage'))
    {
        scene.add.image(x, baseY + 2, 'building-cottage').setOrigin(0.5, 1).setDepth(1.4);
    }
    else
    {
        const g = scene.add.graphics();
        g.setDepth(1.4);
        g.fillStyle(0x78350f, 1);
        g.fillRoundedRect(x - 70, baseY - 130, 140, 130, 8);
        g.fillStyle(0x991b1b, 1);
        g.fillTriangle(x - 80, baseY - 130, x, baseY - 170, x + 80, baseY - 130);
    }

    // Cottage front entrance door
    const door = scene.add.graphics().setDepth(1.5);
    door.fillStyle(0x451a03, 1);
    door.fillRoundedRect(x - 16, baseY - 50, 32, 50, 4);
    door.fillStyle(0xfbbf24, 1);
    door.fillCircle(x + 9, baseY - 24, 3); // brass knob

    // Warm Window Light
    const win = scene.add.graphics().setDepth(1.5);
    win.fillStyle(0xfef08a, 0.75);
    win.fillRoundedRect(x + 24, baseY - 80, 28, 24, 3);

    addLabel(scene, x, baseY - 175, '🏡 ເຮືອນພັກວິລະບູລຸດ (ຫຼັງທີ 1)\n[E] ເຂົ້າໃນເຮືອນ', '#fef08a', '#1e293b');
}

/** Village pets: Lucky the Dog & Clucky the Chicken with Wandering AI */
function addVillagePets (scene: Phaser.Scene, baseY: number): { dogInteractive: InteractiveBuilding; chickenInteractive: InteractiveBuilding }
{
    const DOG_HOME_X = 3450;
    const CHICKEN_HOME_X = 980;

    // 1. Lucky the Dog with autonomous wandering
    let dogTarget: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
    if (scene.textures.exists('pet-dog'))
    {
        if (!scene.anims.exists('pet-dog-idle'))
        {
            scene.anims.create({
                key: 'pet-dog-idle',
                frames: scene.anims.generateFrameNumbers('pet-dog', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1,
            });
        }
        const s = scene.add.sprite(DOG_HOME_X, baseY + 2, 'pet-dog', 0);
        s.setOrigin(0.5, 1);
        s.setDepth(2);
        s.play('pet-dog-idle');
        dogTarget = s;

        // Autonomous Wandering for Lucky
        const wanderDog = () => {
            if (!s.active) return;
            const targetX = DOG_HOME_X + PhaserMath.Between(-100, 100);
            const duration = Math.abs(targetX - s.x) * 35 + 800;
            s.setFlipX(targetX < s.x);
            scene.tweens.add({
                targets: s,
                x: targetX,
                duration,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    scene.time.delayedCall(PhaserMath.Between(1800, 3800), wanderDog);
                },
            });
        };
        scene.time.delayedCall(2000, wanderDog);
    }
    else
    {
        const g = scene.add.graphics();
        g.setDepth(2);
        g.fillStyle(0xb45309, 1);
        g.fillRoundedRect(DOG_HOME_X - 10, baseY - 16, 20, 16, 4);
        dogTarget = g;
    }
    addLabel(scene, DOG_HOME_X, baseY - 36, '🐕 ເຈົ້າໂຊກດີ (Lucky)', '#fde68a', '#78350f');

    const petLuckyAction = () => {
        soundManager.playPetDog();
        for (let i = 0; i < 3; i++)
        {
            const heart = scene.add.text(dogTarget.x + (i - 1) * 14, baseY - 32, '❤️', { fontSize: '18px' });
            heart.setDepth(15);
            scene.tweens.add({
                targets: heart,
                y: baseY - 70 - i * 12,
                alpha: { from: 1, to: 0 },
                scale: { from: 0.8, to: 1.4 },
                duration: 900 + i * 200,
                ease: 'Cubic.easeOut',
                onComplete: () => heart.destroy(),
            });
        }
        scene.tweens.add({
            targets: dogTarget,
            scaleY: 1.25,
            scaleX: 0.85,
            yoyo: true,
            duration: 180,
            repeat: 2,
        });
        EventBus.emit('show-toast', { message: '🐾 ເຈົ້າໂຊກດີ ກະດິກຫາງດີໃຈ! (Lucky loves you! ❤️)', type: 'info' });
    };

    // 2. Clucky the Chicken with autonomous pecking & wandering
    let chickenTarget: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
    if (scene.textures.exists('pet-chicken'))
    {
        if (!scene.anims.exists('pet-chicken-peck'))
        {
            scene.anims.create({
                key: 'pet-chicken-peck',
                frames: scene.anims.generateFrameNumbers('pet-chicken', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1,
            });
        }
        const s = scene.add.sprite(CHICKEN_HOME_X, baseY + 2, 'pet-chicken', 0);
        s.setOrigin(0.5, 1);
        s.setDepth(2);
        s.play('pet-chicken-peck');
        chickenTarget = s;

        // Autonomous Wandering for Clucky
        const wanderChicken = () => {
            if (!s.active) return;
            const targetX = CHICKEN_HOME_X + PhaserMath.Between(-70, 70);
            const duration = Math.abs(targetX - s.x) * 45 + 600;
            s.setFlipX(targetX < s.x);
            scene.tweens.add({
                targets: s,
                x: targetX,
                duration,
                ease: 'Linear',
                onComplete: () => {
                    scene.time.delayedCall(PhaserMath.Between(2000, 4200), wanderChicken);
                },
            });
        };
        scene.time.delayedCall(1500, wanderChicken);
    }
    else
    {
        const g = scene.add.graphics();
        g.setDepth(2);
        g.fillStyle(0xf8fafc, 1);
        g.fillCircle(CHICKEN_HOME_X - 8, baseY - 8, 8);
        chickenTarget = g;
    }
    addLabel(scene, CHICKEN_HOME_X, baseY - 32, '🐔 ແມ່ໄກ່ຄຳ (Clucky)', '#fed7aa', '#991b1b');

    const feedCluckyAction = () => {
        soundManager.playChickenCluck();
        const egg = scene.add.text(chickenTarget.x, baseY - 20, '🥚', { fontSize: '16px' });
        egg.setDepth(15);
        scene.tweens.add({
            targets: egg,
            y: baseY - 48,
            alpha: { from: 1, to: 0 },
            duration: 800,
            onComplete: () => egg.destroy(),
        });
        scene.tweens.add({
            targets: chickenTarget,
            y: baseY - 12,
            yoyo: true,
            duration: 150,
            repeat: 2,
        });
        EventBus.emit('show-toast', { message: '🐔 ແມ່ໄກ່ຄຳ ຮ້ອງກຸກໆຂອບໃຈ! (Clucky clucked! 🥚)', type: 'info' });
    };

    return {
        dogInteractive: {
            x: DOG_HOME_X,
            get label () {
                return entities.petManager.isOwned('pet-lucky')
                    ? '❤️ [E] ລູບຫົວ Lucky / ນຳໃຊ້'
                    : '🐾 [E] ຮັບລ້ຽງໝານ້ອຍ Lucky (80 C)';
            },
            action: () => {
                if (!entities.petManager.isOwned('pet-lucky'))
                {
                    EventBus.emit('open-pet-shop');
                }
                else
                {
                    petLuckyAction();
                    if (!entities.petManager.isActive('pet-lucky'))
                    {
                        entities.petManager.equip('pet-lucky');
                        EventBus.emit('pet-changed', 'pet-lucky');
                    }
                }
            },
        },
        chickenInteractive: {
            x: CHICKEN_HOME_X,
            get label () {
                return entities.petManager.isOwned('pet-clucky')
                    ? '❤️ [E] ໃຫ້ອາຫານ Clucky / ນຳໃຊ້'
                    : '🐔 [E] ຊື້ແມ່ໄກ່ Clucky (50 C)';
            },
            action: () => {
                if (!entities.petManager.isOwned('pet-clucky'))
                {
                    EventBus.emit('open-pet-shop');
                }
                else
                {
                    feedCluckyAction();
                    if (!entities.petManager.isActive('pet-clucky'))
                    {
                        entities.petManager.equip('pet-clucky');
                        EventBus.emit('pet-changed', 'pet-clucky');
                    }
                }
            },
        },
    };
}

/** Pet Companion Stall near Mina's Boutique */
function addPetStall (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    // Wooden stall posts
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 28, baseY - 65, 6, 65);
    g.fillRect(x + 22, baseY - 65, 6, 65);
    // Striped canopy (amber & brown)
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(x - 34, baseY - 75, 68, 12);
    g.fillStyle(0xd97706, 1);
    g.fillRect(x - 34, baseY - 63, 68, 4);
    // Table counter
    g.fillStyle(0xb45309, 1);
    g.fillRect(x - 26, baseY - 26, 52, 26);
    // Sign
    scene.add.text(x, baseY - 45, '🐾 🐕 🐔', { fontSize: '13px' }).setOrigin(0.5).setDepth(2);
    addLabel(scene, x, baseY - 90, '🐾 ຮ້ານສັດລ້ຽງ (Pet Stall)\n[E] ຊື້ & ນຳໃຊ້ສັດລ້ຽງ', '#fde68a', '#78350f');
}

/** Stone lanterns (Toro) and ambient night fireflies in eastern zone */
function addStoneLanterns (scene: Phaser.Scene, baseY: number): void
{
    const STONE_LANTERNS = [4000, 4750, 5350, 5950, 6550];

    for (const lx of STONE_LANTERNS)
    {
        if (scene.textures.exists('stone-lantern'))
        {
            if (!scene.anims.exists('stone-lantern-glow'))
            {
                scene.anims.create({
                    key: 'stone-lantern-glow',
                    frames: scene.anims.generateFrameNumbers('stone-lantern', { start: 1, end: 3 }),
                    frameRate: 4,
                    repeat: -1,
                });
            }
            const lamp = scene.add.sprite(lx, baseY + 2, 'stone-lantern', 0);
            lamp.setOrigin(0.5, 1);
            lamp.setDepth(2);
            lamp.play('stone-lantern-glow');
        }
        else
        {
            const post = scene.add.graphics();
            post.setDepth(2);
            post.fillStyle(0x475569, 1);
            post.fillRect(lx - 4, baseY - 44, 8, 44);
            post.fillStyle(0xf59e0b, 1);
            post.fillCircle(lx, baseY - 36, 6);
        }

        const glow = scene.add.graphics();
        glow.setDepth(1.7);
        glow.fillStyle(0xf59e0b, 0.15);
        glow.fillCircle(lx, baseY - 32, 28);
        glow.fillStyle(0xfde047, 0.25);
        glow.fillCircle(lx, baseY - 32, 14);

        scene.tweens.add({
            targets: glow,
            alpha: { from: 0.5, to: 0.95 },
            duration: 1200 + (lx % 300),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    // Fireflies floating near Well (5200) and Shrine (6850)
    for (const fx of [5200, 6850])
    {
        for (let i = 0; i < 4; i++)
        {
            const firefly = scene.add.graphics();
            firefly.setDepth(2.5);
            firefly.fillStyle(0xa3e635, 0.9);
            firefly.fillCircle(0, 0, 2);
            firefly.setPosition(fx + (i - 1.5) * 26, baseY - 35 - i * 12);

            scene.tweens.add({
                targets: firefly,
                x: fx + (i - 1.5) * 26 + (i % 2 === 0 ? 14 : -14),
                y: baseY - 55 - i * 8,
                alpha: { from: 0.2, to: 0.95 },
                duration: 1600 + i * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }
}

/** Environmental particles: Chimney smoke and falling leaves */
function addVillageAmbienceEffects (scene: Phaser.Scene, baseY: number): void
{
    // 1. Chimney Smoke Puffs
    const CHIMNEYS = [
        { x: COTTAGE_X - 48, y: baseY - 162 }, // Hero Cottage
        { x: SMITHY_X + 38, y: baseY - 194 },  // Smithy
    ];

    for (const ch of CHIMNEYS)
    {
        for (let p = 0; p < 3; p++)
        {
            const smoke = scene.add.graphics();
            smoke.setDepth(1.2);
            smoke.fillStyle(0xf1f5f9, 0.5);
            smoke.fillCircle(0, 0, 5);
            smoke.setPosition(ch.x, ch.y);

            scene.tweens.add({
                targets: smoke,
                x: ch.x + 18,
                y: ch.y - 45,
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.6, to: 0 },
                duration: 2200,
                delay: p * 700,
                repeat: -1,
                ease: 'Quad.easeOut',
            });
        }
    }

    // 2. Falling Leaves from Village Trees
    const LEAF_TREES = [180, 420, 800, 1350, 1900, 2700, 3200, 4250, 5450, 6650];
    for (const tx of LEAF_TREES)
    {
        for (let l = 0; l < 2; l++)
        {
            const leaf = scene.add.graphics();
            leaf.setDepth(1.8);
            leaf.fillStyle(l === 0 ? 0x22c55e : 0xfbbf24, 0.85);
            leaf.fillEllipse(0, 0, 4, 2);
            leaf.setPosition(tx + (l === 0 ? -15 : 15), baseY - 120);

            scene.tweens.add({
                targets: leaf,
                x: tx + (l === 0 ? 25 : -25),
                y: baseY - 2,
                rotation: 6.28,
                alpha: { from: 0.9, to: 0 },
                duration: 3400 + l * 800,
                delay: l * 1500,
                repeat: -1,
                ease: 'Linear',
            });
        }
    }
}

function addStorageChest (scene: Phaser.Scene, x: number, baseY: number): void
{
    if (scene.textures.exists('storage-chest'))
    {
        scene.add.image(x, baseY + 2, 'storage-chest').setOrigin(0.5, 1).setDepth(2);
    }
    else
    {
        const g = scene.add.graphics();
        g.setDepth(1.6);
        g.fillStyle(0x92400e, 1);
        g.fillRoundedRect(x - 13, baseY - 18, 26, 18, 3);
        g.fillStyle(0xfacc15, 1);
        g.fillRect(x - 2, baseY - 11, 4, 5);
    }
    addLabel(scene, x, baseY - 30, '📦 ຫີບເກັບຂອງ (Storage)', '#fde68a', '#451a03');
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

function addTrainingDummy (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 3, baseY - 50, 6, 50);
    g.fillRect(x - 18, baseY - 38, 36, 6);
    g.fillStyle(0xca8a04, 1);
    g.fillRoundedRect(x - 12, baseY - 44, 24, 26, 4);
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
    g.fillStyle(0x475569, 1);
    g.fillRoundedRect(x - 22, baseY - 32, 44, 32, 5);
    g.fillStyle(0x1e293b, 1);
    g.fillRect(x - 18, baseY - 30, 36, 4);
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 18, baseY - 62, 5, 32);
    g.fillRect(x + 13, baseY - 62, 5, 32);
    g.fillStyle(0xb45309, 1);
    g.fillTriangle(x - 26, baseY - 60, x, baseY - 78, x + 26, baseY - 60);
    g.fillStyle(0xd97706, 1);
    g.fillRect(x - 5, baseY - 42, 10, 10);
    addLabel(scene, x, baseY - 88, '💧 ນ້ຳສ້າງບູຮານ (Village Well)', '#7dd3fc', '#0c4a6e');
}

function addLoreMonument (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x - 20, baseY - 12, 40, 12, 3);
    g.fillStyle(0x475569, 1);
    g.fillRect(x - 12, baseY - 72, 24, 60);
    g.fillTriangle(x - 12, baseY - 72, x, baseY - 88, x + 12, baseY - 72);
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
    g.fillStyle(0x78350f, 1);
    g.fillRect(x - 40, baseY - 170, 8, 170);
    g.fillRect(x + 32, baseY - 170, 8, 170);
    g.lineStyle(4, 0x78350f, 1);
    g.lineBetween(x - 36, baseY - 20, x + 36, baseY - 90);
    g.lineBetween(x + 36, baseY - 20, x - 36, baseY - 90);
    g.lineBetween(x - 36, baseY - 90, x + 36, baseY - 160);
    g.lineBetween(x + 36, baseY - 90, x - 36, baseY - 160);
    g.fillStyle(0x92400e, 1);
    g.fillRect(x - 50, baseY - 175, 100, 10);
    g.fillRect(x - 48, baseY - 200, 6, 25);
    g.fillRect(x + 42, baseY - 200, 6, 25);
    g.fillRect(x - 48, baseY - 202, 96, 5);
    g.fillStyle(0x451a03, 1);
    g.fillRect(x - 8, baseY - 170, 2, 170);
    g.fillRect(x + 6, baseY - 170, 2, 170);
    for (let r = 0; r < 9; r++)
    {
        g.fillRect(x - 8, baseY - 16 - r * 18, 16, 2);
    }
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(x, baseY - 188, 4);
    g.fillRect(x - 2, baseY - 192, 14, 5);
    addLabel(scene, x, baseY - 216, '🔭 ຫໍສັງເກດການ (Lookout Tower)', '#fde047', '#451a03');
}

function addVillageShrine (scene: Phaser.Scene, x: number, baseY: number): void
{
    const g = scene.add.graphics();
    g.setDepth(1.6);
    g.fillStyle(0x991b1b, 1);
    g.fillRect(x - 26, baseY - 70, 7, 70);
    g.fillRect(x + 19, baseY - 70, 7, 70);
    g.fillStyle(0xb91c1c, 1);
    g.fillRoundedRect(x - 34, baseY - 78, 68, 10, 3);
    g.fillRect(x - 28, baseY - 64, 56, 5);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(x, baseY - 50, 7);
    g.fillRect(x - 4, baseY - 44, 8, 4);
    addLabel(scene, x, baseY - 90, '⛩️ ສານປົກປ້ອງໝູ່ບ້ານ (Village Shrine)', '#fef08a', '#450a0a');
}
