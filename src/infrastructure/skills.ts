import { syncSkillsWithBooksUseCase } from '../application/SkillUseCases';
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
