import { Scene } from 'phaser';
import { COTTAGE_LEVEL_KEY, COTTAGE_LEVEL_PATH, DUNGEON_LEVEL_KEY, DUNGEON_LEVEL_PATH, GARDEN_LEVEL_KEY, GARDEN_LEVEL_PATH, VILLAGE_LEVEL_KEY, VILLAGE_LEVEL_PATH } from '../levelCatalog';
import { isStageReady } from '../stages/StageDefinition';
import { getGameContent } from '../../content/ContentCatalog';
import { heldTextureKey } from '../objects/HeldItemSprite';
import { ACTIVE_SESSION_STORAGE_KEY, readString, STORAGE_PREFIX } from '../../storage/safeStorage';

const IMAGE_ASSETS: readonly { key: string; path: string }[] = [
    // Backgrounds
    { key: 'bg-village', path: 'assets/backgrounds/bg_village.jpg' },
    { key: 'bg-plains', path: 'assets/backgrounds/bg_plains.jpg' },
    { key: 'bg-cavern', path: 'assets/backgrounds/bg_cavern.jpg' },
    { key: 'bg-boss-arena', path: 'assets/backgrounds/bg_boss_arena.jpg' },
    { key: 'bg-desert', path: 'assets/backgrounds/bg_desert.jpg' },

    // Terrain & Hazards
    { key: 'ground-tile', path: 'assets/environment/tile_ground.png' },
    { key: 'ground-tile-cavern', path: 'assets/environment/tile_ground_cavern.png' },
    { key: 'ground-tile-arena', path: 'assets/environment/tile_ground_arena.png' },
    { key: 'ground-tile-desert', path: 'assets/environment/tile_ground_desert.png' },
    { key: 'platform-texture', path: 'assets/environment/platform.png' },
    { key: 'moving-platform-texture', path: 'assets/environment/moving_platform.png' },
    { key: 'spike-texture', path: 'assets/environment/spikes.png' },

    // Village Architecture & Props
    { key: 'building-library', path: 'assets/environment/building_library.png' },
    { key: 'building-academy', path: 'assets/environment/building_academy.png' },
    { key: 'building-workshop', path: 'assets/environment/building_workshop.png' },
    { key: 'building-forge-open', path: 'assets/environment/building_forge_open.png' },
    { key: 'building-forge-locked', path: 'assets/environment/building_forge_locked.png' },
    { key: 'stall-mina', path: 'assets/environment/stall_mina.png' },
    { key: 'village-tree', path: 'assets/environment/village_tree.png' },
    { key: 'village-lantern', path: 'assets/environment/village_lantern.png' },
    { key: 'signpost', path: 'assets/environment/signpost.png' },
    { key: 'quest-board', path: 'assets/environment/quest_board.png' },
    { key: 'building-cottage', path: 'assets/environment/building_cottage.png' },
    { key: 'storage-chest', path: 'assets/environment/storage_chest.png' },
];

