// ==========================================
// ELECTRO KING 👑 - Cyber Chess Engine 2.0
// Created by Viaan Patel
// ==========================================

// --- GAME CONFIGURATION & VALUES ---
const PIECE_VALUES = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 10000 };
const CAPTURE_POINTS = { 'p': 5, 'n': 30, 'b': 20, 'r': 30, 'q': 50 };
const UNICODE_PIECES = {
    white: { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' },
    black: { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
};

// --- 8-TIER TROPHY PROGRESSION LADDER (HARD MODE) ---
const TROPHY_TIERS = [
    { tier: 1, name: 'Wood Tier', icon: '🪵', tag: 'Apprentice Spark', minPts: 0, maxPts: 249, cssClass: 'tier-wood' },
    { tier: 2, name: 'Bronze Tier', icon: '🟫', tag: 'Cyber Knight', minPts: 250, maxPts: 699, cssClass: 'tier-bronze' },
    { tier: 3, name: 'Silver Tier', icon: '⚪', tag: 'Neon Bishop', minPts: 700, maxPts: 1499, cssClass: 'tier-silver' },
    { tier: 4, name: 'Gold Tier', icon: '🟡', tag: 'Electro Commander', minPts: 1500, maxPts: 2999, cssClass: 'tier-gold' },
    { tier: 5, name: 'Platinum Tier', icon: '💎', tag: 'Plasma Queen', minPts: 3000, maxPts: 5999, cssClass: 'tier-platinum' },
    { tier: 6, name: 'Diamond Tier', icon: '💠', tag: 'Titan of Voltage', minPts: 6000, maxPts: 9999, cssClass: 'tier-diamond' },
    { tier: 7, name: 'Master Tier', icon: '🌌', tag: 'Grandmaster Cyber', minPts: 10000, maxPts: 19999, cssClass: 'tier-master' },
    { tier: 8, name: 'Electro King', icon: '👑', tag: 'Supreme Sovereign', minPts: 20000, maxPts: Infinity, cssClass: 'tier-king' }
];

// --- GAME STATE ---
let board = []; // 8x8 array. Elements: null or { type, color, hasMoved }
let turn = 'white'; // 'white' or 'black'
let selectedSquare = null; // { r, c }
let lastMove = null; // { from: {r,c}, to: {r,c}, piece: {type, color} }
let history = []; // Stack of states for undo
let captured = { white: [], black: [] };
let gameMode = 'ai'; // 'ai', 'local', 'online'
let playerSide = 'white'; // 'white', 'black', or 'random'
let botSide = 'black'; // Bot side for AI mode
let difficulty = 2; // 1: Beginner, 2: Easy, 3: Hard, 4: Difficult
let playerNames = { white: 'Player 1', black: 'ElectroBot 🤖' };
let matchScore = 0;
let careerPoints = 0;
let soundEnabled = true;
let isGameOver = false;
let pendingPromotion = null;
let activeHint = null;
let currentTab = 'arena';
let powerUpUsedThisMatch = false;

// --- STATS TRACKING ---
let playerStats = {
    matches: 0,
    wins: 0,
    puzzles: 0
};

// --- CHESS CLOCK TIMERS ---
let clockSetting = 180; // default 3m Blitz (in seconds), 0 = no timer
let timeRemaining = { white: 180, black: 180 };
let clockInterval = null;

// --- WEBAUDIO SYNTHESIZER ---
let audioCtx = null;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn("Web Audio API is not supported.");
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (navigator.vibrate) {
        if (type === 'move') navigator.vibrate(15);
        else if (type === 'capture') navigator.vibrate([25, 30, 40]);
        else if (type === 'check') navigator.vibrate([40, 50, 40]);
        else if (type === 'win') navigator.vibrate([60, 40, 60, 40, 100]);
        else if (type === 'powerup') navigator.vibrate([50, 50, 80]);
    }

    if (type === 'move') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'capture' || type === 'powerup') {
        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.connect(subGain);
        subGain.connect(audioCtx.destination);
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(240, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.2);
        subGain.gain.setValueAtTime(0.2, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        sub.start(now);
        sub.stop(now + 0.2);

        const zap = audioCtx.createOscillator();
        const zapGain = audioCtx.createGain();
        zap.connect(zapGain);
        zapGain.connect(audioCtx.destination);
        zap.type = 'square';
        zap.frequency.setValueAtTime(800, now);
        zap.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        zapGain.gain.setValueAtTime(0.1, now);
        zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        zap.start(now);
        zap.stop(now + 0.15);
    } else if (type === 'check') {
        const freqs = [587.33, 698.46, 880.00];
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + i * 0.06);
            g.gain.setValueAtTime(0.1, now + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.2);
        });
    } else if (type === 'win') {
        const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        chord.forEach((freq, idx) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g);
            g.connect(audioCtx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + idx * 0.07);
            g.gain.setValueAtTime(0.12, now + idx * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
            o.start(now + idx * 0.07);
            o.stop(now + idx * 0.07 + 0.4);
        });
    } else if (type === 'hint') {
        const scanNotes = [440, 660, 880];
        scanNotes.forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g);
            g.connect(audioCtx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(f, now + i * 0.05);
            g.gain.setValueAtTime(0.08, now + i * 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
            o.start(now + i * 0.05);
            o.stop(now + i * 0.05 + 0.15);
        });
    } else if (type === 'undo') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    }
}

// --- CHESS CLOCK LOGIC ---
function startClock() {
    stopClock();
    if (clockSetting <= 0 || isGameOver) return;
    
    updateClockDisplay();
    clockInterval = setInterval(() => {
        if (isGameOver) {
            stopClock();
            return;
        }
        
        timeRemaining[turn]--;
        if (timeRemaining[turn] <= 0) {
            timeRemaining[turn] = 0;
            updateClockDisplay();
            handleTimeout(turn);
            stopClock();
            return;
        }
        
        updateClockDisplay();
    }, 1000);
}

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

