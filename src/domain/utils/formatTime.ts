/**
 * Formats a given number of seconds into mm:ss.t (minutes:seconds.tenths).
 * Example: 65.4 -> "01:05.4"
 */
export function formatTime (seconds: number | null): string
{
    if (seconds === null || seconds <= 0) return '--:--.-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds * 10) % 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
}
