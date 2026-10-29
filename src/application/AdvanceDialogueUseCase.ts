import { DialogueGraph, DialogueNode, DialogueState } from '../domain/entities/Dialogue';
import { DomainEvents } from '../domain/DomainEvents';

export const DIALOGUE_STARTED_EVENT = 'dialogue_started';
export const DIALOGUE_UPDATED_EVENT = 'dialogue_updated';
export const DIALOGUE_CLOSED_EVENT = 'dialogue_closed';
export const DIALOGUE_ACTION_EVENT = 'dialogue_action';

export interface DialogueActionPayload
{
    action: string;
}

export interface DialoguePayload
{
    node: DialogueNode | null;
    isOpen: boolean;
}

export function startDialogueUseCase (state: DialogueState, graph: DialogueGraph): DialogueNode | null
{
    state.start(graph);
    const node = state.getCurrentNode();
    DomainEvents.emit<DialoguePayload>(DIALOGUE_STARTED_EVENT, {
        node,
        isOpen: state.isOpen,
    });
    return node;
}

export function advanceDialogueUseCase (state: DialogueState): DialogueNode | null
{
    const node = state.advance();
    if (!state.isOpen)
    {
        DomainEvents.emit<DialoguePayload>(DIALOGUE_CLOSED_EVENT, {
            node: null,
            isOpen: false,
        });
        return null;
    }

    DomainEvents.emit<DialoguePayload>(DIALOGUE_UPDATED_EVENT, {
        node,
        isOpen: true,
    });
    return node;
}

export function selectDialogueChoiceUseCase (state: DialogueState, choiceIndex: number): DialogueNode | null
{
    const node = state.choose(choiceIndex);

    // A choice can ask the game to do something (open a shop); announce it before the dialogue closes
    const action = state.takeAction();
    if (action)
    {
        DomainEvents.emit<DialogueActionPayload>(DIALOGUE_ACTION_EVENT, { action });
    }

    if (!state.isOpen)
    {
        DomainEvents.emit<DialoguePayload>(DIALOGUE_CLOSED_EVENT, {
            node: null,
            isOpen: false,
        });
        return null;
    }

    DomainEvents.emit<DialoguePayload>(DIALOGUE_UPDATED_EVENT, {
        node,
        isOpen: true,
    });
    return node;
}

export function closeDialogueUseCase (state: DialogueState): void
{
    state.close();
    DomainEvents.emit<DialoguePayload>(DIALOGUE_CLOSED_EVENT, {
        node: null,
        isOpen: false,
    });
}
