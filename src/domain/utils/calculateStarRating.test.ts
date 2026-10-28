import { describe, expect, it } from 'vitest';
import { calculateStarRating } from './calculateStarRating';

describe('calculateStarRating', () =>
{
    it('awards 1 star if coin and speed criteria are not met', () =>
    {
        const result = calculateStarRating({
            coinsCollected: 1,
            targetCoins: 5,
            elapsedSeconds: 75,
            targetSeconds: 60,
            score: 150,
        });

        expect(result.stars).toBe(1);
        expect(result.hasCoinStar).toBe(false);
        expect(result.hasSpeedStar).toBe(false);
        expect(result.titleEn).toBe('Stage Clear!');
    });

    it('awards 2 stars if coin target is met but speed target is missed', () =>
    {
        const result = calculateStarRating({
            coinsCollected: 6,
            targetCoins: 5,
            elapsedSeconds: 90,
            targetSeconds: 60,
            score: 250,
        });

        expect(result.stars).toBe(2);
        expect(result.hasCoinStar).toBe(true);
        expect(result.hasSpeedStar).toBe(false);
        expect(result.titleLao).toContain('⭐⭐');
    });

    it('awards 2 stars if speed target is met but coin target is missed', () =>
    {
        const result = calculateStarRating({
            coinsCollected: 2,
            targetCoins: 5,
            elapsedSeconds: 42,
            targetSeconds: 60,
            score: 250,
        });

        expect(result.stars).toBe(2);
        expect(result.hasCoinStar).toBe(false);
        expect(result.hasSpeedStar).toBe(true);
    });

    it('awards 3 stars if both coin and speed targets are met', () =>
    {
        const result = calculateStarRating({
            coinsCollected: 7,
            targetCoins: 5,
            elapsedSeconds: 38,
            targetSeconds: 60,
            score: 500,
        });

        expect(result.stars).toBe(3);
        expect(result.hasCoinStar).toBe(true);
        expect(result.hasSpeedStar).toBe(true);
        expect(result.titleEn).toContain('Perfect 3-Star Clear!');
    });
});
