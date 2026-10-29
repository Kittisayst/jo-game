import { describe, expect, it } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime domain utility', () =>
{
    it('returns placeholder for null, 0 or negative seconds', () =>
    {
        expect(formatTime(null)).toBe('--:--.-');
        expect(formatTime(0)).toBe('--:--.-');
        expect(formatTime(-5)).toBe('--:--.-');
    });

    it('formats seconds under one minute with tenths', () =>
    {
        expect(formatTime(9.4)).toBe('00:09.4');
        expect(formatTime(59.9)).toBe('00:59.9');
    });

    it('formats times over one minute with zero-padded minutes and seconds', () =>
    {
        expect(formatTime(65.4)).toBe('01:05.4');
        expect(formatTime(125.8)).toBe('02:05.8');
    });
});
