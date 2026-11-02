/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { PetManager } from '../domain/entities/Pet';
import { Wallet } from '../domain/entities/Wallet';
import { buyPetUseCase, equipPetUseCase, dismissPetUseCase, PET_BOUGHT_EVENT, PET_EQUIPPED_EVENT } from './PetUseCases';
import { DomainEvents } from '../domain/DomainEvents';

describe('PetUseCases', () =>
{
    let petManager: PetManager;
    let wallet: Wallet;

    beforeEach(() =>
    {
        petManager = new PetManager();
        wallet = new Wallet(200);
    });

    it('buys and auto-equips pet, emitting events', () =>
    {
        let boughtEvent: any = null;
        let equippedEvent: any = null;

        DomainEvents.on(PET_BOUGHT_EVENT, (payload) => { boughtEvent = payload; });
        DomainEvents.on(PET_EQUIPPED_EVENT, (payload) => { equippedEvent = payload; });

        const result = buyPetUseCase(petManager, 'pet-lucky', wallet);
        expect(result.success).toBe(true);
        expect(boughtEvent).not.toBeNull();
        expect(boughtEvent.petId).toBe('pet-lucky');
        expect(equippedEvent.petId).toBe('pet-lucky');
    });

    it('equips and dismisses pet', () =>
    {
        petManager.buy('pet-lucky', wallet);
        petManager.buy('pet-clucky', wallet);

        expect(equipPetUseCase(petManager, 'pet-clucky')).toBe(true);
        expect(petManager.activePetId).toBe('pet-clucky');

        dismissPetUseCase(petManager);
        expect(petManager.activePetId).toBeNull();
    });
});

