import { describe, expect, it } from 'vitest';
import { WeaponLoadout } from '../domain/entities/Weapon';
import { Wallet } from '../domain/entities/Wallet';
import { purchaseWeaponUseCase } from './PurchaseWeaponUseCase';

describe('PurchaseWeaponUseCase', () =>
{
    it('successfully purchases and equips a new weapon', () =>
    {
        const wallet = new Wallet(200);
        const loadout = new WeaponLoadout();

        // plasma-blaster costs 150
        const success = purchaseWeaponUseCase(wallet, loadout, 'plasma-blaster');
        expect(success).toBe(true);
        expect(wallet.balance).toBe(50);
        expect(loadout.hasWeapon('plasma-blaster')).toBe(true);
        expect(loadout.equippedId).toBe('plasma-blaster');
    });

    it('rejects purchase if already owned', () =>
    {
        const wallet = new Wallet(500);
        const loadout = new WeaponLoadout();

        // cyber-saber is already owned by default
        const success = purchaseWeaponUseCase(wallet, loadout, 'cyber-saber');
        expect(success).toBe(false);
        expect(wallet.balance).toBe(500);
    });

    it('rejects purchase if cannot afford', () =>
    {
        const wallet = new Wallet(50);
        const loadout = new WeaponLoadout();

        const success = purchaseWeaponUseCase(wallet, loadout, 'plasma-blaster');
        expect(success).toBe(false);
        expect(wallet.balance).toBe(50);
        expect(loadout.hasWeapon('plasma-blaster')).toBe(false);
    });
});
