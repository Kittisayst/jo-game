import { Math as PhaserMath, Physics, Scene } from 'phaser';

const WIDTH = 32;
const HEIGHT = 48;
const PROXIMITY_RANGE = 110;

export class NPC extends Physics.Arcade.Sprite
{
    private promptContainer: Phaser.GameObjects.Container;
    private isPlayerInRange = false;
    onInteract?: () => void;

    readonly homeX: number;
    wanderRadius: number;
    wanderSpeed: number;
    private wanderState: 'idle' | 'walking' = 'idle';
    private stateTimer = 2000;
    private targetX: number;

    constructor (scene: Scene, x: number, y: number, texture = 'npc-elder', promptText = '💬 [E] ລົມກັນ', wanderRadius = 60, wanderSpeed = 28)
    {
        NPC.ensureTexture(scene, texture);

        super(scene, x, y, texture);

        this.homeX = x;
        this.targetX = x;
        this.wanderRadius = wanderRadius;
        this.wanderSpeed = wanderSpeed;
        this.stateTimer = PhaserMath.Between(1500, 3500);

        scene.add.existing(this);
        scene.physics.add.existing(this, false);
        if (this.body)
        {
            (this.body as Physics.Arcade.Body).setAllowGravity(false);
            this.body.immovable = true;
        }

        this.setSize(WIDTH, HEIGHT);
        this.setDepth(9);

        const tex = scene.textures.get(texture);
        if (tex && tex.frameTotal > 4)
        {
            const idleKey = `${texture}-idle`;
            if (!scene.anims.exists(idleKey))
            {
                scene.anims.create({
                    key: idleKey,
                    frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1,
                });
            }
            this.play(idleKey);
        }

        // Gentle breathing idle float
        scene.tweens.add({
            targets: this,
            scaleY: 1.02,
            scaleX: 0.98,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Interactive Speech Bubble Prompt above head
        this.promptContainer = scene.add.container(x, y - HEIGHT - 18);
        this.promptContainer.setDepth(15);
        this.promptContainer.setAlpha(0);

        const bubbleText = scene.add.text(0, 0, promptText, {
            fontFamily: 'Noto Sans Lao, sans-serif',
            fontSize: '13px',
            color: '#38bdf8',
            fontStyle: 'bold',
        });
        bubbleText.setOrigin(0.5, 0.5);

        // The bubble grows with its text so a long prompt is never cut off
        const bubbleWidth = Math.max(140, Math.ceil(bubbleText.width) + 28);
        const halfWidth = bubbleWidth / 2;

        const bubbleBg = scene.add.graphics();
        bubbleBg.fillStyle(0x0f172a, 0.92);
        bubbleBg.lineStyle(1.5, 0x38bdf8, 1);
        bubbleBg.fillRoundedRect(-halfWidth, -16, bubbleWidth, 32, 16);
        bubbleBg.strokeRoundedRect(-halfWidth, -16, bubbleWidth, 32, 16);

        // Pointer triangle at bottom of bubble
        bubbleBg.beginPath();
        bubbleBg.moveTo(-6, 16);
        bubbleBg.lineTo(0, 23);
        bubbleBg.lineTo(6, 16);
        bubbleBg.closePath();
        bubbleBg.fillPath();
        bubbleBg.strokePath();

        this.promptContainer.add([bubbleBg, bubbleText]);

        // Floating animation on prompt
        scene.tweens.add({
            targets: this.promptContainer,
            y: y - HEIGHT - 24,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Make prompt clickable for mouse/touch players
        this.promptContainer.setSize(bubbleWidth, 32);
        this.promptContainer.setInteractive({ useHandCursor: true });
        this.promptContainer.on('pointerdown', () =>
        {
            if (this.isPlayerInRange)
            {
                this.triggerInteraction();
            }
        });

        this.on('destroy', () =>
        {
            this.promptContainer.destroy();
        });
    }

    private static ensureTexture (scene: Scene, textureKey: string): void
    {
        if (scene.textures.exists(textureKey)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        if (textureKey === 'npc-merchant' || textureKey === 'npc-mina')
        {
            // Merchant Mina: Magenta/violet cyber jacket with gold scarf
            graphics.fillStyle(0x7c3aed, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0xf472b6, 1);
            graphics.fillRect(6, 10, WIDTH - 12, 10);
            graphics.fillStyle(0xfbbf24, 1);
            graphics.fillRect(4, 24, WIDTH - 8, 6);
            graphics.fillStyle(0x38bdf8, 1);
            graphics.fillCircle(11, 14, 2);
            graphics.fillCircle(21, 14, 2);
            // Merchant pack
            graphics.fillStyle(0xd97706, 1);
            graphics.fillRect(WIDTH - 6, 16, 6, 18);
        }
        else if (textureKey === 'npc-bounmy')
        {
            // Hunter Bounmy: Forest green cloak, leather quiver and hunter cap
            graphics.fillStyle(0x166534, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0x78350f, 1); // leather vest
            graphics.fillRect(6, 12, WIDTH - 12, 14);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0x15803d, 1); // hunter cap
            graphics.fillRect(4, 2, WIDTH - 8, 6);
            graphics.fillStyle(0xd97706, 1); // quiver strap
            graphics.lineStyle(2, 0x92400e, 1);
            graphics.lineBetween(6, 12, WIDTH - 6, 26);
        }
        else if (textureKey === 'npc-somchay')
        {
            // Archaeologist Somchay: Explorer khaki jacket, explorer hat, mining torch
            graphics.fillStyle(0xb45309, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0xd97706, 1); // khaki jacket
            graphics.fillRect(6, 14, WIDTH - 12, 16);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0x78350f, 1); // explorer hat
            graphics.fillRect(4, 2, WIDTH - 8, 6);
            graphics.fillStyle(0x38bdf8, 1); // glasses
            graphics.fillCircle(11, 12, 2);
            graphics.fillCircle(21, 12, 2);
            graphics.fillStyle(0xf59e0b, 1); // torch/lantern glow
            graphics.fillCircle(WIDTH - 4, 24, 4);
        }
        else if (textureKey === 'npc-scholar')
        {
            // Master Vanh: Royal blue scholar robe with gold trim & digital scroll
            graphics.fillStyle(0x1e3a8a, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0x3b82f6, 1); // inner robe
            graphics.fillRect(6, 14, WIDTH - 12, 18);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0x1e293b, 1); // scholar cap
            graphics.fillRect(4, 2, WIDTH - 8, 6);
            graphics.fillStyle(0xfbbf24, 1); // gold sash
            graphics.fillRect(6, 26, WIDTH - 12, 4);
            graphics.fillStyle(0x38bdf8, 1); // glowing scroll in hand
            graphics.fillRect(WIDTH - 8, 22, 6, 12);
        }
        else if (textureKey === 'npc-chanthy')
        {
            // Grandma Chanthy: Emerald sinh, pink woven sash, herb basket
            graphics.fillStyle(0x065f46, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0x047857, 1); // sinh skirt
            graphics.fillRect(4, 22, WIDTH - 8, 24);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0xf472b6, 1); // pink traditional sash
            graphics.fillRect(6, 12, 6, 18);
            graphics.fillStyle(0x92400e, 1); // woven basket
            graphics.fillRect(WIDTH - 8, 24, 7, 10);
            graphics.fillStyle(0x4ade80, 1); // green herbs in basket
            graphics.fillCircle(WIDTH - 5, 22, 4);
        }
        else if (textureKey === 'npc-kham')
        {
            // Swordsman Kham: Crimson martial arts gi, white headband, wooden practice bokken
            graphics.fillStyle(0x991b1b, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0xb91c1c, 1); // gi torso
            graphics.fillRect(4, 12, WIDTH - 8, 20);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0xf8fafc, 1); // white headband
            graphics.fillRect(4, 6, WIDTH - 8, 4);
            graphics.fillStyle(0x0f172a, 1); // black martial belt
            graphics.fillRect(4, 28, WIDTH - 8, 4);
            graphics.fillStyle(0x78350f, 1); // wooden sword on back
            graphics.lineStyle(2, 0x78350f, 1);
            graphics.lineBetween(4, 10, WIDTH - 4, 38);
        }
        else if (textureKey === 'npc-noy')
        {
            // Shrine Maiden Noy: White kimono, red hakama skirt, prayer bell
            graphics.fillStyle(0xf8fafc, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0xdc2626, 1); // crimson hakama skirt
            graphics.fillRect(4, 24, WIDTH - 8, 22);
            graphics.fillStyle(0xfef08a, 1); // face
            graphics.fillRect(8, 8, WIDTH - 16, 8);
            graphics.fillStyle(0x0f172a, 1); // dark hair
            graphics.fillRect(4, 2, WIDTH - 8, 6);
            graphics.fillStyle(0xef4444, 1); // red hair ribbon
            graphics.fillCircle(8, 4, 3);
            graphics.fillStyle(0xfbbf24, 1); // gold prayer bell
            graphics.fillCircle(WIDTH - 5, 24, 4);
        }
        else
        {
            graphics.fillStyle(0x1e3a8a, 1);
            graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);
            graphics.fillStyle(0xfef08a, 1);
            graphics.fillRect(8, 12, WIDTH - 16, 8);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillTriangle(WIDTH / 2, 20, 6, HEIGHT - 10, WIDTH - 6, HEIGHT - 10);
        }

