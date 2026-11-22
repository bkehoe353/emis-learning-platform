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
- **Online friends (optional, Firebase):** only for a child who taps “Join online friends” (it asks them to check with a grown-up first). Their nickname, a short tag (like #K2P7), emoji, background, points, best league and time, day streak and today’s Friend Challenge score are stored online so friends can find them by nickname, and added friends update by themselves. Never real names, email, location or messages. “Leave online friends” deletes the online profile. It stays switched off until a grown-up completes [docs/ONLINE_SETUP.md](docs/ONLINE_SETUP.md); the security rules are in `firestore.rules`.

## Games

Quick Quiz (10 questions, 60 s each) · Table Trainer · Speed Round (60 s) · Missing Number · True or False · Division Dash · Word Problems · Times Tables Check (25 questions, 6 s each, typed answers, like the real Year 4 check) · Ranked.

**Ranked:** 15 typed questions, up to 10 s each. Your rank comes from your average time per question. A wrong answer or a timeout counts as 10 s. Amethyst ≤ 2.5 s · Diamond ≤ 3.5 s · Gold ≤ 5 s · Silver ≤ 7 s · Bronze otherwise. Your profile and friend code show your best rank ever. Medal images are in `web/ranks/` (made by `node tools/make-medals.mjs`).

**Personalised practice:** facts you get wrong (e.g. 7 × 8) are remembered on the device. About 3 in 10 questions in the other games come from these tricky facts, never the same one twice in a row, marked "🎯 Practice time". Each correct answer counts a fact down until it is forgotten. Ranked stays random so it is fair between friends.

**Daily streak:** the first correct answer each day adds to your day streak and gives a daily bonus (+20 on day 1, rising to +110 from day 10). Miss a day and it starts again.

**Badges:** 29 collectable badges (first answer, 100 correct, perfect round, 7-day streak, Diamond rank and so on). Each one gives +50 points once. They are in the Shop’s Badges tab.

**Celebrations:** confetti and a fox message for perfect rounds, stars, new ranks, badges, streaks and purchases. Confetti is skipped if the device asks for reduced motion.

**Rarities:** every emoji and background is Common (under 1,000), Rare (1,000+), Super Rare (5,000+), Epic (10,000+) or Legendary (16,000+), shown with a coloured label. Legendary cards shimmer. Ultra Legendary (the Cheetah and the Emi emoji) is above all of these.

**15-Day Reward Event (ended):** its prizes (the epic animal emojis, the 🐆 Cheetah and three backgrounds) are now sold in the Shop. Any reward a player had unlocked but not claimed is given automatically.

**Fox Fashion Event (20 days):** finish 2 lessons (any game, played to the end) in a day to unlock that day’s reward, then tap Claim. Missing a day just pauses the event. A fox suit every 3 days (Beach, Dinosaur, Astronaut, Pirate, Wizard, Superhero) and the Ultra Legendary Royal Dragon Suit on day 20. Other days give points, streak freezes or bonus chests. Suits can be changed under the pet on the Play tab.

**Emi emoji:** an Ultra Legendary emoji of a girl riding a cheetah (drawn as 👧 on 🐆). It costs 30,000 points and can only be bought.

**Streak freezes:** each freeze covers one missed day, so the day streak isn’t lost. It is used automatically when you next open the site. If you missed more days than you have freezes, the streak resets and the freezes are kept.

**Tabs:** the site is split into Play, Shop, Friends and Event tabs. A dot on the Event tab means a reward or the chest is waiting. Leaving the Play tab stops any game in progress.

**Christmas Advent Calendar (December 2026):** switches itself on from 1 December and off again in January; before December nothing about it is shown. 24 doors in a jumbled order, each unlocking on its date and opening after 1 finished lesson that day (missed doors can be opened later in December). Prizes: 7 Christmas-only emojis, 3 snowy backgrounds, Elf / Snowman / Christmas Jumper fox suits, points, streak freezes, bonus chests, and the Ultra Legendary Santa Suit on door 24. December also brings gentle snowfall and a “door ready” banner on the Play tab. Christmas prizes are kept after December.

**Fox Adventure Map:** six lands (Whispering Forest, Sunny Shores, Snowy Peaks, Star Galaxy, Volcano Valley, Candy Kingdom). Each finished lesson walks the fox one step and finds 20 coins (points); step 4 of every land also holds a bonus chest. After 7 steps the land boss waits (10 questions, 7+ right to win). Beating it gives 500–3,000 points (more for later lands), a map-only fox suit (Explorer, Surfer, Snow, Alien, Fire, and the Ultra Legendary Candy Suit), a map-only background and a bonus chest, and opens the next land. The prizes for the current land are listed under the map.

**Sticker Album:** a random sticker after every finished lesson (duplicates happen and are counted). Four albums of 8 (Animals, Ocean, Space, Food); completing one gives its free album-only emoji (🦘 🦑 🔭 🍰). In the Shop’s Stickers tab.

**Fox’s Den:** a drawn bedroom for the pet fox (Play tab). Colours are free (walls, bedding, curtains, rug, carpet, sofa, furniture wood, window view). Beds, bedside tables, desks, chairs, sofas and armchairs, wardrobes, a TV, lamps, a bookshelf, wallpapers, floors, rugs, posters and about 37 decorations (including a pet cat and puppy) are bought with points (two taps). “Move things” lets you drag furniture and decorations to new places (saved; “Put everything back” resets them). The fox trots around the room on four legs and naps now and then (it stays still if the device asks for reduced motion). The “🦊 Fox outfit” tab chooses which suit the fox wears in the den (same as the pet, none, or any owned suit) and sells den clothes: hats, glasses, scarves, a medal and ear decorations. A den hat replaces the suit’s hat. Code in `web/den.js`.

**Daily Treasure Chest:** finish 1 lesson to open a free chest every day. Prizes: 100–250 points, a streak freeze, or one of six chest-only emojis (never a duplicate). Bonus chests from the event can be opened any time. A prize screen shows exactly what was won.

**Weekly Mega Chest:** finish lessons on 3 different days in a week (Monday–Sunday) and a Mega Chest opens on Sunday (if Sunday is missed it waits during the next week). It holds 5 prizes, always including at least one new emoji, plus points, a streak freeze, a bonus chest or a new background. All 5 are shown on the prize screen.

**Pet fox:** a happy fox that grows through six stages (Baby → Little → Clever → Super → Royal → Legendary Fox) as correct answers add up. It can be renamed, wear suits from the Fox Fashion Event, cheers when tapped, and is never sad.

**Boss Battle:** a new boss every Monday with 300 HP. Each correct answer hits it for 10, or 15 if answered within 3 seconds (critical). Health is saved through the week. Beating it gives +300 points and the Boss Beater badge.

**Friend Challenge of the Day:** the same 10 questions for everyone on the same date. The first try is saved (score, then total time), and later tries are practice. Friend codes carry today’s score, and the Friends tab shows today’s board.

**Try it on:** any shop item can be previewed on your character for 6 seconds before buying.

**Leaderboard:** ordered by best Ranked medal, then faster average time, then points. It shows each person’s medal, rank time, day streak and points. Friends’ details come from their latest friend code.

**Progress backup:** “Make backup code” creates a code (starting with EMI1-) holding all progress and friends. Pasting it into “Restore” on any device brings everything back (two taps, because it replaces that device’s progress). A checksum rejects codes that were copied wrongly. It is not tamper-proof.

Every correct answer earns +10 points, once per question. Points buy emojis and backgrounds in the Shop, which has an Emojis tab and a Backgrounds tab. A star is earned for a great round (8/10, 20/25, or 15 in a Speed Round).

## Credits

The happy fox (app icon, logo and pet) is based on the fox from Microsoft’s [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT licence), with smiling eyes and rosy cheeks added. Source image: `tools/assets/fox_3d.png`. Rebuild the icons with `node tools/make-icons.mjs`.
