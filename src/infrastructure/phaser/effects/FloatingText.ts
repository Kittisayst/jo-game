const ITEM_EMOJI: Record<string, string> = {
    'wood': '🪵',
    'stone': '🪨',
    'iron-ore': '⛏️',
    'herb': '🌿',
    'fiber': '🌾',
    'crystal': '💎',
    'boss-core': '🔮',
};

/** The emoji shown next to an item in loot messages. */
export function itemEmoji (itemId: string): string
{
    return ITEM_EMOJI[itemId] || '📦';
}

/** `+3 🪵 wood, +2 🌿 herb` — the text of a loot message. */
export function describeDrops (drops: { itemId: string; count: number }[], separator = ', '): string
{
    return drops.map(d => `+${d.count} ${itemEmoji(d.itemId)} ${d.itemId}`).join(separator);
}

/** A damage number that floats up from `(x, y)` and fades out. */
export function showDamageNumber (scene: Phaser.Scene, x: number, y: number, amount: number, isCrit = false): void
{
    const text = scene.add.text(x, y - 24, isCrit ? `-${amount} CRIT!` : `-${amount}`, {
        fontFamily: 'monospace, sans-serif',
        fontSize: isCrit ? '18px' : '15px',
        fontStyle: 'bold',
        color: isCrit ? '#ef4444' : '#facc15',
        stroke: '#000000',
        strokeThickness: 3,
    }).setDepth(25).setOrigin(0.5);

    scene.tweens.add({
        targets: text,
        y: y - 56,
        alpha: 0,
        scale: isCrit ? 1.3 : 1.1,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => text.destroy(),
    });
}

/** A short message (loot, warnings) that floats up from `(x, y)` and fades out. */
export function showLootNotification (scene: Phaser.Scene, x: number, y: number, textStr: string, color = '#22c55e'): void
{
    const text = scene.add.text(x, y - 24, textStr, {
        fontFamily: '"Noto Sans Lao", sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 3,
    }).setDepth(26).setOrigin(0.5);

    scene.tweens.add({
        targets: text,
        y: y - 60,
        alpha: 0,
        scale: 1.15,
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => text.destroy(),
    });
}
