import { entities } from './../composition';
import type { DayPhase } from '../../domain/entities/WorldTime';

/** What the HUD shows of the time of day. */
export interface WorldTimeView
{
    phase: DayPhase;
    icon: string;
    label: string;
    /** `m:ss` until the phase changes. */
    countdown: string;
}

const LOOK: Record<DayPhase, { icon: string; label: string }> = {
    day: { icon: '☀️', label: 'ກາງວັນ' },
    dusk: { icon: '🌅', label: 'ຕາເວັນຕົກ' },
    night: { icon: '🌙', label: 'ກາງຄືນ' },
    dawn: { icon: '🌄', label: 'ຟ້າແຈ້ງ' },
};

export function readWorldTime (): WorldTimeView
{
    const { worldTime } = entities;
    const phase = worldTime.phase;
    const seconds = Math.ceil(worldTime.msUntilNextPhase / 1000);
    const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    return { phase, ...LOOK[phase], countdown };
}
