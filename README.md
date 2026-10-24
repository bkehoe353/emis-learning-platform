# Emi's Learning Platform — Claude Code project bundle

This folder gathers the project files and the requirements discussed so far. The current browser game is in `web/index.html` and is the canonical starting point. The `ios-starter/` folder contains an earlier SwiftUI/WKWebView Xcode starter; it is not yet updated to match every feature in the latest website.

## First: open this folder in Claude Code

1. Transfer this ZIP to your laptop and extract it.
2. Install Claude Code using Anthropic's official guide: https://docs.anthropic.com/en/docs/claude-code/getting-started
3. Open Terminal (Mac/Linux) or PowerShell/terminal on Windows and change directory into the extracted `EmisLearningPlatform-ClaudeCode` folder.
4. Run `claude` and sign in when prompted.
5. Copy the task in `CLAUDE_FIRST_TASK.md` into Claude Code.

Claude Code should inspect the files and test the project before changing anything. Do not assume the current HTML is bug-free: the reported issue is that buttons do not respond when opened in the iPad preview.

## Run the current website locally

The current version is a self-contained HTML file. For reliable testing, serve the `web` folder over localhost rather than opening it inside a file preview. If Python is installed, from the project root run:

```bash
python -m http.server 8000 --directory web
```

Then open `http://localhost:8000` in your browser.

## Current state — important notes

- `web/index.html` is the latest website file available in this project bundle.
- It includes seven maths games, a profile, points, a large emoji shop, and friend-code leaderboard UI.
- Quick Quiz is designed for 10 questions, with 60 seconds per question.
- The profile and owned emojis are stored locally in that browser using localStorage.
- Friends currently use shareable code snapshots; scores do **not** automatically sync between devices. A genuinely live friends leaderboard needs a hosted backend/database and a clear privacy choice.
- The iOS starter is an earlier wrapper and may not contain all latest website features. It requires Xcode on a Mac to build/sign a native iOS app. Do not claim the app is App Store-ready until it has been updated, tested, signed, and reviewed.
- No public website has been deployed from this bundle.
