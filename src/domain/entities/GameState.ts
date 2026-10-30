import { AttackCooldown } from './Combat';
import { Backpack } from './Backpack';
import { BookProgress } from './Book';
import { DialogueState } from './Dialogue';
import { EquipmentState } from './EquipmentState';
import { GamePauseState } from './GamePauseState';
import { Health } from './Health';
import { ItemCatalog } from './ItemCatalog';
import { SpacedRepetitionSystem } from './Quiz';
import { CURRENT_SAVE_VERSION, SaveGameSnapshot } from './SaveData';
import { Settings } from './Settings';
import { SkinManager } from './Skin';
import { StageProgression } from './StageProgression';
import { ActiveEffects } from './ActiveEffects';
import { armorHeartsOf } from './Armor';
import { CraftingQueue } from './CraftingQueue';
import { Garden } from './Garden';
import { MovementAbilities } from './MovementAbilities';
import { PendingRewards } from './PendingRewards';
import { PlantRegrowth } from './PlantRegrowth';
import { RealmProgression } from './RealmProgression';
import { TutorialProgress } from './TutorialProgress';
import { Wallet } from './Wallet';

const FIRST_BOOK_ID = 'book-ch1';

/**
 * Everything that makes up one player's game, held together so it can be handed around as one
 * thing instead of a bag of module-level singletons. Each member is created once and never
 * replaced: loading a save changes the members in place, so a reference held by a scene or a
 * screen never goes stale.
 */
/** Slots in the Storage chest of the Village Hub. */
export const STORAGE_MAX_SLOTS = 40;

export class GameState
{
    readonly itemCatalog: ItemCatalog;
    readonly skinManager = new SkinManager();
    readonly settings = new Settings();
    readonly stageProgression = new StageProgression();
    readonly tutorial = new TutorialProgress();
    /** Which Realms the World Gate has opened. */
    readonly realms = new RealmProgression();
    /** Story Materials a Boss dropped while the Backpack was full, waiting to be claimed. */
    readonly pendingRewards = new PendingRewards();
    /** When each small plant of a Stage was last harvested. */
    readonly plantRegrowth = new PlantRegrowth();
    /** The Garden of the Village Hub. */
    readonly garden = new Garden();
    /** What the Workshop or the Forge is making (one job at a time, counted in Game time). */
    readonly crafting = new CraftingQueue();
    /** The Dash (and later the air dash and double jump). */
    readonly movement = new MovementAbilities();
    /** The Storage chest: 40 slots, never touched by dying. */
    readonly storage: Backpack;
    /** Timed Potion effects running on the hero (not saved). */
    readonly effects = new ActiveEffects();
    /** The Potion chosen to be drunk with R, or null. */
    quickSlotItemId: string | null = null;
    readonly pauseState = new GamePauseState(false);
    readonly dialogueState = new DialogueState();
    readonly wallet = new Wallet();
    readonly health = new Health();
    readonly attackCooldown = new AttackCooldown();
    readonly backpack: Backpack;
    readonly equipment = new EquipmentState();
    readonly spacedRepetition = new SpacedRepetitionSystem();
    readonly books: Record<string, BookProgress> = {};
    readonly repairedGates = new Set<string>();
    forgeUnlocked = false;

    constructor (itemCatalog: ItemCatalog = new ItemCatalog())
    {
        this.itemCatalog = itemCatalog;
        this.backpack = new Backpack([], itemCatalog);
        this.storage = new Backpack([], itemCatalog, STORAGE_MAX_SLOTS);
        this.books[FIRST_BOOK_ID] = new BookProgress(FIRST_BOOK_ID, false);
    }

