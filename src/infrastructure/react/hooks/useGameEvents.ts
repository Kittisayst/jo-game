import { useEffect, useRef } from 'react';
import { DomainEvents } from '../../../domain/DomainEvents';
import {
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
} from '../../../application/DamageBossUseCase';
import { PLAYER_HEALED_EVENT, PlayerHealedPayload } from '../../../application/ConsumeItemUseCase';
import {
    PLAYER_DAMAGED_EVENT,
    PLAYER_DIED_EVENT,
    PlayerDamagedPayload,
} from '../../../application/PlayerTakeDamageUseCase';
import type { GateRequirements } from '../../../application/RepairBrokenGateUseCase';
import { GAME_PAUSED_EVENT, GAME_RESUMED_EVENT } from '../../../application/TogglePauseUseCase';
import { TUTORIAL_CHANGED_EVENT } from '../../../application/NotifyTutorialUseCase';
import { ITEM_REPAIRED_EVENT, ITEM_WORN_EVENT } from '../../../application/WearItemUseCase';
import { ARMOR_CHANGED_EVENT } from '../../../application/ArmorUseCases';
import { POTION_DRUNK_EVENT } from '../../../application/DrinkPotionUseCase';
import { EventBus } from '../../EventBus';

/** What the React side does when the game or the domain announces something. Every handler is optional. */
export interface GameEventHandlers
{
    // From the Phaser scene (EventBus)
    onOpenStageMap?: () => void;
    onOpenGarden?: () => void;
    onOpenStorage?: () => void;
    onWeaponChanged?: (weaponId: string) => void;
    onOpenLibrary?: (bookId?: string) => void;
    onOpenAcademy?: (bookId?: string) => void;
    onOpenWorkshop?: () => void;
    onOpenForge?: () => void;
    onOpenBackpack?: () => void;
    onOpenGateRepair?: (gateId?: string, requirements?: GateRequirements) => void;
    onOpenWaypoint?: (name?: string) => void;
    onOpenQuizFinisher?: (payload?: { bookId?: string }) => void;
    onChangeLevel?: (levelKey: string) => void;
    onBookExamPassed?: () => void;
    onDailyPracticeCompleted?: () => void;
    onBackpackItemUsed?: () => void;
    onBackpackChanged?: () => void;
    onStageCleared?: (payload: { stageId: string }) => void;
    onOpenStageQuestion?: (payload: { stageId: string }) => void;

    // From the domain (DomainEvents)
    onPlayerHealthChanged?: (payload: PlayerDamagedPayload | PlayerHealedPayload) => void;
    onPlayerDied?: () => void;
    onBossDamaged?: (payload: BossDamagedPayload) => void;
    onBossDefeated?: () => void;
    onGamePaused?: () => void;
    onGameResumed?: () => void;
    onItemWornOrRepaired?: () => void;
    onTutorialChanged?: (payload: { finished: string[]; currentStepId: string | null }) => void;
}

const EVENT_BUS_EVENTS: [string, keyof GameEventHandlers][] = [
    ['open-stage-map', 'onOpenStageMap'],
    ['open-garden', 'onOpenGarden'],
    ['open-storage', 'onOpenStorage'],
    ['weapon-changed', 'onWeaponChanged'],
    ['open-library', 'onOpenLibrary'],
    ['open-academy', 'onOpenAcademy'],
    ['open-workshop', 'onOpenWorkshop'],
    ['open-forge', 'onOpenForge'],
    ['open-backpack', 'onOpenBackpack'],
    ['open-gate-repair', 'onOpenGateRepair'],
    ['open-waypoint', 'onOpenWaypoint'],
    ['open-quiz-finisher', 'onOpenQuizFinisher'],
    ['change-level', 'onChangeLevel'],
    ['book-exam-passed', 'onBookExamPassed'],
    ['daily-practice-completed', 'onDailyPracticeCompleted'],
    ['backpack-item-used', 'onBackpackItemUsed'],
    ['backpack-changed', 'onBackpackChanged'],
    ['stage-cleared', 'onStageCleared'],
    ['open-stage-question', 'onOpenStageQuestion'],
];

const DOMAIN_EVENTS: [string, keyof GameEventHandlers][] = [
    [PLAYER_DAMAGED_EVENT, 'onPlayerHealthChanged'],
    [PLAYER_HEALED_EVENT, 'onPlayerHealthChanged'],
    [PLAYER_DIED_EVENT, 'onPlayerDied'],
    [BOSS_DAMAGED_EVENT, 'onBossDamaged'],
    [BOSS_DEFEATED_EVENT, 'onBossDefeated'],
    [GAME_PAUSED_EVENT, 'onGamePaused'],
    [GAME_RESUMED_EVENT, 'onGameResumed'],
    [TUTORIAL_CHANGED_EVENT, 'onTutorialChanged'],
    [ITEM_WORN_EVENT, 'onItemWornOrRepaired'],
    [ITEM_REPAIRED_EVENT, 'onItemWornOrRepaired'],
    [ARMOR_CHANGED_EVENT, 'onItemWornOrRepaired'],
    [POTION_DRUNK_EVENT, 'onItemWornOrRepaired'],
];

/**
 * Subscribes once to every game and domain event the UI cares about and forwards each to the
 * matching handler. Handlers are looked up when the event fires, so they always see current
 * state (a handler captured at the first render would not).
 */
export function useGameEvents (handlers: GameEventHandlers): void
{
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() =>
    {
        const dispatch = (key: keyof GameEventHandlers) => (...args: unknown[]) =>
        {
            (handlersRef.current[key] as ((...a: unknown[]) => void) | undefined)?.(...args);
        };

        const subscriptions = [
            ...EVENT_BUS_EVENTS.map(([event, key]) => ({ bus: true, event, listener: dispatch(key) })),
            ...DOMAIN_EVENTS.map(([event, key]) => ({ bus: false, event, listener: dispatch(key) })),
        ];

        for (const { bus, event, listener } of subscriptions)
        {
            if (bus) EventBus.on(event, listener);
            else DomainEvents.on(event, listener);
        }

        return () =>
        {
            for (const { bus, event, listener } of subscriptions)
            {
                if (bus) EventBus.removeListener(event, listener);
                else DomainEvents.off(event, listener);
            }
        };
    }, []);
}
