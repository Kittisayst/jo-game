import { describe, expect, it } from 'vitest';
import books from '../../public/data/books.json';
import enemies from '../../public/data/enemies.json';
import items from '../../public/data/items.json';
import questions from '../../public/data/questions.json';
import recipes from '../../public/data/recipes.json';
import stages from '../../public/data/stages.json';

/**
 * The game data files point at each other by id. A typo in one file silently breaks a loop
 * (a recipe nobody can craft, a drop that never appears), so every reference is checked here.
 */
const itemIds = new Set(items.map(i => i.id));
const bookIds = new Set(books.map(b => b.id));
const enemyIds = new Set(enemies.map(e => e.id));
const stageIds = new Set(stages.map(s => s.id));

type LooseRecipe = {
    id: string;
    resultItemId?: string;
    targetWeaponId?: string;
    requiredBookRecipe?: string | null;
    ingredients: { itemId: string; count: number }[];
};

describe('content data integrity', () =>
{
    it('has unique ids in every file', () =>
    {
        for (const list of [items, books, enemies, questions, recipes, stages])
        {
            const ids = list.map(entry => entry.id);
            expect(new Set(ids).size).toBe(ids.length);
        }
    });

    it('gives every item a positive stack size and only Materials can be story items', () =>
    {
        for (const item of items)
        {
            expect(item.maxStack, item.id).toBeGreaterThan(0);
            if ((item as { story?: boolean }).story) expect(item.category, item.id).toBe('material');
        }
    });

    it('only uses known items in recipes', () =>
    {
        for (const recipe of recipes as LooseRecipe[])
        {
            if (recipe.resultItemId) expect(itemIds.has(recipe.resultItemId), `${recipe.id} result`).toBe(true);
            if (recipe.targetWeaponId) expect(itemIds.has(recipe.targetWeaponId), `${recipe.id} target`).toBe(true);
            for (const ing of recipe.ingredients)
            {
                expect(itemIds.has(ing.itemId), `${recipe.id} ingredient ${ing.itemId}`).toBe(true);
            }
        }
    });

    it('unlocks recipes that exist and links books to real prerequisites', () =>
    {
        const recipeResults = new Set((recipes as LooseRecipe[]).map(r => r.resultItemId).filter(Boolean));
        for (const book of books)
        {
            for (const unlocked of book.unlockedRecipes)
            {
                expect(recipeResults.has(unlocked), `${book.id} unlocks ${unlocked}`).toBe(true);
            }
            if (book.prerequisiteBookId) expect(bookIds.has(book.prerequisiteBookId), book.id).toBe(true);
            if (book.requiredCompletedStageId) expect(stageIds.has(book.requiredCompletedStageId), book.id).toBe(true);
        }

        const unlockable = new Set(books.flatMap(b => b.unlockedRecipes));
        for (const recipe of recipes as LooseRecipe[])
        {
            if (recipe.requiredBookRecipe)
            {
                expect(unlockable.has(recipe.requiredBookRecipe), `${recipe.id} needs ${recipe.requiredBookRecipe}`).toBe(true);
            }
        }
    });

    it('points every question at a real book page with a valid answer', () =>
    {
        for (const q of questions)
        {
            const book = books.find(b => b.id === q.bookId);
            expect(book, `${q.id} book ${q.bookId}`).toBeDefined();
            expect(book!.pages.some(p => p.pageNumber === q.pageNumber), `${q.id} page ${q.pageNumber}`).toBe(true);
            expect(q.correctIndex, q.id).toBeGreaterThanOrEqual(0);
            expect(q.correctIndex, q.id).toBeLessThan(q.options.length);
        }
    });

    it('only drops known items and uses a valid kind for enemies', () =>
    {
        for (const enemy of enemies)
        {
            expect(['normal', 'elite', 'miniboss', 'boss'], enemy.id).toContain(enemy.kind);
            for (const drop of enemy.drops) expect(itemIds.has(drop.itemId), `${enemy.id} drop ${drop.itemId}`).toBe(true);
        }
    });

    it('builds stages only from known enemies, items and books', () =>
    {
        type Zone = {
            resourceNodes?: { id: string; drops: { itemId: string }[] }[];
            enemySpawns?: { enemyId: string }[];
            bossSpawn?: { enemyId: string };
            gate?: { requiredItem: string; quizBookId: string };
        };

        for (const stage of stages)
        {
            for (const zone of stage.zones as Zone[])
            {
                for (const node of zone.resourceNodes ?? [])
                {
                    for (const drop of node.drops) expect(itemIds.has(drop.itemId), `${node.id} drop ${drop.itemId}`).toBe(true);
                }
                for (const spawn of zone.enemySpawns ?? []) expect(enemyIds.has(spawn.enemyId), spawn.enemyId).toBe(true);
                if (zone.bossSpawn) expect(enemyIds.has(zone.bossSpawn.enemyId), zone.bossSpawn.enemyId).toBe(true);
                if (zone.gate)
                {
                    expect(itemIds.has(zone.gate.requiredItem), zone.gate.requiredItem).toBe(true);
                    expect(bookIds.has(zone.gate.quizBookId), zone.gate.quizBookId).toBe(true);
                }
            }
        }
    });
});
