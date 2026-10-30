/** `1:05` for a time in milliseconds (rounded up to whole seconds). */
export const formatCraftTime = (ms: number): string =>
{
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
