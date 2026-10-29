import { useEffect, useRef, useState } from 'react';
import {
    advanceDialogueUseCase,
    closeDialogueUseCase,
    selectDialogueChoiceUseCase,
    startDialogueUseCase,
} from '../../../application/AdvanceDialogueUseCase';
import { DialogueChoice, DialogueNode } from '../../../domain/entities/Dialogue';
import { DomainEvents } from '../../../domain/DomainEvents';
import { DIALOGUE_ACTION_EVENT, DialogueActionPayload } from '../../../application/AdvanceDialogueUseCase';
import { createSkinShopDialogue, OPEN_SKIN_SHOP_ACTION } from '../../dialogue/skinShopDialogue';
import { VILLAGE_ELDER_DIALOGUE } from '../../dialogue/villageElderDialogue';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';

/**
 * Dialogue modal state; opens when the scene emits `start-dialogue` with the id of a conversation
 * (`village_elder`, `skin_shop`). `onOpenSkinShop` runs when the player picks "look at the outfits".
 */
export function useDialogue (onOpenSkinShop: () => void)
{
    const [isDialogueOpen, setIsDialogueOpen] = useState(false);
    const [currentDialogueNode, setCurrentDialogueNode] = useState<DialogueNode | null>(null);
    const [dialogueChoices, setDialogueChoices] = useState<DialogueChoice[]>([]);

    const refreshFromState = () =>
    {
        setCurrentDialogueNode(entities.dialogueState.getCurrentNode());
        setDialogueChoices(entities.dialogueState.getAvailableChoices());
        if (!entities.dialogueState.isOpen)
        {
            setIsDialogueOpen(false);
            EventBus.emit('dialogue-open-state', false);
        }
    };

    const advanceDialogue = () =>
    {
        advanceDialogueUseCase(entities.dialogueState);
        refreshFromState();
    };

    const selectDialogueChoice = (choiceIndex: number) =>
    {
        selectDialogueChoiceUseCase(entities.dialogueState, choiceIndex);
        refreshFromState();
    };

    const closeDialogue = () =>
    {
        closeDialogueUseCase(entities.dialogueState);
        setIsDialogueOpen(false);
        setCurrentDialogueNode(null);
        setDialogueChoices([]);
        EventBus.emit('dialogue-open-state', false);
    };

    useEffect(() =>
    {
        const onStartDialogue = (graphId: string) =>
        {
            const graph = graphId === 'village_elder'
                ? VILLAGE_ELDER_DIALOGUE
                : graphId === 'skin_shop'
                    ? createSkinShopDialogue(Boolean(entities.books['book-ch1']?.isUnlocked))
                    : null;
            if (!graph) return;

            startDialogueUseCase(entities.dialogueState, graph);
            setCurrentDialogueNode(entities.dialogueState.getCurrentNode());
            setDialogueChoices(entities.dialogueState.getAvailableChoices());
            setIsDialogueOpen(true);
            EventBus.emit('dialogue-open-state', true);
        };

        EventBus.on('start-dialogue', onStartDialogue);
        return () =>
        {
            EventBus.removeListener('start-dialogue', onStartDialogue);
        };
    }, []);

    // The newest callback is read when the event fires, so it always sees current state
    const openShopRef = useRef(onOpenSkinShop);
    openShopRef.current = onOpenSkinShop;

    useEffect(() =>
    {
        const onAction = ({ action }: DialogueActionPayload) =>
        {
            if (action === OPEN_SKIN_SHOP_ACTION) openShopRef.current();
        };

        DomainEvents.on<DialogueActionPayload>(DIALOGUE_ACTION_EVENT, onAction);
        return () =>
        {
            DomainEvents.off<DialogueActionPayload>(DIALOGUE_ACTION_EVENT, onAction);
        };
    }, []);

    return {
        isDialogueOpen,
        currentDialogueNode,
        dialogueChoices,
        advanceDialogue,
        selectDialogueChoice,
        closeDialogue,
    };
}
