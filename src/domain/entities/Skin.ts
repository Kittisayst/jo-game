export interface SkinDefinition
{
    id: string;
    name: string;
    description: string;
    /** Credit price. The default skin is free and always owned. */
    price: number;
    colorHex: string;
}

const DEFAULT_SKIN_ID = 'cyber-blue';

export const AVAILABLE_SKINS: SkinDefinition[] = [
    {
        id: 'cyber-blue',
        name: 'Cyber Runner',
        description: 'Classic electric cyan explorer suit',
        price: 0,
        colorHex: '#0284c7',
    },
    {
        id: 'neon-ninja',
        name: 'Neon Shinobi',
        description: 'Obsidian stealth suit with emerald night visor',
        price: 40,
        colorHex: '#10b981',
    },
    {
        id: 'cyber-knight',
        name: 'Titanium Knight',
        description: 'Chrome plated armor with crimson targeting slit',
        price: 80,
        colorHex: '#ef4444',
    },
    {
        id: 'golden-runner',
        name: 'Solar Champion',
        description: '24K gold radiant armor forged from pure energy',
        price: 120,
        colorHex: '#f59e0b',
    },
];

/**
 * Domain entity managing the available character skins.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class SkinManager
{
    private _activeSkinId: string;
    private _owned: Set<string>;

    constructor (initialSkinId = DEFAULT_SKIN_ID, ownedSkinIds: string[] = [])
    {
        this._owned = new Set([DEFAULT_SKIN_ID]);
        for (const id of ownedSkinIds)
        {
            if (this.isKnown(id)) this._owned.add(id);
        }
        this._activeSkinId = this._owned.has(initialSkinId) ? initialSkinId : DEFAULT_SKIN_ID;
    }

    get activeSkinId (): string
    {
        return this._activeSkinId;
    }

    get ownedSkinIds (): string[]
    {
        return AVAILABLE_SKINS.filter(s => this._owned.has(s.id)).map(s => s.id);
    }

    isOwned (skinId: string): boolean
    {
        return this._owned.has(skinId);
    }

    /** Marks a skin as bought. Returns false for unknown skins and skins already owned. */
    unlock (skinId: string): boolean
    {
        if (!this.isKnown(skinId) || this._owned.has(skinId)) return false;
        this._owned.add(skinId);
        return true;
    }

    /** Equips an owned skin. */
    selectSkin (skinId: string): boolean
    {
        if (!this._owned.has(skinId)) return false;
        this._activeSkinId = skinId;
        return true;
    }

    /** Replaces the ownership and the worn skin, e.g. when a save slot is loaded. */
    restore (activeSkinId: string, ownedSkinIds: string[]): void
    {
        const restored = new SkinManager(activeSkinId, ownedSkinIds);
        this._owned = restored._owned;
        this._activeSkinId = restored._activeSkinId;
    }

    reset (): void
    {
        this._owned = new Set([DEFAULT_SKIN_ID]);
        this._activeSkinId = DEFAULT_SKIN_ID;
    }

    private isKnown (skinId: string): boolean
    {
        return AVAILABLE_SKINS.some(s => s.id === skinId);
    }
}
