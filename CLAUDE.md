# Claude Code instructions for Emi's Learning Platform

Read `PROJECT_SPEC.md` and `README.md` before making changes.

## Working rules
- The website is `web/` (`index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`). Run `npm test` (Playwright: iPad WebKit + Chrome) after changes.
- Inspect the current code first. The user reported that none of the buttons respond on iPad; reproduce/test before making assumptions.
- Preserve all requested features and the credit “Made by Danny Kehoe”.
- Make small, testable changes. After each significant change, run available tests and check the browser console for JavaScript errors.
- Do not claim functionality is complete unless tested. Add automated tests where practical for timers, scoring, emoji purchases, persistence, and leaderboard ordering.
- Do not expose API keys, database secrets, or personal information in frontend code.
- Because the audience includes children, minimise personal data. Use nicknames; avoid direct messaging, location, public profiles by default, and unnecessary tracking.
- Keep local profile persistence separate from any optional online leaderboard. Clearly disclose any information shared online.
- The iOS starter under `ios-starter/` is older and may be out of date. Update it only after the web app behavior is verified. Do not promise App Store acceptance.
- Keep the UI touch-friendly and responsive for iPad Safari.

## First priority order
1. Audit the existing HTML and identify why taps/buttons may not work.
2. Fix and test all seven games, including the 10-question Quick Quiz with 60 seconds per question.
3. Verify one-time +10 point awards, local save/restore, default 😀 avatar, and emoji-shop purchases.
4. Review friend-code behavior and design a safe path to a genuinely live leaderboard. Explain backend options and required configuration before committing to a paid service.
5. Make the website installable on iPad as a PWA if technically appropriate.
6. Then bring the older iOS starter up to parity and document what is needed to build/sign it.
7. Provide exact deployment and testing instructions; never claim deployment has occurred until it has.
