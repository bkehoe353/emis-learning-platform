# Project history / decisions captured so far

- Project name: Emi's Learning Platform.
- Intended learner: Year 4 / around age 9; times-tables and maths practice.
- Credit line: “Made by Danny Kehoe”.
- Games requested: Quick Quiz, Table Trainer, Speed Round, Missing Number, True or False, Division Dash, Word Problems.
- Quick Quiz: 10 questions, 60 seconds per question.
- Points: +10 per correct answer; points intended to be earnable across games.
- Character profile: name, points, avatar, unlocked emojis.
- Default profile emoji: 😀, free.
- Emoji shop: many choices; prices should be quite expensive, with rare choices up to 18,000 points.
- Local save preference: profile/points/items stored on the player's device/browser by default.
- Friends: add friends and compare points on a leaderboard. Current prototype uses friend codes to import score snapshots. Automatic cross-device updates require a backend and a privacy decision.
- User's reported issue: on iPad, buttons do not respond at all when opened from the supplied file. Must be investigated and fixed, not merely assumed to be a preview limitation.
- Desired end result: a working website that can be used on iPad and added to Home Screen, plus a path toward a proper iOS app/App Store release.

## 2026-10-24 decisions
- iPad "buttons don't respond" cause: the file was opened in a preview (Files/email/OneDrive), which doesn't run JavaScript. Served over http it works. Fix = host it; a `<noscript>` message now explains this.
- Players: one profile per device; friends play on their own devices.
- Friends: keep friend codes (snapshots) for now; no online database yet.
- Hosting: GitHub Pages via GitHub Actions (tests must pass before publishing).
- Added an 8th game: Times Tables Check (25 questions, 6 s each, typed answers).
- iOS app: deferred; the installable website (Home Screen) comes first.
