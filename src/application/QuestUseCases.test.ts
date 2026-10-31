import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { QuestBoard } from '../domain/entities/Quest';
import { Wallet } from '../domain/entities/Wallet';
import { Backpack } from '../domain/entities/Backpack';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import {
    recordQuestProgressUseCase,
    claimQuestRewardUseCase,
    QUEST_COMPLETED_EVENT,
    QUEST_CLAIMED_EVENT,
    QuestCompletedPayload,
    QuestClaimedPayload,
} from './QuestUseCases';

describe('QuestUseCases', () =>
{
    let board: QuestBoard;
    let wallet: Wallet;
    let backpack: Backpack;

    beforeEach(() =>
    {
        DomainEvents.clear();
        board = new QuestBoard();
        wallet = new Wallet(0);
        backpack = new Backpack([], new ItemCatalog(), 20);
    });

    it('emits QUEST_COMPLETED_EVENT when a quest finishes', () =>
    {
        const listener = vi.fn();
        DomainEvents.on<QuestCompletedPayload>(QUEST_COMPLETED_EVENT, listener);

        recordQuestProgressUseCase(board, 'gather', 'wood', 5);

        expect(listener).toHaveBeenCalledWith({
            questId: 'quest-wood',
            title: 'ຕັດໄມ້ໃນປ່າ',
        });
    });

    it('emits QUEST_CLAIMED_EVENT when claiming reward', () =>
    {
        const listener = vi.fn();
        DomainEvents.on<QuestClaimedPayload>(QUEST_CLAIMED_EVENT, listener);

        recordQuestProgressUseCase(board, 'gather', 'wood', 5);
        const result = claimQuestRewardUseCase(board, 'quest-wood', wallet, backpack);

        expect(result.success).toBe(true);
        expect(wallet.balance).toBe(20);
        expect(listener).toHaveBeenCalledWith({
            questId: 'quest-wood',
            reward: { credit: 20 },
        });
    });
});

