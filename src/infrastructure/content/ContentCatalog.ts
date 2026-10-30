/**
 * Loads and checks every game data file once at startup, so the rest of the app can read
 * typed content synchronously instead of fetching JSON on its own. A malformed file fails
 * here with the file and path of the mistake rather than as an undefined deep in a modal.
 */

import type { BookDefinition } from '../../domain/entities/Book';
import type { EnemyDefinition, EnemyKind } from '../../domain/entities/Enemy';
import type { EnemyAttackId, EnemyAttackMove, EnemyAttackPlan } from '../../domain/entities/EnemyAttackPlanner';
import type { ItemCategory, ItemDefinition } from '../../domain/entities/ItemCatalog';
import type { QuestionData } from '../../domain/entities/Quiz';
import type { RecipeDefinition } from '../../application/CraftRecipeUseCase';
import type { WeaponUpgradeRecipe } from '../../application/UpgradeWeaponTierUseCase';
import { parseStageDefinitions, StageDefinition } from '../phaser/stages/StageDefinition';
import { parseStageScaling } from './ScalingCatalog';
import type { StageScaling } from '../../domain/entities/StageScaling';
import { NodeDefinition, parseNodes } from './NodeCatalog';
import { parseRealms, RealmDefinition } from './RealmCatalog';
import { makeValidators } from './validate';
import { HeldArt, parseHeldArt, parsePlayerAnimations, PlayerAnimations } from './HeldItemArt';

export type RecipeEntry = RecipeDefinition | WeaponUpgradeRecipe;

export interface GameContent
{
    items: ItemDefinition[];
    books: BookDefinition[];
    questions: QuestionData[];
    recipes: RecipeEntry[];
    enemies: EnemyDefinition[];
    /** The ten Realms: subject, colour, biome, Textbook. */
    realms: RealmDefinition[];
    /** The kinds of Resource node a Stage can place. */
    nodes: NodeDefinition[];
    /** All 100 Stages in order; the ones not built yet are `placeholder`. */
    stages: StageDefinition[];
    /** How ordinary enemies grow with the Stage number. */
    scaling: StageScaling;
    /** How weapons and tools look in the hero's hand, by item id. */
    heldArt: Record<string, HeldArt>;
    /** The rows of the player skin sheets (animations) and where the hand is in each frame. */
    playerAnimations: PlayerAnimations;
}

const ITEM_CATEGORIES: readonly ItemCategory[] = ['material', 'consumable', 'tool', 'weapon'];
const ENEMY_KINDS: readonly EnemyKind[] = ['normal', 'elite', 'miniboss', 'boss'];
const ENEMY_ATTACK_IDS: readonly EnemyAttackId[] = ['charge', 'rock-throw'];
const BUILDINGS = ['workshop', 'forge'] as const;

function parseIngredients (v: ReturnType<typeof makeValidators>, value: unknown, path: string)
{
    return v.asArray(value, path).map((raw, i) =>
    {
        const ing = v.asObject(raw, `${path}[${i}]`);
        return { itemId: v.asString(ing.itemId, `${path}[${i}].itemId`), count: v.asNumber(ing.count, `${path}[${i}].count`) };
    });
}

export function parseItems (raw: unknown): ItemDefinition[]
{
    const v = makeValidators('items.json');
    return v.asArray(raw, 'root').map((entry, i) =>
    {
        const p = `items[${i}]`;
        const item = v.asObject(entry, p);
        const maxStack = v.asNumber(item.maxStack, `${p}.maxStack`);
        if (maxStack < 1) v.fail(`${p}.maxStack`, 'at least 1');

        return {
            id: v.asString(item.id, `${p}.id`),
            name: v.asText(item.name, `${p}.name`),
            nameEn: v.asText(item.nameEn, `${p}.nameEn`),
            description: v.asText(item.description, `${p}.description`),
            category: v.asOneOf(item.category, ITEM_CATEGORIES, `${p}.category`),
            maxStack,
            icon: v.asText(item.icon, `${p}.icon`),
            iconImage: v.optionalString(item.iconImage, `${p}.iconImage`),
            story: v.optionalBoolean(item.story, `${p}.story`),
            toolType: v.optionalString(item.toolType, `${p}.toolType`),
            tier: v.optionalNumber(item.tier, `${p}.tier`),
            baseDamage: v.optionalNumber(item.baseDamage, `${p}.baseDamage`),
            maxUpgradeLevel: v.optionalNumber(item.maxUpgradeLevel, `${p}.maxUpgradeLevel`),
            healAmount: v.optionalNumber(item.healAmount, `${p}.healAmount`),
        };
    });
}

