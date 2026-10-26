import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';

export const SKIN_CHANGED_EVENT = 'skin-changed';

export interface SkinChangedPayload
{
    skinId: string;
}

/**
 * Use case executed when the player selects or equips a character skin.
 * Validates unlock criteria, updates active skin, and emits a domain event.
 * See "Application layer" in CONTEXT.md.
 */
export function selectSkinUseCase (
    skinManager: SkinManager,
    skinId: string,
    currentScore: number
): boolean
{
    const success = skinManager.selectSkin(skinId, currentScore);

    if (success)
    {
        DomainEvents.emit<SkinChangedPayload>(SKIN_CHANGED_EVENT, {
            skinId: skinManager.activeSkinId,
        });
    }

    return success;
}