function formatTime(seconds) {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateClockDisplay() {
    const whiteEl = document.getElementById('time-white');
    const blackEl = document.getElementById('time-black');
    const whiteBadge = document.getElementById('clock-white');
    const blackBadge = document.getElementById('clock-black');
    
    if (clockSetting <= 0) {
        if (whiteEl) whiteEl.textContent = "∞";
        if (blackEl) blackEl.textContent = "∞";
        return;
    }
    
    if (whiteEl) whiteEl.textContent = formatTime(timeRemaining.white);
    if (blackEl) blackEl.textContent = formatTime(timeRemaining.black);
    
    if (whiteBadge) {
        whiteBadge.classList.toggle('active', turn === 'white');
        whiteBadge.classList.toggle('low-time', timeRemaining.white <= 10 && timeRemaining.white > 0);
    }
    if (blackBadge) {
        blackBadge.classList.toggle('active', turn === 'black');
        blackBadge.classList.toggle('low-time', timeRemaining.black <= 10 && timeRemaining.black > 0);
    }
}

function handleTimeout(timedOutColor) {
    isGameOver = true;
    const winnerColor = timedOutColor === 'white' ? 'black' : 'white';
    const winnerName = playerNames[winnerColor];
    
    playSound('win');
    document.getElementById('gameover-title').textContent = "TIME OUT! ⏱️";
    document.getElementById('gameover-msg').textContent = `${timedOutColor.toUpperCase()} flagged out! ${winnerName} wins on time!`;
    document.getElementById('gameover-score').textContent = matchScore;
    
    let bonus = 0;
    if (gameMode === 'ai' && winnerColor === playerSide) {
        bonus = addCareerPoints(800);
    }
    document.getElementById('gameover-career').textContent = `+${bonus} Pts`;
    document.getElementById('gameover-modal').classList.remove('hidden');
    
    updateStatsOnGameOver(winnerColor);
}

function handleForfeit() {
    if (isGameOver) return;
    isGameOver = true;
    stopClock();
    
    const oppColor = turn === 'white' ? 'black' : 'white';
    const oppName = playerNames[oppColor] || 'Opponent';
    
    playSound('undo');
    document.getElementById('gameover-title').textContent = "MATCH FORFEITED 🏳️";
    document.getElementById('gameover-msg').textContent = `Match abandoned! ${oppName} wins by forfeiture.`;
    document.getElementById('gameover-score').textContent = matchScore;
    document.getElementById('gameover-career').textContent = `+0 Pts`;
    
    updateStatsOnGameOver(oppColor);
}

// --- IN-GAME TOAST & CUSTOM MODAL DIALOGS ---
function showToast(msg, type = 'info', duration = 2800) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = msg;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showCustomConfirm(title, msg, onConfirm, onCancel) {
    const modal = document.getElementById('custom-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-msg');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    
    if (modal && titleEl && msgEl && okBtn && cancelBtn) {
        titleEl.textContent = title;
        msgEl.innerHTML = msg;
        modal.classList.remove('hidden');
        
        okBtn.onclick = () => {
            modal.classList.add('hidden');
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
            if (onCancel) onCancel();
        };
    } else {
        if (confirm(`${title}\n\n${msg.replace(/<[^>]*>?/gm, '')}`)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    }
}

// --- 5-TAB NAVIGATION CONTROLLER ---
function switchTab(tabId) {
    const wasInArena = (currentTab === 'arena');
    const goingToOtherTab = (tabId !== 'arena');
    
    // If switching away from active Arena match, PAUSE CLOCK
    if (wasInArena && goingToOtherTab && !isGameOver && history.length > 0) {
        stopClock();
        showToast("⏸️ Match Paused", "info", 1500);
    }
    
    // If returning back to Arena with active match, RESUME CLOCK
    if (currentTab !== 'arena' && tabId === 'arena' && !isGameOver && history.length > 0 && clockSetting > 0) {
        startClock();
        showToast("▶️ Match Resumed", "success", 1500);
    }

    currentTab = tabId;
    
    // Hide setup modal on tab switch (unless quick match was tapped)
    const setupModal = document.getElementById('setup-modal');
    if (setupModal && tabId !== 'quick') {
        setupModal.classList.add('hidden');
    }

    // Update active tab button
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update active screen
    document.querySelectorAll('.tab-screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === `screen-${tabId}`);
    });
    
    if (tabId === 'puzzles') {
        renderCurrentPuzzle();
    } else if (tabId === 'shop') {
        updateTrophyShowcase();
    } else if (tabId === 'profile') {
        updateProfileScreen();
    } else if (tabId === 'arena') {
        setTimeout(() => FX.resize(), 50);
    }
}

// --- TROPHY LADDER ENGINE ---
function getCurrentTrophyTier(points = careerPoints) {
    for (let i = TROPHY_TIERS.length - 1; i >= 0; i--) {
        if (points >= TROPHY_TIERS[i].minPts) {
            return TROPHY_TIERS[i];
        }
    }
    return TROPHY_TIERS[0];
}

function getNextTrophyTier(currentTier) {
    const nextIdx = currentTier.tier;
    if (nextIdx < TROPHY_TIERS.length) {
        return TROPHY_TIERS[nextIdx];
    }
    return null;
}

function updateTrophyHUD() {
    const currentTier = getCurrentTrophyTier();
    const nextTier = getNextTrophyTier(currentTier);
    
    // Header HUD
    const hudIcon = document.getElementById('hud-trophy-icon');
    const hudName = document.getElementById('hud-trophy-name');
    if (hudIcon) hudIcon.textContent = currentTier.icon;
    if (hudName) hudName.textContent = currentTier.name.replace(' Tier', '');
    
    // Trophy Banner in Shop
    const cardIcon = document.getElementById('rank-card-icon');
    const cardTitle = document.getElementById('rank-card-title');
    const cardTag = document.getElementById('rank-card-tag');
    const ptsText = document.getElementById('rank-pts-text');
    const fillBar = document.getElementById('rank-progress-fill');
    
    if (cardIcon) cardIcon.textContent = currentTier.icon;
    if (cardTitle) cardTitle.textContent = currentTier.name;
    if (cardTag) cardTag.textContent = currentTier.tag;
    
    if (nextTier) {
        const span = nextTier.minPts - currentTier.minPts;
        const prog = careerPoints - currentTier.minPts;
        const pct = Math.min(Math.max(Math.round((prog / span) * 100), 0), 100);
        if (ptsText) ptsText.textContent = `${careerPoints} / ${nextTier.minPts} Pts`;
        if (fillBar) fillBar.style.width = `${pct}%`;
    } else {
        if (ptsText) ptsText.textContent = `${careerPoints} Pts (MAX)`;
        if (fillBar) fillBar.style.width = `100%`;
    }
}

function updateTrophyShowcase() {
    updateTrophyHUD();
    const currentTier = getCurrentTrophyTier();
    
    document.querySelectorAll('.trophy-card').forEach(card => {
        const tierNum = parseInt(card.dataset.tier, 10);
        const statusSpan = card.querySelector('.tier-status');
        
        card.classList.remove('unlocked', 'active-tier');
        if (tierNum < currentTier.tier) {
            card.classList.add('unlocked');
            if (statusSpan) {
                statusSpan.textContent = 'Unlocked';
                statusSpan.style.color = '#06d6a0';
            }
        } else if (tierNum === currentTier.tier) {
            card.classList.add('unlocked', 'active-tier');
            if (statusSpan) {
                statusSpan.textContent = 'Current Tier';
                statusSpan.style.color = '#ffd166';
            }
        } else {
            if (statusSpan) {
                statusSpan.textContent = 'Locked';
                statusSpan.style.color = '#9d99b3';
            }
        }
    });
}

// --- DAILY TACTICAL PUZZLES ENGINE ---
const PUZZLE_DATABASE = [
    {
        id: 1,
        title: "Puzzle #1: Back-Rank Zap ⚡",
        instruction: "⚪ White to move: Find the Checkmate!",
        reward: 50,
        board: [
            [{ type: 'r', color: 'black', hasMoved: true }, null, null, null, { type: 'k', color: 'black', hasMoved: true }, null, null, { type: 'r', color: 'black', hasMoved: true }],
            [{ type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, null, null, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [{ type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, null, null, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }],
            [null, null, null, { type: 'r', color: 'white', hasMoved: true }, { type: 'k', color: 'white', hasMoved: true }, null, null, null]
        ],
        solution: { from: { r: 7, c: 3 }, to: { r: 0, c: 3 } }
    },
    {
        id: 2,
        title: "Puzzle #2: Scholar's Blitz 👑",
        instruction: "⚪ White to move: Deliver Checkmate!",
        reward: 50,
        board: [
            [{ type: 'r', color: 'black', hasMoved: true }, { type: 'n', color: 'black', hasMoved: true }, { type: 'b', color: 'black', hasMoved: true }, { type: 'q', color: 'black', hasMoved: true }, { type: 'k', color: 'black', hasMoved: true }, { type: 'b', color: 'black', hasMoved: true }, null, { type: 'r', color: 'black', hasMoved: true }],
            [{ type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, null, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }],
            [null, null, { type: 'n', color: 'black', hasMoved: true }, null, null, null, null, null],
            [null, null, null, null, { type: 'p', color: 'black', hasMoved: true }, null, null, { type: 'q', color: 'white', hasMoved: true }],
            [null, null, { type: 'b', color: 'white', hasMoved: true }, null, { type: 'p', color: 'white', hasMoved: true }, null, null, null],
            [null, null, null, null, null, null, null, null],
            [{ type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, null, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }],
            [{ type: 'r', color: 'white', hasMoved: true }, { type: 'n', color: 'white', hasMoved: true }, { type: 'b', color: 'white', hasMoved: true }, null, { type: 'k', color: 'white', hasMoved: true }, null, { type: 'n', color: 'white', hasMoved: true }, { type: 'r', color: 'white', hasMoved: true }]
        ],
        solution: { from: { r: 3, c: 7 }, to: { r: 1, c: 5 } }
    },
    {
        id: 3,
        title: "Puzzle #3: Royal Knight Fork ♞",
        instruction: "⚪ White to move: Fork King and Queen!",
        reward: 75,
        board: [
            [{ type: 'r', color: 'black', hasMoved: true }, null, { type: 'b', color: 'black', hasMoved: true }, { type: 'q', color: 'black', hasMoved: true }, { type: 'k', color: 'black', hasMoved: true }, { type: 'b', color: 'black', hasMoved: true }, null, { type: 'r', color: 'black', hasMoved: true }],
            [{ type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, null, { type: 'p', color: 'black', hasMoved: true }, null, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }, { type: 'p', color: 'black', hasMoved: true }],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, { type: 'n', color: 'white', hasMoved: true }, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [{ type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, null, null, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }, { type: 'p', color: 'white', hasMoved: true }],
            [{ type: 'r', color: 'white', hasMoved: true }, null, { type: 'b', color: 'white', hasMoved: true }, { type: 'q', color: 'white', hasMoved: true }, { type: 'k', color: 'white', hasMoved: true }, null, null, { type: 'r', color: 'white', hasMoved: true }]
        ],
        solution: { from: { r: 3, c: 4 }, to: { r: 1, c: 2 } }
    }
];

let currentPuzzleIdx = 0;
let puzzleBoardState = [];
let puzzleSelected = null;

function renderCurrentPuzzle() {
    const puzzle = PUZZLE_DATABASE[currentPuzzleIdx];
    if (!puzzle) return;
    
    document.getElementById('puzzle-level-tag').textContent = puzzle.title;
    document.getElementById('puzzle-turn-text').textContent = puzzle.instruction;
    document.getElementById('puzzle-reward-badge').textContent = `⚡ +${puzzle.reward} PTS`;
    document.getElementById('puzzle-feedback').textContent = '';
    
    puzzleBoardState = cloneBoard(puzzle.board);
    puzzleSelected = null;
    drawPuzzleBoard();
}

function drawPuzzleBoard() {
    const boardEl = document.getElementById('puzzle-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            sq.dataset.row = r;
            sq.dataset.col = c;
            
            const piece = puzzleBoardState[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = `piece ${piece.color}`;
                pEl.textContent = UNICODE_PIECES[piece.color][piece.type];
                sq.appendChild(pEl);
            }
            
            sq.addEventListener('click', () => handlePuzzleClick(r, c));
            boardEl.appendChild(sq);
        }
    }
}

function handlePuzzleClick(r, c) {
    const puzzle = PUZZLE_DATABASE[currentPuzzleIdx];
    const piece = puzzleBoardState[r][c];
    const feedback = document.getElementById('puzzle-feedback');
    
    if (puzzleSelected) {
        if (puzzleSelected.r === puzzle.solution.from.r && 
            puzzleSelected.c === puzzle.solution.from.c &&
            r === puzzle.solution.to.r && 
            c === puzzle.solution.to.c) {
            
            // CORRECT MOVE!
            const movingPiece = puzzleBoardState[puzzleSelected.r][puzzleSelected.c];
            puzzleBoardState[r][c] = movingPiece;
            puzzleBoardState[puzzleSelected.r][puzzleSelected.c] = null;
            puzzleSelected = null;
            drawPuzzleBoard();
            
            playSound('win');
            feedback.innerHTML = `<span style="color:#06d6a0">🎉 BRILLIANT! Checkmate found! (+${puzzle.reward} Pts)</span>`;
            addCareerPoints(puzzle.reward);
            playerStats.puzzles++;
            saveStats();
            updateTrophyHUD();
            return;
        } else {
            playSound('undo');
            feedback.innerHTML = `<span style="color:#ff0054">❌ Not the best move! Try again.</span>`;
            puzzleSelected = null;
            drawPuzzleBoard();
            return;
        }
    }
    
    if (piece && piece.color === 'white') {
        puzzleSelected = { r, c };
        drawPuzzleBoard();
        const sq = document.querySelector(`#puzzle-board .square[data-row="${r}"][data-col="${c}"]`);
        if (sq) sq.classList.add('selected');
    }
}

// --- PROFILE & STATS ENGINE ---
function loadStats() {
    const saved = localStorage.getItem('electro_king_stats');
    if (saved) {
        try {
            playerStats = JSON.parse(saved);
        } catch (e) {}
    }
}

function saveStats() {
    localStorage.setItem('electro_king_stats', JSON.stringify(playerStats));
}

function updateStatsOnGameOver(winnerColor) {
    playerStats.matches++;
    if (gameMode === 'ai' && winnerColor === playerSide) {
        playerStats.wins++;
    } else if (gameMode === 'local') {
        playerStats.wins++;
    }
    saveStats();
    updateProfileScreen();
}

function updateProfileScreen() {
    loadStats();
    const statMatches = document.getElementById('stat-matches');
    const statWins = document.getElementById('stat-wins');
    const statWinRate = document.getElementById('stat-winrate');
    const statPuzzles = document.getElementById('stat-puzzles');
    
    if (statMatches) statMatches.textContent = playerStats.matches;
    if (statWins) statWins.textContent = playerStats.wins;
    if (statPuzzles) statPuzzles.textContent = playerStats.puzzles;
    
    const wr = playerStats.matches > 0 ? Math.round((playerStats.wins / playerStats.matches) * 100) : 0;
    if (statWinRate) statWinRate.textContent = `${wr}%`;
}

function startChallenge(friendName) {
    switchTab('arena');
    playerNames = { white: 'Viaan Patel', black: `${friendName} ⚡` };
    gameMode = 'ai';
    difficulty = 3;
    startNewGame();
}

// --- CYBER POWER-UP: EMP LIGHTNING BLAST ---
function handlePowerUp() {
    if (isGameOver || pendingPromotion || powerUpUsedThisMatch) return;
    if (gameMode === 'ai' && turn !== playerSide) return;
    
    const oppColor = turn === 'white' ? 'black' : 'white';
    
    // Find opponent pawns to vaporize with lightning!
    const oppPawns = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === oppColor && p.type === 'p') {
                oppPawns.push({ r, c });
            }
        }
    }
    
    if (oppPawns.length === 0) {
        alert("No opponent pawns in sight to EMP!");
        return;
    }
    
    const target = oppPawns[Math.floor(Math.random() * oppPawns.length)];
    board[target.r][target.c] = null;
    powerUpUsedThisMatch = true;
    
    playSound('powerup');
    FX.spawnCaptureBurst(target.r, target.c, turn);
    floatPointsMessage(50, target.r, target.c);
    matchScore += 50;
    addCareerPoints(50);
    
    drawBoard();
    updateHUD();
    
    const btn = document.getElementById('powerup-btn');
    if (btn) btn.classList.add('disabled');
}

