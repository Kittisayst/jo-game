import { describe, expect, it } from 'vitest';

/**
 * `public/style.css` has only the classes someone wrote by hand: there is no Tailwind, so a utility class it lacks
 * does nothing. That is how a bar ended up with no height and no colour, buttons lost their colour (every
 * `bg-gradient-to-r from-emerald-600` was the same navy), a chosen answer or a selected Backpack slot showed no
 * highlight, and the Gate's confirm button had dark text on no background. This test fails when a window uses a
 * class that style.css does not define, also one written inside a `${ cond ? 'a' : 'b' }`; define it there, or
 * give the element an inline style. A few names are listed below.
 */

// The windows' source, read as text by the bundler (no file system access needed)
const sources = import.meta.glob('../react/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const cssFiles = import.meta.glob('../../../public/style.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const css = Object.values(cssFiles).join('\n');

/**
 * Names that are not styled on purpose: hooks for a test or a later style, values the expression compares (not
 * classes), and Tailwind names with no visible effect here. Do not add a name that is meant to change how
 * something looks.
 */
const ALLOWED_WITHOUT_STYLE = new Set([
    // hooks of the HUD badges and the windows
    'backpack-hud-btn', 'crafting-badge', 'garden-badge', 'health-badge', 'hero-level-badge', 'pending-badge', 'world-time-badge',
    'choice-text', 'dialogue-avatar', 'export-box', 'import-box', 'lib-overlay', 'lib-tab-icon', 'portal-slot-label',
    'realm-cell-number', 'realm-row-icon', 'title-credit-label',
    // values an expression compares with (`tab === 'exam'`), not classes
    'all', 'consumable', 'gear', 'material', 'exam', 'practice', 'skills', 'craft', 'repair', 'upgrade', 'village',
    // Tailwind names with no visible effect here
    'drop-shadow', 'filter', 'py-0.2', 'sm:text-[10px]', 'sm:text-[11px]', 'shadow-cyan-500/30',
]);

function definedClasses (): Set<string>
{
    const defined = new Set<string>();
    for (const match of css.matchAll(/\.((?:[\w-]|\\.)+)/g)) defined.add(match[1].replace(/\\/g, ''));
    return defined;
}

/** The value of every `className=` in a source: `"..."`, or the whole `{...}` expression (braces matched). */
function classExpressions (source: string): string[]
{
    const out: string[] = [];
    for (const match of source.matchAll(/className=/g))
    {
        const start = (match.index as number) + match[0].length;
        if (source[start] === '"')
        {
            out.push(source.slice(start, source.indexOf('"', start + 1) + 1));
        }
        else if (source[start] === '{')
        {
            let depth = 0;
            let end = start;
            for (; end < source.length; end++)
            {
                if (source[end] === '{') depth++;
                else if (source[end] === '}' && --depth === 0) break;
            }
            out.push(source.slice(start + 1, end));
        }
    }
    return out;
}

/** Every quoted string in an expression, and the text parts of its template literals. */
function literalsOf (expression: string): string[]
{
    const found: string[] = [];
    for (const match of expression.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) found.push(match[1] ?? match[2]);
    for (const match of expression.matchAll(/`([^`]*)`/g)) found.push(match[1].replace(/\$\{[^}]*\}/g, ' '));
    return found;
}

function classesUsedBy (source: string): string[]
{
    const used = new Set<string>();
    for (const expression of classExpressions(source))
    {
        for (const literal of literalsOf(expression))
        {
            // A name that ends in "-" is the start of one built at run time (`cell-${state}`)
            for (const name of literal.split(/\s+/)) if (name && !name.endsWith('-')) used.add(name);
        }
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

    it('finds the classes inside a template expression too', () =>
    {
        const used = classesUsedBy('<b className={`a ${on ? \'bg-amber-500 hover:bg-amber-400\' : \'bg-slate-800\'}`} />');
        expect(used).toEqual(expect.arrayContaining(['a', 'bg-amber-500', 'hover:bg-amber-400', 'bg-slate-800']));
        expect(classesUsedBy('<b className="x y" />')).toEqual(['x', 'y']);
        expect(classesUsedBy('<b className={className} />')).toEqual([]);
    });

    it('are all defined in style.css (or are a listed name)', () =>
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