export function parseBooks (raw: unknown): BookDefinition[]
{
    const v = makeValidators('books.json');
    return v.asArray(raw, 'root').map((entry, i) =>
    {
        const p = `books[${i}]`;
        const book = v.asObject(entry, p);
        const prerequisite = book.prerequisiteBookId;
        const requiredStage = book.requiredCompletedStageId;

        return {
            id: v.asString(book.id, `${p}.id`),
            chapter: v.asNumber(book.chapter, `${p}.chapter`),
            title: v.asText(book.title, `${p}.title`),
            titleEn: v.asText(book.titleEn, `${p}.titleEn`),
            description: v.asText(book.description, `${p}.description`),
            price: v.asNumber(book.price, `${p}.price`),
            prerequisiteBookId: prerequisite == null ? null : v.asString(prerequisite, `${p}.prerequisiteBookId`),
            requiredCompletedStageId: requiredStage == null ? null : v.asString(requiredStage, `${p}.requiredCompletedStageId`),
            unlockedRecipes: v.asArray(book.unlockedRecipes, `${p}.unlockedRecipes`).map((r, j) => v.asString(r, `${p}.unlockedRecipes[${j}]`)),
            pages: v.asArray(book.pages, `${p}.pages`).map((rawPage, j) =>
            {
                const pp = `${p}.pages[${j}]`;
                const page = v.asObject(rawPage, pp);
                return {
                    pageNumber: v.asNumber(page.pageNumber, `${pp}.pageNumber`),
                    title: v.asText(page.title, `${pp}.title`),
                    content: v.asText(page.content, `${pp}.content`),
                    keyPoints: v.asArray(page.keyPoints, `${pp}.keyPoints`).map((k, n) => v.asText(k, `${pp}.keyPoints[${n}]`)),
                    illustration: v.optionalString(page.illustration, `${pp}.illustration`),
                };
            }),
        };
    });
}

export function parseQuestions (raw: unknown): QuestionData[]
{
    const v = makeValidators('questions.json');
    return v.asArray(raw, 'root').map((entry, i) =>
    {
        const p = `questions[${i}]`;
        const q = v.asObject(entry, p);
        const options = v.asArray(q.options, `${p}.options`).map((o, j) => v.asText(o, `${p}.options[${j}]`));
        const correctIndex = v.asNumber(q.correctIndex, `${p}.correctIndex`);
        if (correctIndex < 0 || correctIndex >= options.length) v.fail(`${p}.correctIndex`, `an index into options (0–${options.length - 1})`);

        return {
            id: v.asString(q.id, `${p}.id`),
            bookId: v.asString(q.bookId, `${p}.bookId`),
            pageNumber: v.asNumber(q.pageNumber, `${p}.pageNumber`),
            question: v.asText(q.question, `${p}.question`),
            options,
            correctIndex,
            explanation: v.asText(q.explanation, `${p}.explanation`),
        };
    });
}

export function parseRecipes (raw: unknown): RecipeEntry[]
{
    const v = makeValidators('recipes.json');
    return v.asArray(raw, 'root').map((entry, i) =>
    {
        const p = `recipes[${i}]`;
        const recipe = v.asObject(entry, p);
        const id = v.asString(recipe.id, `${p}.id`);
        const building = v.asOneOf(recipe.building, BUILDINGS, `${p}.building`);
        const creditCost = v.asNumber(recipe.creditCost, `${p}.creditCost`);
        const ingredients = parseIngredients(v, recipe.ingredients, `${p}.ingredients`);

        if (recipe.targetWeaponId !== undefined)
        {
            return {
                id,
                targetWeaponId: v.asString(recipe.targetWeaponId, `${p}.targetWeaponId`),
                targetLevel: v.asNumber(recipe.targetLevel, `${p}.targetLevel`),
                building: v.asOneOf(building, ['forge'] as const, `${p}.building`),
                creditCost,
                bonusDamage: v.asNumber(recipe.bonusDamage, `${p}.bonusDamage`),
                ingredients,
            } satisfies WeaponUpgradeRecipe;
        }

        const required = recipe.requiredBookRecipe;
        return {
            id,
            resultItemId: v.asString(recipe.resultItemId, `${p}.resultItemId`),
            resultCount: v.asNumber(recipe.resultCount, `${p}.resultCount`),
            building,
            requiredBookRecipe: required == null ? null : v.asString(required, `${p}.requiredBookRecipe`),
            creditCost,
            ingredients,
        } satisfies RecipeDefinition;
    });
}

