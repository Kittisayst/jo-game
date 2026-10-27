import { DomainEvents } from '../domain/DomainEvents';
import { GamePauseState } from '../domain/entities/GamePauseState';

export const GAME_PAUSED_EVENT = 'game:paused';
export const GAME_RESUMED_EVENT = 'game:resumed';

export interface GamePausePayload
{
    isPaused: boolean;
}

export function pauseGameUseCase(pauseState: GamePauseState): boolean
{
    if (!pauseState.isPaused)
    {
        pauseState.pause();
        DomainEvents.emit<GamePausePayload>(GAME_PAUSED_EVENT, { isPaused: true });
        return true;
    }
    return false;
}

export function resumeGameUseCase(pauseState: GamePauseState): boolean
{
    if (pauseState.isPaused)
    {
        pauseState.resume();
        DomainEvents.emit<GamePausePayload>(GAME_RESUMED_EVENT, { isPaused: false });
        return true;
    }
    return false;
}

export function togglePauseUseCase(pauseState: GamePauseState): boolean
{
    const isPaused = pauseState.toggle();
    if (isPaused)
    {
        DomainEvents.emit<GamePausePayload>(GAME_PAUSED_EVENT, { isPaused: true });
    }
    else
    {
        DomainEvents.emit<GamePausePayload>(GAME_RESUMED_EVENT, { isPaused: false });
    }
    return isPaused;
}
