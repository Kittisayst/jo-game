# GameSession Aggregate and Clock Synchronization

As the game expanded to multiple levels, boss battles, power-ups, and speedrun timing, state was scattered across multiple separate entities (`Score`, `Lives`, `LevelProgress`, `PowerUpState`) and React component states. Furthermore, UI countdowns for power-ups and speedrun elapsed time relied on browser `setInterval` timers, causing timer drift and desynchronization when the Phaser scene was paused.

We adopted the `GameSession` entity as an Aggregate Root in the domain layer, and synchronized session time progression with the Phaser game engine loop via `tickSessionUseCase(session, deltaMs)`.

## Considered options

- **Maintain naive `setInterval` in React for HUD timers** — rejected: React intervals drift under CPU load and continue running while the Phaser physics engine and scene are paused, leading to broken countdowns and incorrect speedrun times.
- **Pass individual entities (`Score`, `Lives`, `PowerUpState`) through every scene transition** — rejected: scattered state across scenes and React state hooks creates high coupling and makes save/restore difficult.
- **`GameSession` aggregate root driven by engine delta** — selected: `GameSession` holds `score`, `lives`, `powerUps`, `coins`, and `elapsedMs`. The Phaser engine's `update(time, delta)` loop ticks the session via `tickSessionUseCase`. When the game is paused (`this.scene.pause()`), Phaser stops executing `update()`, automatically and perfectly pausing all timers without custom pause logic in React.
