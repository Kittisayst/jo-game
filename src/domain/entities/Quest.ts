import { Backpack } from './Backpack';
import { Wallet } from './Wallet';
import { PendingRewards } from './PendingRewards';

export type QuestType =
    | 'gather'
    | 'defeat'
    | 'craft'
    | 'drink_potion'
    | 'clear_stage'
    | 'daily_practice';

export type QuestCategory = 'story' | 'daily' | 'outside';

export interface QuestRewardItem
{
    itemId: string;
    count: number;
}

export interface QuestReward
{
    credit: number;
    items?: QuestRewardItem[];
}

export interface QuestData
{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: QuestCategory;
    type: QuestType;
    /** Specific target: e.g. 'wood', 'copper-ore', 'slime', 'golem'. If undefined, matches any of that type. */
    target?: string;
    requiredCount: number;
    progress: number;
    accepted: boolean;
    completed: boolean;
    claimed: boolean;
    reward: QuestReward;
}

export interface QuestSnapshot
{
    quests: {
        id: string;
        progress: number;
        accepted?: boolean;
        completed: boolean;
        claimed: boolean;
    }[];
}

export const DEFAULT_QUESTS: readonly QuestData[] = [
    // --- 1. Story Quests (ເນື້ອເລື່ອງ - auto-accepted) ---
    {
        id: 'quest-wood',
        title: 'ຕັດໄມ້ໃນປ່າ',
        description: 'ເກັບໄມ້ທ່ອນ 5 ອັນຈາກຕົ້ນໄມ້ໃນດ່ານປ່າ',
        icon: '🪵',
        category: 'story',
        type: 'gather',
        target: 'wood',
        requiredCount: 5,
        progress: 0,
        accepted: true,
        completed: false,
        claimed: false,
        reward: { credit: 20 },
    },
    {
        id: 'quest-copper',
        title: 'ຂຸດແຮ່ທອງແດງ',
        description: 'ຂຸດສາຍແຮ່ທອງແດງ 4 ກ້ອນ ເພື່ອນຳມາໃຊ້ສ້າງອາວຸດ',
        icon: '⛏️',
        category: 'story',
        type: 'gather',
        target: 'copper-ore',
        requiredCount: 4,
        progress: 0,
        accepted: true,
        completed: false,
        claimed: false,
        reward: { credit: 25, items: [{ itemId: 'herb-potion', count: 1 }] },
    },
    {
        id: 'quest-craft',
        title: 'ສ້າງເຄື່ອງມື ຫຼື ຢາ',
        description: 'ສ້າງອຸປະກອນ ຫຼື ປຸງຢາທີ່ໂຮງຊ່າງ 1 ຄັ້ງ',
        icon: '🔨',
        category: 'story',
        type: 'craft',
        requiredCount: 1,
        progress: 0,
        accepted: true,
        completed: false,
        claimed: false,
        reward: { credit: 20 },
    },
    {
        id: 'quest-stage',
        title: 'ສຳຫຼວດດ່ານຜະຈົນໄພ',
        description: 'ຜ່ານດ່ານຜະຈົນໄພຈົນເຖິງປະຕູທາງອອກ 2 ດ່ານ',
        icon: '🚩',
        category: 'story',
        type: 'clear_stage',
        requiredCount: 2,
        progress: 0,
        accepted: true,
        completed: false,
        claimed: false,
        reward: { credit: 35, items: [{ itemId: 'armor-potion', count: 1 }] },
    },

    // --- 2. Daily Quests (ປະຈຳວັນ - ຕ້ອງກົດຮັບ) ---
    {
        id: 'quest-practice',
        title: 'ຝຶກຝົນປັນຍາປະຈຳວັນ',
        description: 'ທົດສອບຄວາມຮູ້ປະຈຳວັນທີ່ສະຖາບັນ 1 ຄັ້ງ',
        icon: '📖',
        category: 'daily',
        type: 'daily_practice',
        requiredCount: 1,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 30 },
    },
    {
        id: 'quest-slime',
        title: 'ປາບ Slime ວຸ້ນປະຈຳວັນ',
        description: 'ກຳຈັດມອນສເຕີ Slime 4 ໂຕໃນການຜະຈົນໄພ',
        icon: '🟢',
        category: 'daily',
        type: 'defeat',
        target: 'slime',
        requiredCount: 4,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 25, items: [{ itemId: 'speed-potion', count: 1 }] },
    },
    {
        id: 'quest-potion',
        title: 'ດື່ມຢາເສີມພະລັງປະຈຳວັນ',
        description: 'ດື່ມຢາຮັກສາ ຫຼື ຢາເພີ່ມພະລັງ 1 ຄັ້ງ',
        icon: '🧪',
        category: 'daily',
        type: 'drink_potion',
        requiredCount: 1,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 15, items: [{ itemId: 'herb-potion', count: 1 }] },
    },

    // --- 3. Outside Quests (ພາລະກິດນອກ/ລ່າສັດ - ຕ້ອງກົດຮັບ) ---
    {
        id: 'quest-golem',
        title: 'ປາບ Golem ຜູ້ປົກປ້ອງ',
        description: 'ປາບ Rock Golem, Sand Golem ຫຼື Crystal Golem 3 ໂຕ',
        icon: '🗿',
        category: 'outside',
        type: 'defeat',
        target: 'golem',
        requiredCount: 3,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 30, items: [{ itemId: 'strength-potion', count: 1 }] },
    },
    {
        id: 'quest-dungeon-bat',
        title: 'ປາບເຈຍຖ້ຳມະຫັນຕະໄພ',
        description: 'ກຳຈັດເຈຍຖ້ຳ (Cave Bat) 3 ໂຕໃນຄຸກໃຕ້ດິນ',
        icon: '🦇',
        category: 'outside',
        type: 'defeat',
        target: 'bat',
        requiredCount: 3,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 20, items: [{ itemId: 'herb-potion', count: 2 }] },
    },
    {
        id: 'quest-dungeon-spider',
        title: 'ລ່າແມງມຸມພິດຄຸກມືດ',
        description: 'ກຳຈັດແມງມຸມຄຸກ (Dungeon Spider) 3 ໂຕ',
        icon: '🕷️',
        category: 'outside',
        type: 'defeat',
        target: 'spider',
        requiredCount: 3,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 30, items: [{ itemId: 'speed-potion', count: 1 }] },
    },
    {
        id: 'quest-dungeon-skeleton',
        title: 'ປາບນັກຮົບໂຄງກະດູກ',
        description: 'ກຳຈັດໂຄງກະດູກນັກຮົບ (Skeleton Warrior) 2 ໂຕ',
        icon: '💀',
        category: 'outside',
        type: 'defeat',
        target: 'skeleton',
        requiredCount: 2,
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        reward: { credit: 40, items: [{ itemId: 'bone-sword', count: 1 }] },
    },
];

