import { describe, expect, it } from 'vitest';
import { SkinManager } from '../domain/entities/Skin';
import { Wallet } from '../domain/entities/Wallet';
import { purchaseSkinUseCase } from './PurchaseSkinUseCase';

describe('purchaseSkinUseCase', () =>
{
    it('spends the skin price in Credit and unlocks the skin', () =>
    {
        const wallet = new Wallet(100);
        const skins = new SkinManager();

        const result = purchaseSkinUseCase(wallet, skins, 'neon-ninja');

        expect(result).toEqual({ success: true });
        expect(wallet.balance).toBe(60);
        expect(skins.isOwned('neon-ninja')).toBe(true);
        expect(skins.activeSkinId).toBe('cyber-blue');
    });

    it('refuses when the player cannot afford it and keeps their Credit', () =>
    {
        const wallet = new Wallet(30);
        const skins = new SkinManager();

        expect(purchaseSkinUseCase(wallet, skins, 'neon-ninja')).toEqual({ success: false, reason: 'insufficient_credit' });
        expect(wallet.balance).toBe(30);
        expect(skins.isOwned('neon-ninja')).toBe(false);
    });

    it('never charges twice for the same skin', () =>
    {
        const wallet = new Wallet(200);
        const skins = new SkinManager();
        purchaseSkinUseCase(wallet, skins, 'neon-ninja');

        expect(purchaseSkinUseCase(wallet, skins, 'neon-ninja')).toEqual({ success: false, reason: 'already_owned' });
        expect(purchaseSkinUseCase(wallet, skins, 'cyber-blue')).toEqual({ success: false, reason: 'already_owned' });
        expect(wallet.balance).toBe(160);
    });

    it('rejects unknown skins', () =>
    {
        const wallet = new Wallet(500);

        expect(purchaseSkinUseCase(wallet, new SkinManager(), 'bogus')).toEqual({ success: false, reason: 'unknown_skin' });
        expect(wallet.balance).toBe(500);
    });

    it('keeps the Credit reserved for the first textbook out of reach', () =>
    {
        const wallet = new Wallet(50);
        const skins = new SkinManager();

        // 50 - 40 = 10, which would leave less than the 20 Credit the first textbook costs
        expect(purchaseSkinUseCase(wallet, skins, 'neon-ninja', 20)).toEqual({ success: false, reason: 'reserved_for_textbook' });
        expect(wallet.balance).toBe(50);

        expect(purchaseSkinUseCase(new Wallet(60), skins, 'neon-ninja', 20)).toEqual({ success: true });
    });
});
