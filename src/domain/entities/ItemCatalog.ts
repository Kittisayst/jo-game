export type ItemCategory = 'material' | 'consumable' | 'tool' | 'weapon';

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
    /** Hearts restored when the item is consumed. */
    healAmount?: number;
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
