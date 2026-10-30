import { describe, expect, it } from 'vitest';
import books from '../../public/data/books.json';
import enemies from '../../public/data/enemies.json';
import items from '../../public/data/items.json';
import questions from '../../public/data/questions.json';
import recipes from '../../public/data/recipes.json';
import nodes from '../../public/data/nodes.json';
import realms from '../../public/data/realms.json';
import stages from '../../public/data/stages.json';
import tutorial from '../../public/data/tutorial.json';
import repairs from '../../public/data/repairs.json';
import garden from '../../public/data/garden.json';
import skills from '../../public/data/skills.json';

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
    targetToolId?: string;
    targetLevel?: number;
    strikeWeight?: number;
    creditCost?: number;
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

    it('gives every active skill a Realm whose Textbook can teach it', () =>
    {
        const bookIds = new Set(books.map(b => b.id));
        for (const skill of skills.active)
        {
            const realm = realms.realms.find(r => r.number === skill.realm);
            expect(realm, `${skill.id} realm ${skill.realm}`).toBeDefined();
            expect(realm?.bookId, `${skill.id}: Realm ${skill.realm} has no Textbook yet`).not.toBeNull();
            expect(bookIds.has(realm?.bookId as string), `${skill.id} book`).toBe(true);
        }
    });

    it('gives each upgradable tool steps +1 to +3 that cost Materials only and speed it up more each time', () =>
    {
        const steps = (recipes as LooseRecipe[]).filter(r => r.targetToolId);
        const toolIds = [...new Set(steps.map(r => r.targetToolId as string))];
        expect(toolIds.length).toBeGreaterThan(0);
        for (const toolId of toolIds)
        {
            const item = items.find(i => i.id === toolId) as { category?: string; durability?: number } | undefined;
            expect(item, `${toolId} is an item`).toBeDefined();
            expect(item?.durability, `${toolId} is a tool that wears`).toBeGreaterThan(0);
            const mine = steps.filter(r => r.targetToolId === toolId).sort((x, y) => (x.targetLevel as number) - (y.targetLevel as number));
            expect(mine.map(r => r.targetLevel), toolId).toEqual([1, 2, 3]);
            for (let i = 0; i < mine.length; i++)
            {
                expect(mine[i].creditCost, `${mine[i].id} costs no Credit`).toBe(0);
                expect(mine[i].strikeWeight as number, `${mine[i].id} weight`).toBeGreaterThan(i === 0 ? 1 : mine[i - 1].strikeWeight as number);
            }
        }
    });

    it('costs every skill upgrade in known items and gives a Boss Stage to each movement unlock', () =>
    {
        const itemIds = new Set(items.map(i => i.id));
        for (const skill of skills.active)
        {
            expect(skill.upgrades.length, `${skill.id} upgrades`).toBe(2);
            for (const upgrade of skill.upgrades)
            {
                for (const ing of upgrade.ingredients) expect(itemIds.has(ing.itemId), `${skill.id} upgrade ingredient ${ing.itemId}`).toBe(true);
            }
        }
        for (const unlock of skills.movement.unlocks) expect(unlock.afterBossStage % 10, unlock.ability).toBe(0);
    });

    it('gives a build time only as a positive number of seconds', () =>
    {
        for (const recipe of recipes as (LooseRecipe & { craftSeconds?: number })[])
        {
            if (recipe.craftSeconds !== undefined) expect(recipe.craftSeconds, recipe.id).toBeGreaterThan(0);
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

    it('only asks the player to harvest nodes that exist and that Stage 1 has', () =>
    {
        const nodeIds = new Set(nodes.nodes.map(n => n.id));
        const stage1 = (stages.stages[0] as { zones: { contents: { kind: string; node?: string }[] }[] }).zones
            .flatMap(z => z.contents)
            .filter(c => c.kind === 'node')
            .map(c => c.node);

        for (const step of tutorial.steps.filter(s => s.event.startsWith('harvested:')))
        {
            const node = step.event.split(':')[1];
            expect(nodeIds.has(node), `${step.id} -> ${node}`).toBe(true);
            expect(stage1, `Stage 1 has a ${node} for step ${step.id}`).toContain(node);
        }
    });

    it('lets only items that wear be repaired, with known Materials, and repairs every item that wears', () =>
    {
        const durable = (items as { id: string; durability?: number; maxStack: number }[]).filter(i => i.durability !== undefined);

        for (const item of durable) expect(item.maxStack, `${item.id} stacks`).toBe(1);
        for (const repair of repairs.repairs)
        {
            expect(durable.some(i => i.id === repair.itemId), `${repair.itemId} wears`).toBe(true);
            for (const ing of repair.ingredients) expect(itemIds.has(ing.itemId), `${repair.itemId} needs ${ing.itemId}`).toBe(true);
        }
        for (const item of durable) expect(repairs.repairs.some(r => r.itemId === item.id), `${item.id} can be repaired`).toBe(true);
    });

    it('has armor for every place, every armor piece and effect potion craftable, and armor taught by a book', () =>
    {
        type Armorish = { id: string; category: string; slot?: string; effect?: string };
        const all = items as Armorish[];
        const armorPieces = all.filter(i => i.category === 'armor');

        expect(new Set(armorPieces.map(i => i.slot))).toEqual(new Set(['head', 'body', 'feet']));

        const craftable = new Map((recipes as LooseRecipe[]).map(r => [r.resultItemId, r] as const));
        const unlockable = new Set(books.flatMap(b => b.unlockedRecipes));
        for (const piece of armorPieces)
        {
            expect(craftable.get(piece.id)?.requiredBookRecipe, `${piece.id} is taught by a book`).toBe(piece.id);
            expect(unlockable.has(piece.id), `${piece.id} is unlocked by a book`).toBe(true);
        }
        for (const potion of all.filter(i => i.effect !== undefined))
        {
            expect(craftable.has(potion.id), `${potion.id} has a recipe`).toBe(true);
        }
    });

    it('has a story shard and block for every Realm, a block recipe for each Realm with a Textbook, and shards from its bosses', () =>
    {
        type Story = { id: string; category: string; story?: boolean; iconImage?: string };
        const all = items as Story[];
        const miniboss = enemies.find(e => e.kind === 'miniboss')!;
        const boss = enemies.find(e => e.kind === 'boss')!;
        const dropOf = (e: { drops: { itemId: string; count: number }[] }, id: string) => e.drops.find(d => d.itemId === id)?.count;

        for (const realm of realms.realms)
        {
            for (const id of [realm.shardItem, realm.blockItem])
            {
                const item = all.find(i => i.id === id);
                expect(item, `${id} exists`).toBeDefined();
                expect(item!.category, `${id} is a Material`).toBe('material');
                expect(item!.story, `${id} is never lost`).toBe(true);
                expect(item!.iconImage, `${id} has an icon`).toBeDefined();
            }

            // A Realm with a Textbook can teach its block, which takes 5 of its shards
            if (realm.bookId)
            {
                const recipe = (recipes as LooseRecipe[]).find(r => r.resultItemId === realm.blockItem);
                expect(recipe, `${realm.blockItem} can be crafted`).toBeDefined();
                expect(recipe!.ingredients.find(i => i.itemId === realm.shardItem)?.count, `${realm.blockItem} takes 5 shards`).toBe(5);
                expect(books.find(b => b.id === realm.bookId)!.unlockedRecipes, `${realm.bookId} teaches ${realm.blockItem}`).toContain(realm.blockItem);
            }
        }

        // The Realm 1 Mini-boss gives 1 shard and its Boss 3
        expect(dropOf(miniboss, 'portal-shard-green')).toBe(1);
        expect(dropOf(boss, 'portal-shard-green')).toBe(3);
    });

    it('gives Seeds that are ordinary Materials, and only to nodes that exist, with a texture to show them', () =>
    {
        type Item = { id: string; category: string; story?: boolean };
        const all = items as Item[];

        for (const node of nodes.nodes as { id: string; texture: string; seed?: { itemId: string; chance: number }; regrow?: unknown }[])
        {
            if (node.seed)
            {
                const seed = all.find(i => i.id === node.seed!.itemId);
                expect(seed, `${node.id} drops ${node.seed.itemId}`).toBeDefined();
                // A Seed is lost 50% on death like any Material, unlike story Materials
                expect(seed!.category, `${node.seed.itemId} is a Material`).toBe('material');
                expect(seed!.story, `${node.seed.itemId} is not a story Material`).not.toBe(true);
            }
        }
    });

    it('gives every Seed a plant that yields known Materials, and prices Garden expansions in known Materials', () =>
    {
        type Planted = { id: string; category: string; plant?: { minutes: number; harvest: { itemId: string }[] } };
        const seeds = (items as Planted[]).filter(i => i.plant);

        // Every Seed a plant can drop is a Seed that can be planted
        for (const node of nodes.nodes as { id: string; seed?: { itemId: string } }[])
        {
            if (node.seed) expect(seeds.some(s => s.id === node.seed!.itemId), `${node.seed.itemId} can be planted`).toBe(true);
        }
        for (const seed of seeds)
        {
            for (const drop of seed.plant!.harvest) expect(itemIds.has(drop.itemId), `${seed.id} gives ${drop.itemId}`).toBe(true);
        }
        for (const cost of garden.expansions) for (const ing of cost) expect(itemIds.has(ing.itemId), `a Plot costs ${ing.itemId}`).toBe(true);
    });

    describe('lessons', () =>
    {
        type LessonPage = { pageNumber: number; lesson?: string };
        type LessonBook = { id: string; chapter: number; pages: LessonPage[] };
        type LessonQuestion = { id: string; bookId: string; pageNumber: number; lesson?: string };
        const lessonBooks = books as unknown as LessonBook[];
        const lessonQuestions = questions as unknown as LessonQuestion[];
        const stageOf = (lesson: string) => Number(lesson.split('-')[0]);

        it('numbers every textbook page <stage>-<order>, once, inside the Realm of its book', () =>
        {
            for (const book of lessonBooks)
            {
                const seen = new Set<string>();
                for (const page of book.pages)
                {
                    const where = `${book.id} page ${page.pageNumber}`;
                    expect(page.lesson, where).toMatch(/^\d{1,3}-\d{1,2}$/);
                    expect(seen.has(page.lesson!), `${where} repeats ${page.lesson}`).toBe(false);
                    seen.add(page.lesson!);
                    expect(Math.ceil(stageOf(page.lesson!) / 10), `${where} lesson ${page.lesson}`).toBe(book.chapter);
                }
            }
        });

        it('gives every question the lesson of its page', () =>
        {
            for (const q of lessonQuestions)
            {
                const page = lessonBooks.find(b => b.id === q.bookId)?.pages.find(p => p.pageNumber === q.pageNumber);
                expect(q.lesson, `${q.id} lesson`).toBe(page?.lesson);
            }
        });

        it('has at least two questions for every lesson, so a repeat visit can ask another', () =>
        {
            for (const book of lessonBooks)
            {
                for (const page of book.pages)
                {
                    const count = lessonQuestions.filter(q => q.lesson === page.lesson).length;
                    expect(count, `lesson ${page.lesson}`).toBeGreaterThanOrEqual(2);
                }
            }
        });

        it('lets every built Stage ask only about lessons that exist in its Realm textbook', () =>
        {
            type S = { number: number; realm: number; status: string; lessons?: string[] };
            const bookOfRealm = new Map(realms.realms.map(r => [r.number, r.bookId]));
            for (const stage of (stages.stages as S[]).filter(x => x.status === 'ready'))
            {
                const book = lessonBooks.find(b => b.id === bookOfRealm.get(stage.realm));
                expect(book, `stage ${stage.number} has a textbook`).toBeDefined();
                expect(stage.lessons?.length ?? 0, `stage ${stage.number} lessons`).toBeGreaterThan(0);
                for (const lesson of stage.lessons ?? [])
                {
                    expect(stageOf(lesson), `stage ${stage.number} ${lesson}`).toBe(stage.number);
                    expect(book!.pages.some(p => p.lesson === lesson), `stage ${stage.number} lesson ${lesson} is in ${book!.id}`).toBe(true);
                }
            }
        });
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
            /** A `spawn-pool` lists the kinds it scatters. */
            nodes?: string[];
            enemies?: string[];
            overrides?: { drops?: { itemId: string }[] };
        };
        type StageEntry = { number: number; realm: number; status: string; layout?: string | { generate: unknown }; zones?: { contents: Content[] }[] };

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
                    if (content.kind === 'spawn-pool')
                    {
                        for (const id of content.nodes ?? []) expect(nodeIds.has(id), `${where} node ${id}`).toBe(true);
                        for (const id of content.enemies ?? []) expect(['normal', 'elite'], `${where} enemy ${id}`).toContain(enemyKinds.get(id));
                    }
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
            // A generated Stage has no file: its content is placed by the generator, checked in LevelReachability.test.ts
            for (const stage of readyStages.filter(s => typeof s.layout === 'string'))
            {
                const width = worldWidthOf(stage.layout as string);
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

        it('plays Realm 2 in full: Stages 11 to 20 are built, each with a lesson and questions from the Realm 2 Textbook', () =>
        {
            const realm2 = realms.realms.find(r => r.number === 2)!;
            const book = books.find(b => b.id === realm2.bookId)!;
            const lessons = new Set(book.pages.map(p => (p as { lesson?: string }).lesson));

            for (let number = 11; number <= 20; number++)
            {
                const stage = stages.stages.find(s => s.number === number) as { status: string; lessons?: string[] };
                expect(stage.status, `stage ${number}`).toBe('ready');
                expect(stage.lessons, `stage ${number} lessons`).toEqual([`${number}-1`]);
                expect(lessons.has(`${number}-1`), `book has lesson ${number}-1`).toBe(true);
                expect(questions.filter(q => (q as { lesson?: string }).lesson === `${number}-1`).length, `questions for ${number}-1`).toBeGreaterThanOrEqual(3);
            }
            expect(stages.stages.find(s => s.number === 21)!.status).toBe('placeholder');
        });

        it('gives Realm 2 its Mini-boss (1 blue shard), its Boss (3 blue shards, finisher from its own Textbook) and Realm 2 gear', () =>
        {
            const realm2 = realms.realms.find(r => r.number === 2)!;
            const dropOf = (id: string, itemId: string) => enemies.find(e => e.id === id)!.drops.find(d => d.itemId === itemId)?.count;

            expect(dropOf('crystal-warden', realm2.shardItem)).toBe(1);
            expect(dropOf('stage-ch2-boss', realm2.shardItem)).toBe(3);
            expect((enemies.find(e => e.id === 'stage-ch2-boss') as { quizFinisher?: { bookId: string } }).quizFinisher?.bookId).toBe(realm2.bookId);

            const taught = new Set(books.find(b => b.id === realm2.bookId)!.unlockedRecipes);
            for (const id of ['axe-t2', 'pickaxe-t2', 'hammer-t2', 'blue-sword', 'blue-helmet', 'blue-chestplate', 'blue-boots'])
            {
                expect(taught.has(id), `${realm2.bookId} teaches ${id}`).toBe(true);
            }
        });
    });
});
