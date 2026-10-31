import { describe, it, expect, beforeEach } from 'vitest';
import { QuestBoard, DEFAULT_QUESTS } from './Quest';
import { Wallet } from './Wallet';
import { Backpack } from './Backpack';
import { ItemCatalog } from './ItemCatalog';
import { PendingRewards } from './PendingRewards';

describe('QuestBoard', () =>
{
    let board: QuestBoard;
    let wallet: Wallet;
    let backpack: Backpack;
    let catalog: ItemCatalog;
    let pendingRewards: PendingRewards;

    beforeEach(() =>
    {
        board = new QuestBoard();
        wallet = new Wallet(50);
        catalog = new ItemCatalog();
        backpack = new Backpack([], catalog, 10);
        pendingRewards = new PendingRewards();
    });

    it('initializes with default quests all uncompleted', () =>
    {
        expect(board.quests.length).toBe(DEFAULT_QUESTS.length);
        expect(board.activeCount).toBe(DEFAULT_QUESTS.length);
        expect(board.claimableCount).toBe(0);
    });

    it('registers progress for gather quests', () =>
    {
        const woodQuest = board.get('quest-wood')!;
        expect(woodQuest.progress).toBe(0);

        board.registerProgress('gather', 'wood', 3);
        expect(woodQuest.progress).toBe(3);
        expect(woodQuest.completed).toBe(false);

        const finished = board.registerProgress('gather', 'wood', 2);
        expect(finished).toBe(true);
        expect(woodQuest.progress).toBe(5);
        expect(woodQuest.completed).toBe(true);
        expect(board.claimableCount).toBe(1);
    });

    it('registers progress for monster defeat matching substring', () =>
    {
        const slimeQuest = board.get('quest-slime')!;
        board.registerProgress('defeat', 'forest-slime', 2);
        expect(slimeQuest.progress).toBe(2);

        board.registerProgress('defeat', 'crystal-slime', 2);
        expect(slimeQuest.progress).toBe(4);
        expect(slimeQuest.completed).toBe(true);
    });

    it('claims reward granting credits and items to backpack', () =>
    {
        board.registerProgress('gather', 'copper-ore', 4);
        const copperQuest = board.get('quest-copper')!;
        expect(copperQuest.completed).toBe(true);

        const startCredits = wallet.balance;
        const res = board.claimReward('quest-copper', wallet, backpack, pendingRewards);

        expect(res.success).toBe(true);
        expect(wallet.balance).toBe(startCredits + 25);
        expect(backpack.getItemCount('herb-potion')).toBe(1);
        expect(copperQuest.claimed).toBe(true);
        expect(board.claimableCount).toBe(0);

        // Cannot claim twice
        const res2 = board.claimReward('quest-copper', wallet, backpack, pendingRewards);
        expect(res2.success).toBe(false);
        expect(res2.reason).toBe('already_claimed');
    });

    it('stashes items in pendingRewards when backpack is full', () =>
    {
        // Fill all 10 slots of backpack
        const tinyBackpack = new Backpack([], catalog, 1);
        tinyBackpack.addItem('wood', 99); // fills the only slot

        board.registerProgress('gather', 'copper-ore', 4);
        const res = board.claimReward('quest-copper', wallet, tinyBackpack, pendingRewards);

        expect(res.success).toBe(true);
        expect(pendingRewards.total).toBe(1);
        expect(pendingRewards.entries.find(e => e.itemId === 'herb-potion')?.count).toBe(1);
    });

    it('serializes and deserializes snapshot cleanly', () =>
    {
        board.registerProgress('craft', undefined, 1);
        const craftQuest = board.get('quest-craft')!;
        expect(craftQuest.completed).toBe(true);

        board.claimReward('quest-craft', wallet, backpack, pendingRewards);

        const snap = board.toSnapshot();
        const newBoard = new QuestBoard();
        newBoard.loadFrom(snap);

        const restored = newBoard.get('quest-craft')!;
        expect(restored.progress).toBe(1);
        expect(restored.completed).toBe(true);
        expect(restored.claimed).toBe(true);
    });
});