        graphics.generateTexture(textureKey, WIDTH, HEIGHT);
        graphics.destroy();
    }

    updateProximity (playerX: number, playerY: number, delta = 16): void
    {
        const dist = Math.hypot(this.x - playerX, this.y - playerY);
        const inRange = dist <= PROXIMITY_RANGE;

        if (inRange !== this.isPlayerInRange)
        {
            this.isPlayerInRange = inRange;
            this.scene.tweens.add({
                targets: this.promptContainer,
                alpha: inRange ? 1 : 0,
                duration: 200,
                ease: 'Quad.easeOut',
            });
        }

        if (inRange)
        {
            this.setFlipX(playerX < this.x);
            this.wanderState = 'idle';
        }
        else if (this.wanderRadius > 0)
        {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0)
            {
                if (this.wanderState === 'walking')
                {
                    this.wanderState = 'idle';
                    this.stateTimer = PhaserMath.Between(2500, 5000);
                }
                else
                {
                    this.targetX = this.homeX + PhaserMath.Between(-this.wanderRadius, this.wanderRadius);
                    this.wanderState = 'walking';
                    this.stateTimer = PhaserMath.Between(3000, 6000);
                }
            }

            if (this.wanderState === 'walking')
            {
                const diff = this.targetX - this.x;
                if (Math.abs(diff) < 2)
                {
                    this.wanderState = 'idle';
                    this.stateTimer = PhaserMath.Between(2000, 4500);
                }
                else
                {
                    const step = Math.sign(diff) * Math.min(Math.abs(diff), this.wanderSpeed * (delta / 1000));
                    this.setX(this.x + step);
                    this.setFlipX(diff < 0);
                    if (this.body)
                    {
                        this.body.reset(this.x, this.y);
                    }
                }
            }
        }

        this.promptContainer.setX(this.x);
    }

    triggerInteraction (): void
    {
        this.onInteract?.();
    }

    get isInteractable (): boolean
    {
        return this.isPlayerInRange;
    }
}
