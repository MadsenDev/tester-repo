# Releasing Orbital Last Stand

The game uses semantic versions from `app-version.js`. That file is the single
version source read by both the page and service worker.

## Release steps

1. Choose the next semantic version.
2. Run `node scripts/set-version.mjs <version>`.
3. Add the release notes to `CHANGELOG.md`.
4. Run `node --test tests/*.test.mjs`.
5. Merge through the normal pull-request and Pages workflow.

Changing `app-version.js` makes the browser discover a new service worker
because the worker imports that file with `updateViaCache: "none"`. The new
worker downloads the complete application shell into a new cache and waits.
The running game offers **Update now**. Accepting activates the new worker,
removes prior version caches, and reloads atomically.

Do not call `skipWaiting()` during installation. The old page and old cache
must remain paired until the player accepts the update.

## Offline shell

`precache-manifest.js` lists every runtime JavaScript and stylesheet plus the
manifest and icon. CI compares it with the repository, so a new module cannot be
merged without being available offline.

Navigation is cache-first while controlled by the worker. This intentionally
prevents a newly deployed `index.html` from running against an older module
cache. Network update checks happen through the service-worker lifecycle instead.

