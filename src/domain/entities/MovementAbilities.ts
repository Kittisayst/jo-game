/**
 * What the hero can do besides walking and jumping: the Dash (a quick burst that cannot be hit, the dodge),
 * and later the air dash and the double jump. The Dash is there from the start; the others are unlocked by
 * beating Bosses (see docs/plans/2026-10-30-skills-and-tool-upgrades.md). Pure rules, no x/y.
 */

export type MovementAbilityId = 'dash' | 'air-dash' | 'double-jump';

export const MOVEMENT_ABILITY_IDS: readonly MovementAbilityId[] = ['dash', 'air-dash', 'double-jump'];

/** How a Dash feels, from `skills.json`. */
export interface DashTuning
{
    /** Horizontal speed during the Dash, in px/s. */
    speed: number;
    /** How long the burst lasts. */
    durationMs: number;
    /** How long nothing can hurt the hero, from the start of the Dash. */
    dodgeMs: number;
    /** Time before the next Dash. */
    cooldownMs: number;
}

export class MovementAbilities
{
    private readonly _unlocked = new Set<MovementAbilityId>(['dash']);
    private _dashCooldownMs = 0;

    has (id: MovementAbilityId): boolean
    {
        return this._unlocked.has(id);
    }

    /** Unlocks an ability. Returns true when it was new. */
    unlock (id: MovementAbilityId): boolean
    {
        if (this._unlocked.has(id)) return false;
        this._unlocked.add(id);
        return true;
    }

    get unlocked (): MovementAbilityId[]
    {
        return MOVEMENT_ABILITY_IDS.filter(id => this._unlocked.has(id));
    }

    /** Milliseconds until the next Dash; 0 when it is ready. */
    get dashReadyInMs (): number
    {
        return this._dashCooldownMs;
    }

    startDashCooldown (ms: number): void
    {
        this._dashCooldownMs = Math.max(0, ms);
    }

    /** Moves the cooldown on by `deltaMs` of Game time. Not saved: a reload starts ready. */
    tick (deltaMs: number): void
    {
        if (deltaMs > 0) this._dashCooldownMs = Math.max(0, this._dashCooldownMs - deltaMs);
    }

    toSnapshot (): MovementAbilityId[]
    {
        return this.unlocked;
    }

    /** Loads the unlocked abilities; the Dash is always there. Unknown ids are ignored. */
    loadFrom (ids: readonly string[] | undefined): void
    {
        this._unlocked.clear();
        this._unlocked.add('dash');
        for (const id of ids ?? [])
        {
            if ((MOVEMENT_ABILITY_IDS as readonly string[]).includes(id)) this._unlocked.add(id as MovementAbilityId);
        }
        this._dashCooldownMs = 0;
    }
}
