import type { ArmorSlot, PotionEffect } from './Armor';

export type ItemCategory = 'material' | 'consumable' | 'tool' | 'weapon' | 'armor';

/** Stack size used for an item the catalog does not know. */
export const DEFAULT_MAX_STACK = 99;

/** One kind of item, as authored in `public/data/items.json`. */
export interface ItemDefinition
{
    id: string;
    name: string;
    nameEn: string;
    description: string;
    category: ItemCategory;
    maxStack: number;
    icon: string;
    /** Optional path to a crisp 32x32 pixel-art item sprite in `public/assets/items/`. */
    iconImage?: string;
    /** Story Materials (crystal, boss core) are never lost when the player dies or retreats. */
    story?: boolean;
    toolType?: string;
    tier?: number;
    baseDamage?: number;
    maxUpgradeLevel?: number;
    /** Hearts restored when the item is consumed (the health potion). */
    healAmount?: number;
    /** What a Potion does besides healing: strength, armor or speed (see `amount` and `durationSec`). */
    effect?: PotionEffect;
    /** Size of the effect: Armor hearts for an armor potion. */
    amount?: number;
    /** How long a strength or speed potion lasts, in seconds. */
    durationSec?: number;
    /** A Seed: planted in a Garden Plot it grows for `minutes` of real time and then gives `harvest`. */
    plant?: { minutes: number; harvest: { itemId: string; count: number }[] };
    /** Armor only: which of the three places on the hero it is worn. */
    slot?: ArmorSlot;
    /** Armor only: Armor hearts it gives while it is not Broken. */
    armorHearts?: number;
    /** Armor only: extra walking speed as a share (0.1 = +10 %). */
    speedBonus?: number;
    /** How many uses a weapon or tool lasts before it is Broken. Missing = it never wears (the wooden sword). */
    durability?: number;
}

/**
 * The single source of truth for what each item is. Rules that depend on an item's kind
 * (stack size, what is lost on death) ask the catalog instead of keeping their own lists.
 * It is filled once at startup, so it can be created empty and loaded later.
 */
export class ItemCatalog
{
    private readonly _byId = new Map<string, ItemDefinition>();

    constructor (definitions: ItemDefinition[] = [])
    {
        this.load(definitions);
    }

    /** Replaces the catalog contents. */
    load (definitions: ItemDefinition[]): void
    {
        this._byId.clear();
        for (const definition of definitions)
        {
            this._byId.set(definition.id, definition);
        }
    }

    get (itemId: string): ItemDefinition | undefined
    {
        return this._byId.get(itemId);
    }

    all (): ItemDefinition[]
    {
        return Array.from(this._byId.values());
    }

    maxStackOf (itemId: string): number
    {
        const maxStack = this._byId.get(itemId)?.maxStack;
        return maxStack && maxStack > 0 ? maxStack : DEFAULT_MAX_STACK;
    }

    /** The Durability of a new item, or undefined when the item never wears. */
    maxDurabilityOf (itemId: string): number | undefined
    {
        return this._byId.get(itemId)?.durability;
    }

    isMaterial (itemId: string): boolean
    {
        return this._byId.get(itemId)?.category === 'material';
    }

    isStory (itemId: string): boolean
    {
        return this._byId.get(itemId)?.story === true;
    }

    /** Materials that are halved when the player dies or retreats from a Stage. */
    isLostOnRetreat (itemId: string): boolean
    {
        return this.isMaterial(itemId) && !this.isStory(itemId);
    }
}