// --- CORE CHESS ENGINE RULES ---

function initBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
        board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
    }
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: 'p', color: 'black', hasMoved: false };
        board[6][col] = { type: 'p', color: 'white', hasMoved: false };
    }
}

function cloneBoard(currentBoard) {
    return currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
}

function onBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isSquareAttackedBy(targetR, targetC, attackerColor, testBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p && p.color === attackerColor) {
                if (p.type === 'p') {
                    const dir = attackerColor === 'white' ? -1 : 1;
                    if (targetR === r + dir && (targetC === c - 1 || targetC === c + 1)) {
                        return true;
                    }
                } else {
                    const moves = getRawMoves(r, c, testBoard, true);
                    if (moves.some(m => m.r === targetR && m.c === targetC)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function getRawMoves(r, c, testBoard = board, ignoringCastling = false) {
    const piece = testBoard[r][c];
    if (!piece) return [];
    
    const moves = [];
    const color = piece.color;
    const oppositeColor = color === 'white' ? 'black' : 'white';
    
    switch (piece.type) {
        case 'p': {
            const dir = color === 'white' ? -1 : 1;
            const startRow = color === 'white' ? 6 : 1;
            
            const step1R = r + dir;
            if (onBoard(step1R, c) && !testBoard[step1R][c]) {
                moves.push({ r: step1R, c: c });
                const step2R = r + 2 * dir;
                if (r === startRow && !testBoard[step2R][c]) {
                    moves.push({ r: step2R, c: c });
                }
            }
            
            const captureCols = [c - 1, c + 1];
            captureCols.forEach(col => {
                if (onBoard(step1R, col)) {
                    const target = testBoard[step1R][col];
                    if (target && target.color === oppositeColor) {
                        moves.push({ r: step1R, c: col });
                    }
                }
            });

            // En Passant
            const epRow = color === 'white' ? 3 : 4;
            if (r === epRow && lastMove) {
                const opponentPawnDoubleStep = 
                    lastMove.piece && 
                    lastMove.piece.type === 'p' && 
                    lastMove.piece.color === oppositeColor &&
                    Math.abs(lastMove.from.r - lastMove.to.r) === 2;
                
                if (opponentPawnDoubleStep) {
                    const lastMoveCol = lastMove.to.c;
                    if (Math.abs(lastMoveCol - c) === 1) {
                        const captureRow = color === 'white' ? 2 : 5;
                        moves.push({ r: captureRow, c: lastMoveCol, isEnPassant: true });
                    }
                }
            }
            break;
        }
        case 'n': {
            const offsets = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            offsets.forEach(([dr, dc]) => {
                const tr = r + dr;
                const tc = c + dc;
                if (onBoard(tr, tc)) {
                    const target = testBoard[tr][tc];
                    if (!target || target.color === oppositeColor) {
                        moves.push({ r: tr, c: tc });
                    }
                }
            });
            break;
        }
        case 'b':
            slideMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], testBoard, moves, oppositeColor);
            break;
        case 'r':
            slideMoves(r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], testBoard, moves, oppositeColor);
            break;
        case 'q':
            slideMoves(r, c, [
                [-1, -1], [-1, 1], [1, -1], [1, 1],
                [-1, 0], [1, 0], [0, -1], [0, 1]
            ], testBoard, moves, oppositeColor);
            break;
        case 'k': {
            const offsets = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            offsets.forEach(([dr, dc]) => {
                const tr = r + dr;
                const tc = c + dc;
                if (onBoard(tr, tc)) {
                    const target = testBoard[tr][tc];
                    if (!target || target.color === oppositeColor) {
                        moves.push({ r: tr, c: tc });
                    }
                }
            });

            // Castling
            if (!ignoringCastling && !piece.hasMoved && !isKingInCheck(color, testBoard)) {
                const rookK = testBoard[r][7];
                if (rookK && rookK.type === 'r' && rookK.color === color && !rookK.hasMoved) {
                    if (!testBoard[r][5] && !testBoard[r][6]) {
                        if (!isSquareAttackedBy(r, 5, oppositeColor, testBoard) && 
                            !isSquareAttackedBy(r, 6, oppositeColor, testBoard)) {
                            moves.push({ r: r, c: 6, isCastling: true });
                        }
                    }
                }

                const rookQ = testBoard[r][0];
                if (rookQ && rookQ.type === 'r' && rookQ.color === color && !rookQ.hasMoved) {
                    if (!testBoard[r][1] && !testBoard[r][2] && !testBoard[r][3]) {
                        if (!isSquareAttackedBy(r, 3, oppositeColor, testBoard) && 
                            !isSquareAttackedBy(r, 2, oppositeColor, testBoard)) {
                            moves.push({ r: r, c: 2, isCastling: true });
                        }
                    }
                }
            }
            break;
        }
    }
    return moves;
}

