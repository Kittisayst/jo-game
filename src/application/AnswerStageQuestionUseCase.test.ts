import { describe, expect, it } from 'vitest';
import { QuestionData } from '../domain/entities/Quiz';
import { StageProgression } from '../domain/entities/StageProgression';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';
import { answerStageQuestionUseCase, pickStageQuestion, STAGE_QUESTION_ANSWERED_EVENT } from './AnswerStageQuestionUseCase';

const question = (id: string, lesson: string | undefined, correctIndex = 1): QuestionData => ({
    id, bookId: 'book-ch1', pageNumber: 1, lesson, question: 'Q?', options: ['a', 'b', 'c'], correctIndex, explanation: 'because',
});

describe('pickStageQuestion', () =>
{
    const questions = [question('a', '3-1'), question('b', '3-1'), question('c', '4-1'), question('d', undefined)];

    it('only picks a question about the Stage lessons', () =>
    {
        for (let i = 0; i < 20; i++)
        {
            expect(['a', 'b']).toContain(pickStageQuestion(['3-1'], questions, () => i / 20)!.id);
        }
    });

    it('picks by the random number, so every question can come up', () =>
    {
        expect(pickStageQuestion(['3-1'], questions, () => 0)!.id).toBe('a');
        expect(pickStageQuestion(['3-1'], questions, () => 0.99)!.id).toBe('b');
        expect(pickStageQuestion(['3-1'], questions, () => 1)!.id).toBe('b');
    });

    it('draws from every lesson of the Stage', () =>
    {
        expect(pickStageQuestion(['3-1', '4-1'], questions, () => 0.99)!.id).toBe('c');
    });

    it('returns null when the Stage has no lesson with a question', () =>
    {
        expect(pickStageQuestion([], questions)).toBeNull();
        expect(pickStageQuestion(['9-1'], questions)).toBeNull();
    });
});

describe('answerStageQuestionUseCase', () =>
{
    const setup = () => ({ progression: new StageProgression(), wallet: new Wallet(0) });

    it('pays Credit for a correct answer', () =>
    {
        const { progression, wallet } = setup();
        const result = answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 1, 5);

        expect(result).toMatchObject({ correct: true, creditReward: 5, correctIndex: 1, explanation: 'because' });
        expect(wallet.balance).toBe(5);
    });

    it('pays nothing for a wrong answer, and a later correct one still pays', () =>
    {
        const { progression, wallet } = setup();
        const wrong = answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 0, 5);
        expect(wrong).toMatchObject({ correct: false, creditReward: 0 });
        expect(wallet.balance).toBe(0);

        const right = answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 1, 5);
        expect(right.creditReward).toBe(5);
        expect(wallet.balance).toBe(5);
    });

    it('pays only once per Stage, but again for another Stage', () =>
    {
        const { progression, wallet } = setup();
        answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 1, 5);
        const repeat = answerStageQuestionUseCase(progression, wallet, 'stage-003', question('b', '3-1'), 1, 5);
        expect(repeat).toMatchObject({ correct: true, creditReward: 0 });
        expect(wallet.balance).toBe(5);

        answerStageQuestionUseCase(progression, wallet, 'stage-004', question('c', '4-1'), 1, 5);
        expect(wallet.balance).toBe(10);
    });

    it('remembers the reward in the progression so a saved game keeps it', () =>
    {
        const { progression, wallet } = setup();
        answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 1, 5);

        expect(progression.isStageQuestionRewarded('stage-003')).toBe(true);
        expect(progression.questionRewardedStages).toEqual(['stage-003']);
    });

    it('announces the answer', () =>
    {
        const { progression, wallet } = setup();
        const heard: unknown[] = [];
        const listener = (payload: unknown) => heard.push(payload);
        DomainEvents.on(STAGE_QUESTION_ANSWERED_EVENT, listener);
        answerStageQuestionUseCase(progression, wallet, 'stage-003', question('a', '3-1'), 1, 5);
        DomainEvents.off(STAGE_QUESTION_ANSWERED_EVENT, listener);

        expect(heard).toEqual([{ stageId: 'stage-003', questionId: 'a', correct: true, creditReward: 5, newBalance: 5 }]);
    });
});
