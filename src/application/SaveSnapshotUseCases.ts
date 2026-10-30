import { GameState } from '../domain/entities/GameState';
import { createDefaultSaveSnapshot, SaveGameSnapshot } from '../domain/entities/SaveData';
import { SavePort, SkinPort, SettingsPort, StageProgressionPort } from '../domain/ports';
import { resetSaveDataUseCase } from './ResetSaveDataUseCase';
import { applySettingsUseCase } from './UpdateSettingsUseCase';

/** The per-topic stores that mirror parts of the game state outside the save slots. */
export interface StatePorts
{
    skin: SkinPort;
    settings: SettingsPort;
    stageProgression: StageProgressionPort;
}

/** Captures the whole game state for saving. Defaults to the slot the player is using. */
export function createSaveSnapshotUseCase (state: GameState, savePort: SavePort, slotId?: string): SaveGameSnapshot
{
    return state.toSnapshot(slotId ?? savePort.getActiveSlot());
}

/**
 * Puts a loaded save into the live game state and keeps the per-topic stores
 * (skin, settings, stage progress) in step with it. Callers refresh their screens afterwards.
 */
export function restoreSaveSnapshotUseCase (state: GameState, snapshot: SaveGameSnapshot, ports: StatePorts): void
{
    state.loadFromSnapshot(snapshot);

    ports.skin.saveActiveSkinId(state.skinManager.activeSkinId);
    ports.settings.save({
        soundMuted: state.settings.isSoundMuted,
        musicMuted: state.settings.isMusicMuted,
    });
    ports.stageProgression.save({
        unlockedStages: state.stageProgression.unlockedStages,
        completedStages: state.stageProgression.completedStages,
        questionRewardedStages: state.stageProgression.questionRewardedStages,
    });
    applySettingsUseCase(state.settings);
}

/** Wipes the active slot and turns the game state back into a brand-new player. */
export function resetGameUseCase (state: GameState, ports: StatePorts, savePort: SavePort): void
{
    const slot = savePort.getActiveSlot();

    resetSaveDataUseCase(
        { skinManager: state.skinManager, settings: state.settings, stageProgression: state.stageProgression },
        ports
    );
    savePort.clearSlot(slot);
    restoreSaveSnapshotUseCase(state, createDefaultSaveSnapshot(slot), ports);
}
