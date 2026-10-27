import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';
import { SkinPort } from '../domain/ports';

export const SKIN_CHANGED_EVENT = 'skin-changed';

export interface SkinChangedPayload
{
    skinId: string;
}

/**
 * Score used for skin unlock checks: the better of the current run and the saved high score.
 * Lives here (not in the UI) because it's a game rule.
 */
export function skinUnlockScore (currentScore: number, highScore: number): number
{
    return Math.max(currentScore, highScore);
}

/**
 * Use case executed when the player selects or equips a character skin.
 * Validates unlock criteria, updates active skin, persists it, and emits a domain event.
 * See "Application layer" in CONTEXT.md.
 */
export function selectSkinUseCase (
    skinManager: SkinManager,
    skinId: string,
    currentScore: number,
    highScore = 0,
    repository?: SkinPort
): boolean
{
    const success = skinManager.selectSkin(skinId, skinUnlockScore(currentScore, highScore));

    if (success)
    {
        repository?.saveActiveSkinId(skinManager.activeSkinId);
        DomainEvents.emit<SkinChangedPayload>(SKIN_CHANGED_EVENT, {
            skinId: skinManager.activeSkinId,
        });
    }

    return success;
}
