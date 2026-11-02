export interface ShopPurchasesSnapshot
{
    dayCount: number;
    bought: Record<string, number>;
}

/**
 * What the Shop of Grandma Chanthy sold today, so a daily limit counts per Game day. The list starts again
 * from empty when the day changes.
 */
export class ShopPurchases
{
    private day = 0;
    private bought = new Map<string, number>();

    boughtToday (itemId: string, dayCount: number): number
    {
        return this.day === dayCount ? (this.bought.get(itemId) ?? 0) : 0;
    }

    record (itemId: string, dayCount: number): void
    {
        if (this.day !== dayCount)
        {
            this.day = dayCount;
            this.bought.clear();
        }
        this.bought.set(itemId, (this.bought.get(itemId) ?? 0) + 1);
    }

    toSnapshot (): ShopPurchasesSnapshot
    {
        return { dayCount: this.day, bought: Object.fromEntries(this.bought) };
    }

    loadFrom (snapshot?: ShopPurchasesSnapshot): void
    {
        this.day = 0;
        this.bought.clear();
        if (!snapshot || typeof snapshot !== 'object') return;
        if (typeof snapshot.dayCount === 'number' && Number.isInteger(snapshot.dayCount) && snapshot.dayCount >= 0) this.day = snapshot.dayCount;
        if (!snapshot.bought || typeof snapshot.bought !== 'object') return;
        for (const [itemId, count] of Object.entries(snapshot.bought))
        {
            if (typeof count === 'number' && Number.isInteger(count) && count > 0) this.bought.set(itemId, count);
        }
    }
}
