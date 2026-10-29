import { Physics, Scene } from 'phaser';

const WIDTH = 32;
const HEIGHT = 48;
const PROXIMITY_RANGE = 110;

export class NPC extends Physics.Arcade.Sprite
{
    private promptContainer: Phaser.GameObjects.Container;
    private isPlayerInRange = false;
    onInteract?: () => void;

    constructor (scene: Scene, x: number, y: number, texture = 'npc-elder', promptText = '💬 [E] ລົມກັນ')
    {
        NPC.ensureTexture(scene, texture);

        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static arcade body

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

        const bubbleBg = scene.add.graphics();
        bubbleBg.fillStyle(0x0f172a, 0.92);
        bubbleBg.lineStyle(1.5, 0x38bdf8, 1);
        bubbleBg.fillRoundedRect(-70, -16, 140, 32, 16);
        bubbleBg.strokeRoundedRect(-70, -16, 140, 32, 16);

        // Pointer triangle at bottom of bubble
        bubbleBg.beginPath();
        bubbleBg.moveTo(-6, 16);
        bubbleBg.lineTo(0, 23);
        bubbleBg.lineTo(6, 16);
        bubbleBg.closePath();
        bubbleBg.fillPath();
        bubbleBg.strokePath();

        const bubbleText = scene.add.text(0, 0, promptText, {
            fontFamily: 'Noto Sans Lao, sans-serif',
            fontSize: '13px',
            color: '#38bdf8',
            fontStyle: 'bold',
        });
        bubbleText.setOrigin(0.5, 0.5);

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
        this.promptContainer.setSize(130, 32);
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

    updateProximity (playerX: number, playerY: number): void
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
