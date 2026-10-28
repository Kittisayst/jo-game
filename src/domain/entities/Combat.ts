/**
 * Domain utility managing player attack cooldown timings and damage formulas.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class AttackCooldown
{
    private _remainingMs = 0;

    get remainingMs (): number
    {
        return this._remainingMs;
    }

    get isReady (): boolean
    {
        return this._remainingMs <= 0;
    }

    canAttack (): boolean
    {
        return this.isReady;
    }

    trigger (cooldownMs: number): void
    {
        this._remainingMs = Math.max(0, cooldownMs);
    }

    tick (deltaMs: number): void
    {
        if (this._remainingMs > 0)
        {
            this._remainingMs = Math.max(0, this._remainingMs - Math.max(0, deltaMs));
        }
    }

    reset (): void
    {
        this._remainingMs = 0;
    }
}

/**
 * Calculates effective attack damage considering weapon base, upgrade bonus, and critical strike.
 */
export function calculateDamage (
    weaponBaseDamage: number,
    upgradeBonusDamage = 0,
    isCritical = false
): number
{
    const base = Math.max(1, weaponBaseDamage);
    const bonus = Math.max(0, upgradeBonusDamage);
    const total = base + bonus;
    return isCritical ? total * 2 : total;
}

/**
 * Calculates effective attack cooldown in ms applying reduction factor from speed upgrades.
 */
export function calculateEffectiveCooldown (
    weaponCooldownMs: number,
    reductionFactor = 1.0
): number
{
    const base = Math.max(50, weaponCooldownMs);
    const factor = Math.max(0.4, Math.min(1.0, reductionFactor));
    return Math.round(base * factor);
}
