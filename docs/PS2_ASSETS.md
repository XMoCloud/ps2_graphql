# Production asset credits

The live experience uses PlayCanvas, locally hosted textures and sounds, and authored CSS 3D memory cards. Licenses needed for distributed third-party code and models remain alongside the runtime assets.

- `public/experience/PlayCanvas-LICENSE.txt`: PlayCanvas engine license.
- `public/experience/crystal-clock/prism.obj`, `normal.jpg`, and `noise.png`: [rrtry/CrystalClock](https://github.com/rrtry/CrystalClock), MIT, copyright 2025 rrtry. Full notice: `public/experience/crystal-clock/LICENSE.txt`. The model retains its normals, UVs and proportions. `referenceClock.js` adapts the crystal shader; `shaders.js` adapts the tunnel palette and lighting.
- `public/experience/ps2-smoke.webp`: Alan-bur's hand-remade PS2M4K intro smoke, converted to WebP. [Repository](https://github.com/Alan-bur/PS2M4K), [original texture](https://raw.githubusercontent.com/Alan-bur/PS2M4K/main/replacements/Intro/91ae57d6a311afd7-81bf9dc2.png). The creator describes the pack as freely available, hand-created replacement artwork; no explicit software license is asserted here.
- `public/experience/studio-small-08-1k.hdr`: [Studio Small 08, Poly Haven](https://polyhaven.com/a/studio_small_08), Sergej Majboroda, CC0. Used as the reflection environment, not the visible background.
- `public/experience/audio/menu-hover.mp3`, `menu-open.mp3`, and `menu-confirm.mp3`: normalized derivatives of reference-site sounds fetched from imsaud.me at the user's request. `menu-back.mp3` derives from the original project logout sound. [Source URLs and normalization notes](../public/experience/audio/SOURCES.md). These sounds are not represented as MIT-licensed assets.
- `public/ps2_assets/ps2_startup_sound.mp3`: extracted from the user's existing startup recording. The startup, waves and death sounds are original project assets.
- `public/ps2_assets/ps2_startup.mp4`, `ps2_menu_loop.mp4`, `ps2_death_loop.mp4`, and `ps2_default_bg.png`: original project footage/backgrounds retained for renderer recovery. Live generated geometry and smoke remain the default.
- `fonts/PsOld-vmPMD.ttf`, `fonts/zrnic rg.ttf`, and `public/ps2_assets/ps2_logo.png`: existing project fonts and branding. Main menu labels use native Helvetica/Arial fallbacks; the proprietary imsaud.me font is not redistributed.

The memory-card and save meshes use authored CSS 3D faces and SVG artwork. The previous PS2UI hardware prototypes, Glace experiment, Three.js renderer, unused original shader copies and duplicate raw menu sounds have been removed from production sources.

## Visual references and local archives

[PS2 Anniversary Tribute](https://ps2-anniversary-tribute.vercel.app/) informed pillar colors and depth gradients. [imsaud.me](https://imsaud.me/) informed orbital lights, menu typography, outlined labels and memory-browser transitions. No external site's JavaScript bundles or project artwork are redistributed.

The user-supplied `Desktop 2026.11.14 - 10.20.48.02 - Trim.mp4` recording is archived under `.references/public/ps2_assets/`. It is a visual reference, not a runtime video. The archive also preserves unused original sounds and reference textures. `.references/` is excluded from Git and deployment.

Memory-browser timing follows the recording: 1700 ms fades, 250 ms save staggering, a 400 ms detail rise, and a four-second detail rotation. Detail colors derive from each save's icon palette.

This is an independent PS2-themed tribute. See [rendering notes](PS2_STARTUP_RECONSTRUCTION.md), [memory browser review](PS2_MEMORY_BROWSER_REVIEW.md), and [header review](PS2_HEADER_REVIEW.md) for implementation and verification details.
