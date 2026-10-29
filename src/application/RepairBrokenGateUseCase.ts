import { findTool } from '../domain/entities/HeldItem';
import { Backpack } from '../domain/entities/Backpack';
import { QuestionData } from '../domain/entities/Quiz';
import { DomainEvents } from '../domain/DomainEvents';

export const BROKEN_GATE_REPAIRED_EVENT = 'broken-gate-repaired';

export interface BrokenGateRepairedPayload
{
    gateId: string;
    questionId: string;
}

/** What the player must carry to repair a gate; comes from the gate in `stages.json`. */
export interface GateRequirements
{
    requiredTool: string;
    requiredItem: string;
}

export const DEFAULT_GATE_REQUIREMENTS: GateRequirements = { requiredTool: 'hammer', requiredItem: 'repair-kit' };

export interface GateRequirementStatus
{
    hasTool: boolean;
    hasItem: boolean;
}

/** Tool ids start with the tool name (`hammer-t1`), so any tier of the tool counts. */
export function checkGateRequirements (backpack: Backpack, requirements: GateRequirements): GateRequirementStatus
{
    return {
        hasTool: findTool(backpack, requirements.requiredTool) !== null,
        hasItem: backpack.getItemCount(requirements.requiredItem) >= 1,
    };
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
    selectedOption: number,
    requirements: GateRequirements = DEFAULT_GATE_REQUIREMENTS
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

    // 1. Check for the required tool in backpack
    const { hasTool, hasItem } = checkGateRequirements(backpack, requirements);
    if (!hasTool)
    {
        return {
            success: false,
            reason: 'missing_hammer',
            repairKitConsumed: false,
        };
    }

    // 2. Check for the required item in backpack
    if (!hasItem)
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
    backpack.removeItem(requirements.requiredItem, 1);
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