const SPRITESHEET_ASSETS: readonly { key: string; path: string; frameWidth: number; frameHeight: number }[] = [
    // Interactive Environment Sheets
    { key: 'pet-dog', path: 'assets/environment/pet_dog.png', frameWidth: 24, frameHeight: 20 },
    { key: 'pet-chicken', path: 'assets/environment/pet_chicken.png', frameWidth: 16, frameHeight: 16 },
    { key: 'stone-lantern', path: 'assets/environment/stone_lantern.png', frameWidth: 24, frameHeight: 44 },
    { key: 'world-gate', path: 'assets/environment/world_gate.png', frameWidth: 112, frameHeight: 160 },
    { key: 'node-tree', path: 'assets/environment/node_tree.png', frameWidth: 80, frameHeight: 112 },
    { key: 'node-herb', path: 'assets/environment/node_herb.png', frameWidth: 48, frameHeight: 48 },
    { key: 'node-fiber-grass', path: 'assets/environment/node_fiber_grass.png', frameWidth: 48, frameHeight: 48 },
    { key: 'node-stone', path: 'assets/environment/node_stone.png', frameWidth: 56, frameHeight: 56 },
    { key: 'node-iron-vein', path: 'assets/environment/node_iron_vein.png', frameWidth: 64, frameHeight: 64 },
    { key: 'node-crystal-vein', path: 'assets/environment/node_crystal_vein.png', frameWidth: 64, frameHeight: 64 },
    { key: 'node-blue-ore', path: 'assets/environment/node_blue_ore.png', frameWidth: 64, frameHeight: 64 },
    { key: 'node-cave-mushroom', path: 'assets/environment/node_cave_mushroom.png', frameWidth: 48, frameHeight: 48 },
    { key: 'node-copper-vein', path: 'assets/environment/node_copper_vein.png', frameWidth: 64, frameHeight: 64 },
    { key: 'node-cactus-patch', path: 'assets/environment/node_cactus_patch.png', frameWidth: 48, frameHeight: 48 },
    { key: 'waypoint-shrine', path: 'assets/environment/waypoint_shrine.png', frameWidth: 48, frameHeight: 80 },
    { key: 'gate-ch1', path: 'assets/environment/gate_ch1.png', frameWidth: 96, frameHeight: 160 },

    // Player Skins (16 frames of 32x48)
    { key: 'player-skin-cyber-blue', path: 'assets/characters/player-skin-cyber-blue.png', frameWidth: 32, frameHeight: 48 },
    { key: 'player-skin-neon-ninja', path: 'assets/characters/player-skin-neon-ninja.png', frameWidth: 32, frameHeight: 48 },
    { key: 'player-skin-cyber-knight', path: 'assets/characters/player-skin-cyber-knight.png', frameWidth: 32, frameHeight: 48 },
    { key: 'player-skin-golden-runner', path: 'assets/characters/player-skin-golden-runner.png', frameWidth: 32, frameHeight: 48 },

    // Village & World NPCs (4 frames of 32x48 each, 48x48 for smith)
    { key: 'npc-elder', path: 'assets/characters/npc_elder.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-mina', path: 'assets/characters/npc_mina.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-smith', path: 'assets/characters/npc_smith.png', frameWidth: 48, frameHeight: 48 },
    { key: 'npc-bounmy', path: 'assets/characters/npc_bounmy.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-scholar', path: 'assets/characters/npc_scholar.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-chanthy', path: 'assets/characters/npc_chanthy.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-kham', path: 'assets/characters/npc_kham.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-noy', path: 'assets/characters/npc_noy.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-somchay', path: 'assets/characters/npc_somchay.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-guide-keo', path: 'assets/characters/npc_guide_keo.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-thong', path: 'assets/characters/npc_thong.png', frameWidth: 32, frameHeight: 48 },
    { key: 'npc-dr-cyber', path: 'assets/characters/npc_dr_cyber.png', frameWidth: 32, frameHeight: 48 },

    // Enemies, Mini-Boss & Chapter Boss (4 frames each)
    { key: 'enemy-slime', path: 'assets/characters/enemy_slime.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-rock-golem', path: 'assets/characters/enemy_rock_golem.png', frameWidth: 48, frameHeight: 40 },
    { key: 'enemy-crystal-slime', path: 'assets/characters/enemy_crystal_slime.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-crystal-golem', path: 'assets/characters/enemy_crystal_golem.png', frameWidth: 48, frameHeight: 40 },
    { key: 'enemy-sand-slime', path: 'assets/characters/enemy_sand_slime.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-sand-golem', path: 'assets/characters/enemy_sand_golem.png', frameWidth: 48, frameHeight: 40 },
    { key: 'enemy-night-wisp', path: 'assets/characters/night_wisp.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-night-shade', path: 'assets/characters/night_shade.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-night-scarab', path: 'assets/characters/night_scarab.png', frameWidth: 32, frameHeight: 28 },
    { key: 'miniboss-cave-guardian', path: 'assets/characters/miniboss_cave_guardian.png', frameWidth: 64, frameHeight: 64 },
    { key: 'miniboss-crystal-warden', path: 'assets/characters/miniboss_crystal_warden.png', frameWidth: 64, frameHeight: 64 },
    { key: 'miniboss-dune-sentinel', path: 'assets/characters/miniboss_dune_sentinel.png', frameWidth: 64, frameHeight: 64 },
    { key: 'boss-hardware-overlord', path: 'assets/characters/boss_hardware_overlord.png', frameWidth: 96, frameHeight: 80 },
    { key: 'boss-network-core', path: 'assets/characters/boss_network_core.png', frameWidth: 96, frameHeight: 80 },
    { key: 'boss-kernel-titan', path: 'assets/characters/boss_kernel_titan.png', frameWidth: 96, frameHeight: 80 },
    { key: 'boss-spider-queen', path: 'assets/characters/boss_spider_queen.png', frameWidth: 96, frameHeight: 80 },

    // Dungeon monsters (4 frames each)
    { key: 'enemy-cave-bat', path: 'assets/characters/enemy_cave_bat.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-dungeon-spider', path: 'assets/characters/enemy_dungeon_spider.png', frameWidth: 32, frameHeight: 28 },
    { key: 'enemy-dungeon-skeleton', path: 'assets/characters/enemy_dungeon_skeleton.png', frameWidth: 32, frameHeight: 32 },

    // Weapon Slash VFX (3 frames of 48x48)
    { key: 'slash-wood', path: 'assets/vfx/slash_wood.png', frameWidth: 48, frameHeight: 48 },
    { key: 'slash-iron', path: 'assets/vfx/slash_iron.png', frameWidth: 48, frameHeight: 48 },
    { key: 'slash-crystal', path: 'assets/vfx/slash_crystal.png', frameWidth: 48, frameHeight: 48 },
    { key: 'slash-blue', path: 'assets/vfx/slash_blue.png', frameWidth: 48, frameHeight: 48 },
    { key: 'slash-copper', path: 'assets/vfx/slash_copper.png', frameWidth: 48, frameHeight: 48 },
];

