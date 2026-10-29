import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';
import { SkinPort } from '../domain/ports';

export const SKIN_CHANGED_EVENT = 'skin-changed';

export interface SkinChangedPayload
{
    skinId: string;
}

/**
 * Use case executed when the player selects or equips a character skin.
 * Validates the skin, updates the active skin, persists it, and emits a domain event.
 * See "Application layer" in CONTEXT.md.
 */
export function selectSkinUseCase (
    skinManager: SkinManager,
    skinId: string,
    repository?: SkinPort
): boolean
{
    const success = skinManager.selectSkin(skinId);

    if (success)
    {
        repository?.saveActiveSkinId(skinManager.activeSkinId);
        DomainEvents.emit<SkinChangedPayload>(SKIN_CHANGED_EVENT, {
            skinId: skinManager.activeSkinId,
        });
    }

    return success;
}
