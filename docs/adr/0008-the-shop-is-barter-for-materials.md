# Grandma Chanthy's shop is barter for Materials

The Village Hub gets a shop run by Grandma Chanthy, and [ADR 0007](0007-materials-can-be-grown-from-explored-seeds.md) turned the idea of a shop down: it said Seeds from a shop would need "a second way to pay for Seeds", and [ADR 0005](0005-wallet-holds-credit-only.md) lets Credit buy only learning and Skins. This shop needs no second way to pay. It takes **Materials for goods** (barter): Seeds, plain Potions, repair kits and a daily pair of stronger Potions. Credit is never asked for and never paid out, and the shop buys nothing back for Credit.

A Seed bought this way was paid for with Materials that exploring gave (herb, fiber, cactus pulp), so the rule of ADR 0007 still holds in spirit: the Garden multiplies what the player explored and never makes Materials from nothing. The wording "Seeds that exploring gave" is widened to "Seeds that exploring gave, or that Materials from exploring paid for".

## Considered options

- **Sell for Credit** — rejected: Credit would buy progress that is not learning, the thing ADR 0005 was written to stop.
- **A new coin currency** — rejected for the reason in ADR 0005 (a second balance in every purchase, the save and the HUD).
- **Barter for Materials** — selected.

## Consequences

- Prices live in `public/data/shop.json`; `ContentIntegrity.test.ts` fails if a price is not a plain Material (so never Credit, never a story item).
- A daily limit counts per Game day (`WorldTime.dayCount`), saved as `shop` (additive).
- Prices need a hand balance pass: a Seed must cost clearly more than the herb it will grow back in the Garden, or the Garden becomes a faucet.
- Quests that pay Credit for gathering or fighting break ADR 0005 on their own; the shop is not the way to fix that.
