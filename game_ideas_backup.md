# Electro King - Game Design & Session Backup

Summary of all game ideas, design requirements, rules, and development history for **Electro King** (originally created by Viaan Patel).

---

## 🎮 1. Initial Game Ideas Brainstormed
1. **Pop-a-Balloon:** A fast-paced arcade balloon popping game.
2. **Emoji Clicker Tycoon:** An incremental tycoon/clicker game with emoji multipliers and upgrades.
3. **Electro King (Selected Project):** A modern, neon-cyber themed chess game with smart AI, custom scoring, hint/undo systems, and native Android support.

---

## ⚡ 2. Core Game Design: "Electro King" by Viaan Patel

- **Creator Credit:** *"Electro King by Viaan Patel"* displayed prominently under the game title.
- **Aesthetics & Visual Theme:**
  - Cyber Dark Glass layout with neon glowing borders (`#00f5d4` cyan, purple, gold accents).
  - Ambient particle effects optimized for mobile devices.
- **Game Modes:**
  - **Play vs Computer (AI)**
  - **2-Player Pass-and-Play** (with custom player names)
  - **Side Selection:** Play as White, Black (board orientation flips), or Random.

---

## 🧠 3. AI Difficulty Levels & Dynamic Color Theme

- 🟦 **Beginner:** Blue
- 🟩 **Easy:** Green
- 🟥 **Hard:** Red
- 🟪 **Difficult:** Dark Purple

---

## 🏆 4. Custom Scoring, Hint & Undo Rules

### Scoring on Captures (Awarded to Player):
- ♟️ **Pawn:** +5 points
- ♞ **Knight:** +30 points
- ♝ **Bishop:** +20 points
- ♜ **Rook:** +30 points
- ♛ **Queen:** +50 points
- 👑 **Game Win:** Bonus points

### Point Penalties:
- 💡 **Professional Hint:** -100 points
- ↩️ **Undo Move:** -100 points

---

## 🛠️ 5. Key Chess Mechanics & Bug Fixes
- **Chess Rules:** Full support for standard moves, captures, castling, en passant, pawn promotion, and check/checkmate detection.
- **Board Sizing:** Fixed responsive board sizing to prevent square distortion during piece moves.
- **Mobile Viewport:** Configured single-screen layout with zero vertical scrolling needed on mobile Chrome / Samsung One UI.
- **Particle Performance:** Optimized background particle rendering to maintain high FPS on mobile phones.
- **Game Start Flow:** Prevented match auto-start before side and mode selection.

---

## 📱 6. Mobile & Android Native App Details

- **GitHub Repository:** `shankykiritpatel2-cmd/Electro-King-Chess`
- **Web App Core Files:**
  - `index.html`
  - `styles.css`
  - `game.js`
  - `sw.js` (Service Worker for PWA)
- **Native Android Project:**
  - Directory: `C:\Users\Shanky\.gemini\antigravity\scratch\electro-king-android`
  - Configured for Android Studio, Gradle 8.5 / 8.12 + AGP 8.7.0, and Samsung One UI 5.1 (Android 13).
- **Home Screen Widget:**
  - Custom `widget_electro_king.xml` with a 1-tap **"▶ PLAY"** quick launcher.
- **Testing & Packaging:**
  - Android package format: `.apk` / `.aab`
  - iOS package format: `.ipa`
