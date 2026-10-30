/**
 * What the hero's Stat points have been spent on. Four Stats (Attack, Hearts, Guard, Agility), each with a
 * ceiling in `progression.json`; the ceilings add up to the points of Hero Level 150, so a hero at the top
 * has filled every Stat and no point is wasted. A small boost on top of the gear, never a replacement for
 * it (see "Stat" in CONTEXT.md). Pure rules, no x/y.
 */

export const STAT_IDS = ['attack', 'hearts', 'guard', 'agility'] as const;
export type StatId = typeof STAT_IDS[number];

/** The ceilings and the size of one point of each Stat, from `progression.json`. */
export interface StatsTuning
{
    stats: {
        /** Damage of the sword and every Skill: +`perPoint` (0.01 = +1 %) for each point. */
        attack: { maxPoints: number; perPoint: number };
        /** One extra heart for every `pointsPerHeart` points. */
        hearts: { maxPoints: number; pointsPerHeart: number };
        /** Chance (0 to 1) that a hit does nothing: +`blockChancePerPoint` for each point. */
        guard: { maxPoints: number; blockChancePerPoint: number };
        /** Walking speed: +`speedPerPoint` (0.0025 = +0.25 %) for each point. */
        agility: { maxPoints: number; speedPerPoint: number };
    };
    /** What it costs in Materials (never Credit) to take every point back and spend them again. */
    respec: { ingredients: { itemId: string; count: number }[] };
}

export type StatsSnapshot = Record<StatId, number>;

export class HeroStats
{
    private readonly _points: StatsSnapshot = { attack: 0, hearts: 0, guard: 0, agility: 0 };

    pointsIn (id: StatId): number
    {
        return this._points[id];
    }

    /** Every point spent so far. */
    get totalSpent (): number
    {
        return STAT_IDS.reduce((sum, id) => sum + this._points[id], 0);
    }

    canAdd (id: StatId, tuning: StatsTuning): boolean
    {
        return this._points[id] < tuning.stats[id].maxPoints;
    }

    /** Puts one point into a Stat. Returns false when that Stat is full. */
    add (id: StatId, tuning: StatsTuning): boolean
    {
        if (!this.canAdd(id, tuning)) return false;
        this._points[id] += 1;
        return true;
    }

    /** Takes every point back. Returns how many there were. */
    clear (): number
    {
        const spent = this.totalSpent;
        for (const id of STAT_IDS) this._points[id] = 0;
        return spent;
    }

    /** Damage factor for the sword and every Skill (1 = no change). */
    attackMultiplier (tuning: StatsTuning): number
    {
        return 1 + this.counted('attack', tuning) * tuning.stats.attack.perPoint;
    }

    /** Hearts added to the three the hero starts with. */
    bonusHearts (tuning: StatsTuning): number
    {
        return Math.floor(this.counted('hearts', tuning) / tuning.stats.hearts.pointsPerHeart);
    }

    /** Chance (0 to 1) that a hit does nothing. */
    blockChance (tuning: StatsTuning): number
    {
        return Math.min(1, this.counted('guard', tuning) * tuning.stats.guard.blockChancePerPoint);
    }

    /** Walking speed factor (1 = no change). */
    speedMultiplier (tuning: StatsTuning): number
    {
        return 1 + this.counted('agility', tuning) * tuning.stats.agility.speedPerPoint;
    }

    toSnapshot (): StatsSnapshot
    {
        return { ...this._points };
    }

    /** Loads a save; a missing, negative or fractional number counts as 0 (the ceilings apply when it is used). */
    loadFrom (snapshot: Partial<Record<string, unknown>> | undefined): void
    {
        for (const id of STAT_IDS)
        {
            const value = snapshot?.[id];
            this._points[id] = typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000 ? value : 0;
        }
    }

    /** Points of a Stat that count: a save with more than the ceiling still gets only the ceiling. */
    private counted (id: StatId, tuning: StatsTuning): number
    {
        return Math.min(this._points[id], tuning.stats[id].maxPoints);
    }
}
