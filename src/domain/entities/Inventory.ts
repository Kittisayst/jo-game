export type ItemEffectType = 'heal' | 'shield' | 'star' | 'bomb';

export interface ItemDefinition
{
    id: string;
    name: string;
    nameLao: string;
    description: string;
    descriptionLao: string;
    icon: string;
    price: number;
    maxStack: number;
    effectType: ItemEffectType;
    effectValue: number;
}

export const ITEM_CATALOG: ItemDefinition[] = [
    {
        id: 'heal-potion',
        name: 'Cyber Elixir',
        nameLao: 'ຢາຟື້ນຟູຊີວິດ (+1 ❤️)',
        description: 'Restores 1 Heart of health immediately',
        descriptionLao: 'ເພີ່ມເລືອດ 1 ຫົວໃຈທັນທີ (ໃຊ້ປຸ່ມ 1)',
        icon: '🧪',
        price: 40,
        maxStack: 3,
        effectType: 'heal',
        effectValue: 1,
    },
    {
        id: 'bubble-shield',
        name: 'Nano Shield',
        nameLao: 'ເກາະປ້ອງກັນນາໂນ (Shield 8s)',
        description: 'Grants damage immunity shield for 8 seconds',
        descriptionLao: 'ສ້າງເກາະປ້ອງກັນການໂຈມຕີເປັນເວລາ 8 ວິນາທີ',
        icon: '🛡️',
        price: 60,
        maxStack: 2,
        effectType: 'shield',
        effectValue: 8000, // 8000ms
    },
    {
        id: 'star-candy',
        name: 'Star Candy',
        nameLao: 'ລູກອົມດາວອຳມະຕະ (Star 6s)',
        description: 'Activates Star Invincibility for 6 seconds',
        descriptionLao: 'ແລ່ນຊົນສັດຕູທຸກໂຕໄດ້ທັນທີ 6 ວິນາທີ',
        icon: '⭐',
        price: 100,
        maxStack: 1,
        effectType: 'star',
        effectValue: 6000, // 6000ms
    },
    {
        id: 'slime-bomb',
        name: 'Pulse Bomb',
        nameLao: 'ລະເບີດຄື້ນກວດລ້າງ (2 Dmg)',
        description: 'Detonates a shockwave damaging all on-screen enemies',
        descriptionLao: 'ສ້າງແຮງລະເບີດສ້າງຄວາມເສຍຫາຍ 2 Damage ໃສ່ສັດຕູທຸກໂຕ',
        icon: '💣',
        price: 75,
        maxStack: 3,
        effectType: 'bomb',
        effectValue: 2,
    },
];

export function getItemDefinition (id: string): ItemDefinition | undefined
{
    return ITEM_CATALOG.find(item => item.id === id);
}

/**
 * Domain entity managing the player's usable consumable items.
 */
export class Inventory
{
    private _items: Map<string, number>;

    constructor (initialItems: Record<string, number> = {})
    {
        this._items = new Map();
        this.loadFrom(initialItems);
    }

    getItemCount (id: string): number
    {
        return this._items.get(id) ?? 0;
    }

    getCount (id: string): number
    {
        return this.getItemCount(id);
    }

    canAddItem (id: string, quantity = 1): boolean
    {
        const def = getItemDefinition(id);
        if (!def) return false;
        if (quantity <= 0) return true;

        const current = this.getItemCount(id);
        return current + quantity <= def.maxStack;
    }

    addItem (id: string, quantity = 1): boolean
    {
        const def = getItemDefinition(id);
        if (!def) return false;
        const validQuantity = Math.max(0, Math.floor(quantity));
        if (validQuantity === 0) return true;

        const current = this.getItemCount(id);
        if (current + validQuantity > def.maxStack)
        {
            return false;
        }

        this._items.set(id, current + validQuantity);
        return true;
    }

    consumeItem (id: string): boolean
    {
        const current = this.getItemCount(id);
        if (current <= 0)
        {
            return false;
        }

        if (current === 1)
        {
            this._items.delete(id);
        }
        else
        {
            this._items.set(id, current - 1);
        }
        return true;
    }

    serialize (): Record<string, number>
    {
        return this.toRecord();
    }

    toRecord (): Record<string, number>
    {
        const result: Record<string, number> = {};
        for (const [key, value] of this._items.entries())
        {
            if (value > 0)
            {
                result[key] = value;
            }
        }
        return result;
    }

    loadFrom (record: Record<string, number>): void
    {
        this._items.clear();
        for (const [key, value] of Object.entries(record))
        {
            const def = getItemDefinition(key);
            if (def && typeof value === 'number' && value > 0)
            {
                this._items.set(key, Math.min(def.maxStack, Math.floor(value)));
            }
        }
    }

    reset (): void
    {
        this._items.clear();
    }
}
