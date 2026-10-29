import { SkinPort } from '../../domain/ports';
import { readString, removeKey, writeString } from './safeStorage';

// Kept identical to the previous key so existing players keep their equipped skin.
const STORAGE_KEY = 'jo_active_skin';

/** Browser LocalStorage implementation of SkinPort. */
export class LocalStorageSkinRepository implements SkinPort
{
    loadActiveSkinId (): string | null
    {
        return readString(STORAGE_KEY);
    }

    saveActiveSkinId (skinId: string): void
    {
        writeString(STORAGE_KEY, skinId);
    }

    clear (): void
    {
        removeKey(STORAGE_KEY);
    }
}

export const localStorageSkinRepository = new LocalStorageSkinRepository();
