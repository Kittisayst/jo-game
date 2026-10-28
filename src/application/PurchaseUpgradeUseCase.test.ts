import { describe, expect, it } from 'vitest';
import { UpgradeTree } from '../domain/entities/Upgrade';
import { Wallet } from '../domain/entities/Wallet';
import { purchaseUpgradeUseCase } from './PurchaseUpgradeUseCase';

describe('PurchaseUpgradeUseCase', () =>
{
    it('successfully purchases an upgrade when wallet has enough funds', () =>
    {
        const wallet = new Wallet(300);
        const tree = new UpgradeTree();

        // maxHp level 1 costs 100
        const success = purchaseUpgradeUseCase(wallet, tree, 'maxHp');
        expect(success).toBe(true);
        expect(wallet.balance).toBe(200);
        expect(tree.getLevel('maxHp')).toBe(1);
    });

    it('rejects upgrade when wallet cannot afford', () =>
    {
        const wallet = new Wallet(50);
        const tree = new UpgradeTree();

        const success = purchaseUpgradeUseCase(wallet, tree, 'maxHp');
        expect(success).toBe(false);
        expect(wallet.balance).toBe(50);
        expect(tree.getLevel('maxHp')).toBe(0);
    });

    it('rejects upgrade when already at max level', () =>
    {
        const wallet = new Wallet(1000);
        const tree = new UpgradeTree({ dash: 1 }); // Max level is 1

        const success = purchaseUpgradeUseCase(wallet, tree, 'dash');
        expect(success).toBe(false);
        expect(wallet.balance).toBe(1000);
    });
});