function parseEnemyAttacks (v: ReturnType<typeof makeValidators>, raw: unknown, p: string): EnemyAttackPlan
{
    const attacks = v.asObject(raw, p);
    const engageRange = v.asNumber(attacks.engageRange, `${p}.engageRange`);
    if (engageRange <= 0) v.fail(`${p}.engageRange`, 'more than 0');
    const cooldownMs = v.asNumber(attacks.cooldownMs, `${p}.cooldownMs`);
    if (cooldownMs < 0) v.fail(`${p}.cooldownMs`, 'at least 0');

    const moves = v.asArray(attacks.moves, `${p}.moves`).map((rawMove, j) =>
    {
        const mp = `${p}.moves[${j}]`;
        const move = v.asObject(rawMove, mp);
        const id = v.asOneOf(move.id, ENEMY_ATTACK_IDS, `${mp}.id`);
        const telegraphMs = v.asNumber(move.telegraphMs, `${mp}.telegraphMs`);
        if (telegraphMs < 100) v.fail(`${mp}.telegraphMs`, 'at least 100 so the player can react');
        const minDistance = v.asNumber(move.minDistance, `${mp}.minDistance`);
        const maxDistance = v.asNumber(move.maxDistance, `${mp}.maxDistance`);
        if (minDistance < 0 || maxDistance < minDistance) v.fail(`${mp}.maxDistance`, 'not less than minDistance');
        const speed = v.asNumber(move.speed, `${mp}.speed`);
        if (speed <= 0) v.fail(`${mp}.speed`, 'more than 0');

        const result: EnemyAttackMove = { id, telegraphMs, minDistance, maxDistance, speed };
        if (id === 'charge')
        {
            result.durationMs = v.asNumber(move.durationMs, `${mp}.durationMs`);
            result.stunMs = v.asNumber(move.stunMs, `${mp}.stunMs`);
            if (result.durationMs <= 0) v.fail(`${mp}.durationMs`, 'more than 0');
            if (result.stunMs < 0) v.fail(`${mp}.stunMs`, 'at least 0');
        }
        else
        {
            const projectiles = v.asNumber(move.projectiles, `${mp}.projectiles`);
            if (!Number.isInteger(projectiles) || projectiles < 1) v.fail(`${mp}.projectiles`, 'a whole number, at least 1');
            result.projectiles = projectiles;
        }
        return result;
    });
    if (moves.length === 0) v.fail(`${p}.moves`, 'at least one attack');

    return { engageRange, cooldownMs, moves };
}

export function parseEnemies (raw: unknown): EnemyDefinition[]
{
    const v = makeValidators('enemies.json');
    return v.asArray(raw, 'root').map((entry, i) =>
    {
        const p = `enemies[${i}]`;
        const enemy = v.asObject(entry, p);
        const maxHp = v.asNumber(enemy.maxHp, `${p}.maxHp`);
        if (maxHp < 1) v.fail(`${p}.maxHp`, 'at least 1');
        const kind = v.asOneOf(enemy.kind, ENEMY_KINDS, `${p}.kind`);
        if (enemy.attacks !== undefined && kind !== 'miniboss') v.fail(`${p}.attacks`, 'only on a miniboss');

        return {
            id: v.asString(enemy.id, `${p}.id`),
            kind,
            maxHp,
            damage: v.asNumber(enemy.damage, `${p}.damage`),
            ...(enemy.attacks !== undefined ? { attacks: parseEnemyAttacks(v, enemy.attacks, `${p}.attacks`) } : {}),
            drops: v.asArray(enemy.drops, `${p}.drops`).map((rawDrop, j) =>
            {
                const dp = `${p}.drops[${j}]`;
                const drop = v.asObject(rawDrop, dp);
                const chance = v.asNumber(drop.chance, `${dp}.chance`);
                if (chance < 0 || chance > 1) v.fail(`${dp}.chance`, 'between 0 and 1');
                return { itemId: v.asString(drop.itemId, `${dp}.itemId`), chance, count: v.asNumber(drop.count, `${dp}.count`) };
            }),
        };
    });
}

async function fetchJson (file: string): Promise<unknown>
{
    const response = await fetch(`data/${file}`);
    if (!response.ok) throw new Error(`${file}: could not be loaded (HTTP ${response.status})`);
    return response.json();
}

/** Fetches and validates all game data. Call once before the app starts. */
export async function loadGameContent (): Promise<GameContent>
{
    const [items, books, questions, recipes, enemies, realms, nodes, stages, playerAnimations] = await Promise.all([
        fetchJson('items.json'),
        fetchJson('books.json'),
        fetchJson('questions.json'),
        fetchJson('recipes.json'),
        fetchJson('enemies.json'),
        fetchJson('realms.json'),
        fetchJson('nodes.json'),
        fetchJson('stages.json'),
        fetchJson('player-animations.json'),
    ]);

    const parsedNodes = parseNodes(nodes);

    return {
        items: parseItems(items),
        books: parseBooks(books),
        questions: parseQuestions(questions),
        recipes: parseRecipes(recipes),
        enemies: parseEnemies(enemies),
        realms: parseRealms(realms),
        nodes: parsedNodes,
        stages: parseStageDefinitions(stages, parsedNodes),
        scaling: parseStageScaling(stages),
        heldArt: parseHeldArt(items),
        playerAnimations: parsePlayerAnimations(playerAnimations),
    };
}

let content: GameContent | null = null;

/** Makes loaded content available to the UI and the scenes. */
export function installGameContent (loaded: GameContent): void
{
    content = loaded;
}

/** The loaded game data. Throws if it is read before startup finished loading it. */
export function getGameContent (): GameContent
{
    if (!content) throw new Error('Game content has not been loaded yet (call installGameContent at startup).');
    return content;
}
