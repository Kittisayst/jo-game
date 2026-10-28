import { Scene } from 'phaser';
import { LEVEL_CATALOG } from '../levelCatalog';
import { ACTIVE_SESSION_STORAGE_KEY, readString, STORAGE_PREFIX } from '../../storage/safeStorage';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        if (!this.cache.json.exists('enemies'))
        {
            this.load.json('enemies', 'data/enemies.json');
        }

        if (!this.cache.json.exists('stages'))
        {
            this.load.json('stages', 'data/stages.json');
        }

        for (const item of LEVEL_CATALOG)
        {
            if (!this.cache.json.exists(item.key))
            {
                this.load.json(item.key, item.assetPath);
            }
        }

        this.load.image('bg-village', 'assets/backgrounds/bg_village.jpg');
        this.load.image('bg-plains', 'assets/backgrounds/bg_plains.jpg');
        this.load.image('bg-sky-islands', 'assets/backgrounds/bg_sky_islands.jpg');
        this.load.image('bg-boss-arena', 'assets/backgrounds/bg_boss_arena.jpg');

        this.load.image('ground-tile', 'assets/environment/tile_ground.png');
        this.load.image('platform-texture', 'assets/environment/platform.png');
        this.load.image('door-texture', 'assets/environment/door.png');
        this.load.image('goal-flag-texture', 'assets/environment/goal_flag.png');
        this.load.image('spike-texture', 'assets/environment/spikes.png');

        this.load.image('powerup-heart', 'assets/items/heart.png');
        this.load.image('powerup-star', 'assets/items/star.png');
        this.load.image('powerup-spring', 'assets/items/spring.png');

        this.load.spritesheet('player-skin-cyber-blue', 'assets/characters/player-skin-cyber-blue.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('player-skin-neon-ninja', 'assets/characters/player-skin-neon-ninja.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('player-skin-cyber-knight', 'assets/characters/player-skin-cyber-knight.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('player-skin-golden-runner', 'assets/characters/player-skin-golden-runner.png', { frameWidth: 32, frameHeight: 48 });
        this.load.image('enemy-slime', 'assets/characters/enemy_slime.png');
        this.load.image('boss-king-slime', 'assets/characters/boss_king_slime.png');
        this.load.image('npc-elder', 'assets/characters/npc_elder.png');
    }

    create ()
    {
        const activeSession = readString(ACTIVE_SESSION_STORAGE_KEY);
        if (activeSession && activeSession !== 'title')
        {
            const activeSkinId = readString(`${STORAGE_PREFIX}active_skin_id`) ?? 'cyber-blue';
            this.scene.start('Game', {
                levelKey: activeSession,
                score: 0,
                lives: 3,
                skinId: activeSkinId,
                elapsedMs: 0,
            });
        }
        else
        {
            this.scene.start('Title');
        }
    }
}
