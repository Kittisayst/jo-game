import { describe, expect, it } from 'vitest';
import { Enemy, EnemyDefinition } from './Enemy';

describe('Enemy entity', () =>
{
    it('initializes as not defeated with the patrol state', () =>
    {
        const enemy = new Enemy();
        expect(enemy.isDefeated).toBe(false);
        expect(enemy.state).toBe('patrol');
        expect(enemy.maxHp).toBe(1);
        expect(enemy.currentHp).toBe(1);
    });

    it('accepts a custom maxHp', () =>
    {
        const enemy = new Enemy('slime', 3);
        expect(enemy.maxHp).toBe(3);
        expect(enemy.currentHp).toBe(3);
    });

    it('marks as defeated and reduces HP', () =>
    {
        const enemy = new Enemy();
        enemy.defeat();
        expect(enemy.isDefeated).toBe(true);
        expect(enemy.currentHp).toBe(0);
    });

    it('takes damage step by step until defeated', () =>
    {
        const enemy = new Enemy('slime', 2);
        const hit1 = enemy.takeDamage(1);
        expect(hit1.defeated).toBe(false);
        expect(hit1.currentHp).toBe(1);
        expect(enemy.isDefeated).toBe(false);

        const hit2 = enemy.takeDamage(1);
        expect(hit2.defeated).toBe(true);
        expect(hit2.currentHp).toBe(0);
        expect(enemy.isDefeated).toBe(true);
    });

    it('transitions states correctly', () =>
    {
        const enemy = new Enemy();
        expect(enemy.state).toBe('patrol');

        enemy.setState('alert');
        expect(enemy.state).toBe('alert');

        enemy.setState('chase');
        expect(enemy.state).toBe('chase');

        enemy.setState('return');
        expect(enemy.state).toBe('return');
    });

    it('initializes flying slime archetype correctly', () =>
    {
        const flying = new Enemy('slime-flying');
        expect(flying.type).toBe('slime-flying');
        expect(flying.maxHp).toBe(1);
    });

    it('initializes armored slime archetype with 3 HP', () =>
    {
        const armored = new Enemy('slime-armored');
        expect(armored.type).toBe('slime-armored');
        expect(armored.maxHp).toBe(3);
        expect(armored.currentHp).toBe(3);

        // Takes 3 hits
        expect(armored.takeDamage(1).defeated).toBe(false);
        expect(armored.takeDamage(1).defeated).toBe(false);
        expect(armored.takeDamage(1).defeated).toBe(true);
    });

    it('initializes toxic spitter slime archetype correctly', () =>
    {
        const spitter = new Enemy('slime-spitter');
        expect(spitter.type).toBe('slime-spitter');
        expect(spitter.maxHp).toBe(2);
    });

    describe('fromDefinition', () =>
    {
        const golem: EnemyDefinition = {
            id: 'rock-golem',
            kind: 'normal',
            maxHp: 80,
            damage: 15,
            drops: [{ itemId: 'stone', chance: 1, count: 2 }],
        };

        it('takes HP and drops from data', () =>
        {
            const enemy = Enemy.fromDefinition(golem, 'slime-armored');
            expect(enemy.maxHp).toBe(80);
            expect(enemy.definitionId).toBe('rock-golem');
            expect(enemy.drops).toEqual([{ itemId: 'stone', chance: 1, count: 2 }]);
        });

        it('survives hits until total damage reaches its HP', () =>
        {
            const enemy = Enemy.fromDefinition(golem);
            expect(enemy.takeDamage(12).defeated).toBe(false);
            expect(enemy.takeDamage(68).defeated).toBe(true);
        });
    });
});
