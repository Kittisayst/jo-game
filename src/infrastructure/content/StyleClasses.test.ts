import { describe, expect, it } from 'vitest';

/**
 * `public/style.css` has only the classes someone wrote by hand: there is no Tailwind, so a utility class it lacks
 * does nothing. That is how a bar ended up with no height and no colour, buttons lost their colour (every
 * `bg-gradient-to-r from-emerald-600` was the same navy), three armor slots stacked in a column and touch targets
 * stayed 22 px. This test fails when a window uses a class that style.css does not define; define it there, or
 * give the element an inline style. A few names are only hooks for tests and styles and are listed below.
 */

// The windows' source, read as text by the bundler (no file system access needed)
const sources = import.meta.glob('../react/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const cssFiles = import.meta.glob('../../../public/style.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const css = Object.values(cssFiles).join('\n');

/**
 * Class names that are not styled on purpose (hooks for a test or a later style), or Tailwind names that are
 * harmless without a definition. Do not add a name that is meant to change how something looks.
 */
const ALLOWED_WITHOUT_STYLE = new Set([
    // hooks of the HUD badges and the windows
    'backpack-hud-btn', 'crafting-badge', 'garden-badge', 'health-badge', 'hero-level-badge', 'pending-badge', 'world-time-badge',
    'choice-text', 'dialogue-avatar', 'export-box', 'import-box', 'lib-overlay', 'lib-tab-icon', 'portal-slot-label',
    'realm-cell-number', 'realm-row-icon', 'title-credit-label',
    // Tailwind names with no visible effect here
    'drop-shadow', 'filter', 'py-0.2', 'sm:text-[10px]', 'sm:text-[11px]',
]);

function definedClasses (): Set<string>
{
    const defined = new Set<string>();
    for (const match of css.matchAll(/\.((?:[\w-]|\\.)+)/g)) defined.add(match[1].replace(/\\/g, ''));
    return defined;
}

function classesUsedBy (source: string): string[]
{
    const used = new Set<string>();
    for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g))
    {
        const text = (match[1] ?? match[2] ?? '').replace(/\$\{[^}]*\}/g, ' ');
        // A name that ends in "-" is the start of one built at run time (`cell-${state}`)
        for (const name of text.split(/\s+/)) if (name && !name.endsWith('-')) used.add(name);
    }
    return [...used];
}

describe('classes of the windows', () =>
{
    const defined = definedClasses();
    const files = Object.entries(sources).map(([path, source]) => ({ name: path.split('/').pop() as string, source }));

    it('reads the windows and the style sheet', () =>
    {
        expect(files.length).toBeGreaterThan(10);
        expect(defined.size).toBeGreaterThan(200);
    });

    it('are all defined in style.css (or are a listed hook)', () =>
    {
        const problems: string[] = [];
        for (const { name, source } of files)
        {
            for (const cls of classesUsedBy(source))
            {
                if (!defined.has(cls) && !ALLOWED_WITHOUT_STYLE.has(cls)) problems.push(`${name}: ${cls}`);
            }
        }
        expect(problems, 'classes that style.css does not define (they do nothing)').toEqual([]);
    });

    it('lists only names that are still used and still undefined', () =>
    {
        const used = new Set(files.flatMap(f => classesUsedBy(f.source)));
        for (const cls of ALLOWED_WITHOUT_STYLE)
        {
            expect(used.has(cls) && !defined.has(cls), `${cls} is used and has no style (else remove it from the list)`).toBe(true);
        }
    });
});
