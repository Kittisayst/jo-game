import { describe, expect, it } from 'vitest';
import { submitBookExamUseCase } from './SubmitBookExamUseCase';
import { QuizExamSession, QuestionData } from '../domain/entities/Quiz';
import { BookProgress } from '../domain/entities/Book';
import { Wallet } from '../domain/entities/Wallet';

const questions: QuestionData[] = [
    { id: 'q1', bookId: 'book-ch1', pageNumber: 1, question: 'Q1', options: ['A', 'B'], correctIndex: 0, explanation: '' },
    { id: 'q2', bookId: 'book-ch1', pageNumber: 1, question: 'Q2', options: ['A', 'B'], correctIndex: 0, explanation: '' },
    { id: 'q3', bookId: 'book-ch1', pageNumber: 2, question: 'Q3', options: ['A', 'B'], correctIndex: 0, explanation: '' },
    { id: 'q4', bookId: 'book-ch1', pageNumber: 2, question: 'Q4', options: ['A', 'B'], correctIndex: 0, explanation: '' },
    { id: 'q5', bookId: 'book-ch1', pageNumber: 3, question: 'Q5', options: ['A', 'B'], correctIndex: 0, explanation: '' },
];

describe('SubmitBookExamUseCase', () =>
{
    it('fails exam when score is below 4 and awards no credit', () =>
    {
        const exam = new QuizExamSession(questions);
        exam.answerQuestion(0, 0); // Correct
        exam.answerQuestion(1, 0); // Correct
        exam.answerQuestion(2, 0); // Correct
        exam.answerQuestion(3, 1); // Wrong
        exam.answerQuestion(4, 1); // Wrong

        const book = new BookProgress('book-ch1', true);
        const wallet = new Wallet(10);

        const result = submitBookExamUseCase(exam, book, wallet);
        expect(result.passed).toBe(false);
        expect(result.creditReward).toBe(0);
        expect(result.score).toBe(3);
        expect(result.forgeUnlocked).toBe(false);
        expect(wallet.balance).toBe(10);
    });

    it('passes exam with 4/5, grants 50 credit on first pass and unlocks forge', () =>
    {
        const exam = new QuizExamSession(questions);
        exam.answerQuestion(0, 0); // Correct
        exam.answerQuestion(1, 0); // Correct
        exam.answerQuestion(2, 0); // Correct
        exam.answerQuestion(3, 0); // Correct
        exam.answerQuestion(4, 1); // Wrong

        const book = new BookProgress('book-ch1', true);
        const wallet = new Wallet(10);

        const result = submitBookExamUseCase(exam, book, wallet);
        expect(result.passed).toBe(true);
        expect(result.firstTime).toBe(true);
        expect(result.creditReward).toBe(50);
        expect(result.forgeUnlocked).toBe(true);
        expect(wallet.balance).toBe(60); // 10 + 50
    });

    it('grants 5 credit on repeat exam pass', () =>
    {
        const exam = new QuizExamSession(questions);
        for (let i = 0; i < 5; i++) exam.answerQuestion(i, 0); // 5/5

        const book = new BookProgress('book-ch1', true, [], true, 4, 1); // Already passed once
        const wallet = new Wallet(60);

        const result = submitBookExamUseCase(exam, book, wallet);
        expect(result.passed).toBe(true);
        expect(result.firstTime).toBe(false);
        expect(result.creditReward).toBe(5);
        expect(wallet.balance).toBe(65);
    });

    it('rejects exam submission if book has not been purchased', () =>
    {
        const exam = new QuizExamSession(questions);
        for (let i = 0; i < 5; i++) exam.answerQuestion(i, 0);

        const unpurchasedBook = new BookProgress('book-ch1', false);
        const wallet = new Wallet(30);

        const result = submitBookExamUseCase(exam, unpurchasedBook, wallet, 5);
        expect(result.passed).toBe(false);
        expect(result.rejectedReason).toBe('book_not_purchased');
        expect(unpurchasedBook.attempts).toBe(0);
        expect(wallet.balance).toBe(30);
    });

    it('rejects exam submission if book pages have not been fully read', () =>
    {
        const exam = new QuizExamSession(questions);
        for (let i = 0; i < 5; i++) exam.answerQuestion(i, 0);

        const partiallyReadBook = new BookProgress('book-ch1', true, [1, 2]);
        const wallet = new Wallet(30);

        const result = submitBookExamUseCase(exam, partiallyReadBook, wallet, 5);
        expect(result.passed).toBe(false);
        expect(result.rejectedReason).toBe('book_not_fully_read');
        expect(partiallyReadBook.attempts).toBe(0);
        expect(wallet.balance).toBe(30);
    });
});

