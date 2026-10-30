import { syncMovementWithProgressUseCase } from '../application/MovementUnlockUseCases';
import { syncSkillsWithBooksUseCase } from '../application/SkillUseCases';
import { stageNumberOf } from '../domain/entities/StageNumber';
import { entities } from './composition';
import { getGameContent } from './content/ContentCatalog';

/**
 * Teaches the hero the skill of every Textbook whose exam was passed. Called after the exam, after loading a
 * save (also one made before skills existed) and when the app starts. Returns the skills that are new.
 */
export function syncSkills (): string[]
{
    const content = getGameContent();
    const passed = new Set(Object.values(entities.books).filter(book => book.examPassed).map(book => book.bookId));
    return syncSkillsWithBooksUseCase(entities.skills, content.skills.active, content.realms, passed);
}

/**
 * Gives the hero the movement abilities (the air dash...) whose Boss Stage was cleared. Called after a Stage is
 * cleared, after loading a save (so an old save that already beat the Boss gets it) and when the app starts.
 * Returns the abilities that are new.
 */
export function syncMovement (): string[]
{
    const cleared = new Set(entities.stageProgression.completedStages.map(stageNumberOf).filter((n): n is number => n !== null));
    return syncMovementWithProgressUseCase(entities.movement, getGameContent().skills.unlocks, cleared);
}
