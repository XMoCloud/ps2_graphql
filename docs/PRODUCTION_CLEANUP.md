# Production cleanup

14 November 2026.

- Removed 30 unreachable source/style/shader files, including the legacy dashboard, old Three.js renderer, unused hardware prototypes, template UI components, hooks and removed sound control.
- Removed five obsolete config/host/license-copy files. Current PlayCanvas and CrystalClock license notices remain.
- Removed 49 unused direct dependencies and 121 installed packages. The five runtime dependencies are PlayCanvas, React, React DOM, React Router and Recharts. Required build/test dependencies remain.
- Removed approximately 150 MB of generated `.local/` captures and scratch files.
- Moved approximately 66 MB of unused recordings, raw sounds and reference textures out of `public/` into Git-ignored `.references/`. The user-provided memory-browser recording is preserved there.
- Removed `node_modules/` from the Git index while retaining the local installation. These staged deletions are intentional; dependencies are reconstructed with `npm ci`.
- Git ignores dependencies, generated builds, local/reference artifacts, coverage, Vercel local state, logs and environment files.
- Preview routes, sample accounts and the startup comparison are development-only. Production bundles contain none of their sample account labels or routes. Development-only comparison CSS is split out of the runtime stylesheet.
- Kept all active fonts, textures, sounds, live rendering code and original footage used by renderer recovery. Public assets decreased from about 112 MB to 46 MB; the complete build is approximately 48 MB.

## Verification

- All 53 tests pass, the production build succeeds, and `npm ci --dry-run` validates the lockfile.
- All 106 remaining relative source imports resolve.
- Browser smoke tests exercised the actual production build's startup, login, overview, projects, memory-card detail, audits and skills. Authentication and GraphQL used controlled test responses; no live account was modified.
- No JavaScript errors or missing runtime asset responses were observed. All 16 requested scene, sound and recovery assets returned HTTP 200.
- `/preview/dashboard` renders the production 404 page, and the output has no startup comparison chunk or sample account records.

The local archive and generated `dist/` are intentionally not committed. Source, lockfile, tests, runtime assets and useful design documentation remain ready to commit. No commit, push or deployment was performed by this cleanup.