    /** A snapshot of the current state, ready to be saved into `slotId`. */
    toSnapshot (slotId: string, timestamp: number = Date.now()): SaveGameSnapshot
    {
        const books: SaveGameSnapshot['books'] = {};
        for (const [key, book] of Object.entries(this.books))
        {
            books[key] = book.toSnapshot();
        }

        return {
            version: CURRENT_SAVE_VERSION,
            timestamp,
            slotId,
            activeSkinId: this.skinManager.activeSkinId,
            ownedSkins: this.skinManager.ownedSkinIds,
            settings: {
                soundMuted: this.settings.isSoundMuted,
                musicMuted: this.settings.isMusicMuted,
            },
            stageProgression: {
                unlockedStages: this.stageProgression.unlockedStages,
                completedStages: this.stageProgression.completedStages,
                questionRewardedStages: this.stageProgression.questionRewardedStages,
            },
            wallet: { balance: this.wallet.balance },
            books,
            backpack: this.backpack.toSnapshot(),
            equipment: this.equipment.toSnapshot(),
            practiceStats: this.spacedRepetition.toSnapshot(),
            repairedGates: Array.from(this.repairedGates),
            forgeUnlocked: this.forgeUnlocked,
            tutorial: this.tutorial.toSnapshot(),
            quickSlotItemId: this.quickSlotItemId,
            openedRealms: this.realms.openedRealms,
            pendingRewards: this.pendingRewards.toSnapshot(),
            plantRegrowth: this.plantRegrowth.toSnapshot(),
            garden: this.garden.toSnapshot(),
            crafting: this.crafting.toSnapshot(),
            movement: this.movement.toSnapshot(),
            storage: this.storage.toSnapshot(),
        };
    }

    /** Replaces the state with a loaded save, member by member, without creating new members. */
    loadFromSnapshot (snapshot: SaveGameSnapshot): void
    {
        this.skinManager.restore(snapshot.activeSkinId, snapshot.ownedSkins);
        this.settings.setSoundMuted(snapshot.settings.soundMuted);
        this.settings.setMusicMuted(snapshot.settings.musicMuted);
        this.stageProgression.loadFrom(
            snapshot.stageProgression.unlockedStages,
            snapshot.stageProgression.completedStages,
            snapshot.stageProgression.questionRewardedStages ?? []
        );
        this.wallet.setBalance(snapshot.wallet.balance);

        for (const key of Object.keys(this.books))
        {
            delete this.books[key];
        }
        for (const [key, value] of Object.entries(snapshot.books))
        {
            this.books[key] = BookProgress.fromSnapshot(value);
        }
        if (!this.books[FIRST_BOOK_ID])
        {
            this.books[FIRST_BOOK_ID] = new BookProgress(FIRST_BOOK_ID, false);
        }

        this.backpack.loadFromSnapshot(snapshot.backpack);
        this.equipment.loadFromSnapshot(snapshot.equipment);
        this.spacedRepetition.loadFromSnapshot(snapshot.practiceStats);

        this.repairedGates.clear();
        for (const gateId of snapshot.repairedGates) this.repairedGates.add(gateId);

        this.forgeUnlocked = snapshot.forgeUnlocked;
        this.tutorial.loadFrom(snapshot.tutorial);
        this.quickSlotItemId = snapshot.quickSlotItemId ?? null;
        this.realms.loadFrom(snapshot.openedRealms ?? [1]);
        this.pendingRewards.loadFrom(snapshot.pendingRewards ?? []);
        this.plantRegrowth.loadFrom(snapshot.plantRegrowth ?? {});
        this.garden.loadFrom(snapshot.garden ?? { plotCount: 6, plots: [] });
        this.crafting.loadFrom(snapshot.crafting ?? null);
        this.movement.loadFrom(snapshot.movement);
        this.storage.loadFromSnapshot(snapshot.storage ?? []);
        this.effects.clear();
        this.syncArmor();
        this.health.reset();
    }

    /** Makes the Armor hearts match the worn pieces. Call again once the item catalog has loaded. */
    syncArmor (): void
    {
        this.health.syncMaxArmor(armorHeartsOf(this.equipment.wornArmor.map(w => w.piece), this.itemCatalog));
    }
}
