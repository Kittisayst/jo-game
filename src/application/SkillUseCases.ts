import { DomainEvents } from '../domain/DomainEvents';
import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { SkillCooldowns } from '../domain/entities/SkillCooldowns';
import { MAX_SKILL_RANK, SkillProgression } from '../domain/entities/SkillProgression';
import { Wallet } from '../domain/entities/Wallet';

export const SKILL_UNLOCKED_EVENT = 'skill-unlocked';
export const SKILL_USED_EVENT = 'skill-used';
export const SKILL_UPGRADED_EVENT = 'skill-upgraded';

/** What a rank-up costs: Credit (earned by learning, spent here) and Materials. */
export interface SkillUpgradeCost
{
    credit: number;
    ingredients: CraftingIngredient[];
}

/** What the rules need to know about a skill (the rest, like its effect, is for the scene). */
export interface SkillRule
{
    id: string;
    realm: number;
    /** The cooldown at rank 1. */
    cooldownMs: number;
    /** The cooldown at rank 1, 2 and 3. */
    rankCooldowns: readonly number[];
    /** The cost of going to rank 2, then to rank 3. */
    upgrades: readonly SkillUpgradeCost[];
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

export interface SkillUpgradedPayload
{
    skillId: string;
    newRank: number;
}

/** The cooldown of a skill at the rank the hero has (rank 1 when not learned). */
export function cooldownAtRank (skill: SkillRule, rank: number): number
{
    return skill.rankCooldowns[Math.min(MAX_SKILL_RANK, Math.max(1, rank)) - 1] ?? skill.cooldownMs;
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

export type UpgradeSkillResult =
    | { success: true; newRank: number }
    | { success: false; reason: 'not_learned' | 'max_rank' | 'no_upgrade_defined' | 'insufficient_credit' | 'insufficient_ingredients' };

/**
 * Raises a learned skill by one rank at the Academy. It takes Credit and Materials; nothing is taken when
 * anything is missing. (Credit is spent here, never made by a skill.)
 */
export function upgradeSkillUseCase (
    skillId: string,
    skills: readonly SkillRule[],
    progression: SkillProgression,
    backpack: Backpack,
    wallet: Wallet
): UpgradeSkillResult
{
    const rank = progression.rankOf(skillId);
    if (rank === 0) return { success: false, reason: 'not_learned' };
    if (rank >= MAX_SKILL_RANK) return { success: false, reason: 'max_rank' };

    const cost = skills.find(s => s.id === skillId)?.upgrades[rank - 1];
    if (!cost) return { success: false, reason: 'no_upgrade_defined' };
    if (cost.credit > 0 && !wallet.canAfford(cost.credit)) return { success: false, reason: 'insufficient_credit' };
    if (cost.ingredients.some(ing => backpack.getItemCount(ing.itemId) < ing.count)) return { success: false, reason: 'insufficient_ingredients' };

    if (cost.credit > 0) wallet.spend(cost.credit);
    for (const ing of cost.ingredients) backpack.removeItem(ing.itemId, ing.count);
    progression.upgradeRank(skillId);

    DomainEvents.emit<SkillUpgradedPayload>(SKILL_UPGRADED_EVENT, { skillId, newRank: rank + 1 });
    return { success: true, newRank: rank + 1 };
}

export type CastSkillResult =
    | { success: true; skillId: string; rank: number }
    | { success: false; reason: 'empty_slot' | 'cooldown' | 'unknown_skill' };

/**
 * The hero presses K or L. Checks the slot and the cooldown, starts the cooldown of the skill's rank and says
 * `skill-used`; the scene then makes the effect happen.
 */
export function castSkillUseCase (
    progression: SkillProgression,
    cooldowns: SkillCooldowns,
    skills: readonly SkillRule[],
    slot: number
): CastSkillResult
{
    const skillId = progression.skillInSlot(slot);
    if (skillId === null) return { success: false, reason: 'empty_slot' };
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return { success: false, reason: 'unknown_skill' };
    if (cooldowns.remainingMs(skillId) > 0) return { success: false, reason: 'cooldown' };

    const rank = progression.rankOf(skillId);
    cooldowns.start(skillId, cooldownAtRank(skill, rank));
    DomainEvents.emit<SkillUsedPayload>(SKILL_USED_EVENT, { skillId, slot });
    return { success: true, skillId, rank };
}
