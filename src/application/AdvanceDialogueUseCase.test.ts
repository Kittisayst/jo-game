import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DialogueGraph, DialogueState } from '../domain/entities/Dialogue';
import { DomainEvents } from '../domain/DomainEvents';
import {
    DIALOGUE_ACTION_EVENT,
    DIALOGUE_CLOSED_EVENT,
    DIALOGUE_STARTED_EVENT,
    DIALOGUE_UPDATED_EVENT,
    advanceDialogueUseCase,
    closeDialogueUseCase,
    selectDialogueChoiceUseCase,
    startDialogueUseCase,
} from './AdvanceDialogueUseCase';

describe('AdvanceDialogueUseCase', () =>
{
    const mockGraph: DialogueGraph = {
        id: 'test',
        title: 'Elder Chat',
        startNodeId: 'start',
        nodes: {
            start: {
                id: 'start',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Greeting',
                next: 'branch',
            },
            branch: {
                id: 'branch',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Choose path',
                choices: [
                    { text: 'A', to: 'finish' },
                ],
            },
            finish: {
                id: 'finish',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Bye',
                end: true,
            },
        },
    };

    beforeEach(() =>
    {
        DomainEvents.clear();
    });

    it('emits DIALOGUE_STARTED_EVENT when starting dialogue', () =>
    {
        const state = new DialogueState();
        const listener = vi.fn();
        DomainEvents.on(DIALOGUE_STARTED_EVENT, listener);

        const node = startDialogueUseCase(state, mockGraph);
        expect(node?.id).toBe('start');
        expect(listener).toHaveBeenCalledWith({
            node,
            isOpen: true,
        });
    });

    it('emits DIALOGUE_UPDATED_EVENT when advancing', () =>
    {
        const state = new DialogueState();
        startDialogueUseCase(state, mockGraph);

        const listener = vi.fn();
        DomainEvents.on(DIALOGUE_UPDATED_EVENT, listener);

        const node = advanceDialogueUseCase(state);
        expect(node?.id).toBe('branch');
        expect(listener).toHaveBeenCalledWith({
            node,
            isOpen: true,
        });
    });

    it('emits DIALOGUE_CLOSED_EVENT when closing dialogue', () =>
    {
        const state = new DialogueState();
        startDialogueUseCase(state, mockGraph);

        const listener = vi.fn();
        DomainEvents.on(DIALOGUE_CLOSED_EVENT, listener);

        closeDialogueUseCase(state);
        expect(listener).toHaveBeenCalledWith({
            node: null,
            isOpen: false,
        });
    });

    it('emits DIALOGUE_UPDATED_EVENT when selecting choices', () =>
    {
        const state = new DialogueState();
        startDialogueUseCase(state, mockGraph);
        advanceDialogueUseCase(state); // to branch

        const updateListener = vi.fn();
        DomainEvents.on(DIALOGUE_UPDATED_EVENT, updateListener);

        const next = selectDialogueChoiceUseCase(state, 0);
        expect(next?.id).toBe('finish');
        expect(updateListener).toHaveBeenCalledWith({
            node: next,
            isOpen: true,
        });
    });

    it('announces the action of a chosen option before the dialogue closes', () =>
    {
        const graph: DialogueGraph = {
            id: 'shop',
            title: 'Shop',
            startNodeId: 'start',
            nodes: {
                start: {
                    id: 'start',
                    speaker: 'Mina',
                    avatar: '🛍️',
                    line: 'Welcome',
                    choices: [
                        { text: 'Look', to: 'end', action: 'open-skin-shop' },
                        { text: 'Later', to: 'end' },
                    ],
                },
            },
        };
        const state = new DialogueState();
        const order: string[] = [];
        const onAction = vi.fn(() => order.push('action'));
        const onClosed = vi.fn(() => order.push('closed'));

        DomainEvents.on(DIALOGUE_ACTION_EVENT, onAction);
        DomainEvents.on(DIALOGUE_CLOSED_EVENT, onClosed);
        startDialogueUseCase(state, graph);
        selectDialogueChoiceUseCase(state, 0);
        startDialogueUseCase(state, graph);
        selectDialogueChoiceUseCase(state, 1);
        DomainEvents.off(DIALOGUE_ACTION_EVENT, onAction);
        DomainEvents.off(DIALOGUE_CLOSED_EVENT, onClosed);

        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith({ action: 'open-skin-shop' });
        // "Look" announces then closes; "Later" only closes
        expect(order).toEqual(['action', 'closed', 'closed']);
    });
});
