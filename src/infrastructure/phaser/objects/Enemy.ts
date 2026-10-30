import { Physics, Scene } from 'phaser';
import { Enemy as EnemyEntity, EnemyDefinition, EnemyState, EnemyType, ENEMY_ARCHETYPES } from '../../../domain/entities/Enemy';
import { soundManager } from '../../audio/SoundManager';
import { GROUND_SINK } from '../physicsConstants';
import { EnemyAttackBehavior } from './EnemyAttackBehavior';

const WIDTH = 32;
const HEIGHT = 28;

const TEXTURE_KEYS: Record<EnemyType, string> = {
    'slime': 'enemy-slime',
    'slime-flying': 'enemy-slime-flying',
    'slime-armored': 'enemy-slime-armored',
    'slime-spitter': 'enemy-slime-spitter',
};

export const SPIT_PROJECTILE_KEY = 'enemy-slime-ball';
export const ROCK_PROJECTILE_KEY = 'enemy-rock-ball';

/** Below this y (the world is 720 tall) an enemy has fallen through the floor. */
const FELL_OUT_OF_WORLD_Y = 800;

/**
 * An Arcade Physics sprite representing an enemy in the level.
 * Features an intelligent Finite State Machine and archetype-specific behaviors:
 * - Basic Slime: Standard ground patrol and hop attack
 * - Flying Slime: Zero-gravity sinusoidal floating, dive-bomb swoop
 * - Armored Slime: Heavy steel armor and high HP
 * - Spitter Slime: Ranged acid projectile spitting
 */
export class Enemy extends Physics.Arcade.Sprite
{
    readonly entity: EnemyEntity;
    readonly enemyType: EnemyType;
    private leftBound: number;
    private rightBound: number;
    private speed: number;
    private isDefeated = false;
    private alertTimer = 0;
    private hopCooldown = 0;
    private alertText?: Phaser.GameObjects.Text;
    private spriteHeight = HEIGHT;

    // Flying slime attributes
    private baseY: number;
    private flightTimer = 0;
    private buzzTimer = 0;

    // Spitter slime attributes
    private spitCooldown = 2200;
    onSpit?: (x: number, y: number, dirX: number, dirY: number) => void;

    // Mini-boss special attacks (charge, rock throw), only when its definition has `attacks`
    private attackBehavior?: EnemyAttackBehavior;
    private stunMarker?: Phaser.GameObjects.Text;
    onThrowRock?: (x: number, y: number, dirX: number, speed: number) => void;

    constructor (
        scene: Scene,
        x: number,
        y: number,
        patrolDistance = 160,
        speed?: number,
        type: EnemyType = 'slime',
        definition?: EnemyDefinition
    )
    {
        const archetype = ENEMY_ARCHETYPES[type] ?? ENEMY_ARCHETYPES['slime'];
        Enemy.ensureTextures(scene);

        const defTexMap: Record<string, string> = {
            'forest-slime': 'enemy-slime',
            'rock-golem': 'enemy-rock-golem',
            'cave-guardian': 'miniboss-cave-guardian',
        };
        const preferredTex = definition ? defTexMap[definition.id] : undefined;
        const texKey = (preferredTex && scene.textures.exists(preferredTex))
            ? preferredTex
            : (TEXTURE_KEYS[type] ?? TEXTURE_KEYS['slime']);
        super(scene, x, y, texKey);

        this.enemyType = type;
        this.entity = definition ? EnemyEntity.fromDefinition(definition, type) : new EnemyEntity(type);
        if (definition?.attacks) this.attackBehavior = new EnemyAttackBehavior(this, definition.attacks);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0, 0);

