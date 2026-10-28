import { describe, expect, it } from 'vitest';
import { Wallet } from '../domain/entities/Wallet';
import { awardChapterClearUseCase, CHAPTER_CLEAR_CREDIT } from './AwardChapterClearUseCase';

describe('AwardChapterClearUseCase', () =>
{
    it('pays Credit the first time a chapter boss is beaten', () =>
    {
        const wallet = new Wallet(10);

        const awarded = awardChapterClearUseCase(wallet, true);

        expect(awarded).toBe(CHAPTER_CLEAR_CREDIT);
        expect(CHAPTER_CLEAR_CREDIT).toBe(60);
        expect(wallet.balance).toBe(70);
    });

    it('pays nothing when the chapter was already cleared before', () =>
    {
        const wallet = new Wallet(10);

        expect(awardChapterClearUseCase(wallet, false)).toBe(0);
        expect(wallet.balance).toBe(10);
    });
});
