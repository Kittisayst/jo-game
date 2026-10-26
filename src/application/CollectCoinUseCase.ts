import { DomainEvents } from '../domain/DomainEvents';
import { Score } from '../domain/entities/Score';

export const COIN_COLLECTED_EVENT = 'coin-collected';

export interface CoinCollectedPayload
{
    score: number;
    points: number;
}

/**
 * Use case executed when the infrastructure detects that the player
 * has collected a coin item. Adds points to the domain Score entity
 * and emits a domain event.
 */
export function collectCoinUseCase (score: Score, points = 10): void
{
    score.add(points);

    DomainEvents.emit<CoinCollectedPayload>(COIN_COLLECTED_EVENT, {
        score: score.value,
        points,
    });
}