        const halfDistance = patrolDistance / 2;
        this.leftBound = x - halfDistance;
        this.rightBound = x + halfDistance;
        this.speed = speed ?? archetype.speed;
        this.baseY = y;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            if (texKey === 'miniboss-cave-guardian')
            {
                this.spriteHeight = 64;
                body.setSize(48, 54 - GROUND_SINK);
                body.setOffset(8, 10);
            }
            else if (texKey === 'enemy-rock-golem')
            {
                this.spriteHeight = 40;
                body.setSize(38, 32 - GROUND_SINK);
                body.setOffset(5, 8);
            }
            else if (type === 'slime-flying')
            {
                body.allowGravity = false;
                body.setSize(24, 20);
                body.setOffset(4, 6);
            }
            else if (type === 'slime-armored')
            {
                body.setSize(30, 20 - GROUND_SINK);
                body.setOffset(1, 8);
            }
            else if (type === 'slime-spitter')
            {
                body.setSize(26, 20 - GROUND_SINK);
                body.setOffset(3, 8);
            }
            else
            {
                // Basic slime: the art reaches GROUND_SINK below the 32x28 sprite's hitbox
                body.setSize(26, 20 - GROUND_SINK);
                body.setOffset(3, 8);
            }
        }

        const loadedTex = scene.textures.get(texKey);
        if (loadedTex && loadedTex.frameTotal > 4)
        {
            const moveKey = `${texKey}-move`;
            if (!scene.anims.exists(moveKey))
            {
                scene.anims.create({
                    key: moveKey,
                    frames: scene.anims.generateFrameNumbers(texKey, { start: 0, end: 3 }),
                    frameRate: 6,
                    repeat: -1,
                });
            }
            this.play(moveKey);
        }

        this.setVelocityX(this.speed);
    }

    static ensureTextures (scene: Scene)
    {
        // 1. Basic Slime
        if (!scene.textures.exists(TEXTURE_KEYS['slime']))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xd946ef, 1); // Neon magenta-crimson
            g.fillRoundedRect(2, 6, WIDTH - 4, HEIGHT - 6, 8);
            g.fillStyle(0xa21caf, 1);
            g.fillTriangle(WIDTH / 2 - 4, 6, WIDTH / 2 + 4, 6, WIDTH / 2, 0);
            g.fillStyle(0xffffff, 1);
            g.fillCircle(10, 14, 4);
            g.fillCircle(22, 14, 4);
            g.fillStyle(0x06b6d4, 1);
            g.fillCircle(11, 14, 2);
            g.fillCircle(23, 14, 2);
            g.lineStyle(2, 0x4a044e, 1);
            g.lineBetween(7, 9, 13, 11);
            g.lineBetween(25, 9, 19, 11);
            g.generateTexture(TEXTURE_KEYS['slime'], WIDTH, HEIGHT);
            g.destroy();
        }

        // 2. Flying Drone Slime
        if (!scene.textures.exists(TEXTURE_KEYS['slime-flying']))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Cyan body
            g.fillStyle(0x06b6d4, 1);
            g.fillRoundedRect(6, 6, WIDTH - 12, HEIGHT - 8, 6);
            // Left cyber wing
            g.fillStyle(0x38bdf8, 0.9);
            g.fillTriangle(0, 8, 8, 4, 8, 16);
            g.lineStyle(1, 0xffffff, 0.8);
            g.strokeTriangle(0, 8, 8, 4, 8, 16);
            // Right cyber wing
            g.fillStyle(0x38bdf8, 0.9);
            g.fillTriangle(WIDTH, 8, WIDTH - 8, 4, WIDTH - 8, 16);
            g.strokeTriangle(WIDTH, 8, WIDTH - 8, 4, WIDTH - 8, 16);
            // Glowing electronic visor
            g.fillStyle(0xfacc15, 1);
            g.fillRect(10, 12, 12, 4);
            // Jet thruster glow
            g.fillStyle(0x67e8f9, 0.9);
            g.fillTriangle(WIDTH / 2 - 4, HEIGHT - 2, WIDTH / 2 + 4, HEIGHT - 2, WIDTH / 2, HEIGHT + 2);
            g.generateTexture(TEXTURE_KEYS['slime-flying'], WIDTH, HEIGHT);
            g.destroy();
        }

        // 3. Armored Slime (Heavy steel plate, spikes, red slit visor)
        if (!scene.textures.exists(TEXTURE_KEYS['slime-armored']))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Dark iron slime base
            g.fillStyle(0x334155, 1);
            g.fillRoundedRect(2, 8, WIDTH - 4, HEIGHT - 8, 8);
            // Heavy steel helmet
            g.fillStyle(0x64748b, 1);
            g.fillRect(3, 4, WIDTH - 6, 12);
            // Helmet rim with rivets
            g.fillStyle(0x94a3b8, 1);
            g.fillRect(1, 14, WIDTH - 2, 3);
            g.fillStyle(0xf8fafc, 1);
            g.fillCircle(5, 15, 1.2);
            g.fillCircle(16, 15, 1.2);
            g.fillCircle(27, 15, 1.2);
            // Top steel spikes
            g.fillStyle(0xcbd5e1, 1);
            g.fillTriangle(8, 4, 12, 4, 10, 0);
            g.fillTriangle(20, 4, 24, 4, 22, 0);
            // Glowing menacing red slit visor
            g.fillStyle(0xef4444, 1);
            g.fillRect(8, 9, 16, 3);
            g.generateTexture(TEXTURE_KEYS['slime-armored'], WIDTH, HEIGHT);
            g.destroy();
        }

        // 4. Toxic Spitter Slime (Radioactive green, venom sack, spitting maw)
        if (!scene.textures.exists(TEXTURE_KEYS['slime-spitter']))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Venom sack on top
            g.fillStyle(0xa3e635, 1);
            g.fillCircle(WIDTH / 2, 7, 7);
            g.fillStyle(0xd9f99d, 1);
            g.fillCircle(WIDTH / 2 - 2, 5, 2.5);
            // Toxic slime body
            g.fillStyle(0x22c55e, 1);
            g.fillRoundedRect(2, 9, WIDTH - 4, HEIGHT - 9, 8);
            // Spitting maw
            g.fillStyle(0x581c87, 1);
            g.fillEllipse(WIDTH / 2, 20, 8, 5);
            // Acid eyes
            g.fillStyle(0xfacc15, 1);
            g.fillCircle(9, 14, 3.5);
            g.fillCircle(23, 14, 3.5);
            g.fillStyle(0x1e293b, 1);
            g.fillCircle(10, 14, 1.8);
            g.fillCircle(24, 14, 1.8);
            g.generateTexture(TEXTURE_KEYS['slime-spitter'], WIDTH, HEIGHT);
            g.destroy();
        }

        // 5. Acid Spit Ball Projectile
        if (!scene.textures.exists(SPIT_PROJECTILE_KEY))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x4ade80, 0.4);
            g.fillCircle(7, 7, 7);
            g.fillStyle(0x84cc16, 0.9);
            g.fillCircle(7, 7, 5);
            g.fillStyle(0xfacc15, 1);
            g.fillCircle(6, 6, 2.5);
            g.generateTexture(SPIT_PROJECTILE_KEY, 14, 14);
            g.destroy();
        }

        // 6. Thrown rock (Cave Guardian)
        if (!scene.textures.exists(ROCK_PROJECTILE_KEY))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x57534e, 1);
            g.fillCircle(10, 10, 10);
            g.fillStyle(0x78716c, 1);
            g.fillCircle(8, 8, 6);
            g.fillStyle(0xa8a29e, 1);
            g.fillCircle(6, 6, 2.5);
            g.lineStyle(1.5, 0x292524, 1);
            g.strokeCircle(10, 10, 9.5);
            g.generateTexture(ROCK_PROJECTILE_KEY, 20, 20);
            g.destroy();
        }
    }

    /** One rock of the Mini-boss's rock throw, leaving from the enemy's side in `dirX`. */
    throwRock (dirX: number, speed: number): void
    {
        soundManager.playSpit();
        this.onThrowRock?.(this.x + dirX * 30, this.y + 6, dirX, speed);
    }

    get currentState (): EnemyState
    {
        return this.entity.state;
    }

    update (playerX?: number, playerY?: number, delta = 16)
    {
        if (this.isDefeated) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // Safety net: at a very low frame rate an enemy can sink through the floor. Put it back where it
        // started instead of letting it fall out of the world for good (see "Known issues" in the sprite-rows plan).
        if (this.y > FELL_OUT_OF_WORLD_Y)
        {
            body.setVelocity(0, 0);
            this.setPosition((this.leftBound + this.rightBound) / 2, this.baseY);
            return;
        }

        if (this.hopCooldown > 0)
        {
            this.hopCooldown -= delta;
        }

        // A stunned enemy stands still: no patrol, no attack, and (see `isStunned`) it cannot hurt by touch
        if (this.updateStun(delta, body)) return;

        if (this.alertText && this.alertText.active)
        {
            this.alertText.setPosition(this.x - 4, this.y - this.spriteHeight / 2 - 18);
        }

        // Mini-boss special attacks take over while one is running
        if (this.attackBehavior && typeof playerX === 'number' && typeof playerY === 'number'
            && this.attackBehavior.update(delta, playerX, playerY, body))
        {
            return;
        }

        // Flying slime floating logic
        if (this.enemyType === 'slime-flying')
        {
            this.updateFlyingBehavior(playerX, playerY, delta, body);
            return;
        }

        // Spitter slime shooting logic
        if (this.enemyType === 'slime-spitter' && typeof playerX === 'number' && typeof playerY === 'number')
        {
            this.updateSpitterBehavior(playerX, playerY, delta);
        }

        // Standard FSM logic for ground units
        if (typeof playerX === 'number' && typeof playerY === 'number')
        {
            this.tickStateMachine(playerX, playerY, delta, body);
        }
        else
        {
            this.patrolBehavior(body);
        }
    }

    private updateFlyingBehavior (
        playerX: number | undefined,
        playerY: number | undefined,
        delta: number,
        body: Phaser.Physics.Arcade.Body
    )
    {
        this.flightTimer += delta * 0.005;
        this.buzzTimer += delta;

        if (typeof playerX !== 'number' || typeof playerY !== 'number')
        {
            this.patrolFlying(body);
            return;
        }

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.hypot(dx, dy);

        switch (this.entity.state)
        {
            case 'patrol': {
                this.patrolFlying(body);
                if (distance <= 210)
                {
                    this.entity.setState('alert');
                    this.alertTimer = 300;
                    this.setVelocity(0, 0);
                    this.showAlertIndicator();
                    soundManager.playDroneBuzz();
                }
                break;
            }

            case 'alert': {
                this.setVelocity(0, 0);
                this.alertTimer -= delta;
                if (this.alertTimer <= 0)
                {
                    this.removeAlertIndicator();
                    this.entity.setState('chase');
                    this.setTint(0x38bdf8);
                }
                break;
            }

            case 'chase': {
                if (distance > 280)
                {
                    this.entity.setState('return');
                    this.clearTint();
                    break;
                }

                // Periodic buzz sound
                if (this.buzzTimer >= 1800)
                {
                    this.buzzTimer = 0;
                    soundManager.playDroneBuzz();
                }

                // Swoop towards player in 2D air space
                const angle = Math.atan2(dy, dx);
                const swoopSpeed = this.speed * 1.35;
                this.setVelocity(Math.cos(angle) * swoopSpeed, Math.sin(angle) * swoopSpeed);
                this.setFlipX(dx < 0);
                break;
            }

            case 'return': {
                const territoryCenter = (this.leftBound + this.rightBound) / 2;
                const distToCenter = territoryCenter - this.x;
                const distToAlt = this.baseY - this.y;

                if (Math.hypot(distToCenter, distToAlt) < 25)
                {
                    this.entity.setState('patrol');
                }
                else
                {
                    const angle = Math.atan2(distToAlt, distToCenter);
                    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
                    this.setFlipX(distToCenter < 0);
                }
                break;
            }
        }
    }

    private patrolFlying (body: Phaser.Physics.Arcade.Body)
    {
        // Sinusoidal floating hover
        const targetHoverY = this.baseY + Math.sin(this.flightTimer) * 18;
        this.y += (targetHoverY - this.y) * 0.1;

        if (this.x >= this.rightBound || body.blocked.right)
        {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        }
        else if (this.x <= this.leftBound || body.blocked.left)
        {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        }
    }

    private updateSpitterBehavior (playerX: number, playerY: number, delta: number)
    {
        this.spitCooldown -= delta;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        // Within shooting range: 70px to 320px, and player not excessively above/below
        if (dist >= 70 && dist <= 320 && Math.abs(dy) <= 120 && this.spitCooldown <= 0)
        {
            this.spitCooldown = 2400 + Math.random() * 600;
            const shootDir = dx < 0 ? -1 : 1;
            this.setFlipX(shootDir < 0);

            // Wind-up anticipation squeeze
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.3,
                scaleY: 0.7,
                duration: 160,
                yoyo: true,
                onComplete: () =>
                {
                    if (this.active && !this.isDefeated)
                    {
                        soundManager.playSpit();
                        this.onSpit?.(this.x + shootDir * 16, this.y - 4, shootDir, 0);
                    }
                },
            });
        }
    }

    private tickStateMachine (
        playerX: number,
        playerY: number,
        delta: number,
        body: Phaser.Physics.Arcade.Body
    )
    {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.hypot(dx, dy);
        const state = this.entity.state;

        switch (state)
        {
            case 'patrol': {
                this.patrolBehavior(body);

                // Detection check: player within 150px and vertical elevation within 80px
                const isFacingPlayer = (this.flipX && dx < 0) || (!this.flipX && dx > 0);
                const detectionRadius = isFacingPlayer ? 160 : 85;

                if (distance <= detectionRadius && Math.abs(dy) <= 80)
                {
                    this.entity.setState('alert');
                    this.alertTimer = 350;
                    this.setVelocityX(0);

                    // Anticipation squash
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 1.25,
                        scaleY: 0.75,
                        duration: 120,
                        yoyo: true,
                    });

                    // Pop exclamation indicator
                    this.showAlertIndicator();
                }
                break;
            }

            case 'alert': {
                this.setVelocityX(0);
                this.alertTimer -= delta;

                if (this.alertTimer <= 0)
                {
                    this.removeAlertIndicator();
                    this.entity.setState('chase');
                    this.setTint(this.enemyType === 'slime-armored' ? 0xff4444 : 0xff5555);
                }
                break;
            }

            case 'chase': {
                if (distance > 230 || Math.abs(dy) > 130)
                {
                    this.entity.setState('return');
                    this.clearTint();
                    break;
                }

                // Chase towards player
                const chaseDir = dx < 0 ? -1 : 1;
                this.setVelocityX(chaseDir * this.speed * 1.45);
                this.setFlipX(chaseDir < 0);

                // Hop over small obstacle or toward jumping player
                const isOnFloor = body.blocked.down || body.touching.down;
                if (isOnFloor && dy < -20 && this.hopCooldown <= 0)
                {
                    this.setVelocityY(-210);
                    this.hopCooldown = 1400;
                }
                break;
            }

            case 'return': {
                const territoryCenter = (this.leftBound + this.rightBound) / 2;
                const distToCenter = territoryCenter - this.x;

                if (Math.abs(distToCenter) < 20 || (this.x >= this.leftBound && this.x <= this.rightBound))
                {
                    this.entity.setState('patrol');
                }
                else
                {
                    const returnDir = distToCenter < 0 ? -1 : 1;
                    this.setVelocityX(returnDir * this.speed);
                    this.setFlipX(returnDir < 0);
                }
                break;
            }
        }
    }

    private patrolBehavior (body: Phaser.Physics.Arcade.Body)
    {
        // Turn around at patrol boundaries or when blocked by wall
        if (this.x >= this.rightBound || body.blocked.right)
        {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        }
        else if (this.x <= this.leftBound || body.blocked.left)
        {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        }
    }

    private showAlertIndicator ()
    {
        if (this.alertText) return;
        this.alertText = this.scene.add.text(this.x - 4, this.y - this.spriteHeight / 2 - 18, '!', {
            fontFamily: 'monospace, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 3,
        }).setDepth(15);
    }

    private removeAlertIndicator ()
    {
        if (this.alertText)
        {
            this.alertText.destroy();
            this.alertText = undefined;
        }
    }

    /** True while a skill (Ping, End Task...) holds the enemy still. */
    get isStunned (): boolean
    {
        return this.entity.isStunned;
    }

    /** Stuns the enemy for `ms` of Game time; a running attack is cut short. */
    stun (ms: number): void
    {
        if (!this.entity.stun(ms)) return;
        this.attackBehavior?.interrupt();
        this.setVelocityX(0);
    }

    /** Counts the stun down and shows it. Returns true while the enemy is stunned (the rest of `update` is skipped). */
    private updateStun (delta: number, body: Phaser.Physics.Arcade.Body): boolean
    {
        this.entity.tickStun(delta);

        if (!this.entity.isStunned)
        {
            if (this.stunMarker)
            {
                this.stunMarker.destroy();
                this.stunMarker = undefined;
                this.clearTint();
            }
            return false;
        }

        body.setVelocityX(0);
        this.setTint(0x93c5fd);
        if (!this.stunMarker)
        {
            this.stunMarker = this.scene.add.text(this.x, this.y - this.spriteHeight / 2 - 18, '💫', {
                fontFamily: 'monospace, sans-serif',
                fontSize: '20px',
            }).setOrigin(0.5).setDepth(15);
        }
        this.stunMarker.setPosition(this.x, this.y - this.spriteHeight / 2 - 18);
        return true;
    }

    takeDamage (amount = 1, knockbackDir = 0, isHeavyWeapon = false): { defeated: boolean; remainingHp: number }
    {
        if (this.isDefeated) return { defeated: true, remainingHp: 0 };

        // Armored slime takes double damage from thunder hammer / bomb heavy attacks
        let effectiveDamage = amount;
        if (this.enemyType === 'slime-armored')
        {
            soundManager.playClink();
            if (isHeavyWeapon)
            {
                effectiveDamage = amount * 2;
            }
        }

        const result = this.entity.takeDamage(effectiveDamage);

        if (result.defeated)
        {
            this.squashAndDefeat();
        }
        else
        {
            // Flinch flash and knockback
            this.setTint(0xffffff);
            if (knockbackDir !== 0)
            {
                const knockPower = this.enemyType === 'slime-armored' ? 70 : 140;
                this.setVelocity(knockbackDir * knockPower, -110);
            }
            this.scene.tweens.add({
                targets: this,
                scaleX: this.scaleX * 1.25,
                scaleY: this.scaleY * 0.8,
                duration: 80,
                yoyo: true,
                onComplete: () =>
                {
                    this.clearTint();
                },
            });
        }

        return { defeated: result.defeated, remainingHp: result.currentHp };
    }

    squashAndDefeat ()
    {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.entity.defeat();

        this.removeAlertIndicator();
        this.stunMarker?.destroy();
        this.stunMarker = undefined;
        this.attackBehavior?.cancel();
        this.disableBody(true, false);

        this.scene.tweens.add({
            targets: this,
            scaleY: 0.15,
            scaleX: 1.4,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () =>
            {
                this.destroy();
            },
        });
    }

    destroy (fromScene?: boolean): void
    {
        this.stunMarker?.destroy();
        this.removeAlertIndicator();
        this.attackBehavior?.cancel();
        super.destroy(fromScene);
    }
}

