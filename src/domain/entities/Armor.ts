/**
 * Armor: three pieces worn at once (head, body, feet). Each gives Armor hearts that are lost before Health and
 * come back at home; boots may add a little speed. A Broken piece gives nothing. Pure rules, see "Armor" and
 * "Armor heart" in CONTEXT.md.
 */

import { durabilityStateOf } from './Durability';
import type { ItemCatalog } from './ItemCatalog';

export type ArmorSlot = 'head' | 'body' | 'feet';
export const ARMOR_SLOTS: readonly ArmorSlot[] = ['head', 'body', 'feet'];

export const ARMOR_SLOT_LABEL: Record<ArmorSlot, string> = {
    head: 'ໝວກ',
    body: 'ເສື້ອ',
    feet: 'ເກີບ',
};

/** What a Potion can do. `heal` is the plain health potion; the others come from `effect` in `items.json`. */
export type PotionEffect = 'heal' | 'strength' | 'armor' | 'speed';
export const POTION_EFFECTS: readonly PotionEffect[] = ['heal', 'strength', 'armor', 'speed'];

/** A piece of Armor being worn. `durability` missing means it is still full. */
export interface WornPiece
{
    itemId: string;
    durability?: number;
}

function isBroken (piece: WornPiece, catalog: ItemCatalog): boolean
{
    const max = catalog.maxDurabilityOf(piece.itemId);
    return max !== undefined && durabilityStateOf(piece.durability ?? max, max) === 'broken';
}

/** Armor hearts a worn piece gives right now: none once it is Broken. */
export function armorHeartsOfPiece (piece: WornPiece, catalog: ItemCatalog): number
{
    const definition = catalog.get(piece.itemId);
    if (!definition || definition.category !== 'armor' || isBroken(piece, catalog)) return 0;
    return definition.armorHearts ?? 0;
}

/** The most Armor hearts the worn pieces give together (Broken pieces count for nothing). */
export function armorHeartsOf (pieces: readonly WornPiece[], catalog: ItemCatalog): number
{
    return pieces.reduce((total, piece) => total + armorHeartsOfPiece(piece, catalog), 0);
}

/** The extra walking speed the worn pieces give, as a share (0.1 = +10 %). Broken pieces give none. */
export function armorSpeedBonusOf (pieces: readonly WornPiece[], catalog: ItemCatalog): number
{
    return pieces.reduce((total, piece) =>
        total + (isBroken(piece, catalog) ? 0 : (catalog.get(piece.itemId)?.speedBonus ?? 0)), 0);
}