function slideMoves(r, c, directions, testBoard, moves, oppositeColor) {
    directions.forEach(([dr, dc]) => {
        let tr = r + dr;
        let tc = c + dc;
        while (onBoard(tr, tc)) {
            const target = testBoard[tr][tc];
            if (!target) {
                moves.push({ r: tr, c: tc });
            } else {
                if (target.color === oppositeColor) {
                    moves.push({ r: tr, c: tc });
                }
                break;
            }
            tr += dr;
            tc += dc;
        }
    });
}

function findKing(color, testBoard = board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p && p.type === 'k' && p.color === color) {
                return { r, c };
            }
        }
    }
    return null;
}

function isKingInCheck(color, testBoard = board) {
    const kingPos = findKing(color, testBoard);
    if (!kingPos) return false;
    const oppColor = color === 'white' ? 'black' : 'white';
    return isSquareAttackedBy(kingPos.r, kingPos.c, oppColor, testBoard);
}

function getLegalMoves(r, c, testBoard = board) {
    const piece = testBoard[r][c];
    if (!piece) return [];
    
    const rawMoves = getRawMoves(r, c, testBoard);
    const legalMoves = [];
    
    rawMoves.forEach(move => {
        const targetPiece = testBoard[move.r][move.c];
        if (targetPiece && targetPiece.type === 'k') return;
        
        const tempBoard = cloneBoard(testBoard);
        if (move.isEnPassant) {
            tempBoard[r][move.c] = null;
        }
        if (move.isCastling) {
            if (move.c === 6) {
                tempBoard[r][5] = tempBoard[r][7];
                tempBoard[r][7] = null;
            } else if (move.c === 2) {
                tempBoard[r][3] = tempBoard[r][0];
                tempBoard[r][0] = null;
            }
        }
        
        tempBoard[move.r][move.c] = tempBoard[r][c];
        tempBoard[r][c] = null;
        
        if (!isKingInCheck(piece.color, tempBoard)) {
            legalMoves.push(move);
        }
    });
    
    return legalMoves;
}

function getAllLegalMoves(color, testBoard = board) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = testBoard[r][c];
            if (piece && piece.color === color) {
                const moves = getLegalMoves(r, c, testBoard);
                moves.forEach(m => {
                    allMoves.push({ from: { r, c }, to: m, piece: piece });
                });
            }
        }
    }
    return allMoves;
}

// --- PARTICLE FX ENGINE ---
const FX = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init() {
        this.canvas = document.getElementById('fx-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    startLoop() {
        if (!this.animId) this.loop();
    },

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(rect.width * dpr);
        this.canvas.height = Math.floor(rect.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    getSquareCenter(r, c) {
        const sq = getSquareNode(r, c);
        if (!sq || !this.canvas) return { x: 0, y: 0 };
        const boardRect = this.canvas.getBoundingClientRect();
        const sqRect = sq.getBoundingClientRect();
        return {
            x: (sqRect.left + sqRect.width / 2) - boardRect.left,
            y: (sqRect.top + sqRect.height / 2) - boardRect.top
        };
    },

    spawnMoveTrail(from, to, color) {
        const p1 = this.getSquareCenter(from.r, from.c);
        const p2 = this.getSquareCenter(to.r, to.c);
        const count = 6;
        const mainColor = color === 'white' ? '#00f5d4' : '#ff0054';

        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const x = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 4;
            const y = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 4;
            this.particles.push({
                type: 'spark',
                x, y,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                size: 2,
                alpha: 1,
                decay: 0.08,
                color: mainColor,
                delay: i * 3
            });
        }
        this.startLoop();
    },

    spawnCaptureBurst(r, c, color) {
        const p = this.getSquareCenter(r, c);
        const shockColor = color === 'white' ? '#00f5d4' : '#ff0054';
        
        this.particles.push({
            type: 'shockwave',
            x: p.x, y: p.y,
            radius: 6,
            maxRadius: 32,
            alpha: 1,
            decay: 0.09,
            color: shockColor,
            lineWidth: 2
        });

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.2;
            const speed = Math.random() * 3 + 2;
            this.particles.push({
                type: 'spark',
                x: p.x, y: p.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.5,
                alpha: 1,
                decay: 0.08,
                color: (i % 2 === 0) ? shockColor : '#ffd166'
            });
        }
        this.startLoop();
    },

    spawnCheckSparks(r, c) {
        const p = this.getSquareCenter(r, c);
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 12 + 4;
            this.particles.push({
                type: 'spark',
                x: p.x + Math.cos(angle) * dist,
                y: p.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                size: 2,
                alpha: 1,
                decay: 0.09,
                color: '#ff0054'
            });
        }
        this.startLoop();
    },

    spawnWinCelebration() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const colors = ['#00f5d4', '#9d4edd', '#ff0054', '#ffd166', '#ffffff'];
        
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                const cx = Math.random() * (rect.width * 0.8) + (rect.width * 0.1);
                const cy = Math.random() * (rect.height * 0.6) + (rect.height * 0.2);
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 4 + 2;
                    this.particles.push({
                        type: 'spark',
                        x: cx, y: cy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2.5,
                        alpha: 1,
                        decay: 0.06,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    });
                }
                this.startLoop();
            }, wave * 200);
        }
    },

    spawnHintFlow(from, to) {
        const p1 = this.getSquareCenter(from.r, from.c);
        const p2 = this.getSquareCenter(to.r, to.c);
        const count = 6;
        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const x = p1.x + (p2.x - p1.x) * t;
            const y = p1.y + (p2.y - p1.y) * t;
            this.particles.push({
                type: 'spark',
                x, y,
                vx: (p2.x - p1.x) * 0.04,
                vy: (p2.y - p1.y) * 0.04,
                size: 2,
                alpha: 1,
                decay: 0.08,
                color: '#ffd166',
                delay: i * 12
            });
        }
        this.startLoop();
    },

    loop() {
        if (!this.ctx || !this.canvas) {
            this.animId = null;
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);

        if (this.particles.length === 0) {
            this.animId = null;
            return;
        }

        this.animId = requestAnimationFrame(() => this.loop());

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.delay && p.delay > 0) {
                p.delay -= 16;
                continue;
            }

            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.type === 'shockwave') {
                p.radius += (p.maxRadius - p.radius) * 0.25;
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.lineWidth = p.lineWidth || 2;
                this.ctx.stroke();
                this.ctx.restore();
            } else if (p.type === 'spark') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;

                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }
};

// --- DYNAMIC GRAPHICS & BOARD RENDERER ---

function drawBoard() {
    const boardElement = document.getElementById('chessboard');
    if (!boardElement) return;
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;
            
            const piece = board[r][c];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = UNICODE_PIECES[piece.color][piece.type];
                square.appendChild(pieceElement);
            }
            
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardElement.appendChild(square);
        }
    }
    
    applyBoardHighlights();
    setTimeout(() => FX.resize(), 20);
}

