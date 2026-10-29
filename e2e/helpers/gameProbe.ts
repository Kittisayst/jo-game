import { Page } from '@playwright/test';

/** Reads a value off the hero in the running Phaser `Game` scene (found through the React tree). */
async function readPlayer (page: Page, what: 'x' | 'texture'): Promise<number | string>
{
  return page.evaluate((what) => {
    const root = document.getElementById('root')!;
    const key = Object.keys(root).find(k => k.startsWith('__reactContainer'))!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack: any[] = [(root as any)[key]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let game: any = null;
    while (stack.length && !game) {
      const node = stack.pop();
      if (!node) continue;
      let state = node.memoizedState;
      while (state) {
        const value = state.memoized;
        if (value && value.current && value.current.game && value.current.game.scene) { game = value.current.game; break; }
        const inner = state.memoizedState;
        if (inner && inner.current && inner.current.game) { game = inner.current.game; break; }
        state = state.next;
      }
      if (node.child) stack.push(node.child);
      if (node.sibling) stack.push(node.sibling);
    }
    const player = game?.scene?.getScene('Game')?.player;
    return what === 'x' ? Math.round(player?.x ?? -1) : (player?.texture?.key ?? '');
  }, what);
}

/** The hero's x position. */
export async function getPlayerX (page: Page): Promise<number>
{
  return (await readPlayer(page, 'x')) as number;
}

/** The texture key of the hero's current look, e.g. `player-skin-neon-ninja`. */
export async function getPlayerTexture (page: Page): Promise<string>
{
  return (await readPlayer(page, 'texture')) as string;
}

/**
 * Holds `key` until the hero has walked past `targetX`, however fast or slow the machine runs.
 * Fixed sleeps made walking specs flaky when the page was slow to react to the first key press.
 */
export async function walkRightTo (page: Page, key: string, targetX: number, timeoutMs = 8000): Promise<void>
{
  const startedAt = Date.now();
  await page.keyboard.down(key);
  try {
    while (Date.now() - startedAt < timeoutMs) {
      if (await getPlayerX(page) >= targetX) return;
      await page.waitForTimeout(40);
    }
    throw new Error(`Hero did not reach x=${targetX} within ${timeoutMs}ms (stopped at x=${await getPlayerX(page)})`);
  } finally {
    await page.keyboard.up(key);
  }
}
