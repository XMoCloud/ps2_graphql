# PS2 GraphQL: interactive redesign and expanded insights

Planning date: 13 November 2026. Scope: a design and implementation plan; no application changes in this document's delivery.

Quick navigation: [3D experience](#5-the-interactive-3d-experience) · [Lighting and performance](#6-lighting-materials-and-low-end-performance) · [New metrics and graphs](#8-useful-new-metrics-and-svg-graphs) · [GraphQL drafts](#9-graphql-expansion-plan) · [Architecture](#10-technology-choices-and-scene-architecture) · [Delivery phases](#14-delivery-sequence-and-acceptance-gates).

## 1. Recommended direction

Turn the app into a personal PS2-inspired system browser: a procedural startup leads into a living crystal observatory, and each section feels like another part of the same console interface. Keep the atmospheric darkness, blue light, familiar symbols, fonts, and sound collection. Give those elements a coherent space and meaningful reactions to user input.

The signature experience should be:

1. A short, skippable flight through a field of dark towers and colored light trails.
2. A login screen that settles naturally out of that flight, with a real moving 3D background.
3. An orbiting crystal hub that changes composition when the user opens Overview, Projects, Audits, Skills, or Journey.
4. A memory-card browser for projects, with a restrained animated icon and a useful result history.
5. A procedural red error environment that responds differently to invalid credentials, connection problems, and a missing page.

**Visual priority:** make a small number of objects look excellent. Faceted silhouettes, controlled lighting, carefully painted reflection textures, and composition will contribute more than a large number of effects. Low quality must remain an intentionally art-directed version of the scene.

**Product priority:** answer practical questions: What changed recently? Which projects have I completed? How much XP did I earn this month? What is my audit balance? Which recorded skills are strongest? What does my journey look like?

### Recommended first release

Ship procedural startup + login, a persistent crystal scene, an accurate Overview, a better Projects browser, and dedicated Audits and Skills views. Add the more elaborate Journey environment after the data and visual budgets are proven. Put all experimental effects behind an appearance setting or a later milestone.

## 2. Requirements that remain binding

The attached assignment requires:

- Reboot01 authentication through `https://learn.reboot01.com/api/auth/signin`, using a Basic-authenticated POST.
- Both username/password and email/password login, helpful invalid-credential feedback, and logout.
- JWT Bearer authentication for GraphQL requests to `https://learn.reboot01.com/api/graphql-engine/v1/graphql`.
- At least three meaningful pieces of the authenticated user's school information.
- At least two different statistical graphs rendered with **SVG**.
- Normal queries, nested queries, and queries with arguments.
- A hosted application with usable UI and UX.

The 3D environment enhances the interface. Keep the required statistical charts in SVG and the important controls in HTML. A glowing 3D sculpture can echo a metric, but it must not become the only way to read it.

## 3. What the current repository actually does

This plan is based on the supplied requirements, both screenshots, and the source files below. Existing query definitions are evidence of intended integration, not proof that every field still works against today's authenticated schema. No user account was accessed, and no authenticated schema or live values were verified.

| Area | Current implementation | Consequence for the redesign |
| --- | --- | --- |
| Stack | React 18, Vite 5, Tailwind, React Router; React Query and Recharts are installed | Extend the existing app; a framework rewrite is unnecessary |
| Routes | `/`, `/dashboard`, `/projects`, and a catch-all page in [App.js](src/App.js) | Preserve existing URLs and add focused routes |
| Login | [Login.js](src/components/Login.js) owns startup, death videos, local audio instances, and several transition flags | Separate authentication, scene direction, and audio ownership |
| Startup | `ps2_startup.mp4`; initially attempts playback with sound; blocked autoplay reveals a click overlay | Build a real scene and an explicit keyboard-accessible start/skip choice |
| Authenticated background | [PS2AmbientLayer.js](src/components/PS2AmbientLayer.js) moves a shared menu video into the current container | Replace with one persistent renderer |
| Background ownership | Both [PS2Shell.js](src/components/PS2Shell.js) and Dashboard mount an ambient layer | Consolidate ownership; the shared video currently has competing containers |
| Styling | [index.css](src/index.css) already supplies PS2 colors, card surfaces, display fonts, fog, and transitions | Retain the identity, improve contrast and visual hierarchy |
| Dashboard | Profile, level, XP, recent projects, XP timeline, technology radar, audit ring | Improve accuracy and drill-down before adding more summary cards |
| Fetching | Dashboard starts seven requests with `Promise.all`; failures are logged, then loading ends | Split required profile loading from independently recoverable panels |
| Projects | Passed records deduplicated by object name, failed rows retained; XP joined by name | Counts combine different units; group by stable IDs and preserve result history separately |
| Charts | [XPProgressGraph.js](src/components/XPProgressGraph.js), [SkillsRadar.js](src/components/SkillsRadar.js), [AuditRatioGraph.js](src/components/AuditRatioGraph.js) use SVG | Keep and evolve them; add touch and keyboard access |
| Asset loading | [preloadAssets.js](src/lib/preloadAssets.js) schedules all collected media for preloading and retains the elements | Replace blanket preloading with scene-specific loading |
| Audio | Shared helpers in [sound.js](src/lib/sound.js), plus separate instances in Login and 404 | Use one audio controller with consistent preferences |
| Auth | JWT stored in local storage; expiration checked before protected page fetches | Centralize expiration and cache clearing; keep credentials out of scene/settings state |

### Data corrections to schedule first

1. **XP scope:** the headline total uses `event.path = /bahrain/bh-module`; timeline transactions use `object.type = project` without the same module constraint. The graph can therefore describe a different dataset.
2. **Synthetic XP:** the timeline appends an artificial transaction dated today when its transaction sum is below the headline total. Remove this. Reconcile the underlying records or label the discrepancy; never invent an earning event.
3. **Project identity:** names are display labels, not reliable join keys. Fetch `objectId`, result IDs, transaction IDs, and paths. Account for the same object appearing in multiple contexts.
4. **Project outcomes:** the current pass rate mixes deduplicated successful projects with failed result rows. Separate unique-project status from recorded-result pass rate.
5. **Skills:** the current query retrieves the highest amount per skill type, while the radar presents it as a percentage and ignores the mapping's technical category. Confirm score semantics, expose both groups, and preserve unknown skill types.
6. **Failure versus empty:** a query failure currently leaves default zero/empty values. Render failed, unavailable, empty, partial, and loaded states distinctly.
7. **Audit labels:** the current ring divides XP-like `up` and `down` amounts. These are not counts of audits. Say “audit credit given/received” until the platform semantics are confirmed.

### Asset inventory

The existing `public/ps2_assets` directory totals about **47.0 MiB** on disk. This is a file inventory, not a measured page transfer: actual downloads depend on preload behavior, browser decisions, and caching.

| Asset | Approximate size | Proposed role |
| --- | ---: | --- |
| `ps2_menu_loop.mp4` | 12.36 MiB | Reference for crystal shape, color, orbit, and pacing |
| `ps2_startup.mp4` | 2.09 MiB | Reference for startup composition and timing |
| `ps2_death_start.mp4` + `ps2_death_loop.mp4` | 13.05 MiB combined | Reference for procedural error choreography |
| `ps2_waves_loop.mp3` | 13.19 MiB | Keep the ambience; make an optimized, seamless delivery version |
| `ps2_death_sound.mp3` | 3.93 MiB | Reference/source for a quieter, bounded error cue |
| `ps2_default_bg.png` | 2.23 MiB | Reference and candidate for an optimized static fallback |
| Hover, click, logout MP3s | About 0.13 MiB combined | Reuse through the shared audio controller |
| Logo, local fonts | Small or separately stored | Preserve identity; validate serving and font loading |

Keep the collected originals during development. Removing video from runtime does not require deleting the collection. Once replaced, default page loads should not request those videos.

## 4. Art direction: a quiet console observatory

### Visual rules

- Deep navy and near-black space; use blue-white highlights to establish depth.
- A few large, faceted crystal forms and a concentrated orbit of lights. Keep recognizable shapes rather than filling the screen with particles.
- Slow, deliberate motion: a suspended system waiting for input.
- Thin luminous separators, restrained panel borders, and narrow selection markers.
- Reserve the PlayStation symbol colors for navigation and small feedback accents. Red takes over only during a deliberate error response.
- Keep display fonts for the brand, section headings, and selected prompts. Use a readable body font for labels, dates, values, and chart annotations.
- Use authentic PS2 browser/startup references as the main visual vocabulary. CRT scanlines, trophies, and modern neon effects are optional reinterpretations, not required PS2 features.

### Improve the composition shown in the screenshots

The current login has a strong central silhouette, but many symbols and the title compete with a conventional card. Replace some of those decorations with spatial depth: towers at the edges, a dark central reading area, and a distant orbit.

The Projects screenshot gives the background a large central stage and pushes the useful records down. Give the scene a controlled upper/right visual region and start the project browser directly below a compact summary. The background should feel present without determining the page's content spacing.

### Design tokens to prototype

| Token | Starting direction | Purpose |
| --- | --- | --- |
| Void | `#03050A` | Main backdrop |
| Space blue | `#07152A` | Depth and fog |
| Panel | `#0B1422` at roughly 92–97% opacity | Stable reading surface |
| Primary light | `#8EC8FF` | Selected edges, brighter values |
| Action blue | `#438AFF` | Focus and primary action |
| Main text | `#E6EEF8` | High legibility |
| Secondary text | Start around `#A0B0C6` | Labels and dates; verify contrast |
| Error light | `#FF5B57` | Error emphasis, paired with text |

These are proposed starting colors. Verify contrast against the final composited scene. Do not use low panel opacity as the main method of exposing the background.

## 5. The interactive 3D experience

### 5.1 Startup: build the scene, not a video player

**Look:** a sparse field of smoky rectangular towers, a deep blue haze, small orbiting lights, and a controlled camera descent. Flat faces should catch different light levels so they read as solid geometry even in darkness.

**Suggested sequence:**

| Time after Start | Scene | UI behavior |
| --- | --- | --- |
| 0–0.5 s | Darkness opens into faint depth and a first light | Start button initiates audio if enabled |
| 0.5–2.0 s | Camera moves between tower silhouettes; trails arc past | Skip remains available |
| 2.0–3.2 s | Orbit resolves and the camera slows | Login UI is already loaded behind the scene |
| 3.2–4.0 s | Camera settles into the login composition | Form fades in and becomes the interaction focus |

Treat these as proposed choreography timings. Match reference frames and refine by feel during the prototype.

Implementation approach:

- Reuse one or a few box geometries, with seeded transforms and `InstancedMesh` for repeated towers.
- Use a small set of instanced light sprites and reusable curves/trail geometry; avoid dozens of moving real lights.
- Animate an authored camera path, with delta-time damping and a clean final camera pose.
- Prefer distance fog and a soft background gradient over volumetric ray marching.
- Before login, use a fixed artistic seed. After authentication, optional personalization may reflect the user's own recorded activity; do not imply the anonymous scene knows account history.
- Keep a real HTML Start button, a visible Skip button, and a silent Continue option. Do not require clicking an invisible full-screen region.
- Returning users go straight to the form or dashboard; offer “Replay startup” in System settings.
- Reduced-motion mode resolves directly to a static composition with a short opacity fade.
- Failed WebGL initialization must reveal the form using the static fallback.

### 5.2 Login: the startup becomes a place

Keep the form calm and stationary while the world reacts around it:

- The camera rests beyond the tower field; two or three large silhouettes frame the form.
- Pointer movement adds a small, bounded camera offset. Disable this for coarse pointers and reduced motion.
- Focusing the identifier field gently brightens a nearby blue rim; password focus shifts the orbit's emphasis without changing layout.
- Submitting causes lights to gather and a quiet pulse to travel around the orbit. This indicates waiting, not fake percentage completion.
- Successful authentication moves toward the crystal hub while profile data loads independently. If data is slow, show useful loading panels rather than a black cover.
- Preserve password-manager support, visible field labels, autofill, and normal Enter-to-submit behavior.

Use pointer position and focus changes only. Do not send field contents or password length into the rendering system.

### 5.3 Crystal hub: one world, several camera compositions

**Look:** elongated, beveled, faceted blue crystals around an invisible center; a few soft orbital lights; a suggestion of pale internal depth. Shape and reflected light should make them attractive before bloom is enabled.

Model three crystal variants: short hexagonal prism, elongated prism, and a chipped/asymmetric prism. Share them across the scene with varied scale, orientation, and material tint. Prototype procedurally; use a compact Blender-authored GLB if hand-edited bevels produce a noticeably better silhouette.

| Active area | Crystal composition | Camera and interaction |
| --- | --- | --- |
| Overview | Balanced, open orbit; central dark area for the summary | Slow three-quarter view |
| Projects | Crystals form a loose arc toward the project browser | Move the cluster right/up; leave the list unobstructed |
| Audits | Two groups, joined by a thin orbit | Slight side view; amounts can influence restrained illumination |
| Skills | Fan arrangement with distinct directions | Selected skill emphasizes one facet/group |
| Journey | Towers return in the distance behind the orbit | Wider view; timeline scrubbing selects a milestone |
| System | Stable, nearly still composition | Preview quality/audio settings without distracting movement |

Navigation changes the scene's target pose. It does not destroy one canvas and create another. Use roughly 450–750 ms camera transitions in normal mode; keep the HTML content available immediately. New navigation interrupts the current transition smoothly from its current pose.

Direct interaction:

- Moving over an exposed crystal creates a small highlight, not a full-screen light burst.
- Clicking a clearly labeled scene hotspot can open its related tab or highlight an existing DOM control.
- Provide an explicit “Explore scene” mode for drag-to-orbit. Normal dashboard mode preserves page scroll and form input.
- Clicking a project card selects it in the browser and triggers one subtle crystal response.
- Selecting a chart range adjusts scene emphasis once; do not run expensive scene changes for every tooltip movement.

The primary menu remains conventional HTML navigation with clear labels. Every scene hotspot has an equivalent button or link. Decorative objects need no fake interactive affordance.

### 5.4 Project browser: the memory-card idea

Use a memory-card browser as the most distinctive new UI element beyond the background:

- Projects appear as saved items in a navigable grid, with a compact list alternative.
- Each item has a small icon, name, latest recorded outcome, earned XP, and last result date.
- Use a small reusable icon family: terminal block, connected nodes, browser window, geometric maze, server stack. Assign curated icons to known projects; use a neutral default for unknown ones.
- Initial grid icons should be SVG or pre-rendered images. Selecting a project can animate one corresponding object inside the **existing** canvas, positioned in a preview region.
- Avoid one WebGL canvas per project card and avoid generating dozens of constantly updating preview textures.
- A selected item opens a normal HTML detail panel: result history, grades, XP transactions, relevant dates, and any validated metadata.
- Add text search, outcome filter, date range, and sort by recent activity/name/XP. Preserve filters in URL parameters.
- Offer clear headings such as “Projects · Memory Card”; the metaphor should clarify the experience without hiding its purpose.

### 5.5 Error scene: preserve the drama, keep recovery fast

Create one procedural error variant shared by Login and 404:

- Blue desaturates into a dark red environment; a red core/ring becomes visible; crystals rotate into a more closed formation.
- Use a short authored transition, then a restrained idle pose. No camera shake or flashing is needed.
- Keep error copy, focus state, and recovery controls on a stable opaque panel.
- Offer a richer red-screen presentation as an optional “Dramatic errors” setting. Default credential feedback should be brief and should never trap the user in a cutscene.

| Condition | Visual response | Useful message/action |
| --- | --- | --- |
| Invalid credentials | Brief red rim and optional red idle | Check username/email and password; retry immediately |
| Network/offline | Amber/blue paused orbit | Connection unavailable; Retry |
| Session expired | Soft neutral fade | Session expired; Sign in again |
| One panel query fails | Local panel marker; background stays calm | Could not load this section; Retry section |
| Missing route | Full disc-error composition | Page not found; Back to Overview or Sign in |

Do not claim a 404 is a fatal data-protection event. Retain the disc-error mood with accurate copy. Stop error audio on recovery and cap its duration/volume.

## 6. Lighting, materials, and low-end performance

This is a primary design requirement. A convincing low-cost material setup is the first prototype milestone, not a final optimization pass.

### 6.1 Establish an affordable visual recipe

Build a material test composition with one hero crystal, one tower, a dark backdrop, and a representative reading panel. Compare the three quality tiers before creating the full scene.

1. **Geometry:** give the crystal enough bevel geometry to catch a thin highlight. Use flat-shaded facets and deliberate asymmetry. A few well-shaped facets beat a dense smooth model that looks like plastic.
2. **Reflection source:** author a small studio-like environment texture: large cool strip, narrow bright strip, and faint violet fill. Reflections should describe the facets; avoid a random HDR environment with noisy highlights.
3. **Key and rim:** start with a cool key and a restrained blue rim. Keep no more than two meaningful unshadowed lights in the normal scene; use emissive sprites for the rest.
4. **Depth:** use distance fog, near/far brightness separation, and darker back faces. Avoid depth-of-field blur over the entire interface.
5. **Highlight control:** maintain visible midtones, limit white clipping, and keep glow off body text. If disabling bloom destroys the shape, fix the lighting/material first.

Use a consistent color and tone-mapping setup across all tiers. Correctly tag color textures and keep non-color masks separate; avoid applying display conversion twice in custom shaders or effect passes. Review fixed-camera captures with the same exposure so a quality change does not unexpectedly wash out the palette. The scene's output treatment must not alter the HTML/SVG reading layer.

### 6.2 Material strategy by object

| Object | Recommended baseline | Higher-quality enhancement | Low-quality substitute |
| --- | --- | --- | --- |
| Crystal body | Faceted standard material with cool tint, moderate roughness, baked environment reflections | One selected hero can use physical transmission/thickness after profiling | Matcap shader with a shared reflection texture and inexpensive view-dependent rim |
| Crystal inner light | Small emissive inner mesh or restrained additive sprite | Very soft selective bloom | Same sprite, no bloom |
| Tower | Shared opaque material, directional face contrast, subtle vertex-color variation | Slight roughness variation | Unlit/cheap shaded faces with baked variation |
| Orbiting light | Billboard with a tiny radial alpha texture | One bloom contribution | Same billboard at lower count |
| Trails | Short reused ribbon/line geometry, additive material | Smoother trail sampling | Fewer segments and slower updates |
| Distant field | Instanced silhouettes or sparse points | Extra distant layer | Fewer silhouettes; no extra texture |

A matcap is a texture that encodes how a material looks across surface orientations. It can give a faceted object rich highlights without evaluating a complex glass material. Author its colors to resemble the higher-quality crystal so the composition feels consistent across devices.

**Avoid making every crystal refractive glass.** Physical materials add per-pixel cost as features are enabled, and an environment map is recommended for their appearance. Use true transmission only where it visibly improves the selected object; stylized opaque reflections are a valid default. [Three.js material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

### 6.3 Transparency and texture rules

- Prefer opaque crystal bodies with internal light accents. Multiple overlapping transparent bodies cause overdraw and can introduce sorting artifacts.
- Keep halos tight around small lights. Avoid large, layered transparent fog planes covering the viewport.
- Create one shared 256–512 px glow/matcap atlas where practical; test a 512–1024 px reflection source before considering a larger one.
- Use vertex colors for tower variation and masks for cheap localized light.
- Start with procedural primitives and a small number of textures; add texture compression only if actual texture payload or GPU memory warrants its decoder cost.
- Do not bake lettering into background textures; keep meaningful labels in HTML/SVG.
- Generate a small static poster from the final art direction for fallback. It should match the scene's lighting and camera pose.

### 6.4 Proposed quality tiers

These counts are starting budgets for a prototype, not measurements or promises. Evaluate on real devices and reduce counts/effects when the visual result does not justify their cost.

| Setting | Low | Standard | High |
| --- | --- | --- | --- |
| Resolution scale | DPR cap 1; allow lower internal scale if needed | DPR cap about 1.25 | DPR cap about 1.5 |
| Crystal count | 6–8 | 10–14 | 14–18 |
| Material | Matcap + simple rim | Shared standard/environment material | Same, plus at most one hero transmission material |
| Towers during startup | About 40 instances | About 80 instances | About 120 instances |
| Light particles | About 24 | About 64 | About 96 |
| Trail samples | Short/coarse | Moderate | Moderate with smoother interpolation |
| Shadows | None | None | None by default; add only after measured value |
| Bloom | None; sprite glow | Optional low-resolution selective bloom | Low-resolution selective bloom |
| Other screen effects | None | None | Optional very subtle scene-only grain |
| Motion | Slow, sparse, paced to around 30 fps | Aim for 60 fps | Aim for 60 fps |

Frame pacing at 30 fps requires deliberate scheduling; simply setting a quality flag does not throttle a renderer. Prefer a calm scene that can rest. If it remains continuously animated, explicitly manage the frame schedule and measure responsiveness.

### 6.5 Performance acceptance targets

- Target smooth input and scrolling first. Continuous scenes should aim for p95 frame time below about 20 ms on the reference standard device, and below about 36 ms on the reference low-end device.
- Initially target fewer than 40 draw calls and roughly 25k triangles in Low, fewer than 70 calls and roughly 60k triangles in Standard. Count composer passes and hidden render targets as well as meshes.
- Aim for initial decorative assets below 1 MiB compressed, plus a separately measured lazy-loaded 3D JavaScript chunk. Set a provisional target of 350 KiB gzip for that chunk and revise from an actual build report; do not treat it as a guaranteed library size.
- Optimize the ambient audio delivery separately; stream/load it after opt-in, with a provisional first-loop transfer target under 1 MiB if acceptable sound quality allows.
- Keep one canvas/context. Verify that route changes do not grow geometry, texture, audio-node, or listener counts indefinitely.
- Preserve a stable login layout before the 3D chunk loads. The form must remain available if it never loads.
- Pause scene scheduling and fade/pause ambience when the page is hidden. Resume without a large accumulated animation delta.

Use a borrowed or available low-end Android phone and an integrated-GPU laptop as named reference devices during implementation. Record their model/browser, scene quality, viewport, frame times, and temperature-sensitive slowdowns. Desktop CPU throttling alone is not a GPU test.

### 6.6 Automatic quality and fallback

Start conservatively in Auto; assess sustained frame times after shader warm-up and while the page is visible. Reduce resolution first, then bloom/transmission, then particles/trails. Downgrade after a sustained slow window, not one isolated frame. Use hysteresis and a cooldown to prevent oscillation; avoid silently increasing quality during an active session.

Provide manual Auto/Low/Standard/High, Static background, and Pause motion controls. Do not assume viewport width identifies GPU capability. Treat save-data hints, when available, as hints rather than universal APIs.

On renderer initialization failure or unrecoverable context loss, switch to the static poster. A restored context may recover once; repeated failures should remain in static mode. Chart rendering, authentication, and navigation continue independently.

Repeated geometry/material sharing, instancing, and rendering only when needed are supported performance techniques. Demand rendering works when a scene can rest; ongoing animation must schedule its own next frames. [React Three Fiber performance guide](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

## 7. Information architecture and new tabs

Use clear product names with a secondary console label. Desktop uses a compact top navigation; mobile uses a labeled menu or scrollable navigation with the active section visible. Do not force six tiny icon-only targets into a narrow header.

| Route | Label / console subtitle | Main question | Core content |
| --- | --- | --- | --- |
| `/dashboard` | Overview / System Status | What should I know now? | Current level, scoped XP, recent XP, audit balance, latest results, selected insight |
| `/projects` | Projects / Memory Card | What have I completed or retried? | Searchable project browser, distinct project/result counts, detail panel |
| `/audits` | Audits / Exchange | What is my contribution balance? | Given/received credit, all-time ratio, period movement, target calculator |
| `/skills` | Skills / Configuration | What recorded skills stand out? | Technology/technical categories, bars, optional radar, score explanation |
| `/journey` | Journey / Activity Archive | How has my recorded progress developed? | XP timeline, activity calendar, milestones, module/piscine scope |
| `/system` | System / Appearance & Sound | How should this console behave? | Audio, quality, motion, startup replay, preferences |

Show scope, date range, and last refreshed time near the relevant content. Account-wide audits and skills must be visibly distinguished from module XP. A global module picker should not silently change unrelated account-wide metrics.

### Overview layout

Desktop: compact identity/status strip; four useful metrics; one large XP chart; recent project results and audit summary; selected skill highlights below. Leave a deliberate margin or upper corner for the crystal scene rather than creating a blank hero section.

Mobile: identity, two-column metrics, XP summary/chart, recent projects, audits, and skills. Move elaborate scene exploration behind an explicit control; keep the background dim and simpler.

Remove email from the main dashboard surface and place it in an expandable profile section. Keep user ID available without making it a headline metric. Display XP in consistent decimal `kB`/`MB` units with exact values available, or consistently use `k XP`/`M XP`; explain the choice once.

## 8. Useful new metrics and SVG graphs

Priority definitions: P0 = integrity/foundation; P1 = first expanded release; P2 = richer follow-up; P3 = optional experiment. “Existing source” below means a table/field already referenced by the app or brief; live validation remains required.

| Priority | Insight | Source and computation | Presentation |
| --- | --- | --- | --- |
| P0 | Accurate module XP | One canonical module-XP filter used for aggregate and history | Total, reconciliation status, corrected cumulative SVG line |
| P1 | XP earned this month / last 30 days | Sum dated XP transactions within labeled boundaries | Metric with date-range drill-down |
| P1 | XP by week or month | Same XP history, bucketed by display timezone | SVG bars; switch total/period view |
| P1 | Project XP contribution | Sum transactions by validated project/context key | Ranked horizontal SVG bars |
| P1 | Unique project outcomes | Group result records by stable project/context key | Completed / no recorded pass / ungraded summary |
| P1 | Result history and retries | Chronological recorded results, with source semantics stated | Project detail timeline and grades table |
| P1 | Audit balance | `sum(up) - sum(down)` within the stated scope | Balance card with exact credit values |
| P1 | Credit to a chosen audit ratio | `max(0, target * down - up)` | Local what-if calculator; no API mutation |
| P1 | Audit credit over time | `up` and `down` transaction history | Paired monthly SVG bars; optional cumulative view |
| P1 | Technology + technical skill scores | Validated `skill_*` records | Sorted SVG bars; switch category, optional radar |
| P2 | Recorded activity days | Union of qualifying XP/result/audit dates | SVG calendar with per-day detail |
| P2 | Failed-then-passed projects | Evidence of a failed record followed by a pass for the same context | Milestone list and project links |
| P2 | First recorded success / strongest XP month | Earliest qualifying pass; largest XP bucket | Journey milestones with provenance |
| P2 | Piscine views | Progress/results/transactions in validated piscine scopes | Quest bars, result counts, dedicated date range |
| P2 | Recorded-result pass rate | Graded passing result rows / graded result rows | SVG outcome bar or donut, denominator explicit |
| P3 | Saved personal XP target | Browser-local goal, compared with scoped earned XP | Memory-card-style target indicator |

### Definitions and edge cases

- **Result records versus attempts:** `result` rows are not necessarily complete submissions or attempts. Call them “recorded results” until the type and lifecycle are confirmed. Exclude duplicate/multi-stage records from an attempt metric only under a documented rule.
- **Completed project:** at least one qualifying pass in that project/context. Separately show the latest recorded outcome; an earlier pass and a later failure can coexist in the history.
- **No recorded pass:** at least one graded failure and no qualifying pass in the selected dataset. This does not establish current enrollment or an unfinished task.
- **Pass threshold:** the app uses `grade >= 1` for `user_audit`. Validate that per result type. Keep ungraded/null results out of pass-rate denominators.
- **Time to success:** earliest observed relevant record to first recorded pass is an observed interval, not work duration. If offered, label it “recorded result interval”; do not call it study time.
- **Activity:** dates show recorded school events, not coding hours, Git commits, attendance, or every day the user studied. Prefer “recorded activity days” over a streak leaderboard.
- **Audit ratio:** `up/down`; zero denominator with positive `up` is “No received credit yet,” and both zero is “No audit credit yet.” Do not render a fictitious 50/50 distribution as real activity.
- **Audit calculator:** proposed contribution assumes received credit remains unchanged. It is a personal scenario, not a guaranteed school requirement. Do not hardcode an official threshold without platform evidence.
- **Skills:** highest observed amount, most recent amount, and verified proficiency are different concepts. Start with “recorded skill score.” Do not assert a percent scale until validated. Unknown types remain visible with a neutral label.
- **Skill trends:** need genuine dated historical values. The current distinct/highest query cannot prove growth. If only snapshots are possible, label “since this app first saved a snapshot” and obtain an explicit user choice before persisting personal history.
- **Date windows:** use half-open intervals `[from, to)` and one visible timezone, defaulting to the device setting. Offer Asia/Bahrain; do not silently mix UTC bucketing with local labels. Compare equal-length periods and label partial periods.
- **Small samples:** zero previous-period XP yields an absolute change and “no prior XP,” not infinite percentage growth. A single chart point must render correctly; no points means an informative empty state.
- **Level:** show the actual recorded level. Do not fabricate XP-to-next-level thresholds from a guessed formula.
- **Curriculum completion:** no percentage without a verified denominator and enrollment/curriculum relationship.

### Chart interaction contract

Every chart gets a readable title, unit, scope/date caption, concise takeaway, and a data table or list alternative. Pointer, touch, and keyboard users can select a point or bucket. Tooltips stay within the viewport and do not rely on hover alone.

Keep SVG text legible on small screens; avoid stretching a desktop viewBox with `preserveAspectRatio="none"`. Use responsive tick density and a suitable aspect ratio. If records are downsampled, preserve exact totals and identify grouped points. Use stable, component-unique IDs for SVG gradients and filters.

Animate chart entry once and briefly. Respect reduced motion. Do not make every data refresh replay all chart animations.

## 9. GraphQL expansion plan

### 9.1 Validate capabilities before implementing speculative panels

Use the authenticated role in the platform's GraphiQL explorer. Begin by discovering the root name rather than assuming `Query` or `query_root`:

```graphql
query DiscoverQueryRoot {
  __schema {
    queryType { name }
  }
}
```

Then inspect only the types/fields needed, including their arguments, nested relationships, scalar types, and role permissions. If introspection is unavailable, use GraphiQL's available documentation and small field probes; lack of introspection does not prove a table is absent.

Record a capability checklist in a future `docs/graphql-capabilities.md`:

| Capability | Evidence now | Validation needed |
| --- | --- | --- |
| Profile, transaction, result, object | Existing code and/or assignment | Authenticated field availability and scalar types |
| Aggregate XP/audit credit | Existing query definitions | Aggregate access, null handling, authoritative scope |
| Transaction → object/event | Existing query definitions | Event identity and context reconciliation |
| Stable IDs and paths | Assignment examples | IDs, ordering, uniqueness, relationship behavior |
| Progress records | Assignment examples | Current visibility and meaning of a progress record |
| Skill values/history | Existing skill query | Highest versus latest semantics, scale, history completeness |
| Piscine scopes | Assignment mentions piscine data | Actual paths/events for this campus/account |
| Pending audits, enrollment, teams | No evidence in the supplied app/brief | Entire relationship/permission/meaning must be discovered |

Do not promise a pending-audit queue, team roster, leaderboard, campus percentile, next assigned project, or attendance panel before that evidence exists. The stated API boundary is the authenticated user's information; plan the useful core around that boundary.

### 9.2 Query families and fetch cadence

| Family | Purpose | When to fetch |
| --- | --- | --- |
| `Profile` | Identity needed by shell/header | Once per authenticated session; explicit refresh |
| `XpSummary` | Scoped all-time and selected-period sums | Overview load; scope/date change |
| `TransactionPage` | XP history, project contributions, or audit history | Paginated, on the relevant tab |
| `ProjectResultPage` | Project browser and recorded outcomes | First browser page, then more as needed |
| `ProjectDetail` | One project's full result and transaction history | On selection; bounded by context |
| `AuditSummary` | Given/received aggregate credit | Overview and Audits, shared cache |
| `SkillSnapshot` | Current chosen skill-value representation | Skills or summary highlights |
| `ProgressPage` | Validated piscine/quest view | Only after the user opens that view |

Remove the duplicated XP aggregate and the unused successful-result selection in the current `XP_OVERVIEW` response. Share a cached profile between Dashboard and Projects. Fetch large histories on demand rather than as a prerequisite for showing the page.

### 9.3 Draft query shapes

The examples below are **implementation drafts**, not executed queries. Hasura-style input type names such as `transaction_bool_exp` and `result_bool_exp`, and every selected field, must be checked against the authenticated schema. Keeping filters in variables avoids hardcoding a different scope into each chart. The server still enforces authorization; a client `userId` filter is only a narrowing filter.

**A. Profile: retain a simple query.**

```graphql
query Profile {
  user {
    id
    login
    firstName
    lastName
    createdAt
  }
}
```

Fetch email separately only where the profile details need it. Confirm how the authenticated role restricts the `user` root before relying on `user[0]`.

**B. XP aggregates: all-time and selected period, with explicit filters.**

```graphql
query XpSummary(
  $all: transaction_bool_exp!
  $period: transaction_bool_exp!
) {
  all: transaction_aggregate(where: $all) {
    aggregate { sum { amount } }
  }
  period: transaction_aggregate(where: $period) {
    aggregate { sum { amount } }
  }
}
```

Candidate `all` filter, following the current headline definition:

```json
{
  "userId": { "_eq": 7657 },
  "type": { "_eq": "xp" },
  "event": { "path": { "_eq": "/bahrain/bh-module" } }
}
```

The ID is illustrative; obtain the actual identity from the authenticated profile and validate its scalar representation. Build `period` as `_and: [allFilter, dateFilter]`; `dateFilter` contains `createdAt: { _gte: fromISO, _lt: toISO }`. Calculate boundaries in the chosen timezone and send ISO timestamps.

**C. Reusable transaction history page: nested object metadata and stable IDs.**

```graphql
query TransactionPage($where: transaction_bool_exp!, $limit: Int!) {
  transaction(
    where: $where
    order_by: { id: asc }
    limit: $limit
  ) {
    id
    objectId
    type
    amount
    path
    createdAt
    object { id name type }
  }
}
```

Use a first page of around 200 records as an adjustable starting point. For later pages, combine the base filter with `id: { _gt: lastId }`, if the schema confirms a sortable unique ID. Sort the assembled series by `createdAt`, then ID, for display. Do not apply the latest-record ID cursor to a different date order.

For an XP chart, reuse **exactly the XP aggregate's base filter**. Add a project-only restriction only to an explicitly labeled project subset, and compare that subset with a matching aggregate. For audit history, use the validated account/module audit scope and `type: { _in: ["up", "down"] }`.

**D. Project results: fetch identity, context, and history.**

```graphql
query ProjectResultPage($where: result_bool_exp!, $limit: Int!) {
  result(
    where: $where
    order_by: { id: asc }
    limit: $limit
  ) {
    id
    objectId
    type
    grade
    path
    createdAt
    updatedAt
    object { id name type }
  }
}
```

Build the candidate filter from authenticated user ID, `type = user_audit`, a validated project restriction, and the selected module context. A path fallback should use an exact root or a delimiter-bounded descendant prefix such as `/bahrain/bh-module/%`, rather than `%bh-module%`. Check whether nested piscine contexts require exclusions. Escape SQL wildcard characters when building dynamic `_like` prefixes.

An event-based transaction scope and a result path prefix are **not automatically equivalent**. Map and verify their contexts using real records. Until then, label the two scopes explicitly and do not merge ambiguous records into one project total.

**E. Audit credit summary.**

```graphql
query AuditSummary(
  $given: transaction_bool_exp!
  $received: transaction_bool_exp!
) {
  given: transaction_aggregate(where: $given) {
    aggregate { sum { amount } }
  }
  received: transaction_aggregate(where: $received) {
    aggregate { sum { amount } }
  }
}
```

Set the filters to the same identity/context, with `type = up` and `type = down` respectively. Start with the current account-wide definition and label it. Period flows and all-time ratio are separate figures; do not silently present a monthly ratio as the official account ratio.

**F. Skill snapshot: preserve the current highest-recorded behavior until semantics are confirmed.**

```graphql
query SkillSnapshot($where: transaction_bool_exp!) {
  transaction(
    where: $where
    distinct_on: [type]
    order_by: [{ type: asc }, { amount: desc }, { id: desc }]
  ) {
    id
    type
    amount
    createdAt
  }
}
```

Include user/context restrictions in `where`. The existing `_like: "skill_%"` is a pattern: `_` is a wildcard. Confirm a suitable escaped prefix or supported regex operator, and also verify the returned types start with literal `skill_`. Highest amount should be called highest recorded score. If latest is the right domain rule, change ordering deliberately and document it.

**G. Progress/piscine exploration.**

```graphql
query ProgressPage($where: progress_bool_exp!, $limit: Int!) {
  progress(where: $where, order_by: { id: asc }, limit: $limit) {
    id
    objectId
    grade
    path
    createdAt
    updatedAt
  }
}
```

This uses fields from the assignment, not fields exercised by the current app. Validate them first. Resolve object metadata in a bounded follow-up query by the collected IDs if the object relationship is unavailable. Use a verified piscine context; never assume the example campus paths match Bahrain.

These families retain all required query styles: a normal profile query, nested object/event relationships, and queries with arguments/variables.

### 9.4 Completeness, reconciliation, and normalization

- Use keyset pagination with a stable unique ordering when supported. Hasura documents both offset and keyset approaches; choose the verified schema's capabilities. [Hasura pagination documentation](https://hasura.io/docs/2.0/queries/postgres/pagination/)
- Deduplicate raw records by source ID. Do not deduplicate transaction amounts by project name or silently discard legitimate repeated results.
- Normalize project identity using `objectId` plus a validated event/context key where necessary. Use a name/path label for display; unresolved context stays unresolved rather than being guessed.
- Maintain `loadedCount`, `hasMore`, and a completion/error state. Do not show all-time unique-project counts or a complete heatmap from one partial page.
- For long histories, show partial data explicitly, fetch additional pages incrementally, and provide a way to finish loading. Aggregate totals can appear before chart history is complete.
- Capture an upper bound for a history fetch when available. If results can change during paging, refetch/reconcile affected records; an ID bound alone does not make mutable result rows a database snapshot.
- Compare completed XP-history sums with an aggregate using the same filter. If new activity arrives mid-fetch, refresh/reconcile rather than injecting a “difference” transaction.
- Validate amount/date/grade parsing, reject invalid dates from plotting, and retain a visible data issue when records cannot be interpreted.
- Keep pure helpers such as `buildScope`, `sumXp`, `groupProjectHistory`, `bucketByPeriod`, and `deriveAuditBalance` separate from components.

### 9.5 Error handling and caching

Extend `graphqlQuery` to accept an `AbortSignal`, classify non-success HTTP responses, handle non-JSON bodies, and distinguish GraphQL errors from transport failures. Preserve useful successful fields when a response contains partial data and errors; do not replace missing values with zero automatically.

Use the already installed TanStack Query for shared profile/summary/history state. Query keys must include user identity, scope, filters, and relevant date bounds. Clear authenticated caches and cancel requests on logout/identity change. Pass the query's cancellation signal through to `fetch`. [Query keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys), [query cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)

Start with a short configurable freshness interval, manual Refresh, and no continuous polling. Do not retry invalid credentials, expired authorization, or schema-validation errors. Retry transient network/server failures modestly; respect server limits. Required profile failure gets a recoverable shell state; optional chart failure gets a local Retry control.

## 10. Technology choices and scene architecture

### Recommended stack

| Layer | Choice | Reason / constraint |
| --- | --- | --- |
| Application | Existing React + Vite + Router | Preserve working structure and URLs |
| 3D | Three.js through React Three Fiber | Reusable scene components driven by existing React state |
| Helpers | Only needed Drei helpers | Select useful camera/environment/performance helpers; measure bundle impact |
| UI animation | CSS transitions and a small scene timeline/damping utility initially | Avoid several overlapping animation systems |
| Charts | Existing hand-authored SVG, with reusable scales/axes | Meets assignment; retains control over console styling |
| Data | Existing GraphQL fetcher + installed TanStack Query | Cache and isolate independent panels |
| Audio | Shared HTML Audio/Web Audio controller | Reuse collected sounds, centralize gains and lifecycle |
| Assets | Procedural geometry first; small GLB/matcap/reflection textures as needed | Makes the visual budget reviewable |

**Version constraint:** the repository uses React 18. Official Fiber guidance pairs Fiber 8 with React 18 and Fiber 9 with React 19. Start with the compatible Fiber 8 line and verify the exact Three/Drei/helper peer dependencies before installing. Pin the chosen compatible set in the lockfile. A React major upgrade should be a separate decision. [Fiber introduction and compatibility guidance](https://r3f.docs.pmnd.rs/getting-started/introduction)

Plain Three.js is a reasonable fallback if the compatible React renderer/helper versions make a needed feature impractical. It gives direct control but requires more manual integration and cleanup. CSS/SVG alone remain the static/low-motion fallback and are ideal for the surrounding UI; they cannot provide the same faceted lighting and camera depth as the proposed hero scene.

An embedded scene editor can help explore visual composition, but the production choice should provide explicit material, draw-call, loading, input, and quality control. Do not replace the collected videos with another opaque, heavy embedded scene.

### One persistent root

Move scene ownership above both public and protected routes, while keeping authentication guards around protected **content**. An invalid URL also uses the shared scene controller.

```text
App
└─ BrowserRouter
   └─ ExperienceProvider
      ├─ AudioController
      ├─ SceneViewport [lazy loaded, error boundary, one Canvas]
      │  ├─ CameraRig
      │  ├─ TowerField
      │  ├─ CrystalOrbit
      │  ├─ LightTrails
      │  └─ SceneLighting / optional effects
      ├─ StaticBackdrop [visible until scene ready, or as fallback]
      └─ Routes
         ├─ Login / Startup controls
         ├─ ProtectedLayout
         │  ├─ Header / controls
         │  └─ Overview / Projects / Audits / Skills / Journey / System
         └─ NotFound
```

Keep authentication state, server data, experience settings, and high-frequency animation values separate. Scene state should describe intention:

```js
{
  scene: 'login', // startup | login | hub | error
  section: 'overview',
  selectedProjectKey: null,
  interaction: 'ui', // ui | explore
  quality: 'auto',
  reducedMotion: false,
  audioEnabled: false
}
```

Use an explicit reducer/state machine for boot, ready, authenticating, entering hub, and recoverable error transitions. Keep transition completion and request completion independent: skip, retry, Back, logout, and a fast route change must work mid-animation.

Update mesh positions, camera transforms, and shader uniforms through refs in the frame loop; keep them out of React state at frame frequency. Share geometry/materials, retain a bounded set of scene objects, and dispose owned resources when the experience unmounts. [Fiber performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

### Pointer and layer ownership

The HTML content layer owns input by default. Keep the background non-blocking. For scene exploration, enable a defined scene region or explicit mode; do not put an invisible full-screen pointer catcher over links and charts. Route menus, form input, dialogs, scrolling, and focus behavior retain priority.

Use the URL as the source of truth for the active section and filters; derive the scene target from it. Browser Back/Forward, direct deep links, and keyboard navigation must select the same camera composition as pointer navigation.

### Proposed file organization

```text
src/
  experience/
    ExperienceProvider.js
    experienceReducer.js
    SceneViewport.jsx
    StaticBackdrop.js
    scenePresets.js
    qualityProfiles.js
    scenes/{TowerField,CrystalOrbit,LightTrails,CameraRig}.jsx
    materials/
    audio/AudioController.js
  data/
    queries/{profile,xp,projects,audits,skills,progress}.js
    scope.js
    normalize.js
    metrics.js
    hooks/
  components/
    charts/ [shared SVG primitives and expanded charts]
    projects/ [browser, result history, selected preview]
  pages/
    [existing pages migrated incrementally, plus new sections]
public/
  ps2_assets/ [retained original collection]
  experience/ [optimized delivery assets and static poster]
docs/
  graphql-capabilities.md [created during authenticated discovery]
  visual-performance-baseline.md [created during the scene prototype]
```

Names are proposed, not a requirement to move every file before useful progress. New `.jsx` scene components work alongside the existing `.js` components. Avoid unrelated component or dependency cleanup in the visual prototype.

## 11. Sound and console interaction

- Keep the familiar hover/click/logout cues, but route all playback through one controller.
- Provide independent ambience and effects volumes, plus a persistent master mute.
- Unlock audio after an explicit user gesture; a muted preference remains muted on future visits. Startup must also work silently. Browsers can block unsolicited audible playback. [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- Debounce repeated focus/hover cues so quickly crossing a menu does not create harsh overlapping sound. Respect the difference between keyboard focus and pointer hover.
- Crossfade ambience across scene states; do not restart the whole loop whenever the route changes.
- Check the edited loop seam for clicks and use short gain fades for start/stop. Prepare a shorter delivery loop only if it preserves the atmosphere; keep the original file.
- Fade error ambience back into normal mode on retry. A failed panel fetch does not trigger the loud death sound.
- Suspend or pause audio when hidden and resume according to the user's setting and browser permission.
- An optional reactive light can follow playback gain or an audio analyser connected to the app's own sound. It requires no microphone access and should not run when sound is off.

Add a small bottom command strip where useful: Select / Back / Options with symbols plus readable labels. Make it adapt to pointer/keyboard context without claiming gamepad support. Gamepad navigation is a later experiment with explicit focus mapping and input-repeat handling, not a prerequisite for the first release.

## 12. Accessibility, responsiveness, and session behavior

- Every startup, tab, project, error-recovery, and settings action works with keyboard and touch.
- Connect form labels with inputs; associate errors with fields and announce submission errors once.
- On route changes, move focus appropriately to the main heading/content. Restore focus after closing project details and settings dialogs.
- Provide visible focus rings and adequately sized hit targets, aiming for 44 px touch controls where feasible.
- Honor `prefers-reduced-motion` from first paint and apply it to both CSS and the JS scene scheduler. Also provide a user override. The media feature expresses a user's preference to reduce motion. [MDN reduced-motion reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- Provide Pause motion separately from graphics quality and audio settings. These are different preferences.
- Do not depend on red/green alone for outcomes; include Pass/Fail or explanatory text. Use tested contrast over the real final background.
- Keep a static experience available on all devices. Canvas failure is a decorative failure, not an application failure.
- Avoid aggressive chromatic aberration, flashing, full-screen shake, and moving text. Scene grain/scanlines, if added, never cover the readable HTML layer.
- Remove the token immediately on logout and clear identity-specific data before any decorative power-off animation finishes.
- Treat JWT payload decoding as a convenience, not authorization proof. Normalize base64url decoding and malformed-token handling; handle server-side expiration even while a page remains open.
- Do not persist fetched private account history by default. Store only appearance/audio preferences locally. If changing token persistence, choose the session behavior explicitly and document the tradeoff; do not put credentials in URLs, logs, or rendering state.

## 13. Additional PS2-inspired ideas, ranked

| Idea | Why it fits | Effort / priority | Constraint |
| --- | --- | --- | --- |
| Memory-card project icons | Makes the project library recognizable and personal | Medium / P1 | Static grid; only selected preview animates |
| System configuration screen | Natural home for sound, motion, graphics, and replay | Small / P1 | Immediate, persistent, reversible settings |
| Orbital menu selection | Links navigation to the living background | Medium / P1 | HTML menu remains primary |
| Startup tower archive | Returning user's own recorded activity influences tower variation | Medium / P2 | Decorative mapping, clearly explained; no fake activity |
| Milestone crystals | Earned XP thresholds or first recorded pass get a selected visual marker | Medium / P2 | Derived from real records; distinguish custom milestones from school awards |
| Memory-card report export | A shareable SVG/PNG summary designed like a saved-game card | Medium / P2 | User initiates; email/ID hidden by default; charts stay readable |
| Activity archive scrubber | Move through actual milestones while the camera reframes | Large / P2 | DOM/SVG timeline is the accessible control |
| Ambient sound visualization | Gives a few orbit lights a subtle sound relationship | Small–medium / P3 | Analyse only app playback; respect mute/performance |
| Optional CRT display treatment | Adds another retro display mood | Small / P3 | Separate from PS2 authenticity; scene-only and off by default |
| Controller navigation | Makes the console metaphor tangible | Large / P3 | Ship only after reliable focus/input behavior |
| Full 3D room or explorable console | Potential standalone showpiece | Very large / defer | Too much navigation cost for the main data experience |

Avoid adding trophies, achievements, or predictions simply to fill a new tab. A few verifiable milestones are more useful than invented progress systems.

## 14. Delivery sequence and acceptance gates

Work in small vertical slices. Each milestone should be reviewable without waiting for all later ideas.

### Phase 0 — establish data and visual baselines

Deliver: authenticated schema/capability notes when an authorized local session is available; normalized scope definitions; reference frames extracted from the collected videos; initial bundle/network/frame measurements.

- [ ] Confirm current login modes, protected routes, logout, and existing chart behavior.
- [ ] Resolve XP scope and project/result-count definitions.
- [ ] Record actual asset requests rather than assuming all preloaded files fully transfer.
- [ ] Select reference desktop and low-end devices.
- [ ] Collect visual targets for tower faces, crystal silhouette, reflection placement, and error palette.

Gate: uncertain data fields are marked as unavailable/draft, and the visual target is concrete enough to compare with a prototype.

### Phase 1 — prove beautiful, affordable crystals

Deliver: isolated material/light test and one persistent scene behind the existing login/overview. Test original assets as visual references, not new runtime video dependencies.

- [ ] Build the three crystal shapes, tower instances, reflection/matcap textures, and static poster.
- [ ] Compare Low/Standard/High at identical camera poses with bloom disabled first.
- [ ] Measure frame times, draw calls, render targets, texture sizes, and lazy chunk size.
- [ ] Verify form input, scroll, keyboard focus, static mode, and context-failure recovery.
- [ ] Use a single scene owner; remove the competing ambient-layer mounts in the migrated path.

Gate: Low still looks intentionally lit and faceted; no fundamental visual quality depends on expensive glass or postprocessing. If it fails, improve the material recipe before expanding the scene.

### Phase 2 — connect the full console experience

Deliver: procedural startup, login waiting/success transitions, route-driven camera presets, shared error scene, and centralized audio/preferences.

- [ ] Skippable and silent startup; returning-user path; replay in settings.
- [ ] Rapid navigation, browser Back, retry during transition, and logout during animation all behave correctly.
- [ ] No required UI is hidden behind a black cover while a request stalls.
- [ ] Invalid credentials, offline state, session expiration, and 404 are distinct.
- [ ] No default network requests for the replaced MP4s.

Gate: the scene works as one continuous experience without adding friction to daily login and navigation.

### Phase 3 — ship useful expanded data

Deliver: corrected Overview, memory-card Projects, Audits, and Skills with SVG graphs and clear scopes.

- [ ] Shared profile/summary cache; independently retryable panels.
- [ ] Correct all-time/period XP and reconciled history.
- [ ] Unique projects separate from result rows; stable joins and result history.
- [ ] Audit credit balance/history and a clearly local ratio target calculator.
- [ ] Both skill categories, unknown-type fallback, and validated score labels.
- [ ] Keyboard/touch chart selection and data alternatives.

Gate: every displayed metric has a defined source, filter, denominator, and completeness state. At least two distinct SVG statistical graphs remain present.

### Phase 4 — Journey and signature extras

Deliver: recorded-activity calendar, milestone archive, selected project 3D preview, and validated piscine views. Add optional export/gamepad/reactive-audio ideas only if the first-release performance and interaction budgets still hold.

Gate: extras expose real information or reward exploration without slowing routine use.

### Phase 5 — verify and host

Deliver: production build, measured visual/performance report, updated README, and hosted-route checks.

- [ ] Desktop and physical low-end device runs at the chosen quality tiers.
- [ ] Test narrow portrait, landscape, large desktop, high-DPR display, and 200% zoom.
- [ ] Validate deep links for all routes on the existing Vercel rewrite or selected host.
- [ ] Confirm local fonts referenced by `/fonts/...` are present in production output. They currently live at repository root rather than under `public`; inspect actual output before choosing the fix.
- [ ] Check slow/offline connections, cancelled requests, expired tokens, partial GraphQL errors, and unavailable optional fields.
- [ ] Verify no accumulating GPU/audio resources after repeated route changes.

## 15. Verification plan for implementation

Do not write tests that merely duplicate a visual configuration. Test the parts where an incorrect result would mislead a user or break a session:

| Area | Meaningful cases |
| --- | --- |
| XP | Matching aggregate/history filters; repeated IDs; late-arriving records; no artificial current-date points; one/zero records |
| Projects | Same name with different IDs; same object in different contexts; fail→pass; pass→fail; null grade; repeated result stages |
| Dates | Timezone day boundaries; month boundaries; equal-length comparisons; start-inclusive/end-exclusive windows |
| Audits/skills | Zero denominators; no credit; amount versus count; highest versus latest; unknown skill type |
| Pagination | More than one page; failure on later page; cancellation; partial-data labels; changes during fetch |
| Sessions | Username/email login, invalid credentials, expired token, logout cache clearing, no previous user's data on next login |
| Experience | Skip startup, mute, reduced motion, static fallback, context failure, fast route changes, history navigation |
| Visual quality | Fixed camera/seed captures for Low/Standard/High; readable forms over brightest scene pose; no clipping/reflection artifacts |

During visual QA, compare reference and procedural scenes for silhouette, pace, palette, and depth. Recreating every frame of the video is unnecessary; the new scene should retain the PS2 mood while responding naturally to interaction.

Record actual before/after measurements for initial transfer, JavaScript chunk sizes, frame times, and resource counts. The budgets in this plan are targets until that report exists.

## 16. Decisions already recommended and remaining discovery

**Proceed with these design defaults:** one persistent canvas; compatible React Three Fiber; low-cost crystal materials first; restrained bloom; static fallback; existing SVG charts; memory-card Projects; separate Audits/Skills; optional short startup; sound and motion controls; no framework rewrite.

**Resolve through implementation evidence:** exact peer-compatible dependency versions, matcap versus standard-material baseline, whether the current XP event scope is the desired authoritative module definition, project/event joins, skill score semantics, available piscine paths, and actual low-end hardware budgets.

**Later preference choices:** how closely the startup should follow the original reference, whether dramatic red errors should be enabled, and which custom milestones deserve visual emphasis. The proposed defaults allow useful work without waiting on these preferences.

The best first prototype is a single beautifully lit crystal orbit behind the current login, with Low/Standard/High and Static switches. It tests the central visual ambition and the lower-end-device requirement before the rest of the redesign depends on it.
