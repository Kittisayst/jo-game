import { Page } from '@playwright/test';

/**
 * A small "player" for end-to-end playthroughs. It only presses real keys (walk, jump, attack,
 * interact) and reads the scene to decide what to press, the way a person looks at the screen.
 * It never teleports the hero or edits game state.
 */

export interface EnemyView
{
  x: number;
  y: number;
  hp: number;
  type: string;
  id: string | null;
}

export interface BotState
{
  ready: boolean;
  scene: string;
  x: number;
  y: number;
  onGround: boolean;
  facing: number;
  hearts: number;
  isDead: boolean;
  isPaused: boolean;
  dialogue: boolean;
  stageCleared: boolean;
  enemies: EnemyView[];
  spikes: number[];
  boss: { x: number; y: number; hp: number; maxHp: number; invulnerable: boolean; phase: number } | null;
}

const EMPTY: BotState = {
  ready: false, scene: '', x: -1, y: -1, onGround: false, facing: 1, hearts: 0, isDead: false,
  isPaused: false, dialogue: false, stageCleared: false, enemies: [], spikes: [], boss: null,
};

export async function readState (page: Page): Promise<BotState>
{
  return page.evaluate((empty) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    if (!w.__botGame) {
      const root = document.getElementById('root')!;
      const key = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      if (!key) return empty;
      const stack: any[] = [(root as any)[key]];
      while (stack.length && !w.__botGame) {
        const node = stack.pop();
        if (!node) continue;
        let state = node.memoizedState;
        while (state) {
          const value = state.memoized;
          if (value && value.current && value.current.game && value.current.game.scene) { w.__botGame = value.current.game; break; }
          const inner = state.memoizedState;
          if (inner && inner.current && inner.current.game) { w.__botGame = inner.current.game; break; }
          state = state.next;
        }
        if (node.child) stack.push(node.child);
        if (node.sibling) stack.push(node.sibling);
      }
    }
    const game = w.__botGame;
    const scene = game?.scene.getScene('Game');
    if (!scene || !scene.player || !scene.player.body || !game.scene.isActive('Game') && !game.scene.isPaused('Game')) return empty;

    const body = scene.player.body;
    const enemies = scene.enemies.getChildren()
      .filter((e: any) => e.active && !e.entity.isDefeated)
      .map((e: any) => ({ x: Math.round(e.x), y: Math.round(e.y), hp: e.entity.currentHp, type: e.enemyType, id: e.entity.definitionId }));
    const boss = scene.boss && scene.boss.active && !scene.boss.entity.isDefeated
      ? { x: Math.round(scene.boss.x), y: Math.round(scene.boss.y), hp: scene.boss.entity.currentHp, maxHp: scene.boss.entity.maxHp, invulnerable: !!scene.boss.isInvulnerable, phase: scene.boss.entity.phase }
      : null;

    return {
      ready: true,
      scene: scene.currentLevelKey,
      x: Math.round(scene.player.x),
      y: Math.round(scene.player.y),
      onGround: !!(body.blocked.down || body.touching.down),
      facing: scene.player.facingDir,
      hearts: scene.health.current,
      isDead: scene.health.isDead,
      isPaused: game.scene.isPaused('Game'),
      dialogue: !!scene.isDialogueActive,
      stageCleared: !!scene.isStageCleared,
      enemies,
      spikes: scene.spikes.getChildren().map((s: any) => Math.round(s.x)),
      boss,
    };
  }, EMPTY);
}

export class Bot
{
  private held = new Set<string>();
  readonly log: string[] = [];

  constructor (private readonly page: Page, private readonly verbose = true) {}

  note (message: string): void
  {
    this.log.push(message);
    if (this.verbose) console.log(`[bot] ${message}`);
  }

  state (): Promise<BotState>
  {
    return readState(this.page);
  }

  async hold (key: string, down: boolean): Promise<void>
  {
    if (down && !this.held.has(key)) {
      this.held.add(key);
      await this.page.keyboard.down(key);
    } else if (!down && this.held.has(key)) {
      this.held.delete(key);
      await this.page.keyboard.up(key);
    }
  }

  async releaseAll (): Promise<void>
  {
    for (const key of [...this.held]) await this.hold(key, false);
  }

  /** Walks in `dir` (-1 left, 1 right, 0 stop). */
  async walk (dir: -1 | 0 | 1): Promise<void>
  {
    await this.hold('KeyD', dir === 1);
    await this.hold('KeyA', dir === -1);
  }

  async tap (key: string, ms = 60): Promise<void>
  {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(ms);
    await this.page.keyboard.up(key);
  }

  /** Turns to face `dir` without covering any real distance. */
  async face (dir: -1 | 1): Promise<void>
  {
    await this.walk(0);
    await this.tap(dir === 1 ? 'KeyD' : 'KeyA', 35);
  }

  /** Swings the sword at whatever is in front of the hero. */
  async attack (): Promise<void>
  {
    await this.tap('KeyJ', 40);
  }

