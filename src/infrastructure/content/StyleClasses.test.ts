import { describe, expect, it } from 'vitest';

/**
 * `public/style.css` has only the utility classes someone wrote by hand: there is no Tailwind, so a class it lacks
 * does nothing. A missing *colour* class only loses a colour, but a missing *size or layout* class (`h-2`,
 * `min-h-[44px]`, `max-w-xl`, `aspect-square`, `grid-cols-3`, `opacity-30`) makes a bar invisible, a touch target
 * tiny, a window as wide as the screen or a row of three stack in a column.
 * This test fails when a window uses a size class the CSS does not define; give the element an inline style
 * (or define the class) instead.
 */

// The windows' source, read as text by the bundler (no file system access needed)
const sources = import.meta.glob('../react/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const cssFiles = import.meta.glob('../../../public/style.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const css = Object.values(cssFiles).join('\n');

const SIZE_CLASS = /^(?:(?:min|max)-)?(?:[hw]|size)-|^aspect-|^(?:top|bottom|left|right|inset)-|^grid-cols-|^col-span-|^opacity-/;

/** Size classes a window may use without a definition (none now; do not add one, give the element an inline style). */
const KNOWN_LEFTOVERS: Record<string, string[]> = {};

function definedClasses (): Set<string>
{
    const defined = new Set<string>();
    for (const match of css.matchAll(/\.((?:[\w-]|\\.)+)/g)) defined.add(match[1].replace(/\\/g, ''));
    return defined;
}

function sizeClassesUsedBy (source: string): string[]
{
    const used = new Set<string>();
    for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g))
    {
        const text = (match[1] ?? match[2] ?? '').replace(/\$\{[^}]*\}/g, ' ');
        for (const name of text.split(/\s+/)) if (name && SIZE_CLASS.test(name)) used.add(name);
    }
    return [...used];
}

describe('size classes of the windows', () =>
{
    const defined = definedClasses();
    const files = Object.entries(sources).map(([path, source]) => ({ name: path.split('/').pop() as string, source }));

    it('reads the windows and the style sheet', () =>
    {
        expect(files.length).toBeGreaterThan(10);
        expect(defined.size).toBeGreaterThan(200);
    });

    it('are defined in style.css (or are a known leftover)', () =>
    {
        const problems: string[] = [];
        for (const { name, source } of files)
        {
            const allowed = new Set(KNOWN_LEFTOVERS[name] ?? []);
            for (const cls of sizeClassesUsedBy(source))
            {
                if (!defined.has(cls) && !allowed.has(cls)) problems.push(`${name}: ${cls}`);
            }
        }
        expect(problems, 'size classes that style.css does not define (they do nothing)').toEqual([]);
    });

    it('lists only leftovers that are still there', () =>
    {
        for (const [name, classes] of Object.entries(KNOWN_LEFTOVERS))
        {
            const file = files.find(f => f.name === name);
            expect(file, `${name} exists`).toBeDefined();
            const used = new Set(sizeClassesUsedBy((file as { source: string }).source));
            for (const cls of classes) expect(used.has(cls) && !defined.has(cls), `${name} still uses the undefined ${cls}`).toBe(true);
        }
    });
});