function applyBoardHighlights() {
    const squares = document.querySelectorAll('#chessboard .square');
    squares.forEach(sq => {
        sq.className = sq.className.replace(/\b(selected|valid-move|valid-capture|last-move|check|suggested)\b/g, '').trim();
    });
    
    // King Check
    ['white', 'black'].forEach(side => {
        if (isKingInCheck(side)) {
            const kingPos = findKing(side);
            if (kingPos) {
                const sq = getSquareNode(kingPos.r, kingPos.c);
                if (sq) sq.classList.add('check');
            }
        }
    });

    // Selection
    if (selectedSquare) {
        const selNode = getSquareNode(selectedSquare.r, selectedSquare.c);
        if (selNode) selNode.classList.add('selected');
        
        const legal = getLegalMoves(selectedSquare.r, selectedSquare.c);
        legal.forEach(move => {
            const targetNode = getSquareNode(move.r, move.c);
            if (targetNode) {
                const isCapture = board[move.r][move.c] !== null || move.isEnPassant;
                if (isCapture) {
                    targetNode.classList.add('valid-capture');
                } else {
                    targetNode.classList.add('valid-move');
                }
            }
        });
    }
    
    // Last move
    if (lastMove) {
        const srcNode = getSquareNode(lastMove.from.r, lastMove.from.c);
        const destNode = getSquareNode(lastMove.to.r, lastMove.to.c);
        if (srcNode) srcNode.classList.add('last-move');
        if (destNode) destNode.classList.add('last-move');
    }

    // Hint
    if (activeHint) {
        const srcNode = getSquareNode(activeHint.from.r, activeHint.from.c);
        const destNode = getSquareNode(activeHint.to.r, activeHint.to.c);
        if (srcNode) srcNode.classList.add('suggested');
        if (destNode) destNode.classList.add('suggested');
    }
}

function getSquareNode(r, c) {
    return document.querySelector(`#chessboard .square[data-row="${r}"][data-col="${c}"]`);
}

function animateNumberVal(elId, targetVal) {
    const el = document.getElementById(elId);
    if (!el) return;
    const currentVal = parseInt(el.textContent, 10) || 0;
    if (currentVal === targetVal) return;

    el.classList.add('score-bump');
    setTimeout(() => el.classList.remove('score-bump'), 400);

    const diff = targetVal - currentVal;
    const steps = 10;
    let step = 0;
    const interval = setInterval(() => {
        step++;
        const val = Math.round(currentVal + (diff * (step / steps)));
        el.textContent = val;
        if (step >= steps) {
            el.textContent = targetVal;
            clearInterval(interval);
        }
    }, 25);
}

function updateHUD() {
    animateNumberVal('match-score', matchScore);
    animateNumberVal('career-points', careerPoints);
    
    const whiteCapturedList = document.getElementById('captured-by-white');
    const blackCapturedList = document.getElementById('captured-by-black');
    
    if (whiteCapturedList) {
        whiteCapturedList.innerHTML = '';
        captured.white.forEach(p => {
            const item = document.createElement('div');
            item.className = 'captured-item white';
            item.textContent = UNICODE_PIECES['white'][p.type];
            whiteCapturedList.appendChild(item);
        });
    }
    
    if (blackCapturedList) {
        blackCapturedList.innerHTML = '';
        captured.black.forEach(p => {
            const item = document.createElement('div');
            item.className = 'captured-item black';
            item.textContent = UNICODE_PIECES['black'][p.type];
            blackCapturedList.appendChild(item);
        });
    }
    
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        if (history.length > 0 && !isGameOver && careerPoints >= 100) {
            undoBtn.classList.remove('disabled');
        } else {
            undoBtn.classList.add('disabled');
        }
    }

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        const isPlayersTurn = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
        if (careerPoints >= 100 && isPlayersTurn && !isGameOver) {
            hintBtn.classList.remove('disabled');
        } else {
            hintBtn.classList.add('disabled');
        }
    }
    
    const banner = document.getElementById('turn-banner');
    const msg = document.getElementById('turn-message');
    
    if (msg) {
        if (isGameOver) {
            msg.textContent = "Finished!";
        } else {
            const activeName = playerNames[turn] || 'Player';
            if (gameMode === 'ai' && turn === botSide) {
                msg.textContent = `${activeName} ⚡`;
            } else {
                msg.textContent = `${turn.toUpperCase()}'S TURN`;
            }
        }
    }

    const oppNameEl = document.getElementById('opponent-name-tag');
    const playerNameEl = document.getElementById('player-name-tag');
    if (oppNameEl) oppNameEl.textContent = playerNames[botSide || 'black'] || 'ElectroBot';
    if (playerNameEl) playerNameEl.textContent = playerNames[playerSide || 'white'] || 'Player 1';

    updateTrophyHUD();
    updateClockDisplay();
}

function floatPointsMessage(value, r, c, isNegative = false) {
    const container = document.body;
    const floating = document.createElement('div');
    floating.className = 'points-float' + (isNegative ? ' negative' : '');
    floating.textContent = isNegative ? `${value} Pts` : `+${value} Pts`;
    
    const targetSq = (r !== null && c !== null) ? getSquareNode(r, c) : null;
    if (targetSq) {
        const rect = targetSq.getBoundingClientRect();
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.top = `${rect.top}px`;
    } else {
        floating.style.left = '50%';
        floating.style.top = '50%';
    }
    
    container.appendChild(floating);
    setTimeout(() => floating.remove(), 1000);
}

// --- STATE STORAGE & UNDO ---

function pushHistory() {
    history.push({
        board: cloneBoard(board),
        turn: turn,
        lastMove: lastMove ? { from: { ...lastMove.from }, to: { ...lastMove.to }, piece: { ...lastMove.piece } } : null,
        captured: { white: [...captured.white], black: [...captured.black] },
        matchScore: matchScore
    });
}

function handleUndo() {
    if (history.length === 0 || isGameOver) return;
    if (careerPoints < 100) {
        showToast("⚠️ You need at least 100 Career Points to undo a move!", "warning");
        return;
    }
    
    careerPoints -= 100;
    saveCareerPoints();
    floatPointsMessage(-100, null, null, true);
    activeHint = null; 
    
    if (gameMode === 'ai') {
        if (history.length >= 2) {
            history.pop();
            const snap = history.pop();
            restoreState(snap);
        } else if (history.length === 1 && playerSide === 'black') {
            const snap = history.pop();
            restoreState(snap);
        }
    } else {
        const snap = history.pop();
        restoreState(snap);
    }
    
    selectedSquare = null;
    drawBoard();
    updateHUD();
    playSound('move');
}

function restoreState(snap) {
    board = cloneBoard(snap.board);
    turn = snap.turn;
    lastMove = snap.lastMove;
    captured = { white: [...snap.captured.white], black: [...snap.captured.black] };
    matchScore = snap.matchScore;
}

function loadCareerPoints() {
    const saved = localStorage.getItem('electro_king_career');
    careerPoints = saved ? parseInt(saved, 10) : 0;
}

function saveCareerPoints() {
    localStorage.setItem('electro_king_career', careerPoints);
}

function addCareerPoints(value) {
    let multiplier = 1;
    if (gameMode === 'ai') {
        if (difficulty === 2) multiplier = 1.5;
        if (difficulty === 3) multiplier = 2;
        if (difficulty === 4) multiplier = 3;
    }
    const finalValue = Math.floor(value * multiplier);
    careerPoints += finalValue;
    saveCareerPoints();
    return finalValue;
}

// --- INTERACTIVE ACTIONS & MOVE EXECUTION ---

function handleSquareClick(r, c) {
    if (isGameOver || pendingPromotion) return;
    if (gameMode === 'ai' && turn !== playerSide) return;
    
    const piece = board[r][c];
    
    if (selectedSquare) {
        const moves = getLegalMoves(selectedSquare.r, selectedSquare.c);
        let destinationMatch = moves.find(m => m.r === r && m.c === c);
        
        // King Castling via Rook click
        const selPiece = board[selectedSquare.r][selectedSquare.c];
        if (!destinationMatch && selPiece && selPiece.type === 'k' && r === selectedSquare.r) {
            if (c === 7) destinationMatch = moves.find(m => m.r === r && m.c === 6 && m.isCastling);
            else if (c === 0) destinationMatch = moves.find(m => m.r === r && m.c === 2 && m.isCastling);
        }

        if (destinationMatch) {
            executeMove(selectedSquare, destinationMatch);
            selectedSquare = null;
            return;
        }
    }
    
    if (piece && piece.color === turn) {
        activeHint = null; 
        selectedSquare = { r, c };
        applyBoardHighlights();
    } else {
        selectedSquare = null;
        applyBoardHighlights();
    }
}

