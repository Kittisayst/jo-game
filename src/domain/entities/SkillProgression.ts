/**
 * The active skills the hero has learned and which of them are on the two skill slots (K and L).
 * A skill is learned by passing the exam of its Realm's Textbook; the rules for that are in
 * `unlockSkillsForBooksUseCase`. Pure rules, no x/y; see "Skill" in CONTEXT.md.
 */

export const SKILL_SLOT_COUNT = 2;

export interface SkillProgressionSnapshot
{
    unlocked: string[];
    /** One entry per slot: a skill id, or null for an empty slot. */
    equipped: (string | null)[];
}

export class SkillProgression
{
    private readonly _unlocked = new Set<string>();
    private readonly _equipped: (string | null)[] = new Array(SKILL_SLOT_COUNT).fill(null);

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
        return { unlocked: this.unlocked, equipped: this.equipped };
    }

    /** Loads a save; a skill on a slot that is not learned is dropped from it. */
    loadFrom (snapshot: SkillProgressionSnapshot | undefined): void
    {
        this._unlocked.clear();
        this._equipped.fill(null);
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
    }
}
