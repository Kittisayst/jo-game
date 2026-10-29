# Materials can be grown from Seeds that exploring gave

[ADR 0005](0005-wallet-holds-credit-only.md) keeps Credit for learning. The glossary also said Materials come *only* from exploring a Stage. The 100-Stage plan ([docs/plans/2026-10-29-hundred-stages-realms.md](../plans/2026-10-29-hundred-stages-realms.md)) adds a Garden in the Village Hub where Seeds are planted, and small plants in a Stage that regrow over real time. Both make Materials without walking through a Stage, so the rule is changed to: **Materials come from exploring, or from growing Seeds that exploring gave.** Seeds are dropped only by harvesting plant Resource nodes in a Stage, so the Garden multiplies what the player already explored; it never creates a first Material from nothing. Credit is untouched: nothing grown, crafted or fought earns it.

## Considered options

- **Keep "exploring only" and make the Garden produce a separate kind of item** (food/potion ingredients only) — rejected: the player would have two kinds of herb, and the Garden could not feed the main craft loop.
- **Garden crops give Materials, Seeds come from the shop** — rejected: it needs a second way to pay for Seeds, and ADR 0005 allows Credit to buy only learning and Skins.
- **Garden crops give Materials, Seeds come only from exploring** — selected.

## Consequences

- Growth is measured in real time (a `Clock` port in the domain) and keeps running while the game is closed. A player can change the computer clock to grow faster; accepted, there is no server.
- Trees, stone and iron still come back "on enter" so that wood and ore are never blocked by a wait; only small plants use Regrow in minutes.
- A Seed is a Material for the death rule: 50% is lost, unlike story Materials. What is in the Storage chest is kept.
- `CONTEXT.md` ("Material", "Seed", "Regrow") and `CLAUDE.md` state the new rule.