export class QuestBoard
{
    private _quests: QuestData[];

    constructor (initialQuests?: QuestData[])
    {
        this._quests = initialQuests
            ? initialQuests.map(q => ({
                ...q,
                accepted: q.accepted ?? (q.category === 'story'),
            }))
            : DEFAULT_QUESTS.map(q => ({ ...q }));
    }

    get quests (): readonly QuestData[]
    {
        return this._quests;
    }

    get (id: string): QuestData | undefined
    {
        return this._quests.find(q => q.id === id);
    }

    /** Returns all quests belonging to a specific category (story, daily, outside). */
    getByCategory (category: QuestCategory): readonly QuestData[]
    {
        return this._quests.filter(q => q.category === category);
    }

    /** All currently accepted quests that are still in progress. */
    get acceptedQuests (): readonly QuestData[]
    {
        return this._quests.filter(q => q.accepted && !q.completed);
    }

    /** Number of completed quests that have not yet had their rewards claimed. */
    get claimableCount (): number
    {
        return this._quests.filter(q => q.accepted && q.completed && !q.claimed).length;
    }

    /** Number of active (accepted & uncompleted) quests. */
    get activeCount (): number
    {
        return this._quests.filter(q => q.accepted && !q.completed).length;
    }

    /**
     * Accepts a daily or outside quest so its progress starts tracking.
     */
    acceptQuest (id: string): boolean
    {
        const quest = this.get(id);
        if (!quest || quest.accepted) return false;
        quest.accepted = true;
        return true;
    }

