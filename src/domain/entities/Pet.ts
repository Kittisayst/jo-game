import { Wallet } from './Wallet';

export interface PetDefinition
{
    id: string;
    name: string;
    price: number;
    icon: string;
    spriteKey: string;
    soundType: 'dog' | 'chicken';
    description: string;
}

export const AVAILABLE_PETS: readonly PetDefinition[] = [
    {
        id: 'pet-lucky',
        name: 'ໝານ້ອຍ Lucky',
        price: 80,
        icon: '🐕',
        spriteKey: 'pet-dog',
        soundType: 'dog',
        description: 'ໝານ້ອຍແສນຮູ້ ແລ່ນຕິດຕາມໄປທຸກບ່ອນ ແລະ ນຳໂຊກມາໃຫ້',
    },
    {
        id: 'pet-clucky',
        name: 'ໄກ່ນ້ອຍ Clucky',
        price: 50,
        icon: '🐔',
        spriteKey: 'pet-chicken',
        soundType: 'chicken',
        description: 'ໄກ່ນ້ອຍໜ້າຮັກ ຍ່າງຕ້ອຍໆຕາມຫຼັງ ແລະ ຮ້ອງກຸກໆ',
    },
];

export interface PetSnapshot
{
    ownedPetIds: string[];
    activePetId: string | null;
}

export class PetManager
{
    private _ownedPetIds: Set<string>;
    private _activePetId: string | null;

    constructor (initialOwned: string[] = [], initialActive: string | null = null)
    {
        this._ownedPetIds = new Set(initialOwned);
        this._activePetId = initialActive;
    }

    get ownedPetIds (): readonly string[]
    {
        return Array.from(this._ownedPetIds);
    }

    get activePetId (): string | null
    {
        return this._activePetId;
    }

    get activePet (): PetDefinition | undefined
    {
        if (!this._activePetId) return undefined;
        return AVAILABLE_PETS.find(p => p.id === this._activePetId);
    }

    isOwned (id: string): boolean
    {
        return this._ownedPetIds.has(id);
    }

    isActive (id: string): boolean
    {
        return this._activePetId === id;
    }

    buy (id: string, wallet: Wallet): { success: boolean; reason?: 'not_found' | 'insufficient_funds' | 'already_owned' }
    {
        const def = AVAILABLE_PETS.find(p => p.id === id);
        if (!def) return { success: false, reason: 'not_found' };
        if (this.isOwned(id)) return { success: false, reason: 'already_owned' };

        if (!wallet.spend(def.price))
        {
            return { success: false, reason: 'insufficient_funds' };
        }

        this._ownedPetIds.add(id);
        // Automatically equip the newly purchased pet if none is active
        if (!this._activePetId)
        {
            this._activePetId = id;
        }

        return { success: true };
    }

    equip (id: string): boolean
    {
        if (!this.isOwned(id)) return false;
        this._activePetId = id;
        return true;
    }

    dismiss (): void
    {
        this._activePetId = null;
    }

    toSnapshot (): PetSnapshot
    {
        return {
            ownedPetIds: Array.from(this._ownedPetIds),
            activePetId: this._activePetId,
        };
    }

    loadFrom (snapshot?: PetSnapshot): void
    {
        if (!snapshot) return;
        this._ownedPetIds = new Set(Array.isArray(snapshot.ownedPetIds) ? snapshot.ownedPetIds : []);
        this._activePetId = snapshot.activePetId ?? null;
    }
}

