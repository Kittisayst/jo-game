import { describe, expect, it } from 'vitest';
import { craftRecipeUseCase, RecipeDefinition } from './CraftRecipeUseCase';
import { Backpack } from '../domain/entities/Backpack';
import { Wallet } from '../domain/entities/Wallet';

describe('CraftRecipeUseCase', () =>
{
    const pickaxeRecipe: RecipeDefinition = {
        id: 'recipe-pickaxe-t1',
        resultItemId: 'pickaxe-t1',
        resultCount: 1,
        building: 'workshop',
        requiredBookRecipe: 'pickaxe-t1',
        creditCost: 0,
        ingredients: [
            { itemId: 'wood', count: 8 },
            { itemId: 'stone', count: 5 },
        ],
    };

    const ironSwordRecipe: RecipeDefinition = {
        id: 'recipe-iron-sword',
        resultItemId: 'iron-sword',
        resultCount: 1,
        building: 'forge',
        requiredBookRecipe: 'iron-sword',
        creditCost: 10,
        ingredients: [
            { itemId: 'iron-ore', count: 10 },
            { itemId: 'wood', count: 5 },
        ],
    };

    it('rejects craft if recipe is locked by textbook', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 10);
        backpack.addItem('stone', 10);
        const wallet = new Wallet(0);
        const unlockedRecipes = new Set<string>(); // Empty

        const result = craftRecipeUseCase(pickaxeRecipe, backpack, wallet, unlockedRecipes);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('recipe_locked');
    });

    it('rejects craft if credit is insufficient', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('iron-ore', 10);
        backpack.addItem('wood', 5);
        const wallet = new Wallet(5); // Needs 10
        const unlockedRecipes = new Set(['iron-sword']);

        const result = craftRecipeUseCase(ironSwordRecipe, backpack, wallet, unlockedRecipes);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_credit');
    });

    it('crafts item successfully, consumes ingredients & credit, and grants result item', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('iron-ore', 10);
        backpack.addItem('wood', 5);
        const wallet = new Wallet(20);
        const unlockedRecipes = new Set(['iron-sword']);

        const result = craftRecipeUseCase(ironSwordRecipe, backpack, wallet, unlockedRecipes);
        expect(result.success).toBe(true);
        expect(result.resultItemId).toBe('iron-sword');
        expect(wallet.balance).toBe(10); // 20 - 10
        expect(backpack.getItemCount('iron-ore')).toBe(0);
        expect(backpack.getItemCount('wood')).toBe(0);
        expect(backpack.getItemCount('iron-sword')).toBe(1);
    });
});

