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

- **Saved on the device only:** nickname, points, stars, correct answers, best streak, owned emojis and backgrounds, friends list. Nothing is sent to a server.
- **Friend codes** contain only the nickname, chosen emoji and background, points and a random player ID. Friends' scores are snapshots, so they update only when a friend sends a new code. A code isn't tamper-proof: someone who knows how could edit it to show a different score.
- A live leaderboard would need an online database (such as Supabase or Firebase). That's a later decision, because it would put children's nicknames and scores online.

## Games

Quick Quiz (10 questions, 60 s each) · Table Trainer · Speed Round (60 s) · Missing Number · True or False · Division Dash · Word Problems · Times Tables Check (25 questions, 6 s each, typed answers, like the real Year 4 check).

Every correct answer earns +10 points, once per question. Points buy emojis and backgrounds in the Shop, which has an Emojis tab and a Backgrounds tab. A star is earned for a great round (8/10, 20/25, or 15 in a Speed Round).
