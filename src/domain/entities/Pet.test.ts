import { describe, it, expect, beforeEach } from 'vitest';
import { PetManager } from './Pet';
import { Wallet } from './Wallet';

describe('PetManager', () =>
{
    let petManager: PetManager;
    let wallet: Wallet;

    beforeEach(() =>
    {
        petManager = new PetManager();
        wallet = new Wallet(100);
    });

    it('initializes with no owned or active pets', () =>
    {
        expect(petManager.ownedPetIds).toEqual([]);
        expect(petManager.activePetId).toBeNull();
        expect(petManager.activePet).toBeUndefined();
    });

    it('fails to buy pet when wallet has insufficient funds', () =>
    {
        const poorWallet = new Wallet(10);
        const result = petManager.buy('pet-lucky', poorWallet);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_funds');
        expect(petManager.isOwned('pet-lucky')).toBe(false);
    });

    it('successfully buys and auto-equips the first pet', () =>
    {
        const result = petManager.buy('pet-lucky', wallet);
        expect(result.success).toBe(true);
        expect(wallet.balance).toBe(20); // 100 - 80
        expect(petManager.isOwned('pet-lucky')).toBe(true);
        expect(petManager.activePetId).toBe('pet-lucky');
        expect(petManager.activePet?.name).toBe('ໝານ້ອຍ Lucky');
    });

    it('prevents buying the same pet twice', () =>
    {
        wallet.earn(200);
        expect(petManager.buy('pet-lucky', wallet).success).toBe(true);
        const repeat = petManager.buy('pet-lucky', wallet);
        expect(repeat.success).toBe(false);
        expect(repeat.reason).toBe('already_owned');
    });

    it('allows equipping and dismissing owned pets', () =>
    {
        wallet.earn(100);
        petManager.buy('pet-lucky', wallet);
        petManager.buy('pet-clucky', wallet);

        expect(petManager.activePetId).toBe('pet-lucky');

        // Switch to clucky
        expect(petManager.equip('pet-clucky')).toBe(true);
        expect(petManager.activePetId).toBe('pet-clucky');

        // Dismiss
        petManager.dismiss();
        expect(petManager.activePetId).toBeNull();
        expect(petManager.activePet).toBeUndefined();

        // Cannot equip unowned pet
        expect(petManager.equip('pet-nonexistent')).toBe(false);
    });

    it('saves and restores snapshot correctly', () =>
    {
        petManager.buy('pet-clucky', wallet);
        const snap = petManager.toSnapshot();

        const newManager = new PetManager();
        newManager.loadFrom(snap);

        expect(newManager.isOwned('pet-clucky')).toBe(true);
        expect(newManager.activePetId).toBe('pet-clucky');
    });
});
