/**
 * Safe wrapper around window.localStorage — tolerates SSR, private browsing, and quota errors.
 * All keys this game writes start with `jo_` so a reset never touches other apps' data.
 */
export const STORAGE_PREFIX = 'jo_';

function storage (): Storage | null
{
    try
    {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
    }
    catch
    {
        return null;
    }
}

export function readJson<T> (key: string): T | null
{
    const s = storage();
    if (!s) return null;
    try
    {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    }
    catch
    {
        return null;
    }
}

export function readString (key: string): string | null
{
    const s = storage();
    if (!s) return null;
    try
    {
        return s.getItem(key);
    }
    catch
    {
        return null;
    }
}

export function writeString (key: string, value: string): void
{
    const s = storage();
    if (!s) return;
    try
    {
        s.setItem(key, value);
    }
    catch
    {
        // Ignore quota or private-browsing storage errors gracefully
    }
}

export function writeJson (key: string, value: unknown): void
{
    writeString(key, JSON.stringify(value));
}

/**
 * Atomic crash-safe JSON writer (save-systems pattern).
 * Keeps a .bak copy of the previous good save before overwriting.
 */
export function writeJsonAtomic (key: string, value: unknown): void
{
    const s = storage();
    if (!s) return;
    try
    {
        const serialized = JSON.stringify(value);
        const existing = s.getItem(key);
        if (existing)
        {
            s.setItem(`${key}_bak`, existing);
        }
        s.setItem(`${key}_tmp`, serialized);
        s.setItem(key, serialized);
        s.removeItem(`${key}_tmp`);
    }
    catch
    {
        // Graceful handling of quota errors
    }
}

/**
 * Defensive JSON reader that automatically falls back to .bak if primary is corrupted or null.
 */
export function readJsonSafe<T> (key: string): T | null
{
    const primary = readJson<T>(key);
    if (primary !== null) return primary;

    // Fallback to .bak
    return readJson<T>(`${key}_bak`);
}

export function removeKey (key: string): void
{
    const s = storage();
    if (!s) return;
    try
    {
        s.removeItem(key);
        s.removeItem(`${key}_bak`);
        s.removeItem(`${key}_tmp`);
    }
    catch
    {
        // ignore
    }
}
