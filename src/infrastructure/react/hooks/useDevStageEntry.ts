import { useEffect, useRef } from 'react';
import { EventBus } from '../../EventBus';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { isStageReady } from '../../phaser/stages/StageDefinition';
import { stageIdOf, STAGE_COUNT } from '../../../domain/entities/StageNumber';

/**
 * Development only: opening the game with `?stage=N` opens Stages 1 to N and starts Stage N as soon as the
 * title scene is up, so a Stage can be tried without clearing the ones before it. Does nothing in a
 * production build, for a Stage that is not built yet, or when the address has no `stage`.
 */
export function useDevStageEntry (startStage: (stageKey: string) => void): void
{
    const startRef = useRef(startStage);
    startRef.current = startStage;

    useEffect(() =>
    {
        if (!import.meta.env.DEV) return;

        const requested = Number(new URLSearchParams(window.location.search).get('stage'));
        if (!Number.isInteger(requested) || requested < 1 || requested > STAGE_COUNT) return;

        const stage = getGameContent().stages[requested - 1];
        if (!isStageReady(stage)) return;

        for (let n = 1; n <= requested; n++) entities.stageProgression.unlockStage(stageIdOf(n));

        const onSceneReady = (scene: Phaser.Scene) =>
        {
            if (scene.scene.key !== 'Title') return;
            EventBus.off('current-scene-ready', onSceneReady);
            startRef.current(stage.id);
        };
        EventBus.on('current-scene-ready', onSceneReady);

        return () => { EventBus.off('current-scene-ready', onSceneReady); };
    }, []);
}
