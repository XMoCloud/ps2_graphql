# Login ambience

17 November 2026.

The supplied `ps2_login_ambient.mp3` streams through one reusable HTML audio element. Start system prepares the track while the startup runs; playback begins at zero gain when startup finishes and the login camera starts. The existing post-startup cue still plays once. The initial prompt's sound toggle is removed.

The loop fades over one second. Invalid credentials crossfade login ambience out and death ambience in. A successful sign-in fades login/death audio out while dashboard waves retain their immediate start. Logout fades waves out and resumes the login ambience during the incoming login transition. Pausing never rewinds the login element or reloads its source; page refresh creates a new playback session. Hidden-tab and mute handling respect the desired scene, so returning to a tab cannot revive a suspended login loop over the account or death screen.

Automated checks cover startup timing, interrupted fades, master volume, error/login transitions, hidden tabs, repeated preparation, preserved playback position and unchanged dashboard/memory-menu behavior. Browser checks use actual local MP3 playback with intercepted sample sign-ins and account responses, without contacting the live authentication API.

The browser verified login audio starting within a few milliseconds of the startup sound stopping, a partial-volume overlap during the error crossfade, silent paused login audio during account use, dashboard audio fading on logout, and login playback resuming at the exact paused timestamp. No autoplay blocks or JavaScript errors were observed. Refresh behavior follows the page-lifetime audio controller; no playback position is saved in browser storage.
