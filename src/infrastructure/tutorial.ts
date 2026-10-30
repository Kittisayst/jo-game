import { notifyTutorialUseCase } from '../application/NotifyTutorialUseCase';
import { entities } from './composition';
import { autoSaveGame } from './saveSnapshot';

/** The first Portal shard picked up reveals the hint about turning shards into a block. */
export function notifyShardsCollected (collected: readonly { itemId: string }[]): void
{
    if (collected.some(drop => drop.itemId.startsWith('portal-shard-'))) notifyTutorial('portal-shard-collected');
}

/** Something happened in the game that a tutorial step may be waiting for (see `tutorial.json`). */
export function notifyTutorial (event: string): void
{
    if (notifyTutorialUseCase(entities.tutorial, event).length > 0) autoSaveGame();
}
