/**
 * Small runtime checks for hand-written JSON. Every failure names the file and the exact
 * path (`items.json: items[3].maxStack must be a number`) so a typo is easy to find.
 */

export type Raw = Record<string, unknown>;

export function makeValidators (file: string)
{
    function fail (path: string, expected: string): never
    {
        throw new Error(`${file}: ${path} must be ${expected}`);
    }

    function asObject (value: unknown, path: string): Raw
    {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'an object');
        return value as Raw;
    }

    function asArray (value: unknown, path: string): unknown[]
    {
        if (!Array.isArray(value)) fail(path, 'an array');
        return value as unknown[];
    }

    function asString (value: unknown, path: string): string
    {
        if (typeof value !== 'string' || value.length === 0) fail(path, 'a non-empty string');
        return value as string;
    }

    function asText (value: unknown, path: string): string
    {
        if (typeof value !== 'string') fail(path, 'a string');
        return value as string;
    }

    function asNumber (value: unknown, path: string): number
    {
        if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'a number');
        return value as number;
    }

    function asBoolean (value: unknown, path: string): boolean
    {
        if (typeof value !== 'boolean') fail(path, 'true or false');
        return value as boolean;
    }

    function asOneOf<T extends string> (value: unknown, allowed: readonly T[], path: string): T
    {
        if (!allowed.includes(value as T)) fail(path, `one of ${allowed.join(', ')}`);
        return value as T;
    }

    function optionalString (value: unknown, path: string): string | undefined
    {
        return value === undefined ? undefined : asString(value, path);
    }

    function optionalNumber (value: unknown, path: string): number | undefined
    {
        return value === undefined ? undefined : asNumber(value, path);
    }

    function optionalBoolean (value: unknown, path: string): boolean | undefined
    {
        return value === undefined ? undefined : asBoolean(value, path);
    }

    return {
        fail,
        asObject,
        asArray,
        asString,
        asText,
        asNumber,
        asBoolean,
        asOneOf,
        optionalString,
        optionalNumber,
        optionalBoolean,
    };
}
