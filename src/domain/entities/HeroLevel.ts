/**
 * The hero's Hero Level (1 to 150) and XP. XP comes only from defeating monsters; it is not Credit, cannot be
 * turned into Credit and buys nothing. Every level gives Stat points (spent in a later phase). Pure rules, no x/y;
 * the numbers come from `progression.json` (see "Hero Level" in CONTEXT.md).
 */

/** The highest level a save can hold, whatever the tuning says. */
export const HERO_LEVEL_CAP = 150;

/** How XP and levels behave, from `progression.json`. */
export interface ProgressionTuning
{
    /** The top level (2 to 150). */
    maxLevel: number;
    /** XP needed to go from level L to L + 1 is `round(base × L ^ exponent)`. */
    xpCurve: { base: number; exponent: number };
    /** Stat points given for every level gained. */
    pointsPerLevel: number;
    /** Monsters in a Stage far below the hero give less, so entering and leaving a low Stage is not a way to farm. */
    overlevel: {
        /** The hero counts as over-levelled in Stage N when its level is above `N × levelsPerStage + offset`. */
        levelsPerStage: number;
        offset: number;
        /** The share of XP such a monster still gives (0 to 1). */
        xpShare: number;
    };
}

/** XP needed to go from `level` to the next one. */
export function xpToNext (level: number, tuning: ProgressionTuning): number
{
    return Math.max(1, Math.round(tuning.xpCurve.base * Math.pow(Math.max(1, level), tuning.xpCurve.exponent)));
}

/** The share of an enemy's XP a hero of `heroLevel` gets in Stage `stageNumber` (1, or the reduced share). */
export function xpShareForStage (heroLevel: number, stageNumber: number, tuning: ProgressionTuning): number
{
    const { levelsPerStage, offset, xpShare } = tuning.overlevel;
    return heroLevel > stageNumber * levelsPerStage + offset ? xpShare : 1;
}

export interface HeroLevelSnapshot
{
    level: number;
    xp: number;
    unspentPoints: number;
}

export class HeroLevel
{
    private _level = 1;
    private _xp = 0;
    private _unspentPoints = 0;

    get level (): number
    {
        return this._level;
    }

    /** XP gathered towards the next level. */
    get xp (): number
    {
        return this._xp;
    }

    /** Stat points not spent yet. */
    get unspentPoints (): number
    {
        return this._unspentPoints;
    }

    isMaxLevel (tuning: ProgressionTuning): boolean
    {
        return this._level >= tuning.maxLevel;
    }

    /**
     * Adds XP, going up as many levels as it pays for. At the top level XP stops counting.
     * Returns the levels gained (0 when none).
     */
    gainXp (amount: number, tuning: ProgressionTuning): number
    {
        if (!(amount > 0) || this.isMaxLevel(tuning)) return 0;

        this._xp += Math.floor(amount);
        let gained = 0;
        while (this._level < tuning.maxLevel && this._xp >= xpToNext(this._level, tuning))
        {
            this._xp -= xpToNext(this._level, tuning);
            this._level += 1;
            this._unspentPoints += tuning.pointsPerLevel;
            gained += 1;
        }
        if (this._level >= tuning.maxLevel) this._xp = 0;
        return gained;
    }

    toSnapshot (): HeroLevelSnapshot
    {
        return { level: this._level, xp: this._xp, unspentPoints: this._unspentPoints };
    }

    /** Loads a save; anything out of range falls back to the start (level 1) or zero. */
    loadFrom (snapshot: Partial<HeroLevelSnapshot> | undefined): void
    {
        const whole = (value: unknown, min: number, max: number, fallback: number): number =>
            typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;

        this._level = whole(snapshot?.level, 1, HERO_LEVEL_CAP, 1);
        this._xp = whole(snapshot?.xp, 0, Number.MAX_SAFE_INTEGER, 0);
        this._unspentPoints = whole(snapshot?.unspentPoints, 0, 10000, 0);
    }
}
