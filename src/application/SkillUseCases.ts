import { DomainEvents } from '../domain/DomainEvents';
import { SkillCooldowns } from '../domain/entities/SkillCooldowns';
import { SkillProgression } from '../domain/entities/SkillProgression';

export const SKILL_UNLOCKED_EVENT = 'skill-unlocked';
export const SKILL_USED_EVENT = 'skill-used';

/** What the rules need to know about a skill (the rest, like its effect, is for the scene). */
export interface SkillRule
{
    id: string;
    realm: number;
    cooldownMs: number;
}

export interface SkillUnlockedPayload
{
    skillId: string;
}

export interface SkillUsedPayload
{
    skillId: string;
    slot: number;
}

/**
 * Teaches the hero the skill of every Realm whose Textbook exam was passed. Safe to call again and again
 * (also after loading a save made before skills existed): only new skills come back.
 */
export function syncSkillsWithBooksUseCase (
    progression: SkillProgression,
    skills: readonly SkillRule[],
    realms: readonly { number: number; bookId: string | null }[],
    passedBookIds: ReadonlySet<string>
): string[]
{
    const learned: string[] = [];
    for (const skill of skills)
    {
        const realm = realms.find(r => r.number === skill.realm);
        if (!realm?.bookId || !passedBookIds.has(realm.bookId)) continue;
        if (progression.unlock(skill.id))
        {
            learned.push(skill.id);
            DomainEvents.emit<SkillUnlockedPayload>(SKILL_UNLOCKED_EVENT, { skillId: skill.id });
        }
    }
    return learned;
}

/** Puts a learned skill on slot 0 (K) or 1 (L), or empties the slot with null. */
export function equipSkillUseCase (progression: SkillProgression, slot: number, skillId: string | null): boolean
{
    return progression.equip(slot, skillId);
}

export type UseSkillResult =
    | { success: true; skillId: string }
    | { success: false; reason: 'empty_slot' | 'cooldown' | 'unknown_skill' };

/**
 * The hero presses K or L. Checks the slot and the cooldown, starts the cooldown and says `skill-used`; the
 * scene then makes the effect happen.
 */
export function castSkillUseCase (
    progression: SkillProgression,
    cooldowns: SkillCooldowns,
    skills: readonly SkillRule[],
    slot: number
): UseSkillResult
{
    const skillId = progression.skillInSlot(slot);
    if (skillId === null) return { success: false, reason: 'empty_slot' };
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return { success: false, reason: 'unknown_skill' };
    if (cooldowns.remainingMs(skillId) > 0) return { success: false, reason: 'cooldown' };

    cooldowns.start(skillId, skill.cooldownMs);
    DomainEvents.emit<SkillUsedPayload>(SKILL_USED_EVENT, { skillId, slot });
    return { success: true, skillId };
}
