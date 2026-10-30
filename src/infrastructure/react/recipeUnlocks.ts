import { entities } from '../composition';
import { getGameContent } from '../content/ContentCatalog';

/** The recipe ids the player may craft now: whatever every Textbook whose exam they passed teaches (`unlockedRecipes` in books.json). */
export function unlockedRecipeIds (): Set<string>
{
    const unlocked = new Set<string>();
    for (const book of getGameContent().books)
    {
        if (entities.books[book.id]?.examPassed)
        {
            for (const recipeId of book.unlockedRecipes) unlocked.add(recipeId);
        }
    }
    return unlocked;
}

/** What a recipe is missing: each ingredient the Backpack does not hold enough of, with how many more are needed. */
export function missingIngredients (ingredients: readonly { itemId: string; count: number }[]): { itemId: string; missing: number }[]
{
    return ingredients
        .map(ing => ({ itemId: ing.itemId, missing: ing.count - entities.backpack.getItemCount(ing.itemId) }))
        .filter(ing => ing.missing > 0);
}
