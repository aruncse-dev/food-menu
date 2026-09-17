# SQLite WebAssembly

Vendored, not fetched from a CDN, because the app has to work offline and off a
plain static host with no build step.

| | |
|---|---|
| Source | `@sqlite.org/sqlite-wasm` on npm |
| Version | 3.53.4-build1 |
| Licence | Apache-2.0 (SQLite itself is public domain; the JS/WASM glue is Apache-2.0) |
| Files | `sqlite3.mjs` (the ES module), `sqlite3.wasm` (the engine) |

`sqlite3.mjs` locates `sqlite3.wasm` relative to its own URL, so the two files
must stay side by side.

To update: download the tarball from the npm registry, then copy `dist/index.mjs`
to `sqlite3.mjs` and `dist/sqlite3.wasm` across unchanged. Nothing is patched.

These two files are cached for a month by `vercel.json`. They are not
content-hashed, so an update must change the filenames (and the path in
`js/db.js`) or people keep the old engine until the cache lapses.
