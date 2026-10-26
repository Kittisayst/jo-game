import { describe, expect, it, vi } from 'vitest';
import { DomainEventEmitter } from './DomainEvents';

describe('DomainEventEmitter', () =>
{
    it('calls a listener with the emitted payload', () =>
    {
        const emitter = new DomainEventEmitter();
        const listener = vi.fn();

        emitter.on('score-changed', listener);
        emitter.emit('score-changed', { value: 10 });

        expect(listener).toHaveBeenCalledWith({ value: 10 });
    });

    it('calls every listener registered for the same event', () =>
    {
        const emitter = new DomainEventEmitter();
        const first = vi.fn();
        const second = vi.fn();

        emitter.on('score-changed', first);
        emitter.on('score-changed', second);
        emitter.emit('score-changed', { value: 5 });

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
    });

    it('does not call a listener after it has been removed via off', () =>
    {
        const emitter = new DomainEventEmitter();
        const listener = vi.fn();

        emitter.on('score-changed', listener);
        emitter.off('score-changed', listener);
        emitter.emit('score-changed', { value: 1 });

        expect(listener).not.toHaveBeenCalled();
    });

    it('does not call listeners registered for a different event', () =>
    {
        const emitter = new DomainEventEmitter();
        const listener = vi.fn();

        emitter.on('score-changed', listener);
        emitter.emit('level-complete', { levelId: 'level-1' });

        expect(listener).not.toHaveBeenCalled();
    });
});
