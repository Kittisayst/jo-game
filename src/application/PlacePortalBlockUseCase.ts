import { DomainEvents } from '../domain/DomainEvents';
import { Backpack } from '../domain/entities/Backpack';
import { RealmProgression } from '../domain/entities/RealmProgression';
import { StageProgression } from '../domain/entities/StageProgression';
import { firstStageOfRealm, lastStageOfRealm, REALM_COUNT, stageIdOf } from '../domain/entities/StageNumber';

export const REALM_OPENED_EVENT = 'realm-opened';

export interface RealmOpenedPayload
{
    realm: number;
}

/** What the World Gate needs to know about a Realm: which Portal block opens the Realm after it. */
export interface RealmPortal
{
    number: number;
    blockItem: string;
}

export type PlacePortalBlockResult =
    | { success: true; realm: number; unlockedStageId: string | null }
    | { success: false; reason: 'no_such_realm' | 'already_open' | 'previous_realm_closed' | 'no_block' };

/**
 * Places the Portal block of Realm N-1 in the World Gate, which opens Realm N for good. The block is used up.
 * The first Stage of Realm N opens at once when the last Stage of Realm N-1 was already cleared, otherwise
 * clearing it later opens it. Nothing is taken when the Realm cannot be opened.
 */
export function placePortalBlockUseCase (
    realm: number,
    realms: readonly RealmPortal[],
    backpack: Backpack,
    realmProgression: RealmProgression,
    stageProgression: StageProgression
): PlacePortalBlockResult
{
    if (!Number.isInteger(realm) || realm < 2 || realm > REALM_COUNT) return { success: false, reason: 'no_such_realm' };
    if (realmProgression.isRealmOpen(realm)) return { success: false, reason: 'already_open' };
    if (!realmProgression.isRealmOpen(realm - 1)) return { success: false, reason: 'previous_realm_closed' };

    const block = realms.find(r => r.number === realm - 1)?.blockItem;
    if (!block || backpack.getItemCount(block) < 1) return { success: false, reason: 'no_block' };

    backpack.removeItem(block, 1);
    realmProgression.openRealm(realm);

    let unlockedStageId: string | null = null;
    if (stageProgression.isStageCompleted(stageIdOf(lastStageOfRealm(realm - 1))))
    {
        unlockedStageId = stageIdOf(firstStageOfRealm(realm));
        stageProgression.unlockStage(unlockedStageId);
    }

    DomainEvents.emit<RealmOpenedPayload>(REALM_OPENED_EVENT, { realm });
    return { success: true, realm, unlockedStageId };
}
