export type WeaponType = 'melee' | 'ranged' | 'heavy';

export interface WeaponDefinition
{
    id: string;
    name: string;
    nameLao: string;
    description: string;
    descriptionLao: string;
    type: WeaponType;
    baseDamage: number;
    cooldownMs: number;
    range: number;
    price: number;
    icon: string;
    projectileSpeed?: number;
}

export const DEFAULT_WEAPON_ID = 'cyber-saber';

export const WEAPON_CATALOG: WeaponDefinition[] = [
    {
        id: 'cyber-saber',
        name: 'Cyber Saber',
        nameLao: 'ດາບເລເຊີໄຊເບີ',
        description: 'High-frequency energy blade for fast melee strikes',
        descriptionLao: 'ດາບພະລັງງານແສງຟັນໄວ ໄລຍະປະຊິດ 48px',
        type: 'melee',
        baseDamage: 1,
        cooldownMs: 320,
        range: 48,
        price: 0, // Free starting weapon
        icon: '🗡️',
    },
    {
        id: 'plasma-blaster',
        name: 'Plasma Blaster',
        nameLao: 'ປືນພລາສມາໄລຍະໄກ',
        description: 'Shoots rapid concentrated plasma bolts',
        descriptionLao: 'ຍິງລູກພລາສມາໄລຍະໄກ 320px ຢ່າງວ່ອງໄວ',
        type: 'ranged',
        baseDamage: 1,
        cooldownMs: 400,
        range: 320,
        price: 150,
        icon: '🔫',
        projectileSpeed: 380,
    },
    {
        id: 'thunder-hammer',
        name: 'Thunder Hammer',
        nameLao: 'ຄ້ອນສາຍຟ້າທະລາຍພື້ນ',
        description: 'Heavy ground slam emitting bilateral shockwaves',
        descriptionLao: 'ທຸບພື້ນສ້າງຄື້ນສັ່ນສະເທືອນຮຸນແຮງ 2 Damage',
        type: 'heavy',
        baseDamage: 2,
        cooldownMs: 750,
        range: 72,
        price: 350,
        icon: '🔨',
    },
    {
        id: 'boomerang-disc',
        name: 'Cyber Disc',
        nameLao: 'ກົງຈັກບູມເມີແລງ',
        description: 'Returning energy disc that cuts through foes twice',
        descriptionLao: 'ຖິ້ມອອກໄປແລ້ວບິນກັບມາ ໂຈມຕີໄດ້ 2 ຄັ້ງ',
        type: 'ranged',
        baseDamage: 1,
        cooldownMs: 550,
        range: 240,
        price: 280,
        icon: '🪃',
        projectileSpeed: 300,
    },
];

export function getWeaponDefinition (weaponId: string): WeaponDefinition
{
    return WEAPON_CATALOG.find(w => w.id === weaponId) ?? WEAPON_CATALOG[0];
}

/**
 * Domain entity managing owned weapons and currently equipped weapon.
 */
export class WeaponLoadout
{
    private _ownedWeapons: Set<string>;
    private _equippedId: string;

    constructor (
        initialOwned: string[] = [DEFAULT_WEAPON_ID],
        initialEquipped = DEFAULT_WEAPON_ID
    )
    {
        this._ownedWeapons = new Set([DEFAULT_WEAPON_ID, ...initialOwned]);
        this._equippedId = this._ownedWeapons.has(initialEquipped)
            ? initialEquipped
            : DEFAULT_WEAPON_ID;
    }

    get ownedWeapons (): string[]
    {
        return Array.from(this._ownedWeapons);
    }

    get equippedId (): string
    {
        return this._equippedId;
    }

    get equippedDefinition (): WeaponDefinition
    {
        return getWeaponDefinition(this._equippedId);
    }

    hasWeapon (weaponId: string): boolean
    {
        return this._ownedWeapons.has(weaponId);
    }

    unlockWeapon (weaponId: string): boolean
    {
        const exists = WEAPON_CATALOG.some(w => w.id === weaponId);
        if (!exists) return false;
        if (this._ownedWeapons.has(weaponId)) return false;

        this._ownedWeapons.add(weaponId);
        return true;
    }

    equipWeapon (weaponId: string): boolean
    {
        if (!this._ownedWeapons.has(weaponId))
        {
            return false;
        }
        this._equippedId = weaponId;
        return true;
    }

    cycleNext (): string
    {
        const list = this.ownedWeapons;
        if (list.length <= 1) return this._equippedId;

        const currentIndex = list.indexOf(this._equippedId);
        const nextIndex = (currentIndex + 1) % list.length;
        this._equippedId = list[nextIndex];
        return this._equippedId;
    }

    serialize (): { owned: string[]; equippedId: string }
    {
        return {
            owned: this.ownedWeapons,
            equippedId: this._equippedId,
        };
    }

    loadFrom (data?: { owned?: string[]; equippedId?: string }): void
    {
        if (!data) return;
        this._ownedWeapons = new Set([DEFAULT_WEAPON_ID, ...(data.owned ?? [])]);
        this._equippedId = (data.equippedId && this._ownedWeapons.has(data.equippedId))
            ? data.equippedId
            : DEFAULT_WEAPON_ID;
    }

    reset (): void
    {
        this._ownedWeapons = new Set([DEFAULT_WEAPON_ID]);
        this._equippedId = DEFAULT_WEAPON_ID;
    }
}