function executeMove(from, to, forcePromoType = null) {
    pushHistory(); 
    activeHint = null; 
    
    // Ensure clock starts ticking on first move
    if (clockSetting > 0 && !clockInterval && !isGameOver) {
        startClock();
    }
    
    const activePiece = board[from.r][from.c];
    let isCapture = false;
    let pointsGained = 0;
    
    const isEnPassant = to.isEnPassant;
    const isCastling = to.isCastling;
    
    activePiece.hasMoved = true;
    FX.spawnMoveTrail(from, to, activePiece.color);

    if (isEnPassant) {
        isCapture = true;
        const capturedPawn = board[from.r][to.c];
        captured[capturedPawn.color].push(capturedPawn);
        board[from.r][to.c] = null; 
        FX.spawnCaptureBurst(to.r, to.c, activePiece.color);

        const isHuman = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
        if (isHuman) pointsGained += CAPTURE_POINTS['p'];
    } else {
        const targetPiece = board[to.r][to.c];
        if (targetPiece) {
            isCapture = true;
            captured[targetPiece.color].push(targetPiece);
            FX.spawnCaptureBurst(to.r, to.c, activePiece.color);

            const isHuman = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
            if (isHuman) pointsGained += CAPTURE_POINTS[targetPiece.type] || 0;
        }
    }
    
    board[to.r][to.c] = activePiece;
    board[from.r][from.c] = null;
    
    lastMove = { from, to, piece: { type: activePiece.type, color: activePiece.color } };
    
    if (isCastling) {
        const row = from.r;
        if (to.c === 6) {
            const rook = board[row][7];
            if (rook) {
                rook.hasMoved = true;
                board[row][5] = rook;
                board[row][7] = null;
                FX.spawnMoveTrail({ r: row, c: 7 }, { r: row, c: 5 }, activePiece.color);
            }
        } else if (to.c === 2) {
            const rook = board[row][0];
            if (rook) {
                rook.hasMoved = true;
                board[row][3] = rook;
                board[row][0] = null;
                FX.spawnMoveTrail({ r: row, c: 0 }, { r: row, c: 3 }, activePiece.color);
            }
        }
    }
    
    let isPromotion = activePiece.type === 'p' && (to.r === 0 || to.r === 7);
    
    if (isPromotion) {
        if (gameMode === 'ai' && turn !== playerSide) {
            board[to.r][to.c].type = 'q';
            finalizeMoveStep(to, isCapture, pointsGained);
        } else {
            pendingPromotion = { from, to, isCapture, pointsGained };
            showPromotionModal(activePiece.color);
        }
    } else {
        finalizeMoveStep(to, isCapture, pointsGained);
    }
}

function finalizeMoveStep(toSquare, isCapture, pointsGained) {
    const currentOpponent = turn === 'white' ? 'black' : 'white';
    const deliversCheck = isKingInCheck(currentOpponent);
    
    if (deliversCheck) {
        playSound('check');
        const kingPos = findKing(currentOpponent);
        if (kingPos) FX.spawnCheckSparks(kingPos.r, kingPos.c);
    } else {
        playSound(isCapture ? 'capture' : 'move');
    }
    
    if (pointsGained > 0) {
        matchScore += pointsGained;
        const careerGained = addCareerPoints(pointsGained);
        floatPointsMessage(careerGained, toSquare.r, toSquare.c);
    }
    
    checkGameOver();
    
    if (!isGameOver) {
        turn = currentOpponent;
        updateHUD();
        drawBoard();
        
        if (gameMode === 'ai' && turn === botSide) {
            setTimeout(makeComputerMove, 600);
        }
    } else {
        updateHUD();
        drawBoard();
    }
}

function showPromotionModal(color) {
    const modal = document.getElementById('promotion-modal');
    const optionsContainer = document.getElementById('promo-options');
    optionsContainer.innerHTML = '';
    
    const options = ['q', 'r', 'b', 'n'];
    options.forEach(type => {
        const btn = document.createElement('button');
        btn.className = `promo-btn ${color}`;
        btn.textContent = UNICODE_PIECES[color][type];
        btn.onclick = () => {
            modal.classList.add('hidden');
            if (pendingPromotion) {
                const { to, isCapture, pointsGained } = pendingPromotion;
                board[to.r][to.c].type = type;
                pendingPromotion = null;
                finalizeMoveStep(to, isCapture, pointsGained);
            }
        };
        optionsContainer.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

function checkGameOver() {
    const nextPlayer = turn === 'white' ? 'black' : 'white';
    const legalMoves = getAllLegalMoves(nextPlayer);
    
    if (legalMoves.length === 0) {
        isGameOver = true;
        stopClock();
        let title = '';
        let msg = '';
        let points = 0;
        
        if (isKingInCheck(nextPlayer)) {
            const winnerColor = turn;
            const winnerName = playerNames[winnerColor];
            title = "CHECKMATE! 🏆";
            msg = `${winnerName} has won the match!`;
            
            if (gameMode === 'ai' && winnerColor === playerSide) {
                points = 1000;
            } else if (gameMode === 'local') {
                points = 1000;
            }
            playSound('win');
            FX.spawnWinCelebration();
            updateStatsOnGameOver(winnerColor);
        } else {
            title = "STALEMATE (DRAW) 🤝";
            msg = "No legal moves left. The match is a draw.";
            points = 500;
            playSound('move');
            updateStatsOnGameOver(null);
        }
        
        let finalCareerPoints = 0;
        if (points > 0) {
            finalCareerPoints = addCareerPoints(points);
        }
        
        const tier = getCurrentTrophyTier();
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-msg').textContent = msg;
        document.getElementById('gameover-score').textContent = matchScore;
        document.getElementById('gameover-career').textContent = `+${finalCareerPoints} Pts`;
        document.getElementById('gameover-trophy-alert').textContent = `Current Rank: ${tier.icon} ${tier.name}`;
        document.getElementById('gameover-modal').classList.remove('hidden');
    }
}

function handleGetSuggestion() {
    if (isGameOver || pendingPromotion) return;
    if (gameMode === 'ai' && turn !== playerSide) return;
    
    if (careerPoints < 100) {
        alert("You need at least 100 Career Points to purchase a suggestion hint!");
        return;
    }
    
    careerPoints -= 100;
    saveCareerPoints();
    updateHUD();
    floatPointsMessage(-100, null, null, true);
    
    const bestMove = getBestMoveMinimax(turn, 3);
    if (bestMove) {
        activeHint = bestMove;
        applyBoardHighlights();
        playSound('hint');
        FX.spawnHintFlow(bestMove.from, bestMove.to);
    } else {
        alert("No legal moves available to suggest!");
    }
}

// --- MINIMAX AI ENGINE ---
const PST = {
    p: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [  0,  0,  0,  0,  0,  0,  0,  0],
        [  5, 10, 10, 10, 10, 10, 10,  5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [  0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

function makeComputerMove() {
    if (isGameOver || turn !== botSide) return;
    
    const allMoves = getAllLegalMoves(botSide);
    if (allMoves.length === 0) {
        checkGameOver();
        return;
    }
    
    let chosenMove = null;
    const roll = Math.random();
    
    if (difficulty === 1) {
        chosenMove = roll < 0.85 ? allMoves[Math.floor(Math.random() * allMoves.length)] : getBestMoveMinimax(botSide, 1);
    } else if (difficulty === 2) {
        chosenMove = roll < 0.60 ? allMoves[Math.floor(Math.random() * allMoves.length)] : getBestMoveMinimax(botSide, 1);
    } else if (difficulty === 3) {
        chosenMove = getBestMoveMinimax(botSide, 3);
    } else {
        chosenMove = getBestMoveMinimax(botSide, 4);
    }
    
    if (!chosenMove) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }
    
    executeMove(chosenMove.from, chosenMove.to);
}

function evaluateBoard(testBoard, botColor) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p) {
                let val = (PIECE_VALUES[p.type] || 0) * 10;
                let posBonus = 0;
                if (PST[p.type]) {
                    const tableRow = (p.color === 'white') ? r : (7 - r);
                    posBonus = PST[p.type][tableRow][c];
                }
                const pieceScore = val + posBonus;
                score += (p.color === botColor) ? pieceScore : -pieceScore;
            }
        }
    }
    return score;
}

function getBestMoveMinimax(color, depth) {
    const allMoves = getAllLegalMoves(color);
    if (allMoves.length === 0) return null;
    
    allMoves.sort((a, b) => {
        const aCapture = board[a.to.r][a.to.c] ? 1 : 0;
        const bCapture = board[b.to.r][b.to.c] ? 1 : 0;
        return bCapture - aCapture;
    });
    
    let bestScore = -Infinity;
    let candidates = [];
    let alpha = -Infinity;
    let beta = Infinity;
    
    allMoves.forEach(move => {
        const tempBoard = cloneBoard(board);
        if (move.to.isEnPassant) tempBoard[move.from.r][move.to.c] = null;
        tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
        tempBoard[move.from.r][move.from.c] = null;
        
        const movedPiece = tempBoard[move.to.r][move.to.c];
        if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
            movedPiece.type = 'q';
        }
        
        let score = (depth > 1) ? 
            getMinimaxScore(tempBoard, depth - 1, alpha, beta, false, color, color === 'white' ? 'black' : 'white') :
            evaluateBoard(tempBoard, color);
        
        if (score > bestScore) {
            bestScore = score;
            candidates = [move];
        } else if (score === bestScore) {
            candidates.push(move);
        }
        alpha = Math.max(alpha, score);
    });
    
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function getMinimaxScore(testBoard, depth, alpha, beta, isMaximizing, botColor, activeColor) {
    if (depth === 0) return evaluateBoard(testBoard, botColor);
    
    const allMoves = getAllLegalMoves(activeColor, testBoard);
    if (allMoves.length === 0) {
        if (isKingInCheck(activeColor, testBoard)) {
            return (activeColor === botColor) ? -99999 : 99999;
        }
        return 0;
    }
    
    const nextColor = activeColor === 'white' ? 'black' : 'white';
    allMoves.sort((a, b) => {
        const aCap = testBoard[a.to.r][a.to.c] ? 1 : 0;
        const bCap = testBoard[b.to.r][b.to.c] ? 1 : 0;
        return bCap - aCap;
    });
    
    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let i = 0; i < allMoves.length; i++) {
            const move = allMoves[i];
            const temp = cloneBoard(testBoard);
            if (move.to.isEnPassant) temp[move.from.r][move.to.c] = null;
            temp[move.to.r][move.to.c] = temp[move.from.r][move.from.c];
            temp[move.from.r][move.from.c] = null;
            
            const movedPiece = temp[move.to.r][move.to.c];
            if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
                movedPiece.type = 'q';
            }
            
            const score = getMinimaxScore(temp, depth - 1, alpha, beta, false, botColor, nextColor);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let i = 0; i < allMoves.length; i++) {
            const move = allMoves[i];
            const temp = cloneBoard(testBoard);
            if (move.to.isEnPassant) temp[move.from.r][move.to.c] = null;
            temp[move.to.r][move.to.c] = temp[move.from.r][move.from.c];
            temp[move.from.r][move.from.c] = null;
            
            const movedPiece = temp[move.to.r][move.to.c];
            if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
                movedPiece.type = 'q';
            }
            
            const score = getMinimaxScore(temp, depth - 1, alpha, beta, true, botColor, nextColor);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return minScore;
    }
}

