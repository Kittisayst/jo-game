import React from 'react';
import type { DurabilityReading } from '../../../domain/entities/Backpack';
import type { DurabilityState } from '../../../domain/entities/Durability';

const COLORS: Record<DurabilityState, string> = {
    ok: '#22c55e',
    low: '#f59e0b',
    broken: '#ef4444',
};

const DURABILITY_LABEL: Record<DurabilityState, string> = {
    ok: 'ປົກກະຕິ',
    low: 'ເກືອບພັງ',
    broken: 'ພັງ',
};

interface DurabilityBarProps
{
    reading: DurabilityReading;
    /** A thin bar without numbers, for a slot or the HUD. */
    compact?: boolean;
}

/** How worn a weapon or tool is: a bar that turns amber when low and red when Broken. Inline styles so the HUD can use it too. */
export const DurabilityBar: React.FC<DurabilityBarProps> = ({ reading, compact = false }) =>
{
    const percent = reading.max > 0 ? Math.max(0, Math.min(100, (reading.current / reading.max) * 100)) : 0;
    const color = COLORS[reading.state];

    return (
        <span
            data-testid="durability-bar"
            data-state={reading.state}
            title={`ຄວາມທົນທານ ${reading.current}/${reading.max} (${DURABILITY_LABEL[reading.state]})`}
            style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, width: compact ? 34 : '100%' }}
        >
            <span style={{ display: 'block', height: compact ? 3 : 6, borderRadius: 3, background: 'rgba(15, 23, 42, 0.85)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${percent}%`, background: color }} />
            </span>
            {!compact && (
                <span style={{ fontSize: 11, color, fontWeight: 700 }}>
                    {reading.current}/{reading.max} · {DURABILITY_LABEL[reading.state]}
                </span>
            )}
        </span>
    );
};
