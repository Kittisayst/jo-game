export type EnemyState = 'patrol' | 'alert' | 'chase' | 'return';

export type EnemyType = 'slime' | 'slime-flying' | 'slime-armored' | 'slime-spitter';

export type EnemyKind = 'normal' | 'elite' | 'miniboss' | 'boss';

export interface EnemyDrop
{
    itemId: string;
    chance: number;
    count: number;
}

/** Data-driven enemy stats loaded from `enemies.json`. */
export interface EnemyDefinition
{
    id: string;
    kind: EnemyKind;
    maxHp: number;
    damage: number;
    drops: EnemyDrop[];
}

export interface EnemyArchetype
{
    type: EnemyType;
    name: string;
    maxHp: number;
    canStomp: boolean;
    speed: number;
}

export const ENEMY_ARCHETYPES: Record<EnemyType, EnemyArchetype> = {
    'slime': {
        type: 'slime',
        name: 'Basic Slime',
        maxHp: 1,
        canStomp: true,
        speed: 70,
    },
    'slime-flying': {
        type: 'slime-flying',
        name: 'Cyber Drone Slime',
        maxHp: 1,
        canStomp: true,
        speed: 95,
    },
    'slime-armored': {
        type: 'slime-armored',
        name: 'Armored Slime',
        maxHp: 3,
        canStomp: false,
        speed: 45,
    },
    'slime-spitter': {
        type: 'slime-spitter',
        name: 'Toxic Spitter Slime',
        maxHp: 2,
        canStomp: true,
        speed: 55,
    },
};

/**
 * Domain entity representing an Enemy.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Enemy
{
    private readonly _type: EnemyType;
    private _isDefeated = false;
    private _state: EnemyState = 'patrol';
    private _currentHp: number;
    private readonly _maxHp: number;
    private readonly _canStomp: boolean;
    private _definitionId: string | null = null;
    private _kind: EnemyKind = 'normal';
    private _drops: EnemyDrop[] = [];

    /**
     * Builds an enemy whose HP and drops come from data. Behaviour (patrol, hop, spit) still
     * comes from the archetype. Enemies never drop coins: Credit is learned, not farmed.
     */
    static fromDefinition (definition: EnemyDefinition, archetype: EnemyType = 'slime'): Enemy
    {
        const base = ENEMY_ARCHETYPES[archetype] ?? ENEMY_ARCHETYPES['slime'];
        const enemy = new Enemy(archetype, Math.max(1, definition.maxHp), base.canStomp);
        enemy._definitionId = definition.id;
        enemy._kind = definition.kind;
        enemy._drops = definition.drops.map(d => ({ ...d }));
        return enemy;
    }

    constructor (type: EnemyType = 'slime', maxHp?: number, canStomp?: boolean)
    {
        const archetype = ENEMY_ARCHETYPES[type] ?? ENEMY_ARCHETYPES['slime'];
        this._type = archetype.type;
        this._maxHp = maxHp !== undefined ? Math.max(1, maxHp) : archetype.maxHp;
        this._canStomp = canStomp !== undefined ? canStomp : archetype.canStomp;
        this._currentHp = this._maxHp;
    }

    get type (): EnemyType
    {
        return this._type;
    }

    get definitionId (): string | null
    {
        return this._definitionId;
    }

    get kind (): EnemyKind
    {
        return this._kind;
    }

    get drops (): EnemyDrop[]
    {
        return this._drops;
    }

    get canStomp (): boolean
    {
        return this._canStomp;
    }

    get state (): EnemyState
    {
        return this._state;
    }

    setState (nextState: EnemyState): void
    {
        this._state = nextState;
    }

    get isDefeated (): boolean
    {
        return this._isDefeated;
    }

    get currentHp (): number
    {
        return this._currentHp;
    }

    get maxHp (): number
    {
        return this._maxHp;
    }

    takeDamage (amount = 1): { defeated: boolean; currentHp: number }
    {
        if (this._isDefeated)
        {
            return { defeated: true, currentHp: 0 };
        }

        const validAmount = Math.max(0, amount);
        this._currentHp = Math.max(0, this._currentHp - validAmount);

        if (this._currentHp === 0)
        {
            this._isDefeated = true;
        }

        return {
            defeated: this._isDefeated,
            currentHp: this._currentHp,
        };
    }

    defeat (): void
    {
        this._currentHp = 0;
        this._isDefeated = true;
    }
}