/** Queues every level JSON, image, and spritesheet not yet in Phaser's cache. */
export function enqueueGameAssets (scene: Scene): void
{
    if (!scene.cache.json.exists(VILLAGE_LEVEL_KEY))
    {
        scene.load.json(VILLAGE_LEVEL_KEY, VILLAGE_LEVEL_PATH);
    }
    if (!scene.cache.json.exists(COTTAGE_LEVEL_KEY))
    {
        scene.load.json(COTTAGE_LEVEL_KEY, COTTAGE_LEVEL_PATH);
    }

    if (!scene.cache.json.exists(GARDEN_LEVEL_KEY))
    {
        scene.load.json(GARDEN_LEVEL_KEY, GARDEN_LEVEL_PATH);
    }
    if (!scene.cache.json.exists(DUNGEON_LEVEL_KEY))
    {
        scene.load.json(DUNGEON_LEVEL_KEY, DUNGEON_LEVEL_PATH);
    }

    // One level JSON per built Stage, cached under the Stage's id
    for (const stage of getGameContent().stages)
    {
        if (!isStageReady(stage) || scene.cache.json.exists(stage.id)) continue;

        if (stage.generated)
        {
            scene.cache.json.add(stage.id, stage.generated.level);
        }
        else if (stage.layout)
        {
            scene.load.json(stage.id, stage.layout);
        }
    }

    for (const img of IMAGE_ASSETS)
    {
        if (!scene.textures.exists(img.key))
        {
            scene.load.image(img.key, img.path);
        }
    }

    // Weapons and tools in the hero's hand; items without an image get a drawn placeholder
    for (const [itemId, art] of Object.entries(getGameContent().heldArt))
    {
        if (art.image && !scene.textures.exists(heldTextureKey(itemId)))
        {
            scene.load.image(heldTextureKey(itemId), art.image);
        }
    }

    for (const sheet of SPRITESHEET_ASSETS)
    {
        if (!scene.textures.exists(sheet.key))
        {
            scene.load.spritesheet(sheet.key, sheet.path, {
                frameWidth: sheet.frameWidth,
                frameHeight: sheet.frameHeight,
            });
        }
    }
}

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        enqueueGameAssets(this);
    }

    create ()
    {
        const activeSession = readString(ACTIVE_SESSION_STORAGE_KEY);
        // A session saved by an older version (stage-ch1) or for a Stage that is not built has nowhere to resume
        const resumable = activeSession === VILLAGE_LEVEL_KEY || activeSession === GARDEN_LEVEL_KEY
            || getGameContent().stages.some(stage => stage.id === activeSession && isStageReady(stage));
        if (activeSession && resumable)
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
