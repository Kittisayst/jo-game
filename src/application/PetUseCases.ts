import { DomainEvents } from '../domain/DomainEvents';
import { PetManager, PetDefinition, AVAILABLE_PETS } from '../domain/entities/Pet';
import { Wallet } from '../domain/entities/Wallet';

export const PET_BOUGHT_EVENT = 'pet-bought';
export const PET_EQUIPPED_EVENT = 'pet-equipped';
export const PET_DISMISSED_EVENT = 'pet-dismissed';

export interface PetEventPayload
{
    petId: string | null;
    pet?: PetDefinition;
}

export function buyPetUseCase (
    petManager: PetManager,
    petId: string,
    wallet: Wallet
): { success: boolean; reason?: 'not_found' | 'insufficient_funds' | 'already_owned' }
{
    const result = petManager.buy(petId, wallet);
    if (result.success)
    {
        const def = AVAILABLE_PETS.find(p => p.id === petId);
        DomainEvents.emit<PetEventPayload>(PET_BOUGHT_EVENT, { petId, pet: def });
        DomainEvents.emit<PetEventPayload>(PET_EQUIPPED_EVENT, { petId, pet: def });
    }
    return result;
}

export function equipPetUseCase (petManager: PetManager, petId: string): boolean
{
    const success = petManager.equip(petId);
    if (success)
    {
        const def = AVAILABLE_PETS.find(p => p.id === petId);
        DomainEvents.emit<PetEventPayload>(PET_EQUIPPED_EVENT, { petId, pet: def });
    }
    return success;
}

export function dismissPetUseCase (petManager: PetManager): void
{
    petManager.dismiss();
    DomainEvents.emit<PetEventPayload>(PET_DISMISSED_EVENT, { petId: null });
}

