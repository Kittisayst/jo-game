import { SettingsData, SettingsPort } from '../../domain/ports';
import { readJson, removeKey, writeJson } from './safeStorage';

const STORAGE_KEY = 'jo_settings_v1';

/** Browser LocalStorage implementation of SettingsPort. */
export class LocalStorageSettingsRepository implements SettingsPort
{
    load (): SettingsData
    {
        const parsed = readJson<Partial<SettingsData>>(STORAGE_KEY);
        return {
            soundMuted: parsed?.soundMuted === true,
            musicMuted: parsed?.musicMuted === true,
        };
    }

    save (data: SettingsData): void
    {
        writeJson(STORAGE_KEY, data);
    }

    clear (): void
    {
        removeKey(STORAGE_KEY);
    }
}

export const localStorageSettingsRepository = new LocalStorageSettingsRepository();
