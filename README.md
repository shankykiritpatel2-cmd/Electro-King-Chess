# ELECTRO KING ⚡

> **Official Chess Platform**  
> **Created by:** Viaan Patel  
> **Aesthetic:** Futuristic, Cyber-Electric, High-Voltage Neon  
> **Platforms:** Progressive Web App (PWA) & Android (Native WebView + Home-Screen Widgets)

---

## 📁 Project Architecture

The project is structured into **one unified master repository** with a single source of truth for game logic and visual assets:

```
Electro-King/
├── web/                 # Main web game source (Single Source of Truth)
│   ├── index.html       # Game markup, chessboard UI, profile modals
│   ├── styles.css       # Cyber-electric theme styles, responsive layouts
│   ├── game.js          # Complete chess engine, AI bots, puzzles, profile stats
│   ├── manifest.json    # PWA web manifest
│   ├── sw.js            # Service worker for offline play
│   └── assets/          # Web & PWA launcher icons (48px to 512px)
│
├── android/             # Android Studio native project
│   ├── app/
│   │   ├── src/main/    # Native Java code, AndroidManifest, widget layouts & drawables
│   │   │   ├── java/    # MainActivity, Widget providers (4x1, 2x1, 1x2, standard)
│   │   │   └── res/     # Widget XML layouts, drawables, and strings
│   │   └── build.gradle # AGP config linking directly to ../../web as asset directory
│   ├── gradle/          # Gradle wrapper binaries and properties
│   ├── build.gradle     # Root Android build configuration
│   ├── settings.gradle  # Project module settings
│   ├── gradlew          # Unix Gradle wrapper executable
│   └── gradlew.bat      # Windows Gradle wrapper batch script
│
├── shared/              # Master branding assets shared across platforms
│   ├── icon_master_1024.png     # Master 1024x1024 high-resolution icon
│   ├── launchericon-1024x1024.png
│   ├── screenshot_phone.png    # Mobile store listing preview
│   └── screenshot_wide.png     # Desktop/tablet listing preview
│
├── README.md            # Project documentation and build guides
└── .gitignore           # Git ignore rules for build caches, binaries, and local configs
```

---

## ⚡ Single Source of Truth Architecture

There are **zero duplicated game files** in this repository.

The Android application builds its web assets directly from the `web/` folder using Android Gradle Plugin's `sourceSets` configuration in `android/app/build.gradle`:

```groovy
android {
    ...
    sourceSets {
        main {
            assets {
                srcDirs = [file("${projectDir}/../../web")]
            }
        }
    }
}
```

* **When you edit any file in `web/` (`index.html`, `game.js`, `styles.css`):**
  - The web version updates instantly.
  - The next Android build automatically packages the updated files into `file:///android_asset/`.
  - You never need to copy or sync files manually between Web and Android!

---

## 🌐 Web Version (PWA)

### Running Locally
To test the web version locally with full Service Worker and PWA support:

Using Python:
```bash
cd web
python -m http.server 8000
```
Open `http://localhost:8000` in any web browser.

Using Node.js:
```bash
npx serve web
```

### Deploying to GitHub Pages
1. Push this repository to GitHub (`main` branch).
2. Go to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/web` (or root if configured via GitHub Actions)
4. Your site will be live at `https://<username>.github.io/<repo>/`!

---

## 📱 Android Version

### Opening in Android Studio
1. Launch **Android Studio**.
2. Select **Open** and choose the `android` folder (`Electro-King/android`).
3. Allow Gradle to sync. Android Studio will automatically recognize the linked `web/` assets under the Android project view.

### Building via Command Line (Gradle)

#### Debug APK
On Windows:
```cmd
cd android
gradlew.bat assembleDebug
```

On macOS / Linux:
```bash
cd android
./gradlew assembleDebug
```

The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK / AAB
```bash
cd android
./gradlew bundleRelease
```

---

## 🧩 Android Home-Screen Widgets

The Android application includes 4 customizable home-screen widgets for quick access to Electro King:
* **Electro King Standard**: Quick play launcher, recent match stats, and daily tactical puzzle preview.
* **4x1 Widget**: Wide status banner with direct action buttons (Play AI, Tactics, Profile).
* **2x1 Widget**: Compact quick-launch banner.
* **1x2 Widget**: Vertical mini-launcher.

### Supported Widget Themes:
* **Electro** (Signature cyan/electric blue & yellow)
* **Cyber** (High-voltage cyberpunk neon)
* **Obsidian** (Dark stealth theme)
* **Gold** (Champagne gold metallic)
* **Matrix** (Phosphor green terminal)

---

## 🛡️ Repository Hygiene & Ignored Files

The root `.gitignore` ensures that unnecessary generated files are never committed to GitHub:
* **Build artifacts**: `build/`, `android/.gradle/`, `android/app/build/`
* **Package binaries**: `*.apk`, `*.aab`
* **Local SDK configuration**: `local.properties`
* **IDE caches**: `.idea/`, `.vscode/`, `*.iml`
* **Archives**: `*.zip`, `*.tar.gz`, `electro-king.zip`, `electro-king-android.zip`
* **OS files**: `Thumbs.db`, `.DS_Store`

---

## 👑 Game Features & Terminology
* Classical 2-Player Chess:
  - Play vs AI Bots with configurable difficulty levels (Beginner, Intermediate, Master, Grandmaster).
  - Pass & Play mode on a single device with board flipping.
  - Daily Tactical Chess Puzzles with move validation and hints.
* Full FIDE Rule Support:
  - Standard chess mechanics: King safety, Check, Checkmate, Stalemate, En Passant, Pawn Promotion, and Castling (Kingside & Queenside).
* Customizable Player Profile:
  - Custom profile picture uploader with client-side image cropping and persistence.
  - Genuine recorded stats (Win/Loss/Draw, Win Rate, Streak tracking, Computer opponents defeated).
  - Real-time achievements system.
