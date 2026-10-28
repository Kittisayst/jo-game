import { Backpack } from '../domain/entities/Backpack';
import { QuestionData } from '../domain/entities/Quiz';
import { DomainEvents } from '../domain/DomainEvents';

export const BROKEN_GATE_REPAIRED_EVENT = 'broken-gate-repaired';

export interface BrokenGateRepairedPayload
{
    gateId: string;
    questionId: string;
}

export interface RepairGateResult
{
    success: boolean;
    alreadyRepaired?: boolean;
    reason?: 'missing_hammer' | 'missing_repair_kit' | 'quiz_failed';
    repairKitConsumed: boolean;
}

export function repairBrokenGateUseCase (
    gateId: string,
    repairedGates: Set<string>,
    backpack: Backpack,
    question: QuestionData,
    selectedOption: number
): RepairGateResult
{
    if (repairedGates.has(gateId))
    {
        return {
            success: true,
            alreadyRepaired: true,
            repairKitConsumed: false,
        };
    }

    // 1. Check for Hammer in backpack
    const hasHammer = backpack.getAllSlots().some(s => s && s.itemId.startsWith('hammer'));
    if (!hasHammer)
    {
        return {
            success: false,
            reason: 'missing_hammer',
            repairKitConsumed: false,
        };
    }

    // 2. Check for Repair Kit in backpack
    if (backpack.getItemCount('repair-kit') < 1)
    {
        return {
            success: false,
            reason: 'missing_repair_kit',
            repairKitConsumed: false,
        };
    }

    // 3. Verify quiz answer
    const isCorrect = selectedOption === question.correctIndex;
    if (!isCorrect)
    {
        // Important: Repair Kit is NOT consumed on wrong answer
        return {
            success: false,
            reason: 'quiz_failed',
            repairKitConsumed: false,
        };
    }

    // 4. Consume repair kit & repair gate
    backpack.removeItem('repair-kit', 1);
    repairedGates.add(gateId);

    DomainEvents.emit<BrokenGateRepairedPayload>(BROKEN_GATE_REPAIRED_EVENT, {
        gateId,
        questionId: question.id,
    });

    return {
        success: true,
        repairKitConsumed: true,
    };
}

