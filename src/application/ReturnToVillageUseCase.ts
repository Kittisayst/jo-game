import { Backpack, DurabilityChange } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';
import { deathWearUseCase } from './WearItemUseCase';
import { deathWearWornArmorUseCase, WornArmorContext } from './ArmorUseCases';

export const RETURNED_TO_VILLAGE_EVENT = 'returned-to-village';

export type ReturnReason = 'safe_waypoint' | 'death' | 'emergency_retreat';

export interface ReturnedToVillagePayload
{
    reason: ReturnReason;
    lostMaterials: { itemId: string; count: number }[];
}

export interface ReturnResult
{
    reason: ReturnReason;
    keptAllMaterials: boolean;
    lostMaterials: { itemId: string; count: number }[];
    /** Weapons and tools that lost Durability because the hero died (empty on any other way home). */
    wornItems: DurabilityChange[];
}

export function returnToVillageUseCase (
    reason: ReturnReason,
    backpack: Backpack,
    healToFullCallback?: () => void,
    armor?: WornArmorContext
): ReturnResult
{
    let lostMaterials: { itemId: string; count: number }[] = [];
    let wornItems: DurabilityChange[] = [];

    if (reason === 'safe_waypoint')
    {
        // Safe Waypoint: 100% kept
        lostMaterials = [];
    }
    else
    {
        // Death or Emergency Retreat: 50% carried materials lost
        const penalty = backpack.applyRetreatPenalty();
        lostMaterials = penalty.lost;
        if (reason === 'death')
        {
            wornItems = deathWearUseCase(backpack);
            if (armor) deathWearWornArmorUseCase(armor);
        }
    }

    if (healToFullCallback)
    {
        healToFullCallback();
    }

    DomainEvents.emit<ReturnedToVillagePayload>(RETURNED_TO_VILLAGE_EVENT, {
        reason,
        lostMaterials,
    });

    return {
        reason,
        keptAllMaterials: reason === 'safe_waypoint',
        lostMaterials,
        wornItems,
    };
}

