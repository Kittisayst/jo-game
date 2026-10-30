import type { CraftingJob } from '../../../domain/entities/CraftingQueue';
import { getGameContent } from '../../content/ContentCatalog';

const FONT = '"Noto Sans Lao", sans-serif';
const FRAME = 48;
const BAR_WIDTH = 64;
const BAR_HEIGHT = 9;
/** Which frame of the sheet the hammer lands on (the sparks fly there). */
const STRIKE_FRAME = 4;

const formatTime = (ms: number): string =>
{
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** Which building a job belongs to, from its recipe in `recipes.json`. */
export function buildingOfJob (job: CraftingJob): 'workshop' | 'forge' | undefined
{
    const recipe = getGameContent().recipes.find(r => r.id === job.recipeId);
    return recipe?.building;
}

/**
 * The smith who works in front of the Workshop or the Forge while something is being made there: he hammers at
 * an anvil (sparks on every strike) with a bar and the time left over his head, and cheers when the job is
 * done. He is not there when nothing is being made at his building.
 */
export class CraftingWorker
{
    private readonly sprite: Phaser.GameObjects.Sprite;
    private readonly head: Phaser.GameObjects.Container;
    private readonly bar: Phaser.GameObjects.Graphics;
    private readonly label: Phaser.GameObjects.Text;
    private state: 'away' | 'building' | 'ready' = 'away';

    constructor (private readonly scene: Phaser.Scene, readonly building: 'workshop' | 'forge', private readonly x: number, private readonly baseY: number)
    {
        if (!scene.anims.exists('smith-hammer'))
        {
            scene.anims.create({ key: 'smith-hammer', frames: scene.anims.generateFrameNumbers('npc-smith', { start: 0, end: 5 }), frameRate: 7, repeat: -1 });
            scene.anims.create({ key: 'smith-cheer', frames: scene.anims.generateFrameNumbers('npc-smith', { start: 6, end: 7 }), frameRate: 3, repeat: -1 });
        }

        this.sprite = scene.add.sprite(x, baseY + 2, 'npc-smith', 0).setOrigin(0.5, 1).setDepth(8).setAlpha(0).setVisible(false);
        this.sprite.on('animationupdate', (_anim: unknown, frame: Phaser.Animations.AnimationFrame) =>
        {
            if (this.state === 'building' && Number(frame.textureFrame) === STRIKE_FRAME) this.sparks();
        });

        this.bar = scene.add.graphics();
        this.label = scene.add.text(0, -BAR_HEIGHT - 6, '', {
            fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#fef08a', stroke: '#0f172a', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5, 1);
        this.head = scene.add.container(x - 8, baseY - FRAME - 20, [this.bar, this.label]).setDepth(30).setAlpha(0).setVisible(false);
    }

    /** Called every frame with the job in progress (or null). */
    update (job: CraftingJob | null): void
    {
        const mine = job !== null && buildingOfJob(job) === this.building;
        if (!mine || !job)
        {
            if (this.state !== 'away') this.leave();
            return;
        }

        const ready = job.remainingMs <= 0;
        if (this.state === 'away') this.arrive();

        const next = ready ? 'ready' : 'building';
        if (next !== this.state)
        {
            this.state = next;
            this.sprite.play(ready ? 'smith-cheer' : 'smith-hammer');
        }

        this.drawBar(ready ? 1 : 1 - job.remainingMs / job.totalMs, ready);
        this.label.setText(ready ? '✅ ສຳເລັດ!' : `🔨 ${formatTime(job.remainingMs)}`);
    }

    private arrive (): void
    {
        this.state = 'building';
        this.sprite.setVisible(true).play('smith-hammer');
        this.head.setVisible(true);
        this.scene.tweens.add({ targets: [this.sprite, this.head], alpha: 1, duration: 300 });
    }

    private leave (): void
    {
        this.state = 'away';
        this.sprite.stop();
        this.scene.tweens.add({
            targets: [this.sprite, this.head],
            alpha: 0,
            duration: 300,
            onComplete: () =>
            {
                // He may have been called back while fading out
                if (this.state === 'away')
                {
                    this.sprite.setVisible(false);
                    this.head.setVisible(false);
                }
            },
        });
    }

    private drawBar (fraction: number, ready: boolean): void
    {
        const g = this.bar;
        const w = Math.round(BAR_WIDTH * Math.min(1, Math.max(0, fraction)));
        g.clear();
        g.fillStyle(0x0f172a, 0.9);
        g.fillRoundedRect(-BAR_WIDTH / 2 - 2, -BAR_HEIGHT - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4, 4);
        g.fillStyle(ready ? 0x22c55e : 0xf97316, 1);
        if (w > 0) g.fillRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT, w, BAR_HEIGHT, 3);
    }

    /** A few sparks fly off the anvil on every strike. */
    private sparks (): void
    {
        const ox = this.x + 18;
        const oy = this.baseY - 14;
        for (let i = 0; i < 6; i++)
        {
            const spark = this.scene.add.rectangle(ox, oy, 3, 3, i % 2 ? 0xfde047 : 0xffffff).setDepth(9);
            this.scene.tweens.add({
                targets: spark,
                x: ox + Phaser.Math.Between(-18, 24),
                y: oy - Phaser.Math.Between(8, 30),
                alpha: 0,
                duration: Phaser.Math.Between(250, 450),
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy(),
            });
        }
    }
}
