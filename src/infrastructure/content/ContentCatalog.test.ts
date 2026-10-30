import { describe, expect, it } from 'vitest';
import assetManifest from '../../../docs/asset-manifest.json';
import books from '../../../public/data/books.json';
import enemies from '../../../public/data/enemies.json';
import items from '../../../public/data/items.json';
import questions from '../../../public/data/questions.json';
import recipes from '../../../public/data/recipes.json';
import nodes from '../../../public/data/nodes.json';
import realms from '../../../public/data/realms.json';
import stages from '../../../public/data/stages.json';
import { parseStageDefinitions } from '../phaser/stages/StageDefinition';
import { parseStageScaling } from './ScalingCatalog';
import { scaleEnemyDefinition } from '../../domain/entities/StageScaling';
import { parseBooks, parseEnemies, parseItems, parseQuestions, parseRecipes } from './ContentCatalog';
import { parseNodes } from './NodeCatalog';
import { parseRealms } from './RealmCatalog';

describe('the shipped game data', () =>
{
    it('passes every validator', () =>
    {
        expect(parseItems(items).length).toBe(items.length);
        expect(parseBooks(books).length).toBe(books.length);
        expect(parseQuestions(questions).length).toBe(questions.length);
        expect(parseRecipes(recipes).length).toBe(recipes.length);
        expect(parseEnemies(enemies).length).toBe(enemies.length);
        expect(parseRealms(realms).length).toBe(10);
        expect(parseNodes(nodes).length).toBe(nodes.nodes.length);
        expect(parseStageDefinitions(stages, parseNodes(nodes)).length).toBe(100);
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

    describe('Mini-boss attacks', () =>
    {
        const guardianIndex = () => enemies.findIndex(e => e.id === 'cave-guardian');
        const brokenGuardian = (change: (guardian: { attacks: { moves: Record<string, unknown>[] } }) => void) =>
        {
            const broken = JSON.parse(JSON.stringify(enemies));
            change(broken[guardianIndex()]);
            return broken;
        };

        it('reads the charge and the rock throw of the Cave Guardian', () =>
        {
            const guardian = parseEnemies(enemies)[guardianIndex()];

            expect(guardian.attacks?.moves.map(m => m.id)).toEqual(['charge', 'rock-throw']);
            expect(guardian.attacks?.moves[0]).toMatchObject({ telegraphMs: 800, stunMs: 1000 });
            expect(guardian.attacks?.moves[1].projectiles).toBe(3);
        });

        it('rejects attacks on an enemy that is not a miniboss', () =>
        {
            const broken = JSON.parse(JSON.stringify(enemies));
            broken[0].attacks = JSON.parse(JSON.stringify(enemies[guardianIndex()].attacks));

            expect(() => parseEnemies(broken)).toThrow(/enemies\[0\]\.attacks must be only on a miniboss/);
        });

        it('rejects a warning too short for the player to react to', () =>
        {
            const broken = brokenGuardian(g => { g.attacks.moves[0].telegraphMs = 50; });

            expect(() => parseEnemies(broken)).toThrow(/moves\[0\]\.telegraphMs must be at least 100/);
        });

        it('rejects an unknown attack', () =>
        {
            const broken = brokenGuardian(g => { g.attacks.moves[1].id = 'laser'; });

            expect(() => parseEnemies(broken)).toThrow(/moves\[1\]\.id must be one of/);
        });

        it('rejects a charge without a dazed time', () =>
        {
            const broken = brokenGuardian(g => { delete g.attacks.moves[0].stunMs; });

            expect(() => parseEnemies(broken)).toThrow(/moves\[0\]\.stunMs/);
        });

        it('rejects a distance band that ends before it starts', () =>
        {
            const broken = brokenGuardian(g => { g.attacks.moves[1].maxDistance = 100; });

            expect(() => parseEnemies(broken)).toThrow(/moves\[1\]\.maxDistance must be not less than minDistance/);
        });
    });

    it('rejects a drop chance above 1', () =>
    {
        const broken = JSON.parse(JSON.stringify(enemies));
        broken[0].drops[0].chance = 1.5;

        expect(() => parseEnemies(broken)).toThrow(/enemies\[0\]\.drops\[0\]\.chance must be between 0 and 1/);
    });

    describe('stages, nodes and realms', () =>
    {
        const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
        const parsedNodes = parseNodes(nodes);
        const parse = (data: unknown) => parseStageDefinitions(data, parsedNodes);
        type Loose = { stages: { zones: { contents: Record<string, unknown>[] }[] }[] };
        /** Stage 3 of the shipped data is a plain forest stage with nodes, enemies and an exit. */
        const stage3 = (data: Loose) => data.stages[2];

        it('resolves a node placed in a stage from nodes.json', () =>
        {
            const stage = parse(stages)[2];
            const tree = stage.zones[0].resourceNodes.find(n => n.type === 'oak-tree')!;

            expect(tree).toMatchObject({ requiredTool: 'axe', strikes: 3, reach: 44, texture: 'node-tree' });
            expect(tree.drops).toEqual([{ itemId: 'wood', count: 3 }]);
        });

        it('lets a stage override strikes and drops of one node only', () =>
        {
            const data = copy(stages) as unknown as Loose;
            stage3(data).zones[0].contents.push({ kind: 'node', node: 'oak-tree', x: 1450, id: 'rich-oak', overrides: { strikes: 5, drops: [{ itemId: 'wood', count: 9 }] } });

            const parsed = parse(data)[2].zones[0].resourceNodes;
            const rich = parsed.find(n => n.id === 'rich-oak')!;
            expect(rich).toMatchObject({ strikes: 5, drops: [{ itemId: 'wood', count: 9 }] });
            expect(parsed.find(n => n.id !== 'rich-oak' && n.type === 'oak-tree')!.strikes).toBe(3);
        });

        it('marks stages that are not built as placeholders', () =>
        {
            const placeholder = parse(stages)[36];

            expect(placeholder).toMatchObject({ id: 'stage-037', number: 37, realm: 4, status: 'placeholder', layout: null, zones: [] });
        });

        it('rejects a stage without zones', () =>
        {
            const broken = copy(stages);
            delete (broken.stages[0] as { zones?: unknown }).zones;

            expect(() => parse(broken)).toThrow('stages.json: stages[0].zones must be an array');
        });

        it('rejects anything but 100 stages in order', () =>
        {
            const short = copy(stages);
            short.stages.pop();
            expect(() => parse(short)).toThrow(/stages must be exactly 100 entries, got 99/);

            const swapped = copy(stages);
            [swapped.stages[0], swapped.stages[1]] = [swapped.stages[1], swapped.stages[0]];
            expect(() => parse(swapped)).toThrow(/stages\[0\]\.number must be 1/);
        });

        it('rejects a realm that does not match the stage number', () =>
        {
            const broken = copy(stages);
            broken.stages[10].realm = 1;

            expect(() => parse(broken)).toThrow(/stages\[10\]\.realm must be 2 for stage 11/);
        });

        it('rejects a node kind that nodes.json does not have', () =>
        {
            const broken = copy(stages) as unknown as Loose;
            stage3(broken).zones[0].contents.push({ kind: 'node', node: 'moon-tree', x: 100 });

            expect(() => parse(broken)).toThrow(/contents\[\d+\]\.node must be an id from nodes\.json/);
        });

        it('rejects two nodes with the same id', () =>
        {
            const broken = copy(stages) as unknown as Loose;
            stage3(broken).zones[0].contents.push({ kind: 'node', node: 'oak-tree', x: 300 }, { kind: 'node', node: 'oak-tree', x: 300 });

            expect(() => parse(broken)).toThrow(/unique node ids \(oak-tree-300 appears twice/);
        });

        it('rejects an unknown kind of content', () =>
        {
            const broken = copy(stages) as unknown as Loose;
            stage3(broken).zones[0].contents.push({ kind: 'dragon', x: 100 });

            expect(() => parse(broken)).toThrow(/contents\[\d+\]\.kind must be one of node, enemy/);
        });

        it('wants an exit on a stage without a boss, and not both', () =>
        {
            const noExit = copy(stages) as unknown as Loose;
            stage3(noExit).zones[0].contents = stage3(noExit).zones[0].contents.filter(c => c.kind !== 'exit');
            expect(() => parse(noExit)).toThrow(/an exit or a boss/);

            const both = copy(stages) as unknown as Loose;
            both.stages[9].zones[1].contents.push({ kind: 'exit', x: 2000 });
            expect(() => parse(both)).toThrow(/either an exit or a boss/);
        });

        it('allows a miniboss only at stage 5 and a boss only at stage 10 of a realm', () =>
        {
            const earlyMiniboss = copy(stages) as unknown as Loose;
            stage3(earlyMiniboss).zones[0].contents.push({ kind: 'miniboss', enemy: 'cave-guardian', x: 900 });
            expect(() => parse(earlyMiniboss)).toThrow(/without a miniboss/);

            const noMiniboss = copy(stages) as unknown as Loose;
            noMiniboss.stages[4].zones[0].contents = noMiniboss.stages[4].zones[0].contents.filter(c => c.kind !== 'miniboss');
            expect(() => parse(noMiniboss)).toThrow(/exactly one miniboss/);

            const earlyBoss = copy(stages) as unknown as Loose;
            stage3(earlyBoss).zones[0].contents.push({ kind: 'boss', enemy: 'stage-ch1-boss', x: 900, y: 400 });
            expect(() => parse(earlyBoss)).toThrow(/without a boss/);
        });

        describe('generated stages', () =>
        {
            type Loose2 = { stages: { layout: unknown; zones: { contents: Record<string, unknown>[] }[] }[] };

            it('builds the level of a generated stage and puts its exit at the end of it', () =>
            {
                const stage = parse(stages)[2];

                expect(stage.layout).toBeNull();
                expect(stage.generated?.level.scenery).toBe('forest');
                expect(stage.generated?.level.worldWidth).toBe(1600);
                expect(stage.zones[0].exit?.x).toBe(stage.generated!.exitX);
                expect(stage.zones[0].resourceNodes).toHaveLength(6);
                expect(stage.zones[0].enemySpawns).toHaveLength(3);
            });

            it('gives the same stage every time it is read', () =>
            {
                expect(parse(stages)[6]).toEqual(parse(stages)[6]);
            });

            it('leaves a hand-made stage on its level file', () =>
            {
                const stage = parse(stages)[0];

                expect(stage.layout).toBe('assets/levels/stage-001.json');
                expect(stage.generated).toBeUndefined();
            });

            it('rejects a spawn pool in a stage that is not generated', () =>
            {
                const broken = copy(stages) as unknown as Loose2;
                broken.stages[0].zones[0].contents.push({ kind: 'spawn-pool', nodes: ['oak-tree'], count: 1 });

                expect(() => parse(broken)).toThrow(/spawn-pool must be used only in a Stage with a generated layout|contents\[\d+\] must be used only in a Stage with a generated layout/);
            });

            it('rejects an unknown biome and a pool that does not fit', () =>
            {
                const badBiome = copy(stages) as unknown as Loose2;
                badBiome.stages[2].layout = { generate: { biome: 'lava', seed: 3, screens: 2 } };
                expect(() => parse(badBiome)).toThrow(/stages\[2\]\.layout\.generate\.biome must be one of forest, cave/);

                const crowded = copy(stages) as unknown as Loose2;
                const pool = crowded.stages[2].zones[0].contents.find(c => c.kind === 'spawn-pool')!;
                pool.count = 30;
                expect(() => parse(crowded)).toThrow(/a pool that fits the generated Stage/);
            });

            it('rejects a pool that names a node kind nodes.json does not have', () =>
            {
                const broken = copy(stages) as unknown as Loose2;
                broken.stages[2].zones[0].contents.find(c => c.kind === 'spawn-pool')!.nodes = ['moon-tree'];

                expect(() => parse(broken)).toThrow(/\.node must be an id from nodes\.json/);
            });
        });

        describe('scaling', () =>
        {
            it('reads the numbers from stages.json and rejects a negative one', () =>
            {
                expect(parseStageScaling(stages)).toEqual({ enemyHpPerStage: 0.08, enemyDamagePerRealm: 1, dropBonusPerRealm: 0.1 });

                const broken = copy(stages) as unknown as { scaling: Record<string, number> };
                broken.scaling.enemyHpPerStage = -1;
                expect(() => parseStageScaling(broken)).toThrow(/scaling\.enemyHpPerStage must be a number, 0 or more/);
            });

            it('makes the golems of stage 9 tougher than those of stage 6', () =>
            {
                const golem = parseEnemies(enemies).find(e => e.id === 'rock-golem')!;
                const scaling = parseStageScaling(stages);

                expect(scaleEnemyDefinition(golem, 9, scaling).maxHp).toBeGreaterThan(scaleEnemyDefinition(golem, 6, scaling).maxHp);
                expect(scaleEnemyDefinition(golem, 1, scaling).maxHp).toBe(golem.maxHp);
            });
        });

        it('rejects two realms of one colour and a node that needs no Strike', () =>
        {
            const sameColour = copy(realms);
            sameColour.realms[1].color = sameColour.realms[0].color;
            expect(() => parseRealms(sameColour)).toThrow(/ten different colours/);

            const noStrike = copy(nodes);
            noStrike.nodes[0].strikes = 0;
            expect(() => parseNodes(noStrike)).toThrow(/nodes\[0\]\.strikes must be a whole number of Strikes, at least 1/);
        });
    });
});
