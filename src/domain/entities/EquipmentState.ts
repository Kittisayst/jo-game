export interface WeaponConfig
{
    id: string;
    name: string;
    baseDamage: number;
    cooldownMs: number;
    range: number;
    maxLevel: number;
    upgradeBonuses: number[]; // Index corresponds to level: 0 = +0, 1 = +5, 2 = +10, 3 = +16
}

export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
    'wooden-sword': {
        id: 'wooden-sword',
        name: 'ດາບໄມ້ຝຶກຫັດ',
        baseDamage: 12,
        cooldownMs: 380,
        range: 48,
        maxLevel: 0,
        upgradeBonuses: [0],
    },
    'iron-sword': {
        id: 'iron-sword',
        name: 'ດາບເຫຼັກກ້າ',
        baseDamage: 22,
        cooldownMs: 360,
        range: 52,
        maxLevel: 3,
        upgradeBonuses: [0, 5, 10, 16], // 22 -> 27 -> 32 -> 38
    },
    'crystal-sword': {
        id: 'crystal-sword',
        name: 'ດາບຜລຶກແກ້ວມົນຕາ',
        baseDamage: 38,
        cooldownMs: 340,
        range: 56,
        maxLevel: 3,
        upgradeBonuses: [0, 8, 16, 26], // 38 -> 46 -> 54 -> 64
    },
};

export interface EquipmentSnapshot
{
    equippedWeaponId: string;
    upgradeLevels: Record<string, number>;
}

export class EquipmentState
{
    private _equippedWeaponId: string;
    private _upgradeLevels: Map<string, number>;

    constructor (
        equippedWeaponId = 'wooden-sword',
        upgradeLevels: Record<string, number> = {}
    )
    {
        this._equippedWeaponId = WEAPON_CONFIGS[equippedWeaponId] ? equippedWeaponId : 'wooden-sword';
        this._upgradeLevels = new Map(Object.entries(upgradeLevels));
    }

    get equippedWeaponId (): string
    {
        return this._equippedWeaponId;
    }

    equipWeapon (weaponId: string): boolean
    {
        if (!WEAPON_CONFIGS[weaponId])
        {
            return false;
        }
        this._equippedWeaponId = weaponId;
        return true;
    }

    getUpgradeLevel (weaponId: string): number
    {
        return this._upgradeLevels.get(weaponId) ?? 0;
    }

    canUpgradeWeapon (weaponId: string): boolean
    {
        const config = WEAPON_CONFIGS[weaponId];
        if (!config || config.maxLevel <= 0) return false;
        const current = this.getUpgradeLevel(weaponId);
        return current < config.maxLevel;
    }

    upgradeWeapon (weaponId: string): boolean
    {
        if (!this.canUpgradeWeapon(weaponId))
        {
            return false;
        }
        const current = this.getUpgradeLevel(weaponId);
        this._upgradeLevels.set(weaponId, current + 1);
        return true;
    }

    getWeaponDamage (weaponId: string): number
    {
        const config = WEAPON_CONFIGS[weaponId];
        if (!config) return 10;
        const level = Math.min(config.maxLevel, this.getUpgradeLevel(weaponId));
        const bonus = config.upgradeBonuses[level] ?? 0;
        return config.baseDamage + bonus;
    }

    /** Combat stats of the equipped sword, including its upgrade bonus. */
    get equippedStats (): { id: string; damage: number; cooldownMs: number; range: number }
    {
        const config = WEAPON_CONFIGS[this._equippedWeaponId];
        return {
            id: this._equippedWeaponId,
            damage: this.getWeaponDamage(this._equippedWeaponId),
            cooldownMs: config.cooldownMs,
            range: config.range,
        };
    }

    get currentAttackPower (): number
    {
        return this.getWeaponDamage(this._equippedWeaponId);
    }

    toSnapshot (): EquipmentSnapshot
    {
        const levels: Record<string, number> = {};
        for (const [key, val] of this._upgradeLevels.entries())
        {
            levels[key] = val;
        }
        return {
            equippedWeaponId: this._equippedWeaponId,
            upgradeLevels: levels,
        };
    }

    /** Replaces the equipped weapon and upgrade levels in place (used when a save is loaded). */
    loadFromSnapshot (snapshot?: EquipmentSnapshot | null): void
    {
        const loaded = EquipmentState.fromSnapshot(snapshot);
        this._equippedWeaponId = loaded._equippedWeaponId;
        this._upgradeLevels = loaded._upgradeLevels;
    }

    static fromSnapshot (snapshot?: EquipmentSnapshot | null): EquipmentState
    {
        if (!snapshot)
        {
            return new EquipmentState();
        }
        return new EquipmentState(
            snapshot.equippedWeaponId,
            snapshot.upgradeLevels || {}
        );
    }
}

