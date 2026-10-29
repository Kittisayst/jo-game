/**
 * Domain entity representing the Player's persistent currency/wallet.
 * Pure business rules — see "Domain layer" in CONTEXT.md.
 */
export class Wallet
{
    private _balance: number;

    constructor (initialBalance = 0)
    {
        this._balance = Math.max(0, Math.floor(initialBalance));
    }

    get balance (): number
    {
        return this._balance;
    }

    canAfford (cost: number): boolean
    {
        if (cost <= 0) return true;
        return this._balance >= Math.floor(cost);
    }

    earn (amount: number): number
    {
        const valid = Math.max(0, Math.floor(amount));
        this._balance += valid;
        return this._balance;
    }

    spend (amount: number): boolean
    {
        const valid = Math.max(0, Math.floor(amount));
        if (this._balance < valid)
        {
            return false;
        }
        this._balance -= valid;
        return true;
    }

    setBalance (amount: number): void
    {
        this._balance = Math.max(0, Math.floor(amount));
    }

    reset (): void
    {
        this._balance = 0;
    }
}
