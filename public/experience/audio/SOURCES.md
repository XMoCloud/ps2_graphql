# Menu sound sources

Fetched from imsaud.me on 2026-11-13 at the user's request:

- `select.mp3`: https://www.imsaud.me/select.mp3 — menu focus/hover.
- `cube-select.mp3`: https://www.imsaud.me/cube-select.mp3 — open project details.
- `SelectChoice.mp3`: https://www.imsaud.me/SelectChoice.mp3 — confirm a selection.

These source URLs identify the originals used to derive the normalized menu cues below. The raw downloads are archived locally under the Git-ignored `.references/` directory and are not shipped. The sounds are not covered by the MIT license of the separate CrystalClock resources. Playback uses the app's master volume and hidden-tab controls. Original local startup, waves and death sounds remain in use.
# Menu normalization

`menu-hover.mp3`, `menu-open.mp3` and `menu-confirm.mp3` are derived from the
corresponding reference sounds above. `menu-back.mp3` derives from the existing
project asset `ps2_logout.mp3`, now archived in `.references/`. The derived short cues
remove leading silence and use FFmpeg EBU R128 normalization at -21 LUFS with a
-2 dBTP ceiling. Runtime gains preserve a slightly quieter navigation cue.

