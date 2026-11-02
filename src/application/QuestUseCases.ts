import { DomainEvents } from '../domain/DomainEvents';
import { QuestBoard, QuestType, QuestReward } from '../domain/entities/Quest';
import { Wallet } from '../domain/entities/Wallet';
import { Backpack } from '../domain/entities/Backpack';
import { PendingRewards } from '../domain/entities/PendingRewards';

export const QUEST_COMPLETED_EVENT = 'quest-completed';
export const QUEST_CLAIMED_EVENT = 'quest-claimed';
export const QUEST_ACCEPTED_EVENT = 'quest-accepted';

export interface QuestCompletedPayload
{
    questId: string;
    title: string;
}

export interface QuestClaimedPayload
{
    questId: string;
    reward: QuestReward;
}

export interface QuestAcceptedPayload
{
    questId: string;
    title: string;
}

/**
 * Accepts a daily or outside quest.
 */
export function acceptQuestUseCase (board: QuestBoard, questId: string): boolean
{
    const quest = board.get(questId);
    if (!quest) return false;
    const success = board.acceptQuest(questId);
    if (success)
    {
        DomainEvents.emit<QuestAcceptedPayload>(QUEST_ACCEPTED_EVENT, {
            questId,
            title: quest.title,
        });
    }
    return success;
}

/**
 * Abandons an active daily or outside quest.
 */
export function abandonQuestUseCase (board: QuestBoard, questId: string): boolean
{
    return board.abandonQuest(questId);
}

/**
 * Updates progress for quests of the given type and target.
 * Emits `quest-completed` when any quest reaches its required count.
 */
export function recordQuestProgressUseCase (
    board: QuestBoard,
    type: QuestType,
    target?: string,
    count = 1
): boolean
{
    const newlyCompleted = board.registerProgress(type, target, count);
    if (newlyCompleted)
    {
        for (const q of board.quests)
        {
            if (q.completed && !q.claimed && q.progress === q.requiredCount)
            {
                DomainEvents.emit<QuestCompletedPayload>(QUEST_COMPLETED_EVENT, {
                    questId: q.id,
                    title: q.title,
                });
            }
        }
    }
    return newlyCompleted;
}

/**
 * Claims the reward for a finished quest.
 * Credits go to the wallet, items to the backpack (or pending rewards if full).
 */
export function claimQuestRewardUseCase (
    board: QuestBoard,
    questId: string,
    wallet: Wallet,
    backpack: Backpack,
    pendingRewards?: PendingRewards
)
{
    const result = board.claimReward(questId, wallet, backpack, pendingRewards);
    if (result.success && result.reward)
    {
        DomainEvents.emit<QuestClaimedPayload>(QUEST_CLAIMED_EVENT, {
            questId,
            reward: result.reward,
        });
    }
    return result;
}
