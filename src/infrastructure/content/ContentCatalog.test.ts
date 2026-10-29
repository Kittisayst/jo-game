import { describe, expect, it } from 'vitest';
import assetManifest from '../../../docs/asset-manifest.json';
import books from '../../../public/data/books.json';
import enemies from '../../../public/data/enemies.json';
import items from '../../../public/data/items.json';
import questions from '../../../public/data/questions.json';
import recipes from '../../../public/data/recipes.json';
import stages from '../../../public/data/stages.json';
import { parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { parseBooks, parseEnemies, parseItems, parseQuestions, parseRecipes } from './ContentCatalog';

describe('the shipped game data', () =>
{
    it('passes every validator', () =>
    {
        expect(parseItems(items).length).toBe(items.length);
        expect(parseBooks(books).length).toBe(books.length);
        expect(parseQuestions(questions).length).toBe(questions.length);
        expect(parseRecipes(recipes).length).toBe(recipes.length);
        expect(parseEnemies(enemies).length).toBe(enemies.length);
        expect(parseStageDefinitions(stages).length).toBe(stages.length);
    });

    it('tells crafting recipes from weapon upgrades', () =>
    {
        const parsed = parseRecipes(recipes);

        expect(parsed.some(r => 'resultItemId' in r)).toBe(true);
        expect(parsed.some(r => 'targetWeaponId' in r)).toBe(true);
    });

    it('tracks every item iconImage and book page illustration in docs/asset-manifest.json', () =>
    {
        const trackedPaths = new Set(assetManifest.assets.map(a => a.path));
        const parsedItems = parseItems(items);
        const parsedBooks = parseBooks(books);

        for (const item of parsedItems)
        {
            expect(item.iconImage, `${item.id} iconImage`).toBeDefined();
            expect(trackedPaths.has(item.iconImage!), `${item.id} -> ${item.iconImage}`).toBe(true);
        }

        for (const book of parsedBooks)
        {
            for (const page of book.pages)
            {
                expect(page.illustration, `${book.id} p${page.pageNumber} illustration`).toBeDefined();
                expect(trackedPaths.has(page.illustration!), `${book.id} p${page.pageNumber} -> ${page.illustration}`).toBe(true);
            }
        }
    });
});

describe('validator errors', () =>
{
    it('names the file and the path of the mistake', () =>
    {
        const broken = JSON.parse(JSON.stringify(items));
        broken[3].maxStack = 'many';

        expect(() => parseItems(broken)).toThrow('items.json: items[3].maxStack must be a number');
    });

    it('rejects an unknown item category', () =>
    {
        const broken = JSON.parse(JSON.stringify(items));
        broken[0].category = 'trinket';

        expect(() => parseItems(broken)).toThrow(/items\[0\]\.category must be one of material, consumable, tool, weapon/);
    });

    it('rejects an answer index outside the options', () =>
    {
        const broken = JSON.parse(JSON.stringify(questions));
        broken[1].correctIndex = 9;

        expect(() => parseQuestions(broken)).toThrow(/questions\[1\]\.correctIndex/);
    });

    it('rejects an enemy with the old "type" field instead of "kind"', () =>
    {
        const broken = JSON.parse(JSON.stringify(enemies));
        broken[0].type = broken[0].kind;
        delete broken[0].kind;

        expect(() => parseEnemies(broken)).toThrow(/enemies\[0\]\.kind must be one of/);
    });

    it('rejects a drop chance above 1', () =>
    {
        const broken = JSON.parse(JSON.stringify(enemies));
        broken[0].drops[0].chance = 1.5;

        expect(() => parseEnemies(broken)).toThrow(/enemies\[0\]\.drops\[0\]\.chance must be between 0 and 1/);
    });

    it('rejects a stage without zones', () =>
    {
        const broken = JSON.parse(JSON.stringify(stages));
        delete broken[0].zones;

        expect(() => parseStageDefinitions(broken)).toThrow('stages.json: stages[0].zones must be an array');
    });
});
