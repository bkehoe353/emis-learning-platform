# Emi's Learning Platform

A Year 4 times-tables practice website with eight games, points, an emoji shop and a friends leaderboard. Made by Danny Kehoe.

The website lives in `web/`. The older iOS app starter in `ios-starter/` is out of date and not updated yet.

## Why buttons didn't work on the iPad

The game code was fine. Opening an `.html` file from the Files app, an email or a OneDrive preview shows the page **without running its code**, so nothing responds. The site needs to be opened from a web address (GitHub Pages below, or `localhost` when testing). A preview now shows a message explaining this.

## Run it on this computer

Needs [Node.js](https://nodejs.org) (already installed here).

```bash
npm start
```

Then open http://localhost:8000.

## Run the automated tests

The tests play the games in WebKit, Safari's engine, set up as an iPad with touch, and in Chrome.

```bash
npm install
npx playwright install webkit chromium
npm test
```

## Publish on GitHub Pages (free)

1. On github.com, create a new **empty** repository (for example `emis-learning-platform`). Public is required for free GitHub Pages.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. From this folder, connect and push:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/emis-learning-platform.git
   git push -u origin main
   ```
4. Open the **Actions** tab. The workflow runs the tests and, if they pass, publishes the site. The address will be `https://YOUR-USERNAME.github.io/emis-learning-platform/`.

Every later `git push` republishes automatically.

## Put it on an iPad's Home Screen

1. Open the website address in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open the game from the new fox icon.

This matters: Safari can delete saved progress for websites that haven't been visited for about 7 days. Saved data for Home Screen apps isn't cleared that way. After the first visit the games also work offline.

## What's saved, and what's shared

- **Saved on the device only:** nickname, points, stars, correct answers, best streak, owned emojis and backgrounds, best rank, tricky facts, day streak, badges, friends list. Nothing is sent to a server.
- **Friend codes** contain only the nickname, chosen emoji and background, best rank and rank time, day streak, points and a random player ID. Friends' scores are snapshots, so they update only when a friend sends a new code. A code isn't tamper-proof: someone who knows how could edit it to show a different score.
- A live leaderboard would need an online database (such as Supabase or Firebase). That's a later decision, because it would put children's nicknames and scores online.

## Games

Quick Quiz (10 questions, 60 s each) · Table Trainer · Speed Round (60 s) · Missing Number · True or False · Division Dash · Word Problems · Times Tables Check (25 questions, 6 s each, typed answers, like the real Year 4 check) · Ranked.

**Ranked:** 15 typed questions, up to 10 s each. Your rank comes from your average time per question. A wrong answer or a timeout counts as 10 s. Amethyst ≤ 2.5 s · Diamond ≤ 3.5 s · Gold ≤ 5 s · Silver ≤ 7 s · Bronze otherwise. Your profile and friend code show your best rank ever. Medal images are in `web/ranks/` (made by `node tools/make-medals.mjs`).

**Personalised practice:** facts you get wrong (e.g. 7 × 8) are remembered on the device. About 3 in 10 questions in the other games come from these tricky facts, never the same one twice in a row, marked "🎯 Practice time". Each correct answer counts a fact down until it is forgotten. Ranked stays random so it is fair between friends.

**Daily streak:** the first correct answer each day adds to your day streak and gives a daily bonus (+20 on day 1, rising to +110 from day 10). Miss a day and it starts again.

**Badges:** 23 collectable badges (first answer, 100 correct, perfect round, 7-day streak, Diamond rank and so on). Each one gives +50 points once. They are in the Shop’s Badges tab.

**Celebrations:** confetti and a fox message for perfect rounds, stars, new ranks, badges, streaks and purchases. Confetti is skipped if the device asks for reduced motion.

**Rarities:** every emoji and background is Common (under 1,000), Rare (1,000+), Super Rare (5,000+), Epic (10,000+) or Legendary (16,000+), shown with a coloured label. Legendary cards shimmer. Ultra Legendary is above all of these and can only be won.

**15-Day Reward Event:** finish 2 exercises (any game, played to the end) in a day to unlock that day’s reward, then tap Claim. Missing a day just pauses the event. Rewards: streak freezes (days 1, 6, 10), points (days 2, 5, 8, 12, 14), mystery event-only emojis (days 3, 7, 11), event-only backgrounds (Super Rare, Epic, Legendary on days 4, 9, 13) and the Ultra Legendary 🐆 Cheetah on day 15. Event items show in the shop but can’t be bought.

**Streak freezes:** each freeze covers one missed day, so the day streak isn’t lost. It is used automatically when you next open the site. If you missed more days than you have freezes, the streak resets and the freezes are kept.

**Tabs:** the site is split into Play, Shop, Friends and Event tabs. A dot on the Event tab means a reward or the chest is waiting. Leaving the Play tab stops any game in progress.

**Weekly Treasure Chest:** practise (get at least one answer right) on 4 different days between Monday and Sunday to unlock one free chest. Prizes: 250–500 points, a streak freeze, or one of six chest-only emojis (never a duplicate). The possible prizes are shown up front, and chests can’t be bought.

**Pet fox:** grows through six stages (Baby → Little → Clever → Super → Royal → Legendary Fox) as correct answers add up. It can be renamed, cheers when tapped, and is never sad.

**Boss Battle:** a new boss every Monday with 300 HP. Each correct answer hits it for 10, or 15 if answered within 3 seconds (critical). Health is saved through the week. Beating it gives +300 points and the Boss Beater badge.

**Friend Challenge of the Day:** the same 10 questions for everyone on the same date. The first try is saved (score, then total time), and later tries are practice. Friend codes carry today’s score, and the Friends tab shows today’s board.

**Try it on:** any shop item can be previewed on your character for 6 seconds before buying.

**Leaderboard:** ordered by best Ranked medal, then faster average time, then points. It shows each person’s medal, rank time, day streak and points. Friends’ details come from their latest friend code.

**Progress backup:** “Make backup code” creates a code (starting with EMI1-) holding all progress and friends. Pasting it into “Restore” on any device brings everything back (two taps, because it replaces that device’s progress). A checksum rejects codes that were copied wrongly. It is not tamper-proof.

Every correct answer earns +10 points, once per question. Points buy emojis and backgrounds in the Shop, which has an Emojis tab and a Backgrounds tab. A star is earned for a great round (8/10, 20/25, or 15 in a Speed Round).
