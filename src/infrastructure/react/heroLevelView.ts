import { entities } from '../composition';
import { getGameContent } from '../content/ContentCatalog';
import { xpToNext } from '../../domain/entities/HeroLevel';

/** What the HUD shows of the Hero Level. */
export interface HeroLevelView
{
    level: number;
    maxLevel: number;
    xp: number;
    /** XP needed for the next level; 0 at the top level. */
    xpNeeded: number;
    /** 0 to 1 */
    fraction: number;
}

export function readHeroLevel (): HeroLevelView
{
    const { progression } = getGameContent();
    const hero = entities.heroLevel;
    const max = hero.isMaxLevel(progression);
    const needed = max ? 0 : xpToNext(hero.level, progression);
    return { level: hero.level, maxLevel: progression.maxLevel, xp: hero.xp, xpNeeded: needed, fraction: max ? 1 : hero.xp / needed };
}
