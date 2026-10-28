export interface SkinDefinition
{
    id: string;
    name: string;
    description: string;
    unlockScore: number;
    colorHex: string;
}

export const AVAILABLE_SKINS: SkinDefinition[] = [
    {
        id: 'cyber-blue',
        name: 'Cyber Runner',
        description: 'Classic electric cyan explorer suit',
        unlockScore: 0,
        colorHex: '#0284c7',
    },
    {
        id: 'neon-ninja',
        name: 'Neon Shinobi',
        description: 'Obsidian stealth suit with emerald night visor',
        unlockScore: 300,
        colorHex: '#10b981',
    },
    {
        id: 'cyber-knight',
        name: 'Titanium Knight',
        description: 'Chrome plated armor with crimson targeting slit',
        unlockScore: 800,
        colorHex: '#ef4444',
    },
    {
        id: 'golden-runner',
        name: 'Solar Champion',
        description: '24K gold radiant armor forged from pure energy',
        unlockScore: 1500,
        colorHex: '#f59e0b',
    },
];

/**
 * Domain entity managing available character skins and unlock requirements.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class SkinManager
{
    private _activeSkinId: string;

    constructor (initialSkinId = 'cyber-blue')
    {
        this._activeSkinId = this.isValidSkin(initialSkinId) ? initialSkinId : 'cyber-blue';
    }

    get activeSkinId (): string
    {
        return this._activeSkinId;
    }

    isSkinUnlocked (skinId: string, currentScore: number): boolean
    {
        const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
        if (!skin) return false;
        return currentScore >= skin.unlockScore;
    }

    selectSkin (skinId: string, currentScore: number): boolean
    {
        if (!this.isValidSkin(skinId)) return false;
        if (!this.isSkinUnlocked(skinId, currentScore)) return false;

        this._activeSkinId = skinId;
        return true;
    }

    setActiveSkin (skinId: string): boolean
    {
        return this.forceEquip(skinId);
    }

    forceEquip (skinId: string): boolean
    {
        if (!this.isValidSkin(skinId)) return false;
        this._activeSkinId = skinId;
        return true;
    }

    private isValidSkin (skinId: string): boolean
    {
        return AVAILABLE_SKINS.some(s => s.id === skinId);
    }
}
