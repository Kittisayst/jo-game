type Listener<T> = (payload: T) => void;

/**
 * Framework-free pub/sub for the domain/application layers.
 * Deliberately not Phaser.Events.EventEmitter — see "Domain event" in CONTEXT.md
 * and docs/adr/0001-clean-architecture-layering.md for why.
 */
export class DomainEventEmitter
{
    private listeners = new Map<string, Set<Listener<any>>>();

    on<T> (event: string, listener: Listener<T>)
    {
        if (!this.listeners.has(event))
        {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(listener);
    }

    off<T> (event: string, listener: Listener<T>)
    {
        this.listeners.get(event)?.delete(listener);
    }

    emit<T> (event: string, payload: T)
    {
        this.listeners.get(event)?.forEach(listener => listener(payload));
    }
}

export const DomainEvents = new DomainEventEmitter();
