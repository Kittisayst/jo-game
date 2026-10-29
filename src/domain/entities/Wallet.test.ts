import { describe, expect, it } from 'vitest';
import { Wallet } from './Wallet';

describe('Wallet entity', () =>
{
    it('initializes with default zero balance or initial balance', () =>
    {
        const w1 = new Wallet();
        expect(w1.balance).toBe(0);

        const w2 = new Wallet(150.9);
        expect(w2.balance).toBe(150);
    });

    it('earns currency correctly and ignores negative amounts', () =>
    {
        const wallet = new Wallet(50);
        wallet.earn(100);
        expect(wallet.balance).toBe(150);

        wallet.earn(-20);
        expect(wallet.balance).toBe(150);
    });

    it('checks if can afford costs', () =>
    {
        const wallet = new Wallet(100);
        expect(wallet.canAfford(50)).toBe(true);
        expect(wallet.canAfford(100)).toBe(true);
        expect(wallet.canAfford(101)).toBe(false);
        expect(wallet.canAfford(0)).toBe(true);
    });

    it('spends currency successfully if enough balance', () =>
    {
        const wallet = new Wallet(100);
        const success = wallet.spend(40);
        expect(success).toBe(true);
        expect(wallet.balance).toBe(60);
    });

    it('rejects spending if insufficient balance', () =>
    {
        const wallet = new Wallet(50);
        const success = wallet.spend(80);
        expect(success).toBe(false);
        expect(wallet.balance).toBe(50);
    });

    it('resets and sets balance properly', () =>
    {
        const wallet = new Wallet(200);
        wallet.setBalance(350);
        expect(wallet.balance).toBe(350);

        wallet.reset();
        expect(wallet.balance).toBe(0);
    });
});
