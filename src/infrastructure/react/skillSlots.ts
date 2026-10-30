import { entities } from '../composition';
import { getGameContent } from '../content/ContentCatalog';

/** What a skill slot shows in the HUD and on the touch buttons. */
export interface SkillSlotView
{
    slot: number;
    key: 'K' | 'L';
    skillId: string;
    name: string;
    icon: string;
    /** 0 = ready, 1 = just used. */
    cooldown: number;
}

/** The two slots as they are now; an empty slot is null. */
export function readSkillSlots (): (SkillSlotView | null)[]
{
    const defs = getGameContent().skills.active;
    return entities.skills.equipped.map((skillId, slot) =>
    {
        const def = skillId === null ? undefined : defs.find(d => d.id === skillId);
        return def
            ? { slot, key: slot === 0 ? 'K' : 'L', skillId: def.id, name: def.name, icon: def.icon, cooldown: entities.skillCooldowns.fraction(def.id) }
            : null;
    });
}
