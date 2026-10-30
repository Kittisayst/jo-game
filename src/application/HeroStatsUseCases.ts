import { DomainEvents } from '../domain/DomainEvents';
import { Backpack } from '../domain/entities/Backpack';
import { Health, DEFAULT_MAX_HEALTH } from '../domain/entities/Health';
import { HeroLevel } from '../domain/entities/HeroLevel';
import { HeroStats, StatId, StatsTuning } from '../domain/entities/HeroStats';

export const STATS_CHANGED_EVENT = 'stats-changed';

export type AllocateStatResult =
    | { success: true }
    | { success: false; reason: 'no_points' | 'stat_full' };

export type ResetStatsResult =
    | { success: true; refunded: number }
    | { success: false; reason: 'nothing_spent' | 'missing_materials'; missing: { itemId: string; count: number }[] };

/** The hearts of the hero: the three it starts with plus the Hearts Stat. A heart gained is full; one lost is lost. */
export function syncHeartsUseCase (health: Health, stats: HeroStats, tuning: StatsTuning): void
{
    health.syncMaxHealth(DEFAULT_MAX_HEALTH + stats.bonusHearts(tuning));
}

/** Spends one Stat point on `statId`. */
export function allocateStatPointUseCase (
    hero: HeroLevel,
    stats: HeroStats,
    health: Health,
    tuning: StatsTuning,
    statId: StatId
): AllocateStatResult
{
    if (hero.unspentPoints <= 0) return { success: false, reason: 'no_points' };
    if (!stats.canAdd(statId, tuning)) return { success: false, reason: 'stat_full' };

    hero.spendPoint();
    stats.add(statId, tuning);
    syncHeartsUseCase(health, stats, tuning);
    DomainEvents.emit(STATS_CHANGED_EVENT, { statId });
    return { success: true };
}

/**
 * Takes every spent point back so they can be spent again. Costs the Materials in `respec.ingredients`
 * (never Credit) and does nothing, taking nothing, when they are missing.
 */
export function resetStatsUseCase (
    hero: HeroLevel,
    stats: HeroStats,
    health: Health,
    backpack: Backpack,
    tuning: StatsTuning
): ResetStatsResult
{
    if (stats.totalSpent === 0) return { success: false, reason: 'nothing_spent', missing: [] };

    const missing = tuning.respec.ingredients
        .map(i => ({ itemId: i.itemId, count: i.count - backpack.getItemCount(i.itemId) }))
        .filter(i => i.count > 0);
    if (missing.length > 0) return { success: false, reason: 'missing_materials', missing };

    for (const ingredient of tuning.respec.ingredients) backpack.removeItem(ingredient.itemId, ingredient.count);
    const refunded = stats.clear();
    hero.refundPoints(refunded);
    syncHeartsUseCase(health, stats, tuning);
    DomainEvents.emit(STATS_CHANGED_EVENT, { statId: null });
    return { success: true, refunded };
}
