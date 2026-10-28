export type UpgradeType = 'maxHp' | 'weaponPower' | 'attackSpeed' | 'coinMagnet' | 'dash';

export interface UpgradeDefinition
{
    id: UpgradeType;
    name: string;
    nameLao: string;
    description: string;
    descriptionLao: string;
    icon: string;
    maxLevel: number;
    prices: number[]; // Price per level: prices[0] = Lv 1 cost, prices[1] = Lv 2 cost...
}

export const UPGRADE_CATALOG: UpgradeDefinition[] = [
    {
        id: 'maxHp',
        name: 'Vitality Armor',
        nameLao: 'ເກາະເພີ່ມຫົວໃຈ (Max HP)',
        description: '+1 Maximum Heart per level',
        descriptionLao: 'ເພີ່ມຫົວໃຈສູງສຸດ +1 ດວງຕໍ່ລະດັບ (ສູງສຸດ 6 ດວງ)',
        icon: '❤️',
        maxLevel: 3,
        prices: [100, 200, 350],
    },
    {
        id: 'weaponPower',
        name: 'Weapon Power',
        nameLao: 'ເພີ່ມພະລັງໂຈມຕີ (Weapon Power)',
        description: 'Boosts attack damage and critical chance',
        descriptionLao: 'ເພີ່ມຄວາມແຮງການໂຈມຕີ ແລະ ໂອກາດຕິດຄຣິຕິຄໍ',
        icon: '⚔️',
        maxLevel: 3,
        prices: [120, 250, 450],
    },
    {
        id: 'attackSpeed',
        name: 'Rapid Reflexes',
        nameLao: 'ຄວາມໄວໂຈມຕີ (Attack Speed)',
        description: 'Reduces attack cooldown by 12% per level',
        descriptionLao: 'ຫຼຸດເວລາ Cooldown ການໂຈມຕີ 12% ຕໍ່ລະດັບ',
        icon: '⚡',
        maxLevel: 3,
        prices: [100, 220, 400],
    },
    {
        id: 'coinMagnet',
        name: 'Coin Magnet',
        nameLao: 'ແມ່ເຫຼັກດູດຫຼຽນ (Coin Magnet)',
        description: 'Draws nearby coins toward you automatically',
        descriptionLao: 'ດູດຫຼຽນໃນບໍລິເວນອ້ອມຂ້າງເຂົ້າຫາຕົວລະຄອນ',
        icon: '🧲',
        maxLevel: 2,
        prices: [150, 300],
    },
    {
        id: 'dash',
        name: 'Cyber Dash',
        nameLao: 'ທ່າພຸ່ງຕົວຫຼົບຫຼີກ (Cyber Dash)',
        description: 'Press Shift to dash forward with momentary invincibility',
        descriptionLao: 'ກົດ Shift ຫຼື ປຸ່ມ Dash ເພື່ອພຸ່ງຕົວໄປໜ້າຢ່າງໄວວາ',
        icon: '👟',
        maxLevel: 1,
        prices: [500],
    },
];

export function getUpgradeDefinition (id: UpgradeType): UpgradeDefinition
{
    return UPGRADE_CATALOG.find(u => u.id === id) ?? UPGRADE_CATALOG[0];
}

export interface PlayerUpgradeStats
{
    bonusMaxHp: number;
    bonusDamage: number;
    cooldownReductionFactor: number; // e.g. 0.88 for 12% reduction
    magnetRadius: number; // in pixels
    hasDash: boolean;
}

/**
 * Domain entity managing the player's permanent upgrade progression.
 */
export class UpgradeTree
{
    private _levels: Record<UpgradeType, number>;

    constructor (initialLevels: Partial<Record<UpgradeType, number>> = {})
    {
        this._levels = {
            maxHp: Math.min(3, Math.max(0, initialLevels.maxHp ?? 0)),
            weaponPower: Math.min(3, Math.max(0, initialLevels.weaponPower ?? 0)),
            attackSpeed: Math.min(3, Math.max(0, initialLevels.attackSpeed ?? 0)),
            coinMagnet: Math.min(2, Math.max(0, initialLevels.coinMagnet ?? 0)),
            dash: Math.min(1, Math.max(0, initialLevels.dash ?? 0)),
        };
    }

    get levels (): Record<UpgradeType, number>
    {
        return { ...this._levels };
    }

    getLevel (id: UpgradeType): number
    {
        return this._levels[id] ?? 0;
    }

    isMaxLevel (id: UpgradeType): boolean
    {
        const def = getUpgradeDefinition(id);
        return this.getLevel(id) >= def.maxLevel;
    }

    getCost (id: UpgradeType): number | null
    {
        const def = getUpgradeDefinition(id);
        const currentLvl = this.getLevel(id);
        if (currentLvl >= def.maxLevel)
        {
            return null;
        }
        return def.prices[currentLvl] ?? null;
    }

    upgrade (id: UpgradeType): boolean
    {
        if (this.isMaxLevel(id))
        {
            return false;
        }
        this._levels[id] = (this._levels[id] ?? 0) + 1;
        return true;
    }

    get hasDash (): boolean
    {
        return this.getLevel('dash') >= 1;
    }

    getNextCost (id: UpgradeType): number | null
    {
        return this.getCost(id);
    }

    serialize (): Record<UpgradeType, number>
    {
        return this.levels;
    }

    computeStats (): PlayerUpgradeStats
    {
        const hpLvl = this.getLevel('maxHp');
        const powerLvl = this.getLevel('weaponPower');
        const speedLvl = this.getLevel('attackSpeed');
        const magnetLvl = this.getLevel('coinMagnet');
        const dashLvl = this.getLevel('dash');

        return {
            bonusMaxHp: hpLvl,
            bonusDamage: Math.floor(powerLvl / 2) + (powerLvl === 3 ? 1 : 0), // Lv1: 0, Lv2: +1, Lv3: +2
            cooldownReductionFactor: Math.max(0.5, 1 - speedLvl * 0.12), // 1.0, 0.88, 0.76, 0.64
            magnetRadius: magnetLvl === 2 ? 140 : (magnetLvl === 1 ? 75 : 0),
            hasDash: dashLvl >= 1,
        };
    }

    loadFrom (levels: Partial<Record<UpgradeType, number>>): void
    {
        this._levels = {
            maxHp: Math.min(3, Math.max(0, levels.maxHp ?? 0)),
            weaponPower: Math.min(3, Math.max(0, levels.weaponPower ?? 0)),
            attackSpeed: Math.min(3, Math.max(0, levels.attackSpeed ?? 0)),
            coinMagnet: Math.min(2, Math.max(0, levels.coinMagnet ?? 0)),
            dash: Math.min(1, Math.max(0, levels.dash ?? 0)),
        };
    }

    reset (): void
    {
        this._levels = {
            maxHp: 0,
            weaponPower: 0,
            attackSpeed: 0,
            coinMagnet: 0,
            dash: 0,
        };
    }
}
