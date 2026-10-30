import { DomainEvents } from '../domain/DomainEvents';
import { QuestionData } from '../domain/entities/Quiz';
import { StageProgression } from '../domain/entities/StageProgression';
import { Wallet } from '../domain/entities/Wallet';

export const STAGE_QUESTION_ANSWERED_EVENT = 'stage-question-answered';

export interface StageQuestionAnsweredPayload
{
    stageId: string;
    questionId: string;
    correct: boolean;
    creditReward: number;
    newBalance: number;
}

export interface StageQuestionResult
{
    correct: boolean;
    /** Credit paid now: only the first correct answer of a Stage pays, a repeat or a wrong answer pays 0. */
    creditReward: number;
    correctIndex: number;
    explanation: string;
}

/**
 * Picks the question asked at the end of a Stage: one of the questions about the Stage's lessons.
 * Returns null when the Stage has no lesson with a question, so it is cleared without asking.
 */
export function pickStageQuestion (
    lessons: readonly string[],
    questions: readonly QuestionData[],
    random: () => number = Math.random
): QuestionData | null
{
    const pool = questions.filter(q => q.lesson !== undefined && lessons.includes(q.lesson));
    if (pool.length === 0) return null;
    return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/**
 * Marks the answer to a Stage's question. A wrong answer still clears the Stage, it only pays no Credit;
 * a correct one pays `credit` the first time for that Stage (Credit comes only from learning, never twice
 * for the same Stage). The caller clears the Stage whatever the answer was.
 */
export function answerStageQuestionUseCase (
    progression: StageProgression,
    wallet: Wallet,
    stageId: string,
    question: QuestionData,
    selectedIndex: number,
    credit: number
): StageQuestionResult
{
    const correct = selectedIndex === question.correctIndex;
    let creditReward = 0;

    if (correct && credit > 0 && progression.markStageQuestionRewarded(stageId))
    {
        wallet.earn(credit);
        creditReward = credit;
    }

    DomainEvents.emit<StageQuestionAnsweredPayload>(STAGE_QUESTION_ANSWERED_EVENT, {
        stageId,
        questionId: question.id,
        correct,
        creditReward,
        newBalance: wallet.balance,
    });

    return { correct, creditReward, correctIndex: question.correctIndex, explanation: question.explanation };
}
