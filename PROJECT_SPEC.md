# Product brief: Emi's Learning Platform

## Purpose and audience
A cheerful, child-friendly Year 4 maths practice platform, especially times tables, designed for a 9-year-old. Use accessible language, responsive layout, large touch targets, and friendly visual feedback. Credit the project with “Made by Danny Kehoe”.

## Core games
Keep seven activities: Quick Quiz, Table Trainer, Speed Round, Missing Number, True or False, Division Dash, and Word Problems.

### Quick Quiz rules
- Exactly 10 questions per round.
- Every question has its own 60-second countdown.
- When time expires, lock that question, show the correct answer, and allow the learner to move to the next question. The final question should end the round cleanly.
- Show progress and final score out of 10.
- Clear intervals when answering, moving next, restarting, closing the game, or leaving the game view. Prevent double-scoring and timer races.

## Points and character profile
- Start with a free happy-face avatar: 😀.
- Correct answer: +10 points, once only per question.
- Provide a character name, chosen avatar, points total, and unlocked emojis.
- Emoji purchases cost points and unlock permanently for the player's local profile.
- Keep a large emoji catalogue with deliberately high prices for rare items (some in the 10,000–18,000 range). Never charge twice for an already owned emoji.
- Persist the local profile and owned emojis between visits on the same browser/device. Handle unavailable browser storage gracefully.

## Friends and leaderboards
- Users want to add friends and see who has the most points.
- Current prototype has friend codes that share a snapshot of a player's name, avatar and points. This is not live synchronization.
- To make a real cross-device leaderboard, propose and implement an appropriate backend only after explaining choices, privacy implications, required accounts/keys, and any costs. Do not put secret keys in client code.
- Keep local game/profile progress local by default if possible; make online leaderboard participation explicit and explain which profile fields are shared.
- Child-friendly privacy: minimise personal data; prefer nicknames, no public real names, no direct messaging, and controls to remove friends.
- Do not misrepresent manually imported friend-code scores as live scores.

## Website and app goals
- Must work in modern Safari and Chrome, including iPad touch input.
- Make the website installable as a PWA where feasible; only add offline behavior if tested.
- Fix the reported bug: buttons do not respond when opening the provided file on iPad. Test JavaScript and event binding; don't assume the preview is the only cause.
- Keep layouts responsive and buttons accessible with keyboard and touch.
- The user would like both a published website and an iPad/iOS app. A native iOS app requires appropriate Apple build/signing tools and account; the bundled Xcode project is only an earlier starter.
- Do not say the website is live or the app is published unless deployment/submission actually happened.

## Visual direction
Colourful and playful without looking too babyish: fox/rainbow/star motif, pastel colours, clear cards, emoji avatars, optional synthesized sound effects with a mute toggle.
