import { Wallet } from './Wallet';
import { DomainEvents } from '../DomainEvents';

export type AchievementCategory = 'combat' | 'progression' | 'mastery' | 'economy';

export interface AchievementDefinition
{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    targetCount: number;
    rewardCoins: number;
}

export interface AchievementProgress
{
    progress: number;
    unlocked: boolean;
    claimed: boolean;
    unlockedAt?: number | null;
}

export const ACHIEVEMENT_UNLOCKED_EVENT = 'achievement-unlocked';

export interface AchievementUnlockedPayload
{
    id: string;
    title: string;
    description: string;
    icon: string;
    rewardCoins: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
    {
        id: 'first-blood',
        title: '🩸 ຢອດເລືອດທຳອິດ (First Blood)',
        description: 'ປາບສັດຕູໂຕທຳອິດໃນເກມ',
        icon: '⚔️',
        category: 'combat',
        targetCount: 1,
        rewardCoins: 50,
    },
    {
        id: 'slime-slayer',
        title: '👾 ນັກລ່າສະໄລມ໌ (Slime Slayer)',
        description: 'ປາບ Slime ທຸກຊະນິດລວມກັນ 15 ໂຕ',
        icon: '🗡️',
        category: 'combat',
        targetCount: 15,
        rewardCoins: 100,
    },
    {
        id: 'flying-ace',
        title: '🦅 ນັກລ່າກາງເວຫາ (Sky Hunter)',
        description: 'ປາບ Cyber Drone Slime 5 ໂຕ',
        icon: '🏹',
        category: 'combat',
        targetCount: 5,
        rewardCoins: 100,
    },
    {
        id: 'tank-breaker',
        title: '🛡️ ຜູ້ທຳລາຍເກາະເຫຼັກ (Tank Breaker)',
        description: 'ປາບ Armored Slime 3 ໂຕດ້ວຍອາວຸດ ຫຼື ລະເບີດ',
        icon: '🔨',
        category: 'combat',
        targetCount: 3,
        rewardCoins: 150,
    },
    {
        id: 'spit-deflector',
        title: '⚡ ນັກດາບຕັດລູກພິດ (Poison Deflector)',
        description: 'ໃຊ້ດາບ Cyber Saber ຟັນຕັດລູກພິດກົດ 5 ຄັ້ງ',
        icon: '🤺',
        category: 'mastery',
        targetCount: 5,
        rewardCoins: 120,
    },
    {
        id: 'boss-slayer',
        title: '👑 ຜູ້ພິຊິດຣາຊາສະໄລມ໌ (King Slayer)',
        description: 'ປາບ Boss King Slime ໄດ້ສຳເລັດ',
        icon: '👑',
        category: 'progression',
        targetCount: 1,
        rewardCoins: 300,
    },
    {
        id: 'untouchable',
        title: '✨ ໄຮ້ຮອຍຂີດຂ່ວນ (Untouchable)',
        description: 'ຜ່ານດ່ານໃດກໍໄດ້ໂດຍບໍ່ເສຍເລືອດເລີຍ',
        icon: '⭐',
        category: 'mastery',
        targetCount: 1,
        rewardCoins: 200,
    },
    {
        id: 'coin-collector',
        title: '💰 ເສດຖີໄຊເບີ (Cyber Rich)',
        description: 'ເກັບຫຼຽນລວມທັງໝົດໄດ້ 100 ຫຼຽນ',
        icon: '💎',
        category: 'economy',
        targetCount: 100,
        rewardCoins: 150,
    },
    {
        id: 'arsenal-master',
        title: '🔫 ຄັງອາວຸດຄົບມື (Arsenal Master)',
        description: 'ເປັນເຈົ້າຂອງອາວຸດຢ່າງໜ້ອຍ 3 ຊະນິດ',
        icon: '🎒',
        category: 'economy',
        targetCount: 3,
        rewardCoins: 200,
    },
    {
        id: 'bomb-expert',
        title: '💣 ຊ່ຽວຊານລະເບີດ (Demolitionist)',
        description: 'ໃຊ້ລະເບີດ Pulse Bomb 3 ຄັ້ງ',
        icon: '💣',
        category: 'combat',
        targetCount: 3,
        rewardCoins: 100,
    },
];

