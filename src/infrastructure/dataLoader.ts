import { BookDefinition } from '../domain/entities/Book';
import { QuestionData } from '../domain/entities/Quiz';
import { RecipeDefinition } from '../application/CraftRecipeUseCase';
import { WeaponUpgradeRecipe } from '../application/UpgradeWeaponTierUseCase';

export interface ItemData
{
    id: string;
    name: string;
    nameEn: string;
    description: string;
    category: 'material' | 'consumable' | 'tool' | 'weapon';
    maxStack: number;
    icon: string;
    toolType?: string;
    tier?: number;
    baseDamage?: number;
    maxUpgradeLevel?: number;
    healAmount?: number;
}

let cachedBooks: BookDefinition[] | null = null;
let cachedQuestions: QuestionData[] | null = null;
let cachedItems: ItemData[] | null = null;
let cachedRecipes: (RecipeDefinition | WeaponUpgradeRecipe)[] | null = null;

export async function loadBooksData (): Promise<BookDefinition[]>
{
    if (cachedBooks) return cachedBooks;
    const res = await fetch('data/books.json');
    cachedBooks = (await res.json()) as BookDefinition[];
    return cachedBooks;
}

export async function loadQuestionsData (): Promise<QuestionData[]>
{
    if (cachedQuestions) return cachedQuestions;
    const res = await fetch('data/questions.json');
    cachedQuestions = (await res.json()) as QuestionData[];
    return cachedQuestions;
}

export async function loadItemsData (): Promise<ItemData[]>
{
    if (cachedItems) return cachedItems;
    const res = await fetch('data/items.json');
    cachedItems = (await res.json()) as ItemData[];
    return cachedItems;
}

export async function loadRecipesData (): Promise<(RecipeDefinition | WeaponUpgradeRecipe)[]>
{
    if (cachedRecipes) return cachedRecipes;
    const res = await fetch('data/recipes.json');
    cachedRecipes = (await res.json()) as (RecipeDefinition | WeaponUpgradeRecipe)[];
    return cachedRecipes;
}

export function getItemDataById (id: string, items: ItemData[]): ItemData | undefined
{
    return items.find(i => i.id === id);
}

