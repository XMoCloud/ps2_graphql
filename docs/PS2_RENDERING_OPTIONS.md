# PS2 rendering alternatives

Research date: 13 November 2026. This is a decision document; it does not migrate the renderer or change the UI.

## Recommendation

**Evaluate PlayCanvas with a deliberately authored scene before committing to another full redesign.** Its integrated rendering features and visual editor make it a strong alternative for the particular combination of glass, atmospheric depth, colored beams, and cinematic cameras in the supplied reference. This is an engineering recommendation based on documented capabilities, not a measured comparison of working PS2 prototypes.

For faithful original PS2 clock behavior, evaluate **the complete CrystalClock renderer compiled to WebAssembly** alongside it. The current site borrows its prism mesh, but that does not reproduce the complete renderer, shading, or animation.

Keep React, authentication, GraphQL, and SVG charts as the application layer. The 3D renderer should remain a replaceable visual layer driven by navigation and interaction events.

## What the reference asks for

The uploaded image shows dark forms at several depths, luminous blue edges, haze between objects, localized light, and soft detail. My interpretation is that lighting, depth composition, and atmospheric occlusion contribute more to its appeal than surface detail alone. A still image cannot establish its animation, frame rate, rendering settings, or device cost.

The current implementation has concrete gaps:

- `src/experience/nebula.js` draws a plane attached to the camera. Its two texture coordinates drift slowly sideways. It does not create outward flow or fog occupying the space between the crystals.
- Startup blocks use an arbitrary spiral distribution. Matching a few colors cannot correct their layout, depth, or camera trajectory.
- Startup colored lights are sprites. They have no actual trailing streak geometry, so they cannot produce the requested moving colored laser-like trails.
- The crystal pass combines physical transmission, alpha transparency, inner geometry, and edge lines. More transparency alone does not guarantee the original glass appearance; the reflection environment and surface treatment must be matched together.
- Purple backgrounds and panels have accumulated in the stylesheet. The next UI pass should return to dark navy and blue controls, keeping atmospheric violet separate from the interface palette.

These are implementation findings from reading the current source. An engine switch would still require correcting them.

## Options

| Approach | What it offers this project | Main tradeoff | Assessment |
| --- | --- | --- | --- |
| PlayCanvas + authored assets | Visual scene editing, refractive materials, integrated cinematic post-processing and light-scattering fog | Scene and material work must be rebuilt; lighting effects still need a GPU budget | Strongest alternative for the supplied cinematic reference |
| Babylon.js + authored assets | PBR materials, refraction, a node material editor, WebGPU support | Still requires a custom atmospheric effect and disciplined art direction | Strong alternative when code and material graphs are preferred |
| Raylib/WebAssembly using CrystalClock | Reuses an existing PS2 clock implementation, including its shader and motion logic | C++ build toolchain and a bridge to React; startup remains separate work | Most interesting route for original clock fidelity |
| Unreal Pixel Streaming | Unreal renders the actual scene remotely and sends interactive video to the browser | GPU host, streaming infrastructure, bandwidth and network dependence | Suitable for a hosted graphics showcase; poor fit for a simple account dashboard |
| Authored smoke textures + browser 3D | Detailed precomputed atmosphere with real-time crystals, camera and controls | Baked smoke cannot respond like a full fluid simulation; viewpoints must be considered | Useful production technique with either browser engine |

### PlayCanvas

