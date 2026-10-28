export type ObjectiveId =
    | 'buy-book'
    | 'read-book'
    | 'pass-exam'
    | 'craft-pickaxe'
    | 'craft-hammer'
    | 'craft-repair-kit'
    | 'repair-gate'
    | 'defeat-boss'
    | 'chapter-cleared';

export interface ObjectiveState
{
    ownsBook: boolean;
    bookFullyRead: boolean;
    examPassed: boolean;
    hasPickaxe: boolean;
    hasHammer: boolean;
    hasRepairKit: boolean;
    gateRepaired: boolean;
    bossCleared: boolean;
}

/**
 * The one thing a Chapter 1 player should do next. Learning always comes first, then the
 * tools, then the gate and the boss, which is the Village Hub loop from the design doc.
 */
export function getNextObjective (state: ObjectiveState): ObjectiveId
{
    if (!state.ownsBook) return 'buy-book';
    if (!state.bookFullyRead) return 'read-book';
    if (!state.examPassed) return 'pass-exam';

    if (!state.gateRepaired)
    {
        // The pickaxe is only needed to mine the iron for the hammer and the Repair Kit
        if (!state.hasHammer)
        {
            return state.hasPickaxe ? 'craft-hammer' : 'craft-pickaxe';
        }
        if (!state.hasRepairKit) return 'craft-repair-kit';
        return 'repair-gate';
    }

    return state.bossCleared ? 'chapter-cleared' : 'defeat-boss';
}
