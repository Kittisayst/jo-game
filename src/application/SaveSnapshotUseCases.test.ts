import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { GameState } from '../domain/entities/GameState';
import { createDefaultSaveSnapshot, CURRENT_SAVE_VERSION } from '../domain/entities/SaveData';
import { createTestItemCatalog } from '../domain/testing/itemCatalog';
import { SavePort } from '../domain/ports';
import {
    createSaveSnapshotUseCase,
    resetGameUseCase,
    restoreSaveSnapshotUseCase,
    StatePorts,
} from './SaveSnapshotUseCases';
import { SETTINGS_CHANGED_EVENT } from './UpdateSettingsUseCase';

function fakePorts (): StatePorts
{
    return {
        skin: { loadActiveSkinId: vi.fn(), saveActiveSkinId: vi.fn(), clear: vi.fn() },
        settings: { load: vi.fn(), save: vi.fn(), clear: vi.fn() },
        stageProgression: { load: vi.fn(), save: vi.fn(), clear: vi.fn() },
    };
}

function fakeSavePort (slot = 'slot_2')
{
    const clearSlot = vi.fn<(slotId: string) => void>();
    return { getActiveSlot: () => slot, clearSlot } satisfies SavePort;
}

/** A player who has progressed: bought things, hurt, read pages, repaired the gate. */
function progressedState (): GameState
{
    const state = new GameState(createTestItemCatalog());
    state.wallet.setBalance(135);
    state.skinManager.unlock('neon-ninja');
    state.skinManager.selectSkin('neon-ninja');
    state.settings.setSoundMuted(true);
    state.stageProgression.completeStage('stage-001');
    state.backpack.addItem('wood', 7);
    state.backpack.addItem('crystal', 2);
    state.backpack.addItem('iron-sword', 1);
    state.equipment.equipWeapon('iron-sword');
    state.books['book-ch1'].unlock();
    state.repairedGates.add('gate-ch1');
    state.forgeUnlocked = true;
    return state;
}

describe('GameState snapshot round trip', () =>
{
    it('loads a snapshot into a fresh state without replacing any member', () =>
    {
        const source = progressedState();
        const snapshot = source.toSnapshot('slot_1', 123);

        const target = new GameState(createTestItemCatalog());
        const { backpack, equipment, books, repairedGates, spacedRepetition } = target;
        target.loadFromSnapshot(snapshot);

        expect(target.toSnapshot('slot_1', 123)).toEqual(snapshot);
        expect(target.backpack).toBe(backpack);
        expect(target.equipment).toBe(equipment);
        expect(target.books).toBe(books);
        expect(target.repairedGates).toBe(repairedGates);
        expect(target.spacedRepetition).toBe(spacedRepetition);
        expect(target.wallet.balance).toBe(135);
        expect(target.backpack.getItemCount('wood')).toBe(7);
        expect(target.equipment.equippedWeaponId).toBe('iron-sword');
        expect(target.repairedGates.has('gate-ch1')).toBe(true);
        expect(target.forgeUnlocked).toBe(true);
    });

    it('drops state the loaded save does not have', () =>
    {
        const state = progressedState();

        state.loadFromSnapshot(createDefaultSaveSnapshot('slot_1'));

        expect(state.repairedGates.size).toBe(0);
        expect(state.forgeUnlocked).toBe(false);
        expect(state.backpack.getItemCount('wood')).toBe(0);
        expect(state.books['book-ch1'].isUnlocked).toBe(false);
        expect(state.skinManager.activeSkinId).toBe('cyber-blue');
    });

    it('stamps the current save version', () =>
    {
        expect(new GameState().toSnapshot('slot_1').version).toBe(CURRENT_SAVE_VERSION);
    });
});

describe('createSaveSnapshotUseCase', () =>
{
    it('uses the active slot unless one is given', () =>
    {
        const state = progressedState();
        const savePort = fakeSavePort('slot_3');

        expect(createSaveSnapshotUseCase(state, savePort).slotId).toBe('slot_3');
        expect(createSaveSnapshotUseCase(state, savePort, 'slot_1').slotId).toBe('slot_1');
    });
});

describe('restoreSaveSnapshotUseCase', () =>
{
    it('loads the state, mirrors it into the per-topic ports and re-announces settings', () =>
    {
        const snapshot = progressedState().toSnapshot('slot_1');
        const state = new GameState(createTestItemCatalog());
        const ports = fakePorts();
        const onSettings = vi.fn();

        DomainEvents.on(SETTINGS_CHANGED_EVENT, onSettings);
        restoreSaveSnapshotUseCase(state, snapshot, ports);
        DomainEvents.off(SETTINGS_CHANGED_EVENT, onSettings);

        expect(state.wallet.balance).toBe(135);
        expect(ports.skin.saveActiveSkinId).toHaveBeenCalledWith('neon-ninja');
        expect(ports.settings.save).toHaveBeenCalledWith({ soundMuted: true, musicMuted: false });
        expect(ports.stageProgression.save).toHaveBeenCalledWith({
            unlockedStages: snapshot.stageProgression.unlockedStages,
            completedStages: ['stage-001'],
            questionRewardedStages: [],
        });
        expect(onSettings).toHaveBeenCalledWith({ soundMuted: true, musicMuted: false });
    });
});

describe('resetGameUseCase', () =>
{
    it('wipes the active slot and gives a brand-new player with the starter kit', () =>
    {
        const state = progressedState();
        const ports = fakePorts();
        const savePort = fakeSavePort('slot_2');

        resetGameUseCase(state, ports, savePort);

        expect(savePort.clearSlot).toHaveBeenCalledWith('slot_2');
        expect(ports.skin.clear).toHaveBeenCalled();
        expect(state.wallet.balance).toBe(20);
        expect(state.skinManager.ownedSkinIds).toEqual(['cyber-blue']);
        expect(state.settings.isSoundMuted).toBe(false);
        expect(state.stageProgression.completedStages).toEqual([]);
        expect(state.backpack.getItemCount('wooden-sword')).toBe(1);
        expect(state.backpack.getItemCount('axe-t1')).toBe(1);
        expect(state.backpack.getItemCount('wood')).toBe(0);
        expect(state.equipment.equippedWeaponId).toBe('wooden-sword');
        expect(state.forgeUnlocked).toBe(false);
    });
});
