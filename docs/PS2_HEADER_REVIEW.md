# Header arrangement and restored startup review

14 November 2026.

The account UI has one responsive top bar. Its controls are centered within a maximum width of 1520 px, keeping branding/date and clock/account controls close to the tabs rather than at the screen edges. Date and clock now use white 21 px menu typography with the same black outline as the other menu labels. Account and login sound toggles have been removed. The background retains translucent glass with a 14 px backdrop blur. Tablet uses two rows; phones put branding/account controls first, date/clock second, and tabs third. Login continues without an account bar.

Blue hover and yellow selection feedback are restored across account tabs, chart switches, memory cards, saves and login controls, retaining black text outlines. The ordinary Refresh data and Skip startup buttons are removed. Failed data requests retain their contextual Retry action, and a failed renderer retains its original-background recovery action.

The previous startup animation has been restored: its recorded camera path and lens remain intact, glass/lasers/smoke fade to black, then the login camera pulls outward to reveal the pillars. The continuous blue-smoke handoff has been removed. Pillars retain fixed geometry without expansion or shaft extension, and remain hidden throughout startup. Logout keeps its existing camera transition without replaying startup.

Memory cards use an explicit display order independent of GraphQL event IDs: 01 Main projects, 02 Go piscine, 03 JavaScript piscine, 04 Rust piscine. Their underlying account records remain associated with the original card IDs.

Project and piscine exercise details omit the Save location section, its raw record path and grade history. Team membership and the latest grade remain available. Back stays fixed at the bottom-left outside scrolling detail content.

## Screenshots

[Desktop header arrangement](visual-review/header-arranged-desktop.webp) · [Phone header arrangement](visual-review/header-arranged-mobile.webp)

Account screenshots use sample data.

## Verification

Production build and 53 tests pass. Browser checks reported no JavaScript errors. The centered header was checked at 2560, 1920, 390 and 320 px, with no horizontal document overflow. At 2560 px its contents span X=520 to X=2040. Date and clock have the same eight-direction 2 px black text outline as other desktop labels. Browser checks confirmed the absence of Save location in both project and piscine exercise details, while team information remains. The login page has no sound button or empty controls footer. Startup visibility tests confirm that glass and smoke are fully hidden at 4.5 seconds, while login pillars remain hidden throughout startup. The memory-card order remains Main, Go, JavaScript, Rust.

## Solid pillars and immediate login ambience

Short columns now use full surface alpha at rest and the lattice writes depth. Blue haze and dimmer lighting are applied to RGB, so the pillars no longer reveal other geometry through their faces. [Updated opaque pillar view](visual-review/solid-short-pillars.webp).

Login silently prepares the original waves MP3 when credentials are submitted. Accepted authentication starts it immediately at the configured gain, before the camera leaves login, with no initial fade. The experience keeps it uninterrupted through both camera stages; memory menus still fade, pause and resume the same transport. Verified live: the first waves play occurred on `/` before the leaving stage, at gain 0.2475; memory-menu pause/resume preserved position. Build and 53 tests pass; browser checks reported no JavaScript errors.
