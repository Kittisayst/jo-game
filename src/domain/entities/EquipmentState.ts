import { ARMOR_SLOTS, ArmorSlot, WornPiece } from './Armor';

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
    /** The Armor being worn, by place on the hero. Missing in older saves. */
    armor?: Partial<Record<ArmorSlot, WornPiece>>;
}

export class EquipmentState
{
    private _equippedWeaponId: string;
    private _upgradeLevels: Map<string, number>;
    private _armor: Record<ArmorSlot, WornPiece | null> = { head: null, body: null, feet: null };

    constructor (
        equippedWeaponId = 'wooden-sword',
        upgradeLevels: Record<string, number> = {},
        armor: Partial<Record<ArmorSlot, WornPiece>> = {}
    )
    {
        for (const slot of ARMOR_SLOTS)
        {
            const piece = armor[slot];
            if (piece && typeof piece.itemId === 'string') this._armor[slot] = { ...piece };
        }

        this._equippedWeaponId = WEAPON_CONFIGS[equippedWeaponId] ? equippedWeaponId : 'wooden-sword';
        this._upgradeLevels = new Map(Object.entries(upgradeLevels));
    }

    get equippedWeaponId (): string
    {
        return this._equippedWeaponId;
    }

    /** The piece worn in `slot`, or null. */
    getArmor (slot: ArmorSlot): WornPiece | null
    {
        const piece = this._armor[slot];
        return piece ? { ...piece } : null;
    }

    /** Every piece being worn, in head, body, feet order. */
    get wornArmor (): { slot: ArmorSlot; piece: WornPiece }[]
    {
        return ARMOR_SLOTS.flatMap(slot => this._armor[slot] ? [{ slot, piece: { ...this._armor[slot]! } }] : []);
    }

    /** Puts a piece on. Returns the piece that was in that place, if any (the caller puts it back in the Backpack). */
    equipArmor (slot: ArmorSlot, piece: WornPiece): WornPiece | null
    {
        const previous = this._armor[slot];
        this._armor[slot] = { ...piece };
        return previous;
    }

    /** Takes the piece off `slot` and returns it, or null when nothing was worn there. */
    unequipArmor (slot: ArmorSlot): WornPiece | null
    {
        const previous = this._armor[slot];
        this._armor[slot] = null;
        return previous;
    }

    /** Sets how much Durability the worn piece in `slot` has left. */
    setArmorDurability (slot: ArmorSlot, durability: number): void
    {
        const piece = this._armor[slot];
        if (piece) piece.durability = Math.max(0, Math.floor(durability));
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
        const armor: Partial<Record<ArmorSlot, WornPiece>> = {};
        for (const slot of ARMOR_SLOTS)
        {
            const piece = this._armor[slot];
            if (piece) armor[slot] = { ...piece };
        }
        return {
            equippedWeaponId: this._equippedWeaponId,
            upgradeLevels: levels,
            armor,
        };
    }

    /** Replaces the equipped weapon and upgrade levels in place (used when a save is loaded). */
    loadFromSnapshot (snapshot?: EquipmentSnapshot | null): void
    {
        const loaded = EquipmentState.fromSnapshot(snapshot);
        this._equippedWeaponId = loaded._equippedWeaponId;
        this._upgradeLevels = loaded._upgradeLevels;
        this._armor = loaded._armor;
    }

    static fromSnapshot (snapshot?: EquipmentSnapshot | null): EquipmentState
    {
        if (!snapshot)
        {
            return new EquipmentState();
        }
        return new EquipmentState(
            snapshot.equippedWeaponId,
            snapshot.upgradeLevels || {},
            snapshot.armor || {}
        );
    }
}

