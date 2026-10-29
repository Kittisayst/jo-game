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
import { Wallet } from './Wallet';

const FIRST_BOOK_ID = 'book-ch1';

/**
 * Everything that makes up one player's game, held together so it can be handed around as one
 * thing instead of a bag of module-level singletons. Each member is created once and never
 * replaced: loading a save changes the members in place, so a reference held by a scene or a
 * screen never goes stale.
 */
export class GameState
{
    readonly itemCatalog: ItemCatalog;
    readonly skinManager = new SkinManager();
    readonly settings = new Settings();
    readonly stageProgression = new StageProgression();
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
            },
            wallet: { balance: this.wallet.balance },
            books,
            backpack: this.backpack.toSnapshot(),
            equipment: this.equipment.toSnapshot(),
            practiceStats: this.spacedRepetition.toSnapshot(),
            repairedGates: Array.from(this.repairedGates),
            forgeUnlocked: this.forgeUnlocked,
        };
    }

    /** Replaces the state with a loaded save, member by member, without creating new members. */
    loadFromSnapshot (snapshot: SaveGameSnapshot): void
    {
        this.skinManager.restore(snapshot.activeSkinId, snapshot.ownedSkins);
        this.settings.setSoundMuted(snapshot.settings.soundMuted);
        this.settings.setMusicMuted(snapshot.settings.musicMuted);
        this.stageProgression.loadFrom(snapshot.stageProgression.unlockedStages, snapshot.stageProgression.completedStages);
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
        this.health.reset();
    }
}
