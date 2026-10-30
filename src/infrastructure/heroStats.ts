import { syncHeartsUseCase } from '../application/HeroStatsUseCases';
import { entities } from './composition';
import { getGameContent } from './content/ContentCatalog';

/**
 * Makes the hero's hearts match the Hearts Stat. Called after loading a save and when the app starts (the
 * Stat points are saved, the hearts they give are not).
 */
export function syncHearts (): void
{
    syncHeartsUseCase(entities.health, entities.heroStats, getGameContent().statsTuning);
}
