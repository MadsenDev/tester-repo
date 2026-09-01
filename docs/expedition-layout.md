# Expedition layout rules

Expedition uses controlled procedural generation: topology may vary heavily, but room meaning is constrained so optional content never becomes mandatory progression.

## Critical path

Each sector first grows a connected graph of ordinary rooms. The boss is selected from the deepest terminal room by graph distance from the start. The generator records the resulting start-to-boss route as `criticalPath`.

Only ordinary combat rooms may sit between the start and boss. Shops, Module Vaults, Forked Signals, Rest Bays, secrets and other optional economy rooms may never gate the boss.

This follows the useful structural lesson from The Binding of Isaac: Rebirth: generate topology first, then assign special-room meaning according to graph position instead of painting special types onto arbitrary nodes.

## Terminal special rooms

Module Vaults, Scrap Exchanges and Forked Signals consume non-boss dead ends. They must have exactly one connection. They therefore remain optional destinations and can never become corridors to progression.

The boss consumes the deepest suitable dead end. Black Signal remains a post-boss branch and is locked until the boss is cleared.

Elite rooms are optional side-route content and are prohibited from the critical path. They do not have to be terminal, leaving room for later alternate-route designs.

## Rest Bay

The old guaranteed Quiet Dock is removed from the normal room checklist. Recovery is now a rare Rest Bay, analogous in purpose to unexpectedly finding a bedroom/bed during an Isaac run rather than receiving a scheduled healing station.

A sector has only a 12% opportunity to turn an otherwise unused terminal room into a Rest Bay. Some runs may therefore go many sectors without seeing one. It remains optional and can never gate the boss.

The existing recovery effect is retained for now; presentation can become a physical rest/repair fixture without changing the topology contract.

## Secrets

Null Chambers are attached only after ordinary and special-room assignment. They never count as progression and are never required to reach the boss. Additional secret chance from modules follows the same rule.

## Validation invariants

`validateExpeditionLayout()` rejects generated sectors when:

- a Shop, Module Vault, Forked Signal or Rest Bay is not terminal;
- one of those optional rooms appears on the critical path;
- any non-combat room gates the boss;
- the boss is missing.

Generation and tests should treat these as hard rules, not aesthetic preferences. Randomness gets to choose the shape of the sector. It does not get to decide that the only road to an apocalyptic machine runs through the gift shop.
