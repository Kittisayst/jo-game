import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Score } from '../domain/entities/Score';
import {
    collectCoinUseCase,
    COIN_COLLECTED_EVENT,
    CoinCollectedPayload,
} from './CollectCoinUseCase';

describe('collectCoinUseCase', () =>
{
    it('adds default points to score and emits the domain event', () =>
    {
        const score = new Score();
        const listener = vi.fn();

        DomainEvents.on<CoinCollectedPayload>(COIN_COLLECTED_EVENT, listener);
        collectCoinUseCase(score);
        DomainEvents.off<CoinCollectedPayload>(COIN_COLLECTED_EVENT, listener);

        expect(score.value).toBe(10);
        expect(listener).toHaveBeenCalledWith({ score: 10, points: 10 });
    });

    it('adds custom points to score and emits with correct payload', () =>
    {
        const score = new Score(20);
        const listener = vi.fn();

        DomainEvents.on<CoinCollectedPayload>(COIN_COLLECTED_EVENT, listener);
        collectCoinUseCase(score, 50);
        DomainEvents.off<CoinCollectedPayload>(COIN_COLLECTED_EVENT, listener);

        expect(score.value).toBe(70);
        expect(listener).toHaveBeenCalledWith({ score: 70, points: 50 });
    });
});
