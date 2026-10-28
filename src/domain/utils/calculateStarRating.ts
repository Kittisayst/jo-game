export interface StarRatingCriteria
{
    coinsCollected: number;
    targetCoins?: number;
    elapsedSeconds: number;
    targetSeconds?: number;
    score: number;
    targetScore?: number;
}

export interface StarRatingResult
{
    stars: 1 | 2 | 3;
    titleLao: string;
    titleEn: string;
    hasCoinStar: boolean;
    hasSpeedStar: boolean;
}

/**
 * Pure domain utility to calculate stage star rating (1 to 3 stars):
 * - Star 1: Awarded for completing the stage (Always earned)
 * - Star 2: Coin Hunter (Collected at least target coins, default 3)
 * - Star 3: Speedrun Master (Cleared under target time, default 60s)
 */
export function calculateStarRating (criteria: StarRatingCriteria): StarRatingResult
{
    const targetCoins = criteria.targetCoins ?? 3;
    const targetSeconds = criteria.targetSeconds ?? 60;

    const hasCoinStar = criteria.coinsCollected >= targetCoins;
    const hasSpeedStar = criteria.elapsedSeconds > 0 && criteria.elapsedSeconds <= targetSeconds;

    let stars: 1 | 2 | 3 = 1;
    if (hasCoinStar && hasSpeedStar)
    {
        stars = 3;
    }
    else if (hasCoinStar || hasSpeedStar)
    {
        stars = 2;
    }

    let titleLao = '⭐ ຜ່ານດ່ານ!';
    let titleEn = 'Stage Clear!';

    if (stars === 3)
    {
        titleLao = '⭐⭐⭐ ສົມບູນແບບ!';
        titleEn = 'Perfect 3-Star Clear!';
    }
    else if (stars === 2)
    {
        titleLao = '⭐⭐ ຍອດຢ້ຽມ!';
        titleEn = 'Great 2-Star Run!';
    }

    return {
        stars,
        titleLao,
        titleEn,
        hasCoinStar,
        hasSpeedStar,
    };
}