// --- SETUP EVENTS & INITIALIZATION ---

function setupEvents() {
    // 5-Tab Dock Buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.dataset.tab;
            if (targetTab === 'quick') {
                document.getElementById('setup-modal').classList.remove('hidden');
            } else {
                switchTab(targetTab);
            }
        };
    });

    const hudCareerCard = document.getElementById('hud-career-card');
    if (hudCareerCard) hudCareerCard.onclick = () => switchTab('shop');
    
    const hudTrophyBadge = document.getElementById('hud-trophy-badge');
    if (hudTrophyBadge) hudTrophyBadge.onclick = () => switchTab('shop');

    // Modes in Setup Modal
    const modeAi = document.getElementById('mode-ai-btn');
    const modeLocal = document.getElementById('mode-local-btn');
    const aiInputs = document.getElementById('ai-name-inputs');
    const localInputs = document.getElementById('local-name-inputs');
    const sideSection = document.getElementById('side-select-section');
    const diffSection = document.getElementById('difficulty-section');
    
    if (modeAi) {
        modeAi.onclick = () => {
            modeAi.classList.add('active');
            if (modeLocal) modeLocal.classList.remove('active');
            if (aiInputs) aiInputs.classList.remove('hidden');
            if (localInputs) localInputs.classList.add('hidden');
            if (sideSection) sideSection.classList.remove('hidden');
            if (diffSection) diffSection.classList.remove('hidden');
            gameMode = 'ai';
        };
    }
    
    if (modeLocal) {
        modeLocal.onclick = () => {
            modeLocal.classList.add('active');
            if (modeAi) modeAi.classList.remove('active');
            if (aiInputs) aiInputs.classList.add('hidden');
            if (localInputs) localInputs.classList.remove('hidden');
            if (sideSection) sideSection.classList.add('hidden');
            if (diffSection) diffSection.classList.add('hidden');
            gameMode = 'local';
        };
    }

    // Clock Selectors
    document.querySelectorAll('.clock-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.clock-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clockSetting = parseInt(btn.dataset.time, 10);
        };
    });

    // Side Selection
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
        btn.onclick = () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playerSide = btn.dataset.side;
        };
    });

    // AI Difficulty Slider
    const diffSlider = document.getElementById('difficulty-slider');
    const diffLabel = document.getElementById('diff-label');
    const diffConfigs = [
        { name: 'Beginner', color: '#00b4d8', glow: 'rgba(0, 180, 216, 0.8)', bg: 'rgba(0, 180, 216, 0.2)' },
        { name: 'Easy', color: '#06d6a0', glow: 'rgba(6, 214, 160, 0.8)', bg: 'rgba(6, 214, 160, 0.2)' },
        { name: 'Hard', color: '#ff0054', glow: 'rgba(255, 0, 84, 0.8)', bg: 'rgba(255, 0, 84, 0.2)' },
        { name: 'Difficult', color: '#9d4edd', glow: 'rgba(157, 78, 221, 0.8)', bg: 'rgba(157, 78, 221, 0.2)' }
    ];

    function updateDifficultyUI(val) {
        difficulty = parseInt(val, 10);
        const config = diffConfigs[difficulty - 1];
        if (diffLabel) {
            diffLabel.innerHTML = `⚙️ Bot Difficulty: <span class="diff-badge" style="background:${config.bg}; color:${config.color}; box-shadow:0 0 10px ${config.glow}; border: 1px solid ${config.color}">${config.name}</span>`;
        }
        applyDifficultyTheme(difficulty);
    }

    if (diffSlider) {
        diffSlider.oninput = () => updateDifficultyUI(diffSlider.value);
        updateDifficultyUI(diffSlider.value || 2);
    }

    // Room Generator
    const genRoomBtn = document.getElementById('generate-room-btn');
    if (genRoomBtn) {
        genRoomBtn.onclick = () => {
            const rand = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('room-code-input').value = rand;
        };
    }

    // Action Bar Buttons
    document.getElementById('undo-btn').onclick = handleUndo;
    document.getElementById('hint-btn').onclick = handleGetSuggestion;
    
    const pwrBtn = document.getElementById('powerup-btn');
    if (pwrBtn) pwrBtn.onclick = handlePowerUp;

    const soundBtn = document.getElementById('sound-btn');
    const soundIcon = document.getElementById('sound-icon');
    soundBtn.onclick = () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    };

    document.getElementById('menu-btn').onclick = () => {
        document.getElementById('setup-modal').classList.remove('hidden');
    };

    const closeBtn = document.getElementById('setup-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('setup-modal').classList.add('hidden');
        };
    }

    document.getElementById('start-match-btn').onclick = startNewGame;
    
    document.getElementById('gameover-restart-btn').onclick = () => {
        document.getElementById('gameover-modal').classList.add('hidden');
        document.getElementById('setup-modal').classList.remove('hidden');
    };

    // Puzzle Controls
    const pzNext = document.getElementById('puzzle-next-btn');
    if (pzNext) {
        pzNext.onclick = () => {
            currentPuzzleIdx = (currentPuzzleIdx + 1) % PUZZLE_DATABASE.length;
            renderCurrentPuzzle();
        };
    }
    
    const pzReset = document.getElementById('puzzle-reset-btn');
    if (pzReset) pzReset.onclick = renderCurrentPuzzle;
    
    const pzHint = document.getElementById('puzzle-hint-btn');
    if (pzHint) {
        pzHint.onclick = () => {
            const puzzle = PUZZLE_DATABASE[currentPuzzleIdx];
            const p1 = puzzle.solution.from;
            const p2 = puzzle.solution.to;
            const sq1 = document.querySelector(`#puzzle-board .square[data-row="${p1.r}"][data-col="${p1.c}"]`);
            const sq2 = document.querySelector(`#puzzle-board .square[data-row="${p2.r}"][data-col="${p2.c}"]`);
            if (sq1) sq1.classList.add('suggested');
            if (sq2) sq2.classList.add('suggested');
            playSound('hint');
        };
    }

    // --- THEME SHOP & UNLOCKING LOGIC ---
    let unlockedThemes = ['cyber'];
    try {
        const savedThemes = localStorage.getItem('electro_king_unlocked_themes');
        if (savedThemes) unlockedThemes = JSON.parse(savedThemes);
    } catch(e) {}

    function updateThemeCardsUI() {
        const currentActiveTheme = localStorage.getItem('electro_king_theme') || 'cyber';
        document.querySelectorAll('.theme-card').forEach(card => {
            const theme = card.dataset.theme;
            const cost = parseInt(card.dataset.cost, 10) || 0;
            const costSpan = card.querySelector('.theme-cost');
            
            card.classList.toggle('active', theme === currentActiveTheme);
            
            if (unlockedThemes.includes(theme)) {
                if (costSpan) costSpan.textContent = (theme === currentActiveTheme) ? 'Active' : 'Unlocked';
            } else {
                if (costSpan) costSpan.textContent = `${cost} Pts (Tap to Unlock)`;
            }
        });
    }

    document.querySelectorAll('.theme-card').forEach(card => {
        card.onclick = () => {
            const theme = card.dataset.theme;
            const cost = parseInt(card.dataset.cost, 10) || 0;
            
            // If already unlocked
            if (unlockedThemes.includes(theme)) {
                document.body.className = '';
                if (theme !== 'cyber') {
                    document.body.classList.add(`theme-${theme}`);
                }
                localStorage.setItem('electro_king_theme', theme);
                playSound('move');
                updateThemeCardsUI();
                return;
            }
            
            // Check if player has enough points to unlock
            if (careerPoints < cost) {
                showToast(`⚠️ You need ${cost} Career Points to unlock this theme! (Your points: ${careerPoints})`, 'warning');
                playSound('undo');
                return;
            }
            
            // Unlock with points!
            const themeTitle = card.querySelector('h4').textContent;
            showCustomConfirm(
                "UNLOCK THEME ✨",
                `Unlock <strong>${themeTitle}</strong> for <strong>${cost} Career Points</strong>?`,
                () => {
                    careerPoints -= cost;
                    saveCareerPoints();
                    unlockedThemes.push(theme);
                    localStorage.setItem('electro_king_unlocked_themes', JSON.stringify(unlockedThemes));
                    
                    document.body.className = '';
                    if (theme !== 'cyber') {
                        document.body.classList.add(`theme-${theme}`);
                    }
                    localStorage.setItem('electro_king_theme', theme);
                    
                    playSound('win');
                    floatPointsMessage(-cost, null, null, true);
                    updateHUD();
                    updateThemeCardsUI();
                    showToast(`🎉 Theme "${themeTitle}" Unlocked Successfully!`, 'success');
                }
            );
        };
    });
    updateThemeCardsUI();

    // --- CLEAN PROFILE / USERNAME SETTINGS ---
    const authBtn = document.getElementById('profile-auth-btn');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close-btn');
    const authSubmit = document.getElementById('auth-submit-btn');
    
    if (authBtn && authModal) {
        authBtn.onclick = () => {
            try {
                const saved = localStorage.getItem('electro_king_profile');
                if (saved) {
                    const p = JSON.parse(saved);
                    const authUsernameInput = document.getElementById('auth-username-input');
                    if (authUsernameInput && p.username) authUsernameInput.value = p.username;
                }
            } catch(e) {}
            authModal.classList.remove('hidden');
        };
    }
    if (authClose && authModal) {
        authClose.onclick = () => authModal.classList.add('hidden');
    }

    // Direct 1-Click Profile Save (Zero questions, zero prompts!)
    if (authSubmit && authModal) {
        authSubmit.onclick = () => {
            const usernameInput = document.getElementById('auth-username-input').value.trim() || 'Crazy Voss';
            
            const profileData = {
                username: usernameInput
            };
            
            localStorage.setItem('electro_king_profile', JSON.stringify(profileData));
            applyUserProfile(profileData);
            
            authModal.classList.add('hidden');
            playSound('win');
        };
    }

    function applyUserProfile(profile) {
        if (!profile) return;
        
        const nameEl = document.getElementById('profile-name');
        const badgeEl = document.getElementById('account-type-badge');
        const playerInput = document.getElementById('player-name-input');
        const p1Input = document.getElementById('p1-name-input');
        const authUsernameInput = document.getElementById('auth-username-input');
        const authEmailInput = document.getElementById('auth-email-input');
        
        // Auto-fill all display names & input fields
        if (nameEl) nameEl.textContent = profile.username;
        if (playerInput) playerInput.value = profile.username;
        if (p1Input) p1Input.value = profile.username;
        if (authUsernameInput) authUsernameInput.value = profile.username;
        if (authEmailInput) authEmailInput.value = profile.email || '';
        
        playerNames.white = profile.username;
        
        if (badgeEl) {
            badgeEl.textContent = `✓ ${profile.provider === 'google' ? 'Google' : 'Email'} Verified: ${profile.email}`;
            badgeEl.style.background = '#06d6a0';
            badgeEl.style.color = '#000000';
            badgeEl.style.fontWeight = '800';
        }

        if (profile.photoUrl) {
            renderAvatarImage(profile.photoUrl);
        }
    }

    // Custom Avatar Gallery / Camera Picker
    setupAvatarPicker();

    // Restore saved profile on start
    try {
        const savedProfile = localStorage.getItem('electro_king_profile');
        if (savedProfile) {
            applyUserProfile(JSON.parse(savedProfile));
        }
    } catch(e) {}
}

