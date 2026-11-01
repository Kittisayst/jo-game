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
import { HUNTER_BOUNMY_DIALOGUE } from '../../dialogue/hunterBounmyDialogue';
import { ARCHAEOLOGIST_SOMCHAY_DIALOGUE } from '../../dialogue/somchayDialogue';
import { stageGuideKeoDialogue } from '../../dialogue/stageGuideKeoDialogue';
import { uncleThongDialogue } from '../../dialogue/uncleThongDialogue';
import { drCyberDialogue } from '../../dialogue/drCyberDialogue';
import { masterVanhDialogue } from '../../dialogue/masterVanhDialogue';
import { grandmaChanthyDialogue } from '../../dialogue/grandmaChanthyDialogue';
import { swordsmanKhamDialogue } from '../../dialogue/swordsmanKhamDialogue';
import { shrineNoyDialogue } from '../../dialogue/shrineNoyDialogue';
import { soundManager } from '../../audio/SoundManager';
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
                    : graphId === 'hunter_bounmy'
                        ? HUNTER_BOUNMY_DIALOGUE
                        : (graphId === 'somchay' || graphId === 'archaeologist_somchay')
                            ? ARCHAEOLOGIST_SOMCHAY_DIALOGUE
                            : graphId === 'stage_guide_keo'
                                ? stageGuideKeoDialogue
                                : graphId === 'uncle_thong'
                                    ? uncleThongDialogue
                                    : graphId === 'dr_cyber'
                                        ? drCyberDialogue
                                        : graphId === 'master_vanh'
                                            ? masterVanhDialogue
                                            : graphId === 'grandma_chanthy'
                                                ? grandmaChanthyDialogue
                                                : graphId === 'swordsman_kham'
                                                    ? swordsmanKhamDialogue
                                                    : graphId === 'shrine_noy'
                                                        ? shrineNoyDialogue
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
            else if (action === 'enter-dungeon') EventBus.emit('change-level', 'dungeon');
            else if (action === 'open-quest-board') EventBus.emit('open-quest-board');
            else if (action === 'give-dungeon-key') EventBus.emit('give-dungeon-key');
            else if (action === 'give-scholar-reward')
            {
                entities.wallet.earn(25);
                soundManager.playCoin();
            }
            else if (action === 'give-herbalist-gift')
            {
                entities.backpack.addItem('herb', 2);
                entities.backpack.addItem('seed-herb', 2);
                EventBus.emit('backpack-changed');
                soundManager.playReward();
            }
            else if (action === 'give-shrine-blessing')
            {
                soundManager.playReward();
            }
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
