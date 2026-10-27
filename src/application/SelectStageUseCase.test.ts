import { beforeEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { StageProgression } from '../domain/entities/StageProgression';
import {
    selectStageUseCase,
    STAGE_SELECTED_EVENT,
    StageSelectedPayload,
} from './SelectStageUseCase';

describe('SelectStageUseCase', () =>
{
    let progression: StageProgression;

    beforeEach(() =>
    {
        DomainEvents.clear();
        progression = new StageProgression();
    });

    it('allows selecting an unlocked stage and emits STAGE_SELECTED_EVENT', () =>
    {
        let emittedPayload: StageSelectedPayload | null = null;
        DomainEvents.on<StageSelectedPayload>(STAGE_SELECTED_EVENT, payload =>
        {
            emittedPayload = payload;
        });

        const success = selectStageUseCase(progression, 'level-1');
        expect(success).toBe(true);
        expect(emittedPayload).toEqual({ stageId: 'level-1' });
    });

    it('rejects selecting a locked stage and emits nothing', () =>
    {
        let emitted = false;
        DomainEvents.on(STAGE_SELECTED_EVENT, () =>
        {
            emitted = true;
        });

        const success = selectStageUseCase(progression, 'level-2');
        expect(success).toBe(false);
        expect(emitted).toBe(false);
    });
});
