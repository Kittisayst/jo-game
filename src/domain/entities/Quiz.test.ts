import { describe, expect, it } from 'vitest';
import { QuestionData, QuizExamSession, SpacedRepetitionSystem } from './Quiz';

const mockQuestions: QuestionData[] = [
    { id: 'q1', bookId: 'b1', pageNumber: 1, question: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Exp 1' },
    { id: 'q2', bookId: 'b1', pageNumber: 1, question: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Exp 2' },
    { id: 'q3', bookId: 'b1', pageNumber: 2, question: 'Q3', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'Exp 3' },
    { id: 'q4', bookId: 'b1', pageNumber: 2, question: 'Q4', options: ['A', 'B', 'C', 'D'], correctIndex: 3, explanation: 'Exp 4' },
    { id: 'q5', bookId: 'b1', pageNumber: 3, question: 'Q5', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Exp 5' },
];

describe('QuizExamSession Entity', () =>
{
    it('manages exam answers and computes score', () =>
    {
        const exam = new QuizExamSession(mockQuestions);
        expect(exam.totalQuestions).toBe(5);
        expect(exam.answeredCount).toBe(0);
        expect(exam.isComplete).toBe(false);

        exam.answerQuestion(0, 0); // Correct
        exam.answerQuestion(1, 1); // Correct
        exam.answerQuestion(2, 2); // Correct
        exam.answerQuestion(3, 0); // Wrong (correct is 3)
        exam.answerQuestion(4, 0); // Correct

        expect(exam.isComplete).toBe(true);
        expect(exam.score).toBe(4);
        expect(exam.passThreshold).toBe(4);
        expect(exam.hasPassed).toBe(true);

        const results = exam.getResults();
        expect(results.length).toBe(5);
        expect(results[0].isCorrect).toBe(true);
        expect(results[3].isCorrect).toBe(false);
    });

    it('marks exam as failed when score < 4', () =>
    {
        const exam = new QuizExamSession(mockQuestions);
        exam.answerQuestion(0, 0); // Correct
        exam.answerQuestion(1, 1); // Correct
        exam.answerQuestion(2, 2); // Correct
        exam.answerQuestion(3, 1); // Wrong
        exam.answerQuestion(4, 2); // Wrong

        expect(exam.score).toBe(3);
        expect(exam.hasPassed).toBe(false);
    });
});

describe('SpacedRepetitionSystem Entity', () =>
{
    it('calculates higher weights for unseen and wrong questions', () =>
    {
        const srs = new SpacedRepetitionSystem();

        // Unseen question has high base weight (25)
        expect(srs.calculateWeight('q1')).toBe(25);

        // Incorrect answers boost weight
        srs.recordAnswer('q1', false);
        expect(srs.calculateWeight('q1')).toBe(10 + 15); // 25

        srs.recordAnswer('q1', false);
        expect(srs.calculateWeight('q1')).toBe(10 + 30); // 40

        // Correct answers decrease weight
        srs.recordAnswer('q2', true);
        srs.recordAnswer('q2', true);
        expect(srs.calculateWeight('q2')).toBe(10 - 8); // 2
    });

    it('selects 3 unique questions from pool', () =>
    {
        const srs = new SpacedRepetitionSystem();
        const selected = srs.selectQuestions(mockQuestions, 3);

        expect(selected.length).toBe(3);
        const ids = selected.map(q => q.id);
        const uniqueIds = Array.from(new Set(ids));
        expect(uniqueIds.length).toBe(3);
    });

    it('manages daily practice limit and date transitions', () =>
    {
        const srs = new SpacedRepetitionSystem({}, '2026-10-27', 3);

        // Yesterday was complete (3/3), today is a new day
        expect(srs.canPracticeToday('2026-10-28')).toBe(true);

        srs.completeDailySession('2026-10-28', 1);
        expect(srs.practiceCountToday).toBe(1);
        expect(srs.canPracticeToday('2026-10-28')).toBe(true);

        srs.completeDailySession('2026-10-28', 2);
        expect(srs.practiceCountToday).toBe(3);
        expect(srs.canPracticeToday('2026-10-28')).toBe(false);
    });

    it('serializes and deserializes snapshot accurately', () =>
    {
        const srs = new SpacedRepetitionSystem({}, '2026-10-28', 2);
        srs.recordAnswer('q1', true);
        srs.recordAnswer('q2', false);

        const snapshot = srs.toSnapshot();
        const restored = SpacedRepetitionSystem.fromSnapshot(snapshot);

        expect(restored.lastPracticeDate).toBe('2026-10-28');
        expect(restored.practiceCountToday).toBe(2);
        expect(restored.getQuestionStats('q1').timesCorrect).toBe(1);
        expect(restored.getQuestionStats('q2').timesIncorrect).toBe(1);
    });
});

