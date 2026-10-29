import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GamePauseState } from '../domain/entities/GamePauseState';
import { DomainEvents } from '../domain/DomainEvents';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
    GamePausePayload,
    pauseGameUseCase,
    resumeGameUseCase,
    togglePauseUseCase,
} from './TogglePauseUseCase';

describe('TogglePauseUseCase', () =>
{
    beforeEach(() =>
    {
        vi.restoreAllMocks();
    });

    it('emits GAME_PAUSED_EVENT when pausing an unpaused game', () =>
    {
        const pauseState = new GamePauseState(false);
        const spy = vi.fn();
        DomainEvents.on<GamePausePayload>(GAME_PAUSED_EVENT, spy);

        const result = pauseGameUseCase(pauseState);

        expect(result).toBe(true);
        expect(pauseState.isPaused).toBe(true);
        expect(spy).toHaveBeenCalledWith({ isPaused: true });

        DomainEvents.off<GamePausePayload>(GAME_PAUSED_EVENT, spy);
    });

    it('does not re-emit if already paused', () =>
    {
        const pauseState = new GamePauseState(true);
        const spy = vi.fn();
        DomainEvents.on<GamePausePayload>(GAME_PAUSED_EVENT, spy);

        const result = pauseGameUseCase(pauseState);

        expect(result).toBe(false);
        expect(spy).not.toHaveBeenCalled();

        DomainEvents.off<GamePausePayload>(GAME_PAUSED_EVENT, spy);
    });

    it('emits GAME_RESUMED_EVENT when resuming a paused game', () =>
    {
        const pauseState = new GamePauseState(true);
        const spy = vi.fn();
        DomainEvents.on<GamePausePayload>(GAME_RESUMED_EVENT, spy);

        const result = resumeGameUseCase(pauseState);

        expect(result).toBe(true);
        expect(pauseState.isPaused).toBe(false);
        expect(spy).toHaveBeenCalledWith({ isPaused: false });

        DomainEvents.off<GamePausePayload>(GAME_RESUMED_EVENT, spy);
    });

    it('does not re-emit if already resumed', () =>
    {
        const pauseState = new GamePauseState(false);
        const spy = vi.fn();
        DomainEvents.on<GamePausePayload>(GAME_RESUMED_EVENT, spy);

        const result = resumeGameUseCase(pauseState);

        expect(result).toBe(false);
        expect(spy).not.toHaveBeenCalled();

        DomainEvents.off<GamePausePayload>(GAME_RESUMED_EVENT, spy);
    });

    it('emits appropriate events when togglePauseUseCase is called', () =>
    {
        const pauseState = new GamePauseState(false);
        const pauseSpy = vi.fn();
        const resumeSpy = vi.fn();
        DomainEvents.on<GamePausePayload>(GAME_PAUSED_EVENT, pauseSpy);
        DomainEvents.on<GamePausePayload>(GAME_RESUMED_EVENT, resumeSpy);

        // Toggle to paused
        const paused = togglePauseUseCase(pauseState);
        expect(paused).toBe(true);
        expect(pauseSpy).toHaveBeenCalledWith({ isPaused: true });

        // Toggle to resumed
        const resumed = togglePauseUseCase(pauseState);
        expect(resumed).toBe(false);
        expect(resumeSpy).toHaveBeenCalledWith({ isPaused: false });

        DomainEvents.off<GamePausePayload>(GAME_PAUSED_EVENT, pauseSpy);
        DomainEvents.off<GamePausePayload>(GAME_RESUMED_EVENT, resumeSpy);
    });
});
