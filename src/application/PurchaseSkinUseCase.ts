import { AVAILABLE_SKINS, SkinManager } from '../domain/entities/Skin';
import { Wallet } from '../domain/entities/Wallet';

export type PurchaseSkinResult =
    | { success: true }
    | { success: false; reason: 'unknown_skin' | 'already_owned' | 'insufficient_credit' | 'reserved_for_textbook' };

/**
 * Buys a cosmetic skin with Credit. `reservedCredit` is Credit that must stay in the wallet,
 * used so a new player cannot spend the money meant for the first textbook.
 */
export function purchaseSkinUseCase (
    wallet: Wallet,
    skinManager: SkinManager,
    skinId: string,
    reservedCredit = 0
): PurchaseSkinResult
{
    const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
    if (!skin) return { success: false, reason: 'unknown_skin' };
    if (skinManager.isOwned(skinId)) return { success: false, reason: 'already_owned' };
    if (!wallet.canAfford(skin.price)) return { success: false, reason: 'insufficient_credit' };
    if (wallet.balance - skin.price < reservedCredit) return { success: false, reason: 'reserved_for_textbook' };

    wallet.spend(skin.price);
    skinManager.unlock(skinId);
    return { success: true };
}
