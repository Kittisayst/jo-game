import { UpgradeTree, UpgradeType } from '../domain/entities/Upgrade';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const UPGRADE_PURCHASED_EVENT = 'upgrade-purchased';

export interface UpgradePurchasedPayload
{
    upgradeType: UpgradeType;
    newLevel: number;
    cost: number;
    remainingBalance: number;
}

/**
 * Handles purchasing permanent stat and ability upgrades.
 */
export function purchaseUpgradeUseCase (
    wallet: Wallet,
    upgradeTree: UpgradeTree,
    upgradeType: UpgradeType
): boolean
{
    if (upgradeTree.isMaxLevel(upgradeType))
    {
        return false;
    }

    const cost = upgradeTree.getCost(upgradeType);
    if (cost === null || !wallet.canAfford(cost))
    {
        return false;
    }

    const spent = wallet.spend(cost);
    if (!spent) return false;

    const upgraded = upgradeTree.upgrade(upgradeType);
    if (!upgraded)
    {
        wallet.earn(cost);
        return false;
    }

    DomainEvents.emit<UpgradePurchasedPayload>(UPGRADE_PURCHASED_EVENT, {
        upgradeType,
        newLevel: upgradeTree.getLevel(upgradeType),
        cost,
        remainingBalance: wallet.balance,
    });

    return true;
}
