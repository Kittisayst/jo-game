import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const WEAPON_UPGRADED_EVENT = 'weapon-upgraded';

export interface WeaponUpgradeRecipe
{
    id: string;
    targetWeaponId: string;
    targetLevel: number;
    building: 'forge';
    creditCost: number;
    bonusDamage: number;
    ingredients: CraftingIngredient[];
}

export interface WeaponUpgradedPayload
{
    weaponId: string;
    newLevel: number;
    newDamage: number;
    creditCost: number;
    remainingCredit: number;
}

export interface UpgradeWeaponResult
{
    success: boolean;
    reason?: 'cannot_upgrade' | 'no_matching_recipe' | 'insufficient_credit' | 'insufficient_ingredients';
    newLevel?: number;
    newDamage?: number;
}

export function upgradeWeaponTierUseCase (
    weaponId: string,
    recipes: WeaponUpgradeRecipe[],
    equipment: EquipmentState,
    backpack: Backpack,
    wallet: Wallet
): UpgradeWeaponResult
{
    if (!equipment.canUpgradeWeapon(weaponId))
    {
        return {
            success: false,
            reason: 'cannot_upgrade',
        };
    }

    const nextLevel = equipment.getUpgradeLevel(weaponId) + 1;
    const recipe = recipes.find(r => r.targetWeaponId === weaponId && r.targetLevel === nextLevel);

    if (!recipe)
    {
        return {
            success: false,
            reason: 'no_matching_recipe',
        };
    }

    if (recipe.creditCost > 0 && !wallet.canAfford(recipe.creditCost))
    {
        return {
            success: false,
            reason: 'insufficient_credit',
        };
    }

    for (const ing of recipe.ingredients)
    {
        if (backpack.getItemCount(ing.itemId) < ing.count)
        {
            return {
                success: false,
                reason: 'insufficient_ingredients',
            };
        }
    }

    // Deduct
    if (recipe.creditCost > 0)
    {
        wallet.spend(recipe.creditCost);
    }

    for (const ing of recipe.ingredients)
    {
        backpack.removeItem(ing.itemId, ing.count);
    }

    equipment.upgradeWeapon(weaponId);

    const newLevel = equipment.getUpgradeLevel(weaponId);
    const newDamage = equipment.getWeaponDamage(weaponId);

    DomainEvents.emit<WeaponUpgradedPayload>(WEAPON_UPGRADED_EVENT, {
        weaponId,
        newLevel,
        newDamage,
        creditCost: recipe.creditCost,
        remainingCredit: wallet.balance,
    });

    return {
        success: true,
        newLevel,
        newDamage,
    };
}

