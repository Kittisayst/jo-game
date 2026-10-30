/**
 * Stage numbers: the game has 100 Stages, numbered 1 to 100, ten to a Realm.
 * A Stage is saved and loaded by its id (`stage-001`), the village by `village`.
 * Pure rules, see "Stage number" and "Realm" in CONTEXT.md.
 */

export const STAGE_COUNT = 100;
export const STAGES_PER_REALM = 10;
export const REALM_COUNT = STAGE_COUNT / STAGES_PER_REALM;
/** The Stage that has a Mini-boss in every Realm. */
export const MINIBOSS_STAGE_IN_REALM = 5;
/** The last Stage of a Realm has its Boss. */
export const BOSS_STAGE_IN_REALM = STAGES_PER_REALM;

const STAGE_ID = /^stage-(\d{3})$/;

export function stageIdOf (stageNumber: number): string
{
    if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > STAGE_COUNT)
    {
        throw new Error(`Stage number must be a whole number from 1 to ${STAGE_COUNT}, got ${stageNumber}`);
    }
    return `stage-${String(stageNumber).padStart(3, '0')}`;
}

/** The Stage number of an id such as `stage-012`, or null for `village` and anything else. */
export function stageNumberOf (stageId: string): number | null
{
    const match = STAGE_ID.exec(stageId);
    if (!match) return null;
    const stageNumber = Number(match[1]);
    return stageNumber >= 1 && stageNumber <= STAGE_COUNT ? stageNumber : null;
}

export function isStageId (stageId: string): boolean
{
    return stageNumberOf(stageId) !== null;
}

/** Realm 1 to 10 that a Stage number belongs to. */
export function realmOf (stageNumber: number): number
{
    return Math.ceil(stageNumber / STAGES_PER_REALM);
}

/** Position inside its Realm, 1 to 10. */
export function positionInRealm (stageNumber: number): number
{
    return ((stageNumber - 1) % STAGES_PER_REALM) + 1;
}

/** Number of the first Stage of a Realm (Realm 2 starts at Stage 11). */
export function firstStageOfRealm (realm: number): number
{
    return (realm - 1) * STAGES_PER_REALM + 1;
}

/** Number of the last Stage of a Realm, the one with its Boss. */
export function lastStageOfRealm (realm: number): number
{
    return realm * STAGES_PER_REALM;
}

/**
 * The Stage that opens when `stageId` is cleared: the next one of its Realm, or, after the Boss Stage, the first
 * Stage of the next Realm when that Realm is already open (its Portal block was placed). Otherwise null.
 */
export function nextStageToUnlock (stageId: string, isRealmOpen: (realm: number) => boolean): string | null
{
    const stageNumber = stageNumberOf(stageId);
    if (stageNumber === null) return null;
    if (positionInRealm(stageNumber) < STAGES_PER_REALM) return stageIdOf(stageNumber + 1);

    const nextRealm = realmOf(stageNumber) + 1;
    return nextRealm <= REALM_COUNT && isRealmOpen(nextRealm) ? stageIdOf(firstStageOfRealm(nextRealm)) : null;
}

/**
 * The Stage that opens when this one is cleared: the next one of the same Realm.
 * The last Stage of a Realm opens nothing by itself, the next Realm needs its Portal block.
 */
export function nextStageIdInRealm (stageId: string): string | null
{
    const stageNumber = stageNumberOf(stageId);
    if (stageNumber === null || positionInRealm(stageNumber) === STAGES_PER_REALM) return null;
    return stageIdOf(stageNumber + 1);
}

/** The Stage a lesson number belongs to (`12-3` is Stage 12), or null when it is not a lesson number. */
export function stageOfLesson (lesson: string): number | null
{
    return isLessonNumber(lesson) ? Number(lesson.split('-')[0]) : null;
}

/** Lesson numbers are `<stage number>-<order>`, such as `12-3`. */
export function isLessonNumber (value: string): boolean
{
    const match = /^(\d{1,3})-(\d{1,2})$/.exec(value);
    if (!match) return false;
    const stageNumber = Number(match[1]);
    return stageNumber >= 1 && stageNumber <= STAGE_COUNT && Number(match[2]) >= 1;
}
