import { describe, expect, it } from 'vitest';
import { upgradeWeaponTierUseCase, WeaponUpgradeRecipe } from './UpgradeWeaponTierUseCase';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { Backpack } from '../domain/entities/Backpack';
import { Wallet } from '../domain/entities/Wallet';

describe('UpgradeWeaponTierUseCase', () =>
{
    const recipes: WeaponUpgradeRecipe[] = [
        {
            id: 'upgrade-iron-sword-1',
            targetWeaponId: 'iron-sword',
            targetLevel: 1,
            building: 'forge',
            creditCost: 5,
            bonusDamage: 5,
            ingredients: [{ itemId: 'iron-ore', count: 4 }],
        },
    ];

    it('rejects upgrade when player does not have enough materials', () =>
    {
        const equip = new EquipmentState('iron-sword');
        const backpack = new Backpack(); // no iron ore
        const wallet = new Wallet(10);

        const result = upgradeWeaponTierUseCase('iron-sword', recipes, equip, backpack, wallet);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_ingredients');
        expect(equip.getUpgradeLevel('iron-sword')).toBe(0);
    });

    it('upgrades weapon to level 1, deducts ingredients and credit, boosts damage', () =>
    {
        const equip = new EquipmentState('iron-sword');
        const backpack = new Backpack();
        backpack.addItem('iron-ore', 5);
        const wallet = new Wallet(10);

        const result = upgradeWeaponTierUseCase('iron-sword', recipes, equip, backpack, wallet);
        expect(result.success).toBe(true);
        expect(result.newLevel).toBe(1);
        expect(result.newDamage).toBe(27); // 22 + 5
        expect(wallet.balance).toBe(5); // 10 - 5
        expect(backpack.getItemCount('iron-ore')).toBe(1); // 5 - 4
    });
});