    /**
     * Abandons an active daily or outside quest, resetting its progress.
     */
    abandonQuest (id: string): boolean
    {
        const quest = this.get(id);
        if (!quest || !quest.accepted || quest.category === 'story' || quest.completed) return false;
        quest.accepted = false;
        quest.progress = 0;
        return true;
    }

    /**
     * Registers progress for matching quests that have been accepted.
     * Returns true if at least one quest became completed with this progress.
     */
    registerProgress (type: QuestType, target?: string, count = 1): boolean
    {
        if (count <= 0) return false;
        let anyCompleted = false;

        for (const quest of this._quests)
        {
            // Note 2: Must be accepted first to register progress!
            if (!quest.accepted || quest.completed || quest.type !== type) continue;

            if (quest.target && target)
            {
                // Partial substring or exact match: e.g. target 'slime' matches 'forest-slime', 'enemy-crystal-slime', etc.
                const targetLower = target.toLowerCase();
                const questTargetLower = quest.target.toLowerCase();
                if (!targetLower.includes(questTargetLower) && !questTargetLower.includes(targetLower))
                {
                    continue;
                }
            }
            else if (quest.target && !target)
            {
                continue;
            }

            quest.progress = Math.min(quest.requiredCount, quest.progress + count);
            if (quest.progress >= quest.requiredCount)
            {
                quest.completed = true;
                anyCompleted = true;
            }
        }

        return anyCompleted;
    }

    /**
     * Claims the reward for a completed quest.
     * Credit is granted to wallet; reward items go to backpack (or pending rewards if backpack is full).
     */
    claimReward (
        questId: string,
        wallet: Wallet,
        backpack: Backpack,
        pendingRewards?: PendingRewards
    ): { success: boolean; reason?: 'not_found' | 'not_completed' | 'already_claimed'; reward?: QuestReward }
    {
        const quest = this.get(questId);
        if (!quest) return { success: false, reason: 'not_found' };
        if (!quest.completed) return { success: false, reason: 'not_completed' };
        if (quest.claimed) return { success: false, reason: 'already_claimed' };

        // 1. Grant credits
        if (quest.reward.credit > 0)
        {
            wallet.earn(quest.reward.credit);
        }

        // 2. Grant items
        if (quest.reward.items && quest.reward.items.length > 0)
        {
            for (const item of quest.reward.items)
            {
                const { overflow } = backpack.addItem(item.itemId, item.count);
                if (overflow > 0 && pendingRewards)
                {
                    pendingRewards.add(item.itemId, overflow);
                }
            }
        }

        quest.claimed = true;
        return { success: true, reward: quest.reward };
    }

    toSnapshot (): QuestSnapshot
    {
        return {
            quests: this._quests.map(q => ({
                id: q.id,
                progress: q.progress,
                accepted: q.accepted,
                completed: q.completed,
                claimed: q.claimed,
            })),
        };
    }

    loadFrom (snapshot?: QuestSnapshot): void
    {
        if (!snapshot || !Array.isArray(snapshot.quests)) return;

        for (const saved of snapshot.quests)
        {
            const quest = this.get(saved.id);
            if (quest)
            {
                quest.progress = typeof saved.progress === 'number' ? saved.progress : 0;
                quest.accepted = saved.accepted ?? (quest.category === 'story');
                quest.completed = Boolean(saved.completed);
                quest.claimed = Boolean(saved.claimed);
            }
        }
    }
}
