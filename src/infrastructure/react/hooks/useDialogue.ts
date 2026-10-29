import { useEffect, useState } from 'react';
import {
    advanceDialogueUseCase,
    closeDialogueUseCase,
    selectDialogueChoiceUseCase,
    startDialogueUseCase,
} from '../../../application/AdvanceDialogueUseCase';
import { DialogueChoice, DialogueNode } from '../../../domain/entities/Dialogue';
import { VILLAGE_ELDER_DIALOGUE } from '../../dialogue/villageElderDialogue';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';

/** Dialogue modal state; opens when the scene emits `start-dialogue`. */
export function useDialogue ()
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
            if (graphId === 'village_elder')
            {
                startDialogueUseCase(entities.dialogueState, VILLAGE_ELDER_DIALOGUE);
                setCurrentDialogueNode(entities.dialogueState.getCurrentNode());
                setDialogueChoices(entities.dialogueState.getAvailableChoices());
                setIsDialogueOpen(true);
                EventBus.emit('dialogue-open-state', true);
            }
        };

        EventBus.on('start-dialogue', onStartDialogue);
        return () =>
        {
            EventBus.removeListener('start-dialogue', onStartDialogue);
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
