# Continuous PlayCanvas PS2 world

One persistent PlayCanvas canvas renders startup, login and all six account menus. `/preview/startup` remains a deterministic, scrubbable comparison against the supplied 4.533-second recording. `/preview/dashboard` uses explicitly labelled sample account data.

## Scene choreography

- Startup contains five beveled glass cubes from frame zero, blue volumetric smoke, and the measured four colored light paths. Login pillars are disabled throughout the entire startup, including the closing frames.
- The cubes refract the actual scene color, using neutral transmission, scene-color refraction, beveled Fresnel reflections and direct highlights from the moving colored lights. Colored heads and ribbons render before the glass capture, so refraction includes the actual lasers and fog. Lights, ribbons and smoke reach zero gain before the final black frame.
- The original startup sound plays after Start system. Replay and Skip remain available.
- After blackout, the login camera pulls out from a distance of 5 to 37 units in 1.18 seconds. Its initial 112-degree turn quickly settles into a slow shared camera roll. Every pillar stays parallel on a regular lattice.
- Successful sign-in and the preview link pull the camera inward. The outgoing curtain finishes before the route commits at 520 ms; entry time is measured from the actual commit, so an expensive frame cannot skip arrival. The crystal scene moves inward from 52 to 30.6 units over 560 ms while the curtain opens. Logout keeps the account token and route until the blackout commit, then clears authentication and reveals the pillars. A navigation lock prevents a double click from restarting the move.
- Incorrect credentials trigger a full-screen red world, the existing death sound, a modal retry action and restored password focus. Server/network failures remain inline errors. Passwords are cleared after credential rejection.

## Reference materials and color

The account scene uses the MIT CrystalClock OBJ and normal map, preserving the authored broad faces, bevels, UVs and width-to-length ratio. Tangents are generated once. Original crystal shaders are retained with their MIT notice. The current material uses a corrected world-space tangent basis, tinted transmission, cap attenuation, normal-map detail, orbital highlights and a shared HDR reflection environment. It uses an environment approximation for glass rather than copying the complete scene every menu frame. Near surfaces render once, preventing rear-face reflections from stacking into washed-out lavender.

The crystal layout starts from the early front-facing pose in the local menu clip: twelve radial spokes, a 12.3-unit center radius, shallow shared tilt, and a camera anchor near 41.7% width / 49.1% height. Shaft twist is applied before radial placement. The ring rotates through depth as a group (7.5 degrees/second about Y, with slow tilt and roll), following multiple frames of the recording. A tab click adds a continuous 450 ms speed pulse and retains its completed angle. Every crystal uses the same violet glass: cyan highlights now arise from world-space light/reflection directions, including the seven blue orbital sources. Account content remains centered independently of this background anchor.

Purple fog uses an analytic tunnel intersection based on CrystalClock's original tunnel, palette, texture and distance-based lighting. Broad advected 3D cloud banks replace sharp radial texture ribs. Distance falloff clears the clock center gradually; there is no painted black disk. Startup and login instead use a bounded blue volume, keeping blue smoke behind the pillars rather than giving login the crystal world's empty core. Color gains are calibrated separately from camera exposure, using samples from the local recordings. Display-space colors are decoded before the linear compositor to avoid accidental gamma shifts.

Seven blue-white lights converge and fan out on a precessing clock ring. Each has a fading ribbon, white core and cyan/blue bloom. Tab changes keep the camera continuous while briefly accelerating crystal rotation: later tabs integrate a one-second forward smoke rush, earlier tabs reverse it, and slow forward drift continues between clicks without resetting its phase. Explore permits manual orbiting.

## Console interface

Live PlayCanvas 3D is the default again. `ps2-renderer-v2` stores the current choice; the original asset version remains an explicit System option. The previous fallback default is not migrated as a user preference.

The Glace dependency and optical UI filtering are removed. Native DOM panels use a restrained translucent navy material, thin edges, Helvetica-style typography on menu labels/key headings, cyan hover/selection and clear keyboard focus. Data text retains its own legible type. A static horizontal scanline and subtle RGB mask covers the screen; there is no flicker loop. Charcoal keycaps replace repeated controller symbols in navigation and the login form. There are no per-card SVG displacement filters or backdrop blurs. The overview profile is compact; its statistics share one strip and the center of the scene remains open. All six menus stay centered within 1120 px. Project tiles precede progression history. Audit statistics use a stronger backing for readability. Login has no top bar.

The user-selected PS2 Anniversary Tribute and the supplied original PS2 pillar image guide parallel shafts, smaller square caps, near-black recessed lengths and concentrated blue-white lighting. imsaud.me and the local recording guide orbital lights and restrained menu feedback. External site bundles are not redistributed.

Design resources reviewed from the user's collection: [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) and [Three.js performance](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-performance). Their hierarchy and profiling guidance is applied to this existing PlayCanvas app; engine-specific Three.js APIs are not transplanted.

## Rendering limits

- One scene compositor; no fluid simulation or live cubemap capture.
- The 1K Poly Haven HDR environment loads once and is shared by the crystals.
- Main fog: one analytic surface evaluation with a few noise samples. Login fog: 10 bounded volume samples; startup: 20. No intersecting fog planes.
- Geometry renders at native desktop resolution up to about 8.3 million pixels, DPR at most 2. The former 1.25 MP cap visibly enlarged pixels on desktop displays. A 2048x1210 browser check verifies a 2048x1210 canvas and no canvas blur filter.
- Up to 60 fps during startup, arrival, smoke rush and exploration; 30 fps for settled ambient motion. Hidden documents skip scene rendering. Ambient motion can be paused.
- The 108 static login pillars are merged into one mesh and one draw call. Per-pillar color and depth travel in vertex attributes.
- Main clock trails use static ribbon buffers and GPU orbit evaluation. Startup laser trails retain CPU-fitted tracks. Hidden cubes no longer update their physical material. Scene-color capture is enabled for startup, login floating cubes and death/recovery; it is disabled for the settled crystal world.
- Packed float color buffers preserve dark fog gradients where supported; RGBA16F is the next fallback. Four-sample anti-aliasing softens geometry edges.
- Startup lasers use individual world depths and historical camera poses for their trails. Red/pink trajectories continue through their close pass instead of reversing; the two heads remain more than 15 units apart at the crossing.
- The old Three renderer is not mounted on the app route.

Visual iteration includes software graphics and a Direct3D11 run on the available NVIDIA GPU. Browser scripting time and rendered frames are sampled after warm-up. These controlled samples are not a measurement of whole-system CPU utilization or other tabs/processes.

## Verification and fidelity boundary

Unit tests cover startup visibility/blackout, timeline samples, smoke direction and continuity, crystal placement, clock behavior, camera arrival/portal timing, authentication error classification, account summaries and pagination. Browser QA uses preview data and intercepted dummy authentication responses, never real credentials. It checks startup sound, red failure/retry, persistent canvas, navigation beneath blackout, all six menus, project search/details, mobile layout and paused animation.

This is a reference-calibrated reconstruction, not pixel-identical BIOS emulation. Geometry placement and startup light paths are fitted; volumetric cloud patterns and optical response remain authored approximations. The comparison route makes remaining differences inspectable. Asset sources and licenses are in [PS2_ASSETS.md](PS2_ASSETS.md).
