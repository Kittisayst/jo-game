import { describe, expect, it } from 'vitest';
import books from '../../public/data/books.json';
import enemies from '../../public/data/enemies.json';
import items from '../../public/data/items.json';
import questions from '../../public/data/questions.json';
import recipes from '../../public/data/recipes.json';
import nodes from '../../public/data/nodes.json';
import realms from '../../public/data/realms.json';
import stages from '../../public/data/stages.json';

/**
 * The game data files point at each other by id. A typo in one file silently breaks a loop
 * (a recipe nobody can craft, a drop that never appears), so every reference is checked here.
 */
const itemIds = new Set(items.map(i => i.id));
const bookIds = new Set(books.map(b => b.id));
const stageIds = new Set(stages.stages.map(s => `stage-${String(s.number).padStart(3, '0')}`));

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
        for (const list of [items, books, enemies, questions, recipes, nodes.nodes])
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

    describe('stages, nodes and realms', () =>
    {
        type Content = {
            kind: string;
            node?: string;
            enemy?: string;
            x?: number;
            requiredItem?: string;
            quizBookId?: string;
            overrides?: { drops?: { itemId: string }[] };
        };
        type StageEntry = { number: number; realm: number; status: string; layout?: string; zones?: { contents: Content[] }[] };

        const levels = import.meta.glob<{ worldWidth: number }>('../../public/assets/levels/stage-*.json', { eager: true, import: 'default' });
        const worldWidthOf = (layout: string) =>
            Object.entries(levels).find(([path]) => layout.endsWith(path.split('/').pop()!))?.[1].worldWidth;
        const allStages = stages.stages as StageEntry[];
        const readyStages = allStages.filter(s => s.status === 'ready');
        const nodeIds = new Set(nodes.nodes.map(n => n.id));
        const enemyKinds = new Map(enemies.map(e => [e.id, e.kind]));

        it('has 100 stages numbered in order, ten to a realm, and a realm for each ten', () =>
        {
            expect(allStages.map(s => s.number)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
            expect(allStages.every(s => s.realm === Math.ceil(s.number / 10))).toBe(true);
            expect(realms.realms.map(r => r.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it('drops only known items from nodes', () =>
        {
            for (const node of nodes.nodes)
            {
                for (const drop of node.drops) expect(itemIds.has(drop.itemId), `${node.id} drop ${drop.itemId}`).toBe(true);
            }
        });

        it('builds stages only from known nodes, enemies of the right kind, items and books', () =>
        {
            for (const stage of readyStages)
            {
                for (const content of stage.zones!.flatMap(z => z.contents))
                {
                    const where = `stage ${stage.number} ${content.kind}`;
                    if (content.kind === 'node') expect(nodeIds.has(content.node!), `${where} ${content.node}`).toBe(true);
                    for (const drop of content.overrides?.drops ?? []) expect(itemIds.has(drop.itemId), `${where} drop ${drop.itemId}`).toBe(true);
                    if (content.kind === 'enemy') expect(['normal', 'elite'], `${where} ${content.enemy}`).toContain(enemyKinds.get(content.enemy!));
                    if (content.kind === 'miniboss') expect(enemyKinds.get(content.enemy!), where).toBe('miniboss');
                    if (content.kind === 'boss') expect(enemyKinds.get(content.enemy!), where).toBe('boss');
                    if (content.kind === 'gate')
                    {
                        expect(itemIds.has(content.requiredItem!), content.requiredItem).toBe(true);
                        expect(bookIds.has(content.quizBookId!), content.quizBookId).toBe(true);
                    }
                }
            }
        });

        it('keeps everything inside the width of its level', () =>
        {
            for (const stage of readyStages)
            {
                const width = worldWidthOf(stage.layout!);
                expect(width, `layout of stage ${stage.number}`).toBeDefined();
                for (const content of stage.zones!.flatMap(z => z.contents))
                {
                    if (content.x !== undefined) expect(content.x, `stage ${stage.number} ${content.kind}`).toBeLessThan(width!);
                }
            }
        });

        it('points realms at known books and stages that unlock books at known stages', () =>
        {
            for (const realm of realms.realms)
            {
                if (realm.bookId) expect(bookIds.has(realm.bookId), `realm ${realm.number}`).toBe(true);
            }
            for (const book of books as { id: string; requiredCompletedStageId?: string | null }[])
            {
                if (book.requiredCompletedStageId) expect(stageIds.has(book.requiredCompletedStageId), book.id).toBe(true);
            }
        });
    });
});
