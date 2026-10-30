/**
 * The active skills the hero has learned, their rank (1 to 3) and which of them are on the two skill slots
 * (K and L). A skill is learned by passing the exam of its Realm's Textbook (`syncSkillsWithBooksUseCase`) and
 * its rank goes up at the Academy (`upgradeSkillUseCase`). Pure rules, no x/y; see "Skill" in CONTEXT.md.
 */

export const SKILL_SLOT_COUNT = 2;
export const MAX_SKILL_RANK = 3;

export interface SkillProgressionSnapshot
{
    unlocked: string[];
    /** One entry per slot: a skill id, or null for an empty slot. */
    equipped: (string | null)[];
    /** Rank of each learned skill above 1 (a skill missing here is rank 1). Missing in older saves. */
    ranks?: Record<string, number>;
}

export class SkillProgression
{
    private readonly _unlocked = new Set<string>();
    private readonly _equipped: (string | null)[] = new Array(SKILL_SLOT_COUNT).fill(null);
    private readonly _ranks = new Map<string, number>();

    get unlocked (): string[]
    {
        return [...this._unlocked];
    }

    get equipped (): (string | null)[]
    {
        return [...this._equipped];
    }

    isUnlocked (skillId: string): boolean
    {
        return this._unlocked.has(skillId);
    }

    /** The skill on a slot (0 = K, 1 = L), or null. */
    skillInSlot (slot: number): string | null
    {
        return this._equipped[slot] ?? null;
    }

    /** 1 to 3 for a learned skill, 0 for one not learned. */
    rankOf (skillId: string): number
    {
        return this._unlocked.has(skillId) ? (this._ranks.get(skillId) ?? 1) : 0;
    }

    /** Raises a learned skill by one rank. Returns false for a skill not learned or already at the top. */
    upgradeRank (skillId: string): boolean
    {
        const rank = this.rankOf(skillId);
        if (rank === 0 || rank >= MAX_SKILL_RANK) return false;
        this._ranks.set(skillId, rank + 1);
        return true;
    }

    /**
     * Learns a skill. A new skill goes on the first empty slot so it can be used at once.
     * Returns true when it was new.
     */
    unlock (skillId: string): boolean
    {
        if (this._unlocked.has(skillId)) return false;
        this._unlocked.add(skillId);
        const empty = this._equipped.indexOf(null);
        if (empty >= 0) this._equipped[empty] = skillId;
        return true;
    }

    /**
     * Puts a learned skill on a slot (or empties it with null). A skill on another slot moves, so one skill is
     * never on both. Returns false for a skill not learned or a slot that does not exist.
     */
    equip (slot: number, skillId: string | null): boolean
    {
        if (!Number.isInteger(slot) || slot < 0 || slot >= SKILL_SLOT_COUNT) return false;
        if (skillId !== null && !this._unlocked.has(skillId)) return false;
        if (skillId !== null)
        {
            const other = this._equipped.indexOf(skillId);
            if (other >= 0) this._equipped[other] = this._equipped[slot];
        }
        this._equipped[slot] = skillId;
        return true;
    }

    toSnapshot (): SkillProgressionSnapshot
    {
        const ranks: Record<string, number> = {};
        for (const [id, rank] of this._ranks)
        {
            if (this._unlocked.has(id) && rank > 1) ranks[id] = rank;
        }
        return { unlocked: this.unlocked, equipped: this.equipped, ranks };
    }

    /** Loads a save; a skill on a slot that is not learned is dropped from it, a bad rank is ignored. */
    loadFrom (snapshot: SkillProgressionSnapshot | undefined): void
    {
        this._unlocked.clear();
        this._equipped.fill(null);
        this._ranks.clear();
        for (const id of snapshot?.unlocked ?? []) this._unlocked.add(id);
        const used = new Set<string>();
        for (let slot = 0; slot < SKILL_SLOT_COUNT; slot++)
        {
            const id = snapshot?.equipped?.[slot] ?? null;
            if (id !== null && this._unlocked.has(id) && !used.has(id))
            {
                this._equipped[slot] = id;
                used.add(id);
            }
        }
        for (const [id, rank] of Object.entries(snapshot?.ranks ?? {}))
        {
            if (this._unlocked.has(id) && Number.isInteger(rank) && rank >= 2 && rank <= MAX_SKILL_RANK) this._ranks.set(id, rank);
        }
    }
}
