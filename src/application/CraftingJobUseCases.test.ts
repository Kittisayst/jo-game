import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { CraftingQueue } from '../domain/entities/CraftingQueue';
import { Wallet } from '../domain/entities/Wallet';
import { RecipeDefinition } from './CraftRecipeUseCase';
import { collectCraftUseCase, startCraftUseCase } from './CraftingJobUseCases';

const sword: RecipeDefinition = {
    id: 'recipe-iron-sword',
    resultItemId: 'iron-sword',
    resultCount: 1,
    building: 'forge',
    requiredBookRecipe: 'iron-sword',
    creditCost: 10,
    craftSeconds: 30,
    ingredients: [{ itemId: 'iron-ore', count: 10 }, { itemId: 'wood', count: 5 }],
};

const axe: RecipeDefinition = {
    id: 'recipe-axe-t1',
    resultItemId: 'axe-t1',
    resultCount: 1,
    building: 'workshop',
    requiredBookRecipe: null,
    creditCost: 0,
    ingredients: [{ itemId: 'wood', count: 5 }],
};

function setup (): { backpack: Backpack; wallet: Wallet; queue: CraftingQueue; unlocked: Set<string> }
{
    const backpack = new Backpack();
    backpack.addItem('iron-ore', 20);
    backpack.addItem('wood', 20);
    return { backpack, wallet: new Wallet(50), queue: new CraftingQueue(), unlocked: new Set(['iron-sword']) };
}

describe('startCraftUseCase', () =>
{
    it('takes the Materials and Credit now and puts a timed recipe in the queue', () =>
    {
        const { backpack, wallet, queue, unlocked } = setup();
        const result = startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        expect(result).toMatchObject({ success: true, started: true });
        expect(backpack.getItemCount('iron-ore')).toBe(10);
        expect(backpack.getItemCount('wood')).toBe(15);
        expect(wallet.balance).toBe(40);
        expect(backpack.getItemCount('iron-sword')).toBe(0);
        expect(queue.job).toMatchObject({ recipeId: 'recipe-iron-sword', totalMs: 30_000, remainingMs: 30_000 });
    });

    it('refuses a second job and takes nothing for it', () =>
    {
        const { backpack, wallet, queue, unlocked } = setup();
        startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        const second = startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        expect(second).toEqual({ success: false, reason: 'busy' });
        expect(backpack.getItemCount('iron-ore')).toBe(10);
        expect(wallet.balance).toBe(40);
    });

    it('checks the lock, the Credit and the Materials like an instant craft', () =>
    {
        const a = setup();
        expect(startCraftUseCase(sword, a.backpack, a.wallet, new Set(), a.queue)).toEqual({ success: false, reason: 'recipe_locked' });
        const b = setup();
        b.wallet.spend(45);
        expect(startCraftUseCase(sword, b.backpack, b.wallet, b.unlocked, b.queue)).toEqual({ success: false, reason: 'insufficient_credit' });
        const c = setup();
        c.backpack.removeItem('wood', 20);
        expect(startCraftUseCase(sword, c.backpack, c.wallet, c.unlocked, c.queue)).toEqual({ success: false, reason: 'insufficient_ingredients_or_space' });
        expect(a.queue.isBusy || b.queue.isBusy || c.queue.isBusy).toBe(false);
    });

    it('makes a recipe without a build time at once, even while a job runs', () =>
    {
        const { backpack, wallet, queue, unlocked } = setup();
        startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        const result = startCraftUseCase(axe, backpack, wallet, unlocked, queue);
        expect(result).toMatchObject({ success: true, started: false });
        expect(backpack.getItemCount('axe-t1')).toBe(1);
    });
});

describe('collectCraftUseCase', () =>
{
    it('gives the result when the job is done, and frees the queue', () =>
    {
        const { backpack, wallet, queue, unlocked } = setup();
        startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        expect(collectCraftUseCase(queue, backpack)).toEqual({ success: false, reason: 'nothing_ready' });
        queue.tick(30_000);
        expect(collectCraftUseCase(queue, backpack)).toEqual({ success: true, resultItemId: 'iron-sword', resultCount: 1 });
        expect(backpack.getItemCount('iron-sword')).toBe(1);
        expect(queue.isBusy).toBe(false);
    });

    it('keeps the job when the Backpack is full', () =>
    {
        const { backpack, wallet, queue, unlocked } = setup();
        startCraftUseCase(sword, backpack, wallet, unlocked, queue);
        queue.tick(30_000);
        let n = 0;
        while (backpack.canAddItem(`filler-${n}`, 1)) backpack.addItem(`filler-${n++}`, 1);
        expect(collectCraftUseCase(queue, backpack)).toEqual({ success: false, reason: 'backpack_full' });
        expect(queue.isReady).toBe(true);
    });
});
