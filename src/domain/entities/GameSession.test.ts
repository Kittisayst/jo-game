import { describe, expect, it } from 'vitest';
import { GameSession } from './GameSession';

describe('GameSession entity', () =>
{
    it('initializes with default values', () =>
    {
        const session = new GameSession();
        expect(session.levelId).toBe('level-1');
        expect(session.score.value).toBe(0);
        expect(session.lives.current).toBe(3);
        expect(session.coins).toBe(0);
        expect(session.elapsedMs).toBe(0);
        expect(session.elapsedSeconds).toBe(0);
        expect(session.isGameOver).toBe(false);
        expect(session.powerUps.isStarActive).toBe(false);
        expect(session.powerUps.isSpringActive).toBe(false);
    });

    it('initializes with custom parameters', () =>
    {
        const session = new GameSession('level-2', 500, 2, 15, 25400);
        expect(session.levelId).toBe('level-2');
        expect(session.score.value).toBe(500);
        expect(session.lives.current).toBe(2);
        expect(session.coins).toBe(15);
        expect(session.elapsedMs).toBe(25400);
        expect(session.elapsedSeconds).toBe(25.4);
    });

    it('adds coins correctly', () =>
    {
        const session = new GameSession();
        session.addCoin();
        expect(session.coins).toBe(1);

        session.addCoin(5);
        expect(session.coins).toBe(6);

        session.addCoin(-3);
        expect(session.coins).toBe(6);
    });

    it('advances elapsed time and updates power-ups on tick', () =>
    {
        const session = new GameSession();
        session.powerUps.activateStar(500);

        const tick1 = session.tick(200);
        expect(session.elapsedMs).toBe(200);
        expect(session.elapsedSeconds).toBe(0.2);
        expect(tick1.starExpired).toBe(false);
        expect(session.powerUps.isStarActive).toBe(true);

        const tick2 = session.tick(300);
        expect(session.elapsedMs).toBe(500);
        expect(tick2.starExpired).toBe(true);
        expect(session.powerUps.isStarActive).toBe(false);
    });

    it('stops ticking elapsed time when game is over', () =>
    {
        const session = new GameSession();
        session.lives.takeDamage();
        session.lives.takeDamage();
        session.lives.takeDamage();
        expect(session.isGameOver).toBe(true);

        session.tick(500);
        expect(session.elapsedMs).toBe(0);
    });

    it('resets run state completely', () =>
    {
        const session = new GameSession('level-2', 300, 1, 10, 42000);
        session.powerUps.activateSpring(1000);

        session.resetRun('level-1');
        expect(session.levelId).toBe('level-1');
        expect(session.score.value).toBe(0);
        expect(session.lives.current).toBe(3);
        expect(session.coins).toBe(0);
        expect(session.elapsedMs).toBe(0);
        expect(session.powerUps.isSpringActive).toBe(false);
    });

    it('returns an accurate snapshot of the entire session', () =>
    {
        const session = new GameSession('level-3', 250, 2, 7, 15000);
        session.powerUps.activateStar(4000);
        const snapshot = session.getSnapshot();

        expect(snapshot).toEqual({
            score: 250,
            lives: 2,
            maxLives: 3,
            coins: 7,
            levelId: 'level-3',
            elapsedSeconds: 15,
            elapsedMs: 15000,
            isGameOver: false,
            starActive: true,
            starSeconds: 4,
            springActive: false,
            springSeconds: 0,
        });
    });

    it('does not increment elapsed time when trackTime is false', () =>
    {
        const session = new GameSession('village', 0, 3, 0, 0, false);
        session.tick(1000);
        expect(session.elapsedMs).toBe(0);
        expect(session.elapsedSeconds).toBe(0);
    });
});
