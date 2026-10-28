import { describe, expect, it } from 'vitest';
import { Inventory } from '../domain/entities/Inventory';
import { Wallet } from '../domain/entities/Wallet';
import { purchaseItemUseCase } from './PurchaseItemUseCase';

describe('PurchaseItemUseCase', () =>
{
    it('successfully purchases an item when wallet has enough funds and inventory has space', () =>
    {
        const wallet = new Wallet(100);
        const inventory = new Inventory();

        // heal-potion costs 40
        const success = purchaseItemUseCase(wallet, inventory, 'heal-potion', 2);
        expect(success).toBe(true);
        expect(wallet.balance).toBe(20);
        expect(inventory.getItemCount('heal-potion')).toBe(2);
    });

    it('rejects purchase if wallet cannot afford', () =>
    {
        const wallet = new Wallet(30);
        const inventory = new Inventory();

        const success = purchaseItemUseCase(wallet, inventory, 'heal-potion', 1);
        expect(success).toBe(false);
        expect(wallet.balance).toBe(30);
        expect(inventory.getItemCount('heal-potion')).toBe(0);
    });

    it('rejects purchase if inventory cannot hold more items (max stack)', () =>
    {
        const wallet = new Wallet(500);
        const inventory = new Inventory({ 'heal-potion': 3 }); // Max stack is 3

        const success = purchaseItemUseCase(wallet, inventory, 'heal-potion', 1);
        expect(success).toBe(false);
        expect(wallet.balance).toBe(500);
        expect(inventory.getItemCount('heal-potion')).toBe(3);
    });
});
