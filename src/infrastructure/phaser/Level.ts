/**
 * Infrastructure-owned layout data for one playable level — pure spatial data,
 * loaded from JSON rather than hand-written as code. See "Level" in CONTEXT.md
 * and docs/adr/0003-level-data-as-loaded-json.md.
 *
 * Nothing here is verified against this shape at runtime — a malformed level
 * JSON file will fail in whatever way reading a missing/wrong-typed field fails.
 */
export interface Level
{
    worldWidth: number;
    finishX: number;
    spawn: { x: number; y: number };
    platforms: { x: number; y: number }[];
}