  async interact (): Promise<void>
  {
    await this.walk(0);
    await this.tap('KeyE', 50);
  }

  /** Opens the backpack, picks a herb potion and drinks it, like a player would with I, arrows and Enter. */
  async drinkPotion (): Promise<boolean>
  {
    await this.walk(0);
    const slot = await this.page.evaluate(async () => {
      const entities = (window as any).__entities; // the app's own state (a second import() can be a second copy)
      const slots = entities.backpack.getAllSlots();
      const first = slots.findIndex(x => x !== null);
      const potion = slots.findIndex(x => x && x.itemId === 'herb-potion');
      return { first, potion, hearts: entities.health.current };
    });
    if (slot.potion < 0) return false;

    await this.tap('KeyI', 50);
    await this.page.waitForTimeout(250);
    for (let i = 0; i < (slot.potion - slot.first + 20) % 20; i++) {
      await this.tap('ArrowRight', 40);
      await this.page.waitForTimeout(40);
    }
    await this.tap('Enter', 50);
    await this.page.waitForTimeout(200);
    await this.tap('Escape', 50);
    await this.page.waitForTimeout(150);

    const after = await this.page.evaluate(async () => {
      const entities = (window as any).__entities; // the app's own state (a second import() can be a second copy)
      return entities.health.current;
    });
    this.note(`drank a potion: hearts ${slot.hearts} -> ${after}`);
    return after > slot.hearts;
  }

  /**
   * Walks to `targetX`, jumping spikes and bumps on the way, and fights whatever blocks the way
   * when `fight` is on. Returns why it stopped.
   */
  async goTo (targetX: number, options: { tolerance?: number; timeoutMs?: number; fight?: boolean } = {}): Promise<'arrived' | 'dead' | 'timeout' | 'left-scene'>
  {
    const { tolerance = 18, timeoutMs = 30000, fight = true } = options;
    const startedAt = Date.now();
    const startScene = (await this.state()).scene;
    let lastX = -999;
    let lastMovedAt = Date.now();

    try {
      while (Date.now() - startedAt < timeoutMs) {
        const s = await this.state();
        if (!s.ready) { await this.page.waitForTimeout(100); continue; }
        if (s.scene !== startScene) return 'left-scene';
        if (s.isDead) return 'dead';
        if (Math.abs(s.x - targetX) <= tolerance) return 'arrived';

        const dir: -1 | 1 = targetX > s.x ? 1 : -1;

        if (fight) {
          const blocker = s.enemies.find(e => (e.x - s.x) * dir > 0 && Math.abs(e.x - s.x) < 120 && Math.abs(e.y - s.y) < 80);
          if (blocker) {
            await this.fightEnemy(blocker.x);
            continue;
          }
        }

        await this.walk(dir);

        // Jump a spike that is just ahead
        const spikeAhead = s.spikes.some(sx => (sx - s.x) * dir > 0 && Math.abs(sx - s.x) < 85 && Math.abs(sx - s.x) > 30);
        if (spikeAhead && s.onGround) await this.tap('Space', 60);

        // Jump if something is holding the hero back
        if (Math.abs(s.x - lastX) > 1) { lastX = s.x; lastMovedAt = Date.now(); }
        else if (Date.now() - lastMovedAt > 500 && s.onGround) { await this.tap('Space', 60); lastMovedAt = Date.now(); }

        await this.page.waitForTimeout(35);
      }
      return 'timeout';
    } finally {
      await this.walk(0);
    }
  }

  /** Fights the enemy near `x` until it is gone with the sword only, keeping a sword's length away. */
  async fightEnemy (x: number, timeoutMs = 25000): Promise<void>
  {
    const startedAt = Date.now();
    await this.walk(0);

    try {
    while (Date.now() - startedAt < timeoutMs) {
      const s = await this.state();
      if (!s.ready || s.isDead) return;

      // Track the nearest enemy to where we started
      const target = [...s.enemies].sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
      if (!target || Math.abs(target.x - s.x) > 180) return;

      const dir: -1 | 1 = target.x > s.x ? 1 : -1;
      const gap = Math.abs(target.x - s.x);
      if (process.env.BOT_TRACE) console.log(`[trace] t=${Date.now() - startedAt} hero=${s.x},${s.y} face=${s.facing} hp=${s.hearts} enemy=${target.type}@${target.x},${target.y} hp=${target.hp} gap=${gap}`);

      // Touching an enemy always costs a heart, so fight from a distance and heal when low
      if (s.hearts <= 1 && gap > 110 && await this.drinkPotion()) continue;

      if (s.facing !== dir) await this.face(dir);

      if (gap < 68) {
        // Inside the enemy's reach: step back so the next swing lands from a safe distance
        await this.tap(dir === 1 ? 'KeyA' : 'KeyD', 230);
      } else if (gap > 86) {
        await this.tap(dir === 1 ? 'KeyD' : 'KeyA', 70);
      } else {
        await this.attack();
        await this.page.waitForTimeout(330);
      }
    }
    } finally {
      await this.walk(0);
    }
  }
}
