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

    it('initializes with story quests auto-accepted, daily and outside unaccepted', () =>
    {
        expect(board.quests.length).toBe(DEFAULT_QUESTS.length);
        const storyQuests = board.getByCategory('story');
        expect(storyQuests.every(q => q.accepted)).toBe(true);

        const dailyQuests = board.getByCategory('daily');
        expect(dailyQuests.every(q => !q.accepted)).toBe(true);

        const outsideQuests = board.getByCategory('outside');
        expect(outsideQuests.every(q => !q.accepted)).toBe(true);

        // Active count reflects only accepted & uncompleted (which initially is story quests)
        expect(board.activeCount).toBe(storyQuests.length);
        expect(board.claimableCount).toBe(0);
    });

    it('registers progress for accepted gather quests', () =>
    {
        const woodQuest = board.get('quest-wood')!;
        expect(woodQuest.progress).toBe(0);
        expect(woodQuest.accepted).toBe(true);

        board.registerProgress('gather', 'wood', 3);
        expect(woodQuest.progress).toBe(3);
        expect(woodQuest.completed).toBe(false);

        const finished = board.registerProgress('gather', 'wood', 2);
        expect(finished).toBe(true);
        expect(woodQuest.progress).toBe(5);
        expect(woodQuest.completed).toBe(true);
        expect(board.claimableCount).toBe(1);
    });

    it('does NOT register progress for daily or outside quests until accepted', () =>
    {
        const slimeQuest = board.get('quest-slime')!;
        expect(slimeQuest.accepted).toBe(false);

        // Kill slime while unaccepted -> progress stays 0
        board.registerProgress('defeat', 'forest-slime', 2);
        expect(slimeQuest.progress).toBe(0);

        // Now accept the quest
        const acceptRes = board.acceptQuest('quest-slime');
        expect(acceptRes).toBe(true);
        expect(slimeQuest.accepted).toBe(true);

        // Kill slime after acceptance -> progress increments!
        board.registerProgress('defeat', 'forest-slime', 2);
        expect(slimeQuest.progress).toBe(2);

        board.registerProgress('defeat', 'crystal-slime', 2);
        expect(slimeQuest.progress).toBe(4);
        expect(slimeQuest.completed).toBe(true);
    });

    it('allows abandoning an uncompleted daily or outside quest', () =>
    {
        board.acceptQuest('quest-golem');
        board.registerProgress('defeat', 'rock-golem', 1);
        expect(board.get('quest-golem')!.progress).toBe(1);

        const res = board.abandonQuest('quest-golem');
        expect(res).toBe(true);
        expect(board.get('quest-golem')!.accepted).toBe(false);
        expect(board.get('quest-golem')!.progress).toBe(0);

        // Story quest cannot be abandoned
        expect(board.abandonQuest('quest-wood')).toBe(false);
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
        const tinyBackpack = new Backpack([], catalog, 1);
        tinyBackpack.addItem('wood', 99); // fills the only slot

        board.registerProgress('gather', 'copper-ore', 4);
        const res = board.claimReward('quest-copper', wallet, tinyBackpack, pendingRewards);

        expect(res.success).toBe(true);
        expect(pendingRewards.total).toBe(1);
        expect(pendingRewards.entries.find(e => e.itemId === 'herb-potion')?.count).toBe(1);
    });

    it('serializes and deserializes snapshot cleanly preserving accepted state', () =>
    {
        board.acceptQuest('quest-practice');
        board.registerProgress('craft', undefined, 1);
        const craftQuest = board.get('quest-craft')!;
        expect(craftQuest.completed).toBe(true);

        board.claimReward('quest-craft', wallet, backpack, pendingRewards);

        const snap = board.toSnapshot();
        const newBoard = new QuestBoard();
        newBoard.loadFrom(snap);

        const restoredCraft = newBoard.get('quest-craft')!;
        expect(restoredCraft.progress).toBe(1);
        expect(restoredCraft.completed).toBe(true);
        expect(restoredCraft.claimed).toBe(true);

        const restoredPractice = newBoard.get('quest-practice')!;
        expect(restoredPractice.accepted).toBe(true);
    });
});