function setupAvatarPicker() {
    const pickerBtn = document.getElementById('avatar-picker-btn');
    const fileInput = document.getElementById('avatar-file-input');
    
    if (pickerBtn && fileInput) {
        pickerBtn.onclick = () => fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                localStorage.setItem('electro_king_custom_avatar', base64);
                renderAvatarImage(base64);
                playSound('move');
            };
            reader.readAsDataURL(file);
        };
    }
    
    const savedAvatar = localStorage.getItem('electro_king_custom_avatar');
    if (savedAvatar) {
        renderAvatarImage(savedAvatar);
    }
}

function renderAvatarImage(url) {
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarEmoji = document.getElementById('profile-avatar');
    if (avatarImg && avatarEmoji && url) {
        avatarImg.src = url;
        avatarImg.classList.remove('hidden');
        avatarEmoji.classList.add('hidden');
    }
}

function applyDifficultyTheme(diffVal) {
    document.body.classList.remove('diff-beginner', 'diff-easy', 'diff-hard', 'diff-difficult');
    if (diffVal === 1) document.body.classList.add('diff-beginner');
    else if (diffVal === 2) document.body.classList.add('diff-easy');
    else if (diffVal === 3) document.body.classList.add('diff-hard');
    else if (diffVal === 4) document.body.classList.add('diff-difficult');
}

function startNewGame() {
    initAudio(); 
    switchTab('arena');
    
    if (gameMode === 'ai') {
        applyDifficultyTheme(difficulty);
        const rawName = document.getElementById('player-name-input').value.trim();
        const userName = rawName || 'Viaan Patel';
        
        let activeSide = playerSide;
        if (playerSide === 'random') {
            activeSide = Math.random() < 0.5 ? 'white' : 'black';
        }
        playerSide = activeSide;
        
        if (activeSide === 'white') {
            playerNames = { white: userName, black: 'ElectroBot 🤖' };
            botSide = 'black';
        } else {
            playerNames = { white: 'ElectroBot 🤖', black: userName };
            botSide = 'white';
        }
    } else {
        const p1 = document.getElementById('p1-name-input').value.trim() || 'Player 1';
        const p2 = document.getElementById('p2-name-input').value.trim() || 'Player 2';
        playerNames = { white: p1, black: p2 };
        botSide = null;
    }

    const boardNode = document.getElementById('chessboard');
    if (gameMode === 'ai' && playerSide === 'black') {
        boardNode.classList.add('flipped');
    } else {
        boardNode.classList.remove('flipped');
    }

    turn = 'white';
    selectedSquare = null;
    lastMove = null;
    history = [];
    captured = { white: [], black: [] };
    matchScore = 0;
    isGameOver = false;
    pendingPromotion = null;
    activeHint = null;
    powerUpUsedThisMatch = false;

    // Reset Clocks
    timeRemaining.white = clockSetting;
    timeRemaining.black = clockSetting;
    startClock();

    initBoard();
    document.getElementById('setup-modal').classList.add('hidden');
    
    updateHUD();
    drawBoard();
    playSound('move');

    if (gameMode === 'ai' && botSide === 'white') {
        setTimeout(makeComputerMove, 700);
    }
}

// Initializer
window.onload = () => {
    loadCareerPoints();
    loadStats();
    setupEvents();
    
    // Restore Saved Theme
    const savedTheme = localStorage.getItem('electro_king_theme');
    if (savedTheme && savedTheme !== 'cyber') {
        document.body.classList.add(`theme-${savedTheme}`);
        const card = document.querySelector(`.theme-card[data-theme="${savedTheme}"]`);
        if (card) {
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
    }
    
    initBoard();
    drawBoard();
    timeRemaining.white = clockSetting;
    timeRemaining.black = clockSetting;
    updateHUD();
    updateClockDisplay();
    FX.init();
    applyDifficultyTheme(difficulty || 2);

    // Default to Arena Tab in clean idle state
    switchTab('arena');
};
