import { DomainEvents } from '../domain/DomainEvents';
import { HeroLevel, xpShareForStage, type ProgressionTuning } from '../domain/entities/HeroLevel';

export const XP_GAINED_EVENT = 'xp-gained';
export const HERO_LEVEL_UP_EVENT = 'hero-level-up';

export interface XpGainedPayload
{
    amount: number;
}

export interface HeroLevelUpPayload
{
    level: number;
    levelsGained: number;
    unspentPoints: number;
}

export interface GrantXpResult
{
    /** The XP that counted, after a monster far below the hero gave less (0 at the top level). */
    xp: number;
    levelsGained: number;
}

/**
 * XP for a monster that fell. In Stage `stageNumber` a hero far above it gets a smaller share (see
 * `ProgressionTuning.overlevel`). Publishes `xp-gained`, and `hero-level-up` when a level is gained.
 */
export function grantXpUseCase (
    hero: HeroLevel,
    tuning: ProgressionTuning,
    enemyXp: number,
    stageNumber: number
): GrantXpResult
{
    if (hero.isMaxLevel(tuning) || !(enemyXp > 0)) return { xp: 0, levelsGained: 0 };

    const xp = Math.max(1, Math.round(enemyXp * xpShareForStage(hero.level, stageNumber, tuning)));
    const levelsGained = hero.gainXp(xp, tuning);

    DomainEvents.emit<XpGainedPayload>(XP_GAINED_EVENT, { amount: xp });
    if (levelsGained > 0)
    {
        DomainEvents.emit<HeroLevelUpPayload>(HERO_LEVEL_UP_EVENT, {
            level: hero.level,
            levelsGained,
            unspentPoints: hero.unspentPoints,
        });
    }
    return { xp, levelsGained };
}
