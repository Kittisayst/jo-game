/**
 * The ten Realms as authored in `public/data/realms.json`: subject, portal colour, biome and the
 * Textbook and Portal items that belong to each. See "Realm" in CONTEXT.md.
 */

import { REALM_COUNT } from '../../domain/entities/StageNumber';
import { makeValidators } from './validate';

export interface RealmDefinition
{
    number: number;
    name: string;
    nameEn: string;
    subject: string;
    /** The colour of the portal and of the Realm on the Stage map. */
    color: string;
    icon: string;
    biome: string;
    /** The Textbook of this Realm, or null while it has not been written. */
    bookId: string | null;
    shardItem: string;
    blockItem: string;
}

const COLOR = /^#[0-9a-fA-F]{6}$/;

export function parseRealms (raw: unknown): RealmDefinition[]
{
    const v = makeValidators('realms.json');
    const realms = v.asArray(v.asObject(raw, 'root').realms, 'realms').map((entry, i): RealmDefinition =>
    {
        const p = `realms[${i}]`;
        const realm = v.asObject(entry, p);
        const color = v.asString(realm.color, `${p}.color`);
        if (!COLOR.test(color)) v.fail(`${p}.color`, 'a colour such as #22c55e');

        return {
            number: v.asNumber(realm.number, `${p}.number`),
            name: v.asString(realm.name, `${p}.name`),
            nameEn: v.asString(realm.nameEn, `${p}.nameEn`),
            subject: v.asString(realm.subject, `${p}.subject`),
            color,
            icon: v.asString(realm.icon, `${p}.icon`),
            biome: v.asString(realm.biome, `${p}.biome`),
            bookId: realm.bookId === null ? null : v.asString(realm.bookId, `${p}.bookId`),
            shardItem: v.asString(realm.shardItem, `${p}.shardItem`),
            blockItem: v.asString(realm.blockItem, `${p}.blockItem`),
        };
    });

    if (realms.length !== REALM_COUNT) v.fail('realms', `exactly ${REALM_COUNT} realms`);
    realms.forEach((realm, i) =>
    {
        if (realm.number !== i + 1) v.fail(`realms[${i}].number`, `${i + 1} (realms are listed in order)`);
    });
    const colours = new Set(realms.map(r => r.color.toLowerCase()));
    if (colours.size !== realms.length) v.fail('realms', 'ten different colours');

    return realms;
}