/**
 * Domain entity managing Player Achievements and Quests.
 * Pure business rules — see "Domain layer" in CONTEXT.md.
 */
export class AchievementManager
{
    private _state: Map<string, AchievementProgress>;

    constructor (initialData?: Record<string, AchievementProgress>)
    {
        this._state = new Map();

        // Initialize all catalog achievements
        for (const def of ACHIEVEMENT_CATALOG)
        {
            const saved = initialData?.[def.id];
            this._state.set(def.id, {
                progress: saved?.progress ? Math.max(0, saved.progress) : 0,
                unlocked: Boolean(saved?.unlocked),
                claimed: Boolean(saved?.claimed),
                unlockedAt: saved?.unlockedAt ?? null,
            });
        }
    }

    getProgress (id: string): AchievementProgress
    {
        return this._state.get(id) ?? { progress: 0, unlocked: false, claimed: false, unlockedAt: null };
    }

    getAllAchievements (): Array<AchievementDefinition & AchievementProgress>
    {
        return ACHIEVEMENT_CATALOG.map((def) =>
        {
            const prog = this.getProgress(def.id);
            return {
                ...def,
                ...prog,
            };
        });
    }

    get unclaimedCount (): number
    {
        let count = 0;
        for (const [, state] of this._state)
        {
            if (state.unlocked && !state.claimed)
            {
                count++;
            }
        }
        return count;
    }

    recordProgress (
        id: string,
        amount = 1,
        isAbsoluteValue = false
    ): { justUnlocked: boolean; achievement: AchievementDefinition } | null
    {
        const def = ACHIEVEMENT_CATALOG.find(a => a.id === id);
        if (!def) return null;

        const current = this.getProgress(id);
        if (current.unlocked) return null;

        const nextProgress = isAbsoluteValue
            ? Math.max(current.progress, amount)
            : current.progress + amount;

        const isNowUnlocked = nextProgress >= def.targetCount;

        this._state.set(id, {
            progress: nextProgress,
            unlocked: isNowUnlocked,
            claimed: current.claimed,
            unlockedAt: isNowUnlocked ? Date.now() : null,
        });

        if (isNowUnlocked)
        {
            DomainEvents.emit(ACHIEVEMENT_UNLOCKED_EVENT, {
                id: def.id,
                title: def.title,
                description: def.description,
                icon: def.icon,
                rewardCoins: def.rewardCoins,
            } as AchievementUnlockedPayload);

            return {
                justUnlocked: true,
                achievement: def,
            };
        }

        return null;
    }

    claimReward (id: string, wallet: Wallet): { success: boolean; rewardCoins: number }
    {
        const def = ACHIEVEMENT_CATALOG.find(a => a.id === id);
        if (!def) return { success: false, rewardCoins: 0 };

        const current = this.getProgress(id);
        if (!current.unlocked || current.claimed)
        {
            return { success: false, rewardCoins: 0 };
        }

        // Add coins to wallet
        wallet.earn(def.rewardCoins);

        this._state.set(id, {
            ...current,
            claimed: true,
        });

        return {
            success: true,
            rewardCoins: def.rewardCoins,
        };
    }

    loadFrom (data?: Record<string, AchievementProgress>): void
    {
        for (const def of ACHIEVEMENT_CATALOG)
        {
            const saved = data?.[def.id];
            this._state.set(def.id, {
                progress: saved?.progress ? Math.max(0, saved.progress) : 0,
                unlocked: Boolean(saved?.unlocked),
                claimed: Boolean(saved?.claimed),
                unlockedAt: saved?.unlockedAt ?? null,
            });
        }
    }

    reset (): void
    {
        this.loadFrom();
    }

    serialize (): Record<string, AchievementProgress>
    {
        const result: Record<string, AchievementProgress> = {};
        for (const [id, state] of this._state)
        {
            result[id] = { ...state };
        }
        return result;
    }
}
