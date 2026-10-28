# The Wallet holds Credit only — no coins

The game started as a score-and-coins platformer where killing enemies and collecting coins paid for shop items and weapon upgrades. The design for the learning loop (see the GDD) needs the opposite incentive: the only thing that should unlock Textbooks, weapon upgrades and skins is **learning** — passing exams, Daily Practice, finishing a Chapter by answering the Boss question — while **exploring** only yields Materials for crafting. We therefore removed coins, the Shop and score, and made the `Wallet` hold a single currency, **Credit**, that nothing earned by fighting can touch. Enemies drop Materials, never Credit; Skins and Textbooks are bought with Credit; the Boss gives Credit only through the chapter-clear bonus that follows the quiz finisher.

## Considered options

- **Two currencies (coins from exploring, Credit from learning)** — rejected: coins would let a player buy progress without learning, which defeats the point of the game, and the second currency adds UI and balance work for a classroom MVP. A player who farms enemies must still be unable to skip the exam.
- **Keep coins but make them unable to buy learning content** — rejected: a currency that cannot buy anything meaningful is noise, and it kept the old shop alive.
- **Credit only, earned by learning** — selected.

## Consequences

- Reversing this means re-threading a second balance through the save schema (`wallet`, save v6), every purchase use case and the HUD, so treat "can fighting earn Credit?" as a design decision to take to the GDD first, not a tweak.
- The starting balance is exactly the price of the first Textbook (20), and skin purchases keep that amount in reserve until the Textbook is bought, so a new player cannot spend themselves into a state where nothing can be learned.
- Credit income is bounded by content: book exams (first pass +50, resit +5 once per day per book), Daily Practice (+5 per correct answer, 3 a day) and the chapter-clear bonus (+60, first time only). More Chapters and questions are needed before it can be spent on more things.