PlayCanvas has a browser-based editor with live scene editing. Its CameraFrame pipeline documents bloom, depth of field, temporal anti-aliasing, color grading, lens flares and volumetric fog. Its materials support dynamic refraction using the rendered scene color. These are relevant tools for this reference, rather than a promise that engine defaults will produce the final look. Sources: [Editor](https://developer.playcanvas.com/user-manual/editor/), [CameraFrame effects](https://developer.playcanvas.com/user-manual/graphics/posteffects/cameraframe/), [Material refraction](https://developer.playcanvas.com/user-manual/editor/assets/inspectors/material/).

Its fog scatters directional, point and spot lighting and can account for objects blocking light. The documentation also exposes resolution and sampling controls because this effect has a real GPU cost. **Illuminated height fog is not automatically animated turbulent smoke:** outward motion would still need an additional authored or procedural effect. Source: [Volumetric fog](https://developer.playcanvas.com/user-manual/graphics/posteffects/cameraframe/volumetric-fog/).

### Babylon.js

Babylon provides physically based material controls including refraction, tint and subsurface behavior. Its node material system exposes reflection, refraction and Fresnel controls. WebGPU is supported alongside its WebGL implementation. This makes it a credible engine alternative; it does not inherently solve placement or improve every scene's performance. Sources: [PBR materials](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/masterPBR/), [Node material PBR](https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/NMEPBR/), [WebGPU support](https://doc.babylonjs.com/setup/support/webGPU/).

### Existing reconstruction + WebAssembly

[CrystalClock](https://github.com/rrtry/CrystalClock) is an MIT-licensed Raylib recreation of the PS2 display clock. Its repository includes an [Emscripten entry point](https://github.com/rrtry/CrystalClock/blob/main/src/emscripten_main.cpp) and [Web build configuration](https://github.com/rrtry/CrystalClock/blob/main/CMakeLists.txt). Raylib officially documents compiling for browsers through WebAssembly. Source: [Raylib web builds](https://github.com/raysan5/raylib/wiki/Working-for-Web-%28HTML5%29).

This is materially different from importing its mesh and inventing the remaining behavior. A prototype should preserve its renderer first, then expose camera and section controls to the application. Browser integration and performance have not been tested here. WebAssembly changes how the program is compiled; it does not automatically improve the image or remove GPU costs.

For startup accuracy, [aap/osdbits](https://github.com/aap/osdbits) documents and reconstructs towers, fog, streaks, refractive cubes and the boot camera, with comparisons against the original ROM. It targets PS2 hardware, not the browser, and contains no Sony texture data. Its menu implementation is notes only. Treat it as a technical reference for reconstruction, not a ready-to-embed web package.

### Unreal and the useful hybrid route

Epic's documented Pixel Streaming architecture runs Unreal on a separate computer and streams rendered audio/video to the browser, sending user input back. A production deployment therefore needs rendering hardware and streaming services in addition to the website. That introduces operating cost and network dependence. Source: [Pixel Streaming overview](https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine).

A more practical way to benefit from Unreal is to export expensive effects. Epic documents baking a Niagara simulation into a tiled sequence of images for efficient playback. My proposed adaptation is to use such smoke textures on depth-separated layers in the browser, while keeping crystals and cameras real-time. This retains interactivity, although the smoke simulation itself is precomputed. Source: [Niagara flipbook baking](https://dev.epicgames.com/documentation/unreal-engine/niagara-flipbook-baker-quick-start-guide-in-unreal-engine).

Blender can author the exact meshes and transform animation for glTF export, including supported transmission materials. The browser result still needs its own lighting and material validation; exporting a model is not equivalent to exporting the complete rendered image. Source: [Blender glTF export](https://docs.blender.org/manual/de/5.1/addons/import_export/scene_gltf2.html).

Spline is another visual authoring option with React and JavaScript exports. I would shortlist it for stylized interaction work rather than choose it first for this particular reconstruction. That is a workflow judgment. Sources: [Code export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code), [glTF export limitations](https://docs.spline.design/exporting-your-scene/files/exporting-as-gtlf-glb).

## How to decide without another full rewrite

Build an isolated, small scene comparison before changing the production renderer:

1. Match one original menu frame: geometry, arrangement, camera, lighting and glass. Include a side-by-side reference.
2. Add outward-moving atmosphere. Layer motion at several depths so it passes both behind and in front of the crystal structure; vary scale and opacity continuously without a visible loop reset. Validate whether this produces the requested sinking sensation.
3. Add one interrupted tab transition. Camera and crystal state must continue from their current positions; UI feedback should be immediate and the main camera move should settle in roughly half a second.
4. Reconstruct a short startup segment with measured block positions and camera motion, plus red, green and blue/violet streaks with persistent trails and the existing sound.
5. Measure frame times and GPU/CPU behavior on the user's browser. Compare visual quality at the same viewport and rendering resolution. A software-rendered automated screenshot is not a hardware performance benchmark.

Choose PlayCanvas if its lighting pipeline produces the desired cinematic scene at acceptable cost. Choose the full CrystalClock route if original clock fidelity is visibly stronger and its camera controls can support the menus. Babylon remains a credible alternative if its material workflow proves more effective in the comparison.

The pending visual direction remains: **dark blue UI, large glass prisms, outward-flowing atmospheric depth, colored startup streaks, and snappy continuous navigation**. Engine selection should be judged against those visible results.
