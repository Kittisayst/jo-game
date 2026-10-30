import { notifyTutorialUseCase } from '../application/NotifyTutorialUseCase';
import { entities } from './composition';
import { autoSaveGame } from './saveSnapshot';

/** Something happened in the game that a tutorial step may be waiting for (see `tutorial.json`). */
export function notifyTutorial (event: string): void
{
    if (notifyTutorialUseCase(entities.tutorial, event).length > 0) autoSaveGame();
}
