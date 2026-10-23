// =========================================================
// ELECTRO KING 👑 - OFFICIAL EDITION
// Professional Chess & Tactics Engine
// =========================================================

// --- ROYAL GOLD PARTICLE & LIGHTNING FX SYSTEM ---
class CastleFX {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.lightningBolts = [];
        this.animId = null;
        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    spark(x, y, count = 18, color = '#00f5d4') {
        if (!this.ctx) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 3.8;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                color
            });
        }
        if (!this.animId) this.animate();
    }

    shockwave(x, y, color = '#ff0054') {
        if (!this.ctx) return;
        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            const speed = 3.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03,
                size: 3.2,
                color
            });
        }
        if (!this.animId) this.animate();
    }

    lightningDefeat(x, y, color = '#00f5d4', secondary = '#9d4edd') {
        if (!this.ctx) return;
        this.resize();
        
        // Blast particles around defeated King
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            const speed = 3.5 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.2,
                decay: 0.025,
                size: 3.5 + Math.random() * 3,
                color: i % 2 === 0 ? color : secondary
            });
        }
        
        // Multi-branch electrical lightning bolts
        for (let b = 0; b < 6; b++) {
            let startX = x + (Math.random() - 0.5) * 80;
            let startY = Math.max(0, y - 160 + Math.random() * 40);
            let curX = startX, curY = startY;
            const steps = 10;
            const dx = (x - startX) / steps;
            const dy = (y - startY) / steps;
            for (let s = 0; s < steps; s++) {
                const nextX = curX + dx + (Math.random() - 0.5) * 24;
                const nextY = curY + dy + (Math.random() - 0.5) * 14;
                this.particles.push({
                    x: nextX,
                    y: nextY,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    life: 0.8 + Math.random() * 0.4,
                    decay: 0.035,
                    size: 3.5,
                    color: '#00f5d4'
                });
                curX = nextX;
                curY = nextY;
            }
        }
        if (!this.animId) this.animate();
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.size = Math.max(0.5, p.size * 0.96);
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.animate());
        } else {
            this.animId = null;
        }
    }
}

let fx2p = null;

// --- AUDIO SYNTHESIS SYSTEM ---
class CastleAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, gainVal = 0.15) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio policy restriction fallback
        }
    }

    move() {
        this.playTone(320, 'sine', 0.08, 0.12);
    }

    capture() {
        this.playTone(220, 'triangle', 0.15, 0.2);
        setTimeout(() => this.playTone(180, 'sine', 0.15, 0.2), 40);
    }

    check() {
        this.playTone(587.33, 'triangle', 0.2, 0.25);
        setTimeout(() => this.playTone(880, 'sine', 0.3, 0.25), 100);
    }

    strike() {
        this.playTone(150, 'sawtooth', 0.3, 0.25);
        setTimeout(() => this.playTone(80, 'sine', 0.4, 0.3), 50);
    }

    victory() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 'triangle', 0.35, 0.3), i * 140);
        });
    }

    defeat() {
        const notes = [440, 415.30, 392.00, 349.23];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 'sawtooth', 0.3, 0.2), i * 150);
        });
    }

    powerup() {
        this.playTone(400, 'sine', 0.1, 0.25);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.3), 80);
        setTimeout(() => this.playTone(1200, 'triangle', 0.3, 0.35), 160);
    }
}

const audio = new CastleAudio();

// --- HIGH-DEF PIECE SVG RENDERER ---
const PIECE_SVGS = {
    p: (fill, stroke) => `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/></svg>`,
    n: (fill, stroke) => `<svg viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z"/><circle cx="9.5" cy="25" r="1.5" fill="${stroke}"/></g></svg>`,
    b: (fill, stroke) => `<svg viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/><path d="M 25 8 A 2.5 2.5 0 0 1 20 8 A 2.5 2.5 0 0 1 25 8 z"/><path d="M 17.5,26 C 15,22 14,17.5 17.5,13.5 C 20,10.5 25,10.5 27.5,13.5 C 31,17.5 30,22 27.5,26 C 22.5,27 22.5,27 17.5,26 z"/><path d="M 20,15 L 25,15"/><path d="M 22.5,12.5 L 22.5,18"/></g></svg>`,
    r: (fill, stroke) => `<svg viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 14,17 L 11,14 z"/><path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17 L 31,17 z"/><path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5 L 14,29.5 z"/></g></svg>`,
    q: (fill, stroke) => `<svg viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 12,37 14,37.5 15.5,37 C 17,36.5 19.5,36.5 22.5,36.5 C 25.5,36.5 28,36.5 29.5,37 C 31,37.5 33,37 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/><path d="M 11.5,30 C 15,29 30,29 33.5,30"/><path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5"/><circle cx="6" cy="12" r="2" fill="${stroke}"/><circle cx="14" cy="9" r="2" fill="${stroke}"/><circle cx="22.5" cy="6" r="2" fill="${stroke}"/><circle cx="31" cy="9" r="2" fill="${stroke}"/><circle cx="39" cy="12" r="2" fill="${stroke}"/></g></svg>`,
    k: (fill, stroke) => `<svg viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6"/><path d="M 20,8 L 25,8"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z"/><path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,35 37.5,29.5 35,26 C 33.5,24 30,23 26.5,24.5 C 24,25.5 22.5,25 22.5,25 C 22.5,25 21,25.5 18.5,24.5 C 15,23 11.5,24 10,26 C 7.5,29.5 8.5,35 11.5,37 z"/><path d="M 11.5,30 C 15,29 30,29 33.5,30"/><path d="M 11.5,33.5 C 15,32.5 30,32.5 33.5,33.5"/><path d="M 11.5,37 C 15,36 30,36 33.5,37"/></g></svg>`
};

function getPieceSvg(color, type) {
    let fill = '#ffffff';
    let stroke = '#00f5d4';
    
    if (color === 'white') {
        fill = '#ffffff';
        stroke = '#00f5d4'; // Electric Cyan
    } else if (color === 'black') {
        fill = '#140a22';   // Deep Cyber Purple
        stroke = '#ff0054'; // Electric Neon Pink
    } else if (color === 'red') {
        fill = '#2b0610';
        stroke = '#ff0054';
    } else if (color === 'blue') {
        fill = '#051b33';
        stroke = '#00f5d4';
    } else if (color === 'gold') {
        fill = '#2a1c02';
        stroke = '#ffd166';
    } else if (color === 'green') {
        fill = '#042314';
        stroke = '#00ff66';
    }
    
    const fn = PIECE_SVGS[type];
    return fn ? fn(fill, stroke) : '';
}

// --- GLOBAL STATE ---
let currentTab = 'home'; // App starts on HOME!
let lordProfile = {
    name: localStorage.getItem('electro_player_name') || 'Player',
    avatar: localStorage.getItem('electro_profile_avatar') || '👑',
    avatarUrl: localStorage.getItem('electro_profile_avatar_url') || '',
    matches: parseInt(localStorage.getItem('electro_stat_matches') || '0', 10),
    wins: parseInt(localStorage.getItem('electro_stat_wins') || '0', 10),
    losses: parseInt(localStorage.getItem('electro_stat_losses') || '0', 10),
    draws: parseInt(localStorage.getItem('electro_stat_draws') || '0', 10),
    currentStreak: parseInt(localStorage.getItem('electro_stat_current_streak') || '0', 10),
    bestStreak: parseInt(localStorage.getItem('electro_stat_best_streak') || '0', 10),
    rating: parseInt(localStorage.getItem('electro_player_rating') || '1200', 10),
    puzzles: parseInt(localStorage.getItem('royal_puzzles_solved') || '0', 10),
    botRecords: {
        1: { w: 0, l: 0, d: 0 },
        2: { w: 0, l: 0, d: 0 },
        3: { w: 0, l: 0, d: 0 },
        4: { w: 0, l: 0, d: 0 }
    }
};

const BOT_INFO = {
    1: { name: 'Sparky', title: 'Novice Bot', elo: 600, icon: '⚡' },
    2: { name: 'CyberKnight', title: 'Tactician Bot', elo: 1200, icon: '🛡️' },
    3: { name: 'VoltQueen', title: 'Master Bot', elo: 1700, icon: '👑' },
    4: { name: 'ElectroKing', title: 'Grandmaster Bot', elo: 2200, icon: '🌌' }
};

function getRatingTitle(elo) {
    if (elo >= 2000) return 'Electro Grandmaster 🌌';
    if (elo >= 1600) return 'Volt Master 👑';
    if (elo >= 1200) return 'Electro Knight 🛡️';
    return 'Spark Novice ⚡';
}

function recordMatchHistory(opponent, result, moves) {
    try {
        let historyList = JSON.parse(localStorage.getItem('electro_game_history') || '[]');
        const today = new Date();
        const dateStr = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        historyList.unshift({
            opponent: opponent || 'Opponent',
            result: result || 'Completed',
            moves: moves || 1,
            date: dateStr,
            mode: gameMode === 'ai' ? 'vs Computer' : 'Pass & Play'
        });
        if (historyList.length > 20) historyList = historyList.slice(0, 20);
        localStorage.setItem('electro_game_history', JSON.stringify(historyList));
    } catch (e) {
        console.error('Error saving game history:', e);
    }
}

function onMatchConcluded(result, opponentName, moveCount) {
    lordProfile.matches = (lordProfile.matches || 0) + 1;
    if (result === 'win') {
        lordProfile.wins = (lordProfile.wins || 0) + 1;
        lordProfile.currentStreak = (lordProfile.currentStreak || 0) + 1;
        if (lordProfile.currentStreak > (lordProfile.bestStreak || 0)) {
            lordProfile.bestStreak = lordProfile.currentStreak;
        }
        lordProfile.rating = Math.max(400, (lordProfile.rating || 1200) + 16);
        if (gameMode === 'ai') {
            if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0,d:0}, 2:{w:0,l:0,d:0}, 3:{w:0,l:0,d:0}, 4:{w:0,l:0,d:0} };
            if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0, d: 0 };
            lordProfile.botRecords[difficulty].w = (lordProfile.botRecords[difficulty].w || 0) + 1;
        }
        recordMatchHistory(opponentName, 'Victory', moveCount);
        audio.victory();
        triggerHaptic('victory');
    } else if (result === 'loss') {
        lordProfile.losses = (lordProfile.losses || 0) + 1;
        lordProfile.currentStreak = 0;
        lordProfile.rating = Math.max(400, (lordProfile.rating || 1200) - 16);
        if (gameMode === 'ai') {
            if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0,d:0}, 2:{w:0,l:0,d:0}, 3:{w:0,l:0,d:0}, 4:{w:0,l:0,d:0} };
            if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0, d: 0 };
            lordProfile.botRecords[difficulty].l = (lordProfile.botRecords[difficulty].l || 0) + 1;
        }
        recordMatchHistory(opponentName, 'Defeat', moveCount);
        audio.defeat();
        triggerHaptic('check');
    } else {
        lordProfile.draws = (lordProfile.draws || 0) + 1;
        if (gameMode === 'ai') {
            if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0,d:0}, 2:{w:0,l:0,d:0}, 3:{w:0,l:0,d:0}, 4:{w:0,l:0,d:0} };
            if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0, d: 0 };
            lordProfile.botRecords[difficulty].d = (lordProfile.botRecords[difficulty].d || 0) + 1;
        }
        recordMatchHistory(opponentName, 'Draw', moveCount);
        triggerHaptic('move');
    }
    saveProfile();
    checkAndUnlockAchievements();
}

// --- ELECTRO SETTINGS & HAPTIC ENGINE ---
let initialTheme = localStorage.getItem('royal_chess_theme');
if (!initialTheme || initialTheme === 'castle') {
    initialTheme = 'cyber';
    localStorage.setItem('royal_chess_theme', 'cyber');
}

const royalSettings = {
    theme: initialTheme,
    sound: localStorage.getItem('royal_chess_sound') !== 'false',
    vibration: localStorage.getItem('royal_chess_vibration') !== 'false',
    coords: localStorage.getItem('royal_chess_coords') !== 'false',
    evalBar: localStorage.getItem('royal_chess_eval') !== 'false'
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
let replayIndex = -1; // -1 for live game, 0..N-1 for historical snapshot review
let isManualFlipped = false;

function triggerHaptic(type = 'move') {
    if (!royalSettings.vibration) return;
    try {
        let ms = 15;
        if (type === 'capture') ms = 45;
        else if (type === 'check') ms = 75;
        else if (type === 'victory') ms = 150;
        
        if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
            window.AndroidBridge.vibrate(ms);
        } else if (navigator.vibrate) {
            if (type === 'victory') {
                navigator.vibrate([60, 60, 60, 60, 140]);
            } else {
                navigator.vibrate(ms);
            }
        }
    } catch (e) {}
}

function applyTheme(themeName) {
    if (!['cyber', 'obsidian', 'gold', 'matrix', 'castle', 'wood'].includes(themeName)) themeName = 'cyber';
    royalSettings.theme = themeName;
    localStorage.setItem('royal_chess_theme', themeName);
    document.body.className = `theme-${themeName}`;
    document.querySelectorAll('.theme-card-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

// 2-Player Match State
let board = [];
let turn = 'white';
let selectedSquare = null;
let lastMove = null;
let history = [];
let captured = { white: [], black: [] };
let gameMode = 'ai'; // 'ai', 'local'
let playerSide = 'white';
let botSide = 'black';
let difficulty = 2;
let playerNames = { white: lordProfile.name, black: 'CyberKnight 🛡️' };
let isGameOver = false;
let isGamePaused = false;
let isMatchActive = false;
let pendingPromotion = null;
let activeHint = null;
let clockInterval = null;
let clockTimes = { white: 0, black: 0 };
let matchClockLimit = 0; // Default: 0 = NONE (Untimed!)
let moveHistoryNotation = [];
let aiMoveTimeout = null;

const BOT_PERSONALITIES = {
    1: { name: 'Sparky ⚡', rating: '~600 Elo', icon: '⚡' },
    2: { name: 'CyberKnight 🛡️', rating: '~1200 Elo', icon: '🛡️' },
    3: { name: 'VoltQueen 👑', rating: '~1700 Elo', icon: '👑' },
    4: { name: 'ElectroKing 🌌', rating: '~2200 Elo', icon: '🌌' }
};

// Puzzles & Openings State
let currentPuzzleIdx = 0;
let currentOpeningIdx = 0;
let openingStep = 0;

// =========================================================
// 1. BOARD INITIALIZATION & CORE 2-PLAYER ENGINE
// =========================================================

function init2PlayerBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
        board[0][c] = { type: backRow[c], color: 'black', hasMoved: false };
        board[1][c] = { type: 'p', color: 'black', hasMoved: false };
        board[6][c] = { type: 'p', color: 'white', hasMoved: false };
        board[7][c] = { type: backRow[c], color: 'white', hasMoved: false };
    }
}

function cloneBoard(b) {
    return b.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function onBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPseudoLegalMoves(r, c, b = board, allowCastling = true) {
    const piece = b[r][c];
    if (!piece) return [];
    const moves = [];
    const color = piece.color;
    const opp = color === 'white' ? 'black' : 'white';
    
    if (piece.type === 'p') {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Single forward move
        if (onBoard(r + dir, c) && !b[r + dir][c]) {
            moves.push({ r: r + dir, c });
            // Double forward move
            if (r === startRow && !b[r + 2 * dir][c]) {
                moves.push({ r: r + 2 * dir, c });
            }
        }
        
        // Diagonal captures
        [-1, 1].forEach(dc => {
            const tr = r + dir, tc = c + dc;
            if (onBoard(tr, tc) && b[tr][tc] && b[tr][tc].color === opp) {
                moves.push({ r: tr, c: tc });
            }
        });
    } else if (piece.type === 'n') {
        const deltas = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        deltas.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (onBoard(tr, tc) && (!b[tr][tc] || b[tr][tc].color === opp)) {
                moves.push({ r: tr, c: tc });
            }
        });
    } else if (piece.type === 'b') {
        slideMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves, opp, b);
    } else if (piece.type === 'r') {
        slideMoves(r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves, opp, b);
    } else if (piece.type === 'q') {
        slideMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], moves, opp, b);
    } else if (piece.type === 'k') {
        const deltas = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        deltas.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (onBoard(tr, tc) && (!b[tr][tc] || b[tr][tc].color === opp)) {
                moves.push({ r: tr, c: tc });
            }
        });
        
        // Castling (only evaluated when allowCastling is true)
        if (allowCastling && !piece.hasMoved && !isKingInCheck(color, b)) {
            // Kingside
            if (b[r][7] && b[r][7].type === 'r' && !b[r][7].hasMoved && !b[r][5] && !b[r][6]) {
                if (!isSquareAttacked(r, 5, opp, b) && !isSquareAttacked(r, 6, opp, b)) {
                    moves.push({ r, c: 6, isCastling: 'kingside' });
                }
            }
            // Queenside
            if (b[r][0] && b[r][0].type === 'r' && !b[r][0].hasMoved && !b[r][1] && !b[r][2] && !b[r][3]) {
                if (!isSquareAttacked(r, 3, opp, b) && !isSquareAttacked(r, 2, opp, b)) {
                    moves.push({ r, c: 2, isCastling: 'queenside' });
                }
            }
        }
    }
    
    return moves;
}

function slideMoves(r, c, directions, moves, opp, b) {
    directions.forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (onBoard(tr, tc)) {
            if (!b[tr][tc]) {
                moves.push({ r: tr, c: tc });
            } else {
                if (b[tr][tc].color === opp) {
                    moves.push({ r: tr, c: tc });
                }
                break;
            }
            tr += dr;
            tc += dc;
        }
    });
}

function isSquareAttacked(r, c, byColor, b) {
    // 1. Check Pawns attacking (r, c)
    const pRow = r - (byColor === 'white' ? -1 : 1);
    if (onBoard(pRow, c - 1) && b[pRow][c - 1] && b[pRow][c - 1].color === byColor && b[pRow][c - 1].type === 'p') return true;
    if (onBoard(pRow, c + 1) && b[pRow][c + 1] && b[pRow][c + 1].color === byColor && b[pRow][c + 1].type === 'p') return true;
    
    // 2. Check Knights attacking (r, c)
    const nDeltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (let i = 0; i < nDeltas.length; i++) {
        const nr = r + nDeltas[i][0], nc = c + nDeltas[i][1];
        if (onBoard(nr, nc) && b[nr][nc] && b[nr][nc].color === byColor && b[nr][nc].type === 'n') return true;
    }
    
    // 3. Check Kings (1-step radius)
    const kDeltas = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    for (let i = 0; i < kDeltas.length; i++) {
        const kr = r + kDeltas[i][0], kc = c + kDeltas[i][1];
        if (onBoard(kr, kc) && b[kr][kc] && b[kr][kc].color === byColor && b[kr][kc].type === 'k') return true;
    }
    
    // 4. Check Orthogonal (Rook & Queen)
    const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let i = 0; i < ortho.length; i++) {
        let dr = ortho[i][0], dc = ortho[i][1];
        let tr = r + dr, tc = c + dc;
        while (onBoard(tr, tc)) {
            if (b[tr][tc]) {
                if (b[tr][tc].color === byColor && (b[tr][tc].type === 'r' || b[tr][tc].type === 'q')) return true;
                break;
            }
            tr += dr;
            tc += dc;
        }
    }
    
    // 5. Check Diagonal (Bishop & Queen)
    const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let i = 0; i < diag.length; i++) {
        let dr = diag[i][0], dc = diag[i][1];
        let tr = r + dr, tc = c + dc;
        while (onBoard(tr, tc)) {
            if (b[tr][tc]) {
                if (b[tr][tc].color === byColor && (b[tr][tc].type === 'b' || b[tr][tc].type === 'q')) return true;
                break;
            }
            tr += dr;
            tc += dc;
        }
    }
    
    return false;
}

function findKing(color, b = board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c] && b[r][c].type === 'k' && b[r][c].color === color) {
                return { r, c };
            }
        }
    }
    return null;
}

function isKingInCheck(color, b = board) {
    const kPos = findKing(color, b);
    if (!kPos) return false;
    const opp = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(kPos.r, kPos.c, opp, b);
}

function getLegalMoves(r, c, b = board) {
    const piece = b[r][c];
    if (!piece) return [];
    const pseudo = getPseudoLegalMoves(r, c, b);
    
    return pseudo.filter(m => {
        const nextB = cloneBoard(b);
        nextB[m.r][m.c] = nextB[r][c];
        nextB[r][c] = null;
        
        if (m.isCastling === 'kingside') {
            nextB[r][5] = nextB[r][7];
            nextB[r][7] = null;
        } else if (m.isCastling === 'queenside') {
            nextB[r][3] = nextB[r][0];
            nextB[r][0] = null;
        }
        
        return !isKingInCheck(piece.color, nextB);
    });
}

function getAllLegalMoves(color, b = board) {
    const all = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c] && b[r][c].color === color) {
                const moves = getLegalMoves(r, c, b);
                moves.forEach(m => all.push({ from: { r, c }, to: m }));
            }
        }
    }
    return all;
}

// =========================================================
// 2. 2-PLAYER BOARD RENDERING & INTERACTION
// =========================================================

function draw2PlayerBoard() {
    const boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    
    const isFlipped = (playerSide === 'black' && gameMode === 'ai') || isManualFlipped;
    const kingInCheckPos = isKingInCheck(turn, board) ? findKing(turn, board) : null;
    const legalMovesForSelected = selectedSquare ? getLegalMoves(selectedSquare.r, selectedSquare.c) : [];
    
    for (let rIdx = 0; rIdx < 8; rIdx++) {
        for (let cIdx = 0; cIdx < 8; cIdx++) {
            const r = isFlipped ? 7 - rIdx : rIdx;
            const c = isFlipped ? 7 - cIdx : cIdx;
            
            const sq = document.createElement('div');
            const isLight = (r + c) % 2 === 0;
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            sq.dataset.r = r;
            sq.dataset.c = c;
            
            if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                sq.classList.add('selected');
            }
            if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
                sq.classList.add('last-move');
            }
            if (kingInCheckPos && kingInCheckPos.r === r && kingInCheckPos.c === c) {
                sq.classList.add('check-danger');
            }
            if (activeHint && activeHint.r === r && activeHint.c === c) {
                sq.classList.add('hint-square');
            }
            
            // Coordinates on board edge
            if (royalSettings.coords) {
                if (cIdx === 0) {
                    const rankLbl = document.createElement('span');
                    rankLbl.className = 'sq-coord sq-coord-rank';
                    rankLbl.textContent = 8 - r;
                    sq.appendChild(rankLbl);
                }
                if (rIdx === 7) {
                    const fileLbl = document.createElement('span');
                    fileLbl.className = 'sq-coord sq-coord-file';
                    fileLbl.textContent = String.fromCharCode(97 + c);
                    sq.appendChild(fileLbl);
                }
            }
            
            const destMove = legalMovesForSelected.find(m => m.r === r && m.c === c);
            if (destMove) {
                if (board[r][c]) {
                    const ring = document.createElement('div');
                    ring.className = 'capture-ring';
                    sq.appendChild(ring);
                } else {
                    const dot = document.createElement('div');
                    dot.className = 'move-dest-dot';
                    sq.appendChild(dot);
                }
            }
            
            const piece = board[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = 'piece-svg animate-land';
                pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pEl);
            }
            
            sq.addEventListener('click', () => handle2PlayerSquareClick(r, c));
            boardEl.appendChild(sq);
        }
    }
    
    updateEvalBar();
}

function drawBoardSnapshot(snapBoard, snapLastMove, snapTurn) {
    const boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    
    const isFlipped = (playerSide === 'black' && gameMode === 'ai') || isManualFlipped;
    const kingInCheckPos = isKingInCheck(snapTurn, snapBoard) ? findKing(snapTurn, snapBoard) : null;
    
    for (let rIdx = 0; rIdx < 8; rIdx++) {
        for (let cIdx = 0; cIdx < 8; cIdx++) {
            const r = isFlipped ? 7 - rIdx : rIdx;
            const c = isFlipped ? 7 - cIdx : cIdx;
            
            const sq = document.createElement('div');
            const isLight = (r + c) % 2 === 0;
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            
            if (snapLastMove && ((snapLastMove.from.r === r && snapLastMove.from.c === c) || (snapLastMove.to.r === r && snapLastMove.to.c === c))) {
                sq.classList.add('last-move');
            }
            if (kingInCheckPos && kingInCheckPos.r === r && kingInCheckPos.c === c) {
                sq.classList.add('check-danger');
            }
            
            if (royalSettings.coords) {
                if (cIdx === 0) {
                    const rankLbl = document.createElement('span');
                    rankLbl.className = 'sq-coord sq-coord-rank';
                    rankLbl.textContent = 8 - r;
                    sq.appendChild(rankLbl);
                }
                if (rIdx === 7) {
                    const fileLbl = document.createElement('span');
                    fileLbl.className = 'sq-coord sq-coord-file';
                    fileLbl.textContent = String.fromCharCode(97 + c);
                    sq.appendChild(fileLbl);
                }
            }
            
            const piece = snapBoard[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = 'piece-svg';
                pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pEl);
            }
            
            sq.addEventListener('click', () => {
                showToast('Reviewing move history. Tap "Return to Live" to play ⚡');
            });
            boardEl.appendChild(sq);
        }
    }
}

function handle2PlayerSquareClick(r, c) {
    if (isGameOver || isGamePaused) return;
    if (gameMode === 'ai' && turn === botSide) return;
    
    const clickedPiece = board[r][c];
    
    if (selectedSquare) {
        if (selectedSquare.r === r && selectedSquare.c === c) {
            selectedSquare = null;
            draw2PlayerBoard();
            return;
        }
        
        const legals = getLegalMoves(selectedSquare.r, selectedSquare.c);
        const chosen = legals.find(m => m.r === r && m.c === c);
        
        if (chosen) {
            const movingPiece = board[selectedSquare.r][selectedSquare.c];
            const isPawnPromotion = movingPiece.type === 'p' && (r === 0 || r === 7);
            
            if (isPawnPromotion) {
                pendingPromotion = { from: selectedSquare, to: chosen };
                showPromotionModal(movingPiece.color);
                return;
            }
            
            execute2PlayerMove(selectedSquare, chosen);
            selectedSquare = null;
            return;
        }
        
        if (clickedPiece && clickedPiece.color === turn) {
            selectedSquare = { r, c };
            draw2PlayerBoard();
            return;
        }
        
        selectedSquare = null;
        draw2PlayerBoard();
    } else {
        if (clickedPiece && clickedPiece.color === turn) {
            selectedSquare = { r, c };
            draw2PlayerBoard();
        }
    }
}

function execute2PlayerMove(from, to, promoPiece = null) {
    const movingPiece = board[from.r][from.c];
    if (!movingPiece) return;
    
    const capturedPiece = board[to.r][to.c];
    
    history.push({
        board: cloneBoard(board),
        turn,
        lastMove,
        captured: { white: [...captured.white], black: [...captured.black] },
        clockTimes: { ...clockTimes }
    });
    
    // Sparkle FX on landing square
    const sqEl = document.querySelector(`.square[data-r="${to.r}"][data-c="${to.c}"]`);
    if (sqEl && fx2p) {
        const rect = sqEl.getBoundingClientRect();
        const canvasRect = fx2p.canvas.getBoundingClientRect();
        const px = rect.left - canvasRect.left + rect.width / 2;
        const py = rect.top - canvasRect.top + rect.height / 2;
        if (capturedPiece) {
            fx2p.shockwave(px, py, '#ef4444');
        } else {
            fx2p.spark(px, py, 14, '#ffd700');
        }
    }
    
    if (capturedPiece) {
        captured[movingPiece.color].push(capturedPiece);
        audio.capture();
        triggerHaptic('capture');
    } else {
        audio.move();
        triggerHaptic('move');
    }
    
    // Handle Castling Rook move
    if (to.isCastling === 'kingside') {
        board[from.r][5] = { ...board[from.r][7], hasMoved: true };
        board[from.r][7] = null;
    } else if (to.isCastling === 'queenside') {
        board[from.r][3] = { ...board[from.r][0], hasMoved: true };
        board[from.r][0] = null;
    }
    
    const finalPiece = promoPiece ? { type: promoPiece, color: movingPiece.color, hasMoved: true } : { ...movingPiece, hasMoved: true };
    board[to.r][to.c] = finalPiece;
    board[from.r][from.c] = null;
    
    lastMove = { from, to, piece: finalPiece };
    addMoveHistoryNotation(from, to, finalPiece, capturedPiece !== null);
    
    turn = turn === 'white' ? 'black' : 'white';
    updateHUD();
    draw2PlayerBoard();
    
    if (isKingInCheck(turn, board)) {
        audio.check();
        triggerHaptic('check');
    }
    
    const nextLegals = getAllLegalMoves(turn, board);
    if (nextLegals.length === 0) {
        isGameOver = true;
        stopClock();
        if (isKingInCheck(turn, board)) {
            const winner = turn === 'white' ? 'black' : 'white';
            const winnerName = playerNames[winner];
            
            // Defeat Lightning on King's square
            const kingSq = findKing(turn, board);
            triggerDefeatLightning2P(kingSq);
            
            setTimeout(() => {
                showGameOverModal(`Checkmate! ${winnerName} reigns victorious!`, winnerName);
            }, 650);
            
            if (winner === playerSide) {
                onMatchConcluded('win', playerNames[botSide || 'black'], history.length);
            } else {
                onMatchConcluded('loss', playerNames[botSide || 'black'], history.length);
            }
        } else {
            showGameOverModal('Stalemate! The royal duel ends in a draw.', 'Draw');
            onMatchConcluded('draw', playerNames[botSide || 'black'], history.length);
        }
        return;
    }
    
    if (gameMode === 'ai' && turn === botSide && !isGameOver) {
        aiMoveTimeout = setTimeout(make2PlayerAIMove, 450);
    }
}

function triggerDefeatLightning2P(kingSq) {
    if (!kingSq || !fx2p) return;
    const sqEl = document.querySelector(`.square[data-r="${kingSq.r}"][data-c="${kingSq.c}"]`);
    if (sqEl) {
        const rect = sqEl.getBoundingClientRect();
        const canvasRect = fx2p.canvas.getBoundingClientRect();
        const px = rect.left - canvasRect.left + rect.width / 2;
        const py = rect.top - canvasRect.top + rect.height / 2;
        fx2p.lightningDefeat(px, py, '#ef4444', '#ffd700');
        audio.strike();
    }
}

function make2PlayerAIMove() {
    if (isGameOver || isGamePaused || turn !== botSide) return;
    const allMoves = getAllLegalMoves(botSide, board);
    if (allMoves.length === 0) return;
    
    let chosenMove = null;
    
    if (difficulty === 1) {
        // Sparky (~600 Elo): Random with occasional capture
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (difficulty === 2) {
        // CyberKnight (~1200 Elo): Prefer captures, checks, and center control
        const captureMoves = allMoves.filter(m => board[m.to.r][m.to.c] !== null);
        chosenMove = captureMoves.length > 0 ? captureMoves[Math.floor(Math.random() * captureMoves.length)] : allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (difficulty === 3) {
        // VoltQueen (~1700 Elo): Material evaluation with center weighting
        let bestVal = -999999;
        const vals = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        
        allMoves.forEach(m => {
            const nextB = cloneBoard(board);
            const target = nextB[m.to.r][m.to.c];
            nextB[m.to.r][m.to.c] = nextB[m.from.r][m.from.c];
            nextB[m.from.r][m.from.c] = null;
            
            let moveScore = target ? vals[target.type] : 0;
            if (isKingInCheck(playerSide, nextB)) moveScore += 50;
            if (m.to.r >= 3 && m.to.r <= 4 && m.to.c >= 3 && m.to.c <= 4) moveScore += 15;
            
            if (moveScore > bestVal) {
                bestVal = moveScore;
                chosenMove = m;
            }
        });
        if (!chosenMove) chosenMove = allMoves[0];
    } else {
        // ElectroKing (~2200 Elo): Deep tactical calculation with king safety
        let bestVal = -999999;
        const vals = { p: 100, n: 330, b: 340, r: 520, q: 950, k: 20000 };
        
        allMoves.forEach(m => {
            const nextB = cloneBoard(board);
            const target = nextB[m.to.r][m.to.c];
            nextB[m.to.r][m.to.c] = nextB[m.from.r][m.from.c];
            nextB[m.from.r][m.from.c] = null;
            
            let moveScore = target ? vals[target.type] : 0;
            if (isKingInCheck(playerSide, nextB)) moveScore += 80;
            if (m.to.r >= 3 && m.to.r <= 4 && m.to.c >= 3 && m.to.c <= 4) moveScore += 25;
            // Penalize leaving pieces under immediate attack
            if (isSquareAttacked(m.to.r, m.to.c, playerSide, nextB)) {
                moveScore -= (vals[nextB[m.to.r][m.to.c].type] * 0.8);
            }
            
            if (moveScore > bestVal) {
                bestVal = moveScore;
                chosenMove = m;
            }
        });
        if (!chosenMove) chosenMove = allMoves[0];
    }
    
    execute2PlayerMove(chosenMove.from, chosenMove.to);
}

function addMoveHistoryNotation(from, to, piece, isCapture) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pLetter = piece.type === 'p' ? '' : piece.type.toUpperCase();
    const dest = `${files[to.c]}${ranks[to.r]}`;
    const notation = isCapture ? (pLetter ? `${pLetter}x${dest}` : `${files[from.c]}x${dest}`) : `${pLetter}${dest}`;
    
    moveHistoryNotation.push(notation);
    renderMoveHistoryChips();
}

function renderMoveHistoryChips() {
    const container = document.getElementById('history-chips');
    if (!container) return;
    
    if (moveHistoryNotation.length === 0) {
        container.innerHTML = '<span class="history-empty-placeholder">Royal duel ready to commence...</span>';
        return;
    }
    
    container.innerHTML = '';
    moveHistoryNotation.forEach((not, idx) => {
        const chip = document.createElement('span');
        const isCurrentActive = replayIndex === idx || (replayIndex === -1 && idx === moveHistoryNotation.length - 1);
        chip.className = `history-chip ${isCurrentActive ? 'active' : ''}`;
        const num = Math.ceil((idx + 1) / 2);
        chip.textContent = idx % 2 === 0 ? `${num}. ${not}` : not;
        chip.title = `Review move ${num}`;
        chip.addEventListener('click', () => showReplayMove(idx));
        container.appendChild(chip);
    });
    
    if (replayIndex === -1) {
        container.scrollLeft = container.scrollWidth;
    }
}

function showReplayMove(index) {
    if (history.length === 0) return;
    if (index < 0) index = 0;
    if (index >= history.length) {
        returnToLiveGame();
        return;
    }
    replayIndex = index;
    const snap = history[index];
    
    drawBoardSnapshot(snap.board, snap.lastMove, snap.turn);
    renderMoveHistoryChips();
    
    const banner = document.getElementById('replay-notice-banner');
    const label = document.getElementById('replay-move-label');
    if (banner) banner.classList.remove('hidden');
    if (label) {
        const num = Math.ceil((index + 1) / 2);
        label.textContent = `${num}${index % 2 === 0 ? ' (White)' : ' (Black)'}`;
    }
    triggerHaptic('move');
}

function returnToLiveGame() {
    replayIndex = -1;
    const banner = document.getElementById('replay-notice-banner');
    if (banner) banner.classList.add('hidden');
    renderMoveHistoryChips();
    draw2PlayerBoard();
    triggerHaptic('move');
}

function updateEvalBar() {
    const fill = document.getElementById('eval-bar-fill');
    const badge = document.getElementById('eval-bar-score');
    if (!fill) return;
    const vals = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 };
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) {
                score += (p.color === 'white' ? 1 : -1) * vals[p.type];
            }
        }
    }
    const percent = Math.min(95, Math.max(5, 50 + score * 4));
    fill.style.height = `${percent}%`;
    if (badge) badge.textContent = `${score > 0 ? '+' : ''}${score.toFixed(1)}`;
}

function updateHUD() {
    const turnMsg = document.getElementById('turn-message');
    const turnDot = document.getElementById('turn-dot');
    if (turnMsg) turnMsg.textContent = `${turn === 'white' ? 'White' : 'Black'}'s Turn`;
    if (turnDot) {
        turnDot.style.backgroundColor = turn === 'white' ? 'var(--primary)' : 'var(--accent)';
    }
    
    // Sort captured pieces by value descending (Q -> R -> B -> N -> P)
    const sortPieces = (a, b) => (PIECE_VALUES[b.type] || 0) - (PIECE_VALUES[a.type] || 0);
    const whiteCapturedSorted = [...captured.white].sort(sortPieces);
    const blackCapturedSorted = [...captured.black].sort(sortPieces);
    
    const capWhite = document.getElementById('captured-by-white');
    const capBlack = document.getElementById('captured-by-black');
    if (capWhite) {
        capWhite.innerHTML = whiteCapturedSorted.map(p => `<div class="captured-piece-mini">${getPieceSvg('black', p.type)}</div>`).join('');
    }
    if (capBlack) {
        capBlack.innerHTML = blackCapturedSorted.map(p => `<div class="captured-piece-mini">${getPieceSvg('white', p.type)}</div>`).join('');
    }
    
    // Material advantage calculation
    const whiteScore = captured.white.reduce((acc, p) => acc + (PIECE_VALUES[p.type] || 0), 0);
    const blackScore = captured.black.reduce((acc, p) => acc + (PIECE_VALUES[p.type] || 0), 0);
    const diff = whiteScore - blackScore;
    
    const advWhite = document.getElementById('advantage-white');
    const advBlack = document.getElementById('advantage-black');
    if (advWhite && advBlack) {
        if (diff > 0) {
            advWhite.textContent = `+${diff}`;
            advWhite.classList.remove('hidden');
            advBlack.classList.add('hidden');
        } else if (diff < 0) {
            advBlack.textContent = `+${Math.abs(diff)}`;
            advBlack.classList.remove('hidden');
            advWhite.classList.add('hidden');
        } else {
            advWhite.classList.add('hidden');
            advBlack.classList.add('hidden');
        }
    }
    
    const clkW = document.getElementById('clock-white');
    const clkB = document.getElementById('clock-black');
    if (clkW) clkW.classList.toggle('active', turn === 'white' && matchClockLimit > 0);
    if (clkB) clkB.classList.toggle('active', turn === 'black' && matchClockLimit > 0);
}

// =========================================================
// 3. CLOCK TIMERS WITH STRICT BACKGROUND PAUSE (NO TIME LOSS)
// =========================================================

function startClock() {
    stopClock();
    if (matchClockLimit <= 0) {
        const tw = document.getElementById('time-white');
        const tb = document.getElementById('time-black');
        if (tw) tw.textContent = '∞';
        if (tb) tb.textContent = '∞';
        return;
    }
    
    clockTimes = { white: matchClockLimit, black: matchClockLimit };
    updateClockDisplay();
    
    resumeClockTicker();
}

function resumeClockTicker() {
    stopClock();
    if (matchClockLimit <= 0 || isGameOver || isGamePaused) return;
    
    clockInterval = setInterval(() => {
        if (isGameOver || isGamePaused) return;
        clockTimes[turn]--;
        updateClockDisplay();
        
        if (clockTimes[turn] <= 0) {
            stopClock();
            isGameOver = true;
            const winner = turn === 'white' ? 'black' : 'white';
            const winnerName = playerNames[winner];
            showGameOverModal(`Time expired! ${winnerName} wins on time!`, winnerName);
            audio.defeat();
        }
    }, 1000);
}

function stopClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = null;
}

function updateClockDisplay() {
    if (matchClockLimit <= 0) {
        const tw = document.getElementById('time-white');
        const tb = document.getElementById('time-black');
        if (tw) tw.textContent = '∞';
        if (tb) tb.textContent = '∞';
        return;
    }
    
    const format = t => {
        const m = Math.floor(Math.max(0, t) / 60);
        const s = Math.max(0, t) % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const tw = document.getElementById('time-white');
    const tb = document.getElementById('time-black');
    if (tw) tw.textContent = format(clockTimes.white);
    if (tb) tb.textContent = format(clockTimes.black);
}

// Pause and Resume APIs for Android lifecycle and UI
function pauseGame() {
    isGamePaused = true;
    stopClock();
    if (aiMoveTimeout) {
        clearTimeout(aiMoveTimeout);
        aiMoveTimeout = null;
    }
    const banner = document.getElementById('turn-message');
    if (banner && isMatchActive && (currentTab === 'arena' || currentTab === 'battle')) {
        banner.textContent = 'Match Paused ⏸️';
    }
}

function resumeGame() {
    isGamePaused = false;
    updateHUD();
    if (matchClockLimit > 0 && isMatchActive && !isGameOver) {
        resumeClockTicker();
    }
    if (gameMode === 'ai' && turn === botSide && isMatchActive && !isGameOver) {
        aiMoveTimeout = setTimeout(make2PlayerAIMove, 400);
    }
}

function handleAndroidBack() {
    // If an overlay modal is active, close it
    const openModal = document.querySelector('.modal-overlay:not(.hidden)');
    if (openModal) {
        openModal.classList.add('hidden');
        if (openModal.id === 'pause-modal') resumeGame();
        return true;
    }
    
    // If in active Arena match, show Pause Modal
    if (currentTab === 'arena' && isMatchActive && !isGameOver) {
        pauseGame();
        const pModal = document.getElementById('pause-modal');
        if (pModal) pModal.classList.remove('hidden');
        return true;
    }
    
    // If on Tactics or Profile, return to Home
    if (currentTab !== 'home') {
        switchTab('home');
        return true;
    }
    
    return false; // Let Android show exit confirmation
}
window.handleAndroidBack = handleAndroidBack;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;

// Background tab / screen visibility handler
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGame();
    }
});

// Promotion Dialog
function showPromotionModal(color) {
    const modal = document.getElementById('promotion-modal');
    const container = document.getElementById('promo-options');
    if (!modal || !container) return;
    container.innerHTML = '';
    
    const pieces = ['q', 'r', 'b', 'n'];
    pieces.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'promo-btn';
        btn.innerHTML = getPieceSvg(color, type);
        btn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (pendingPromotion) {
                execute2PlayerMove(pendingPromotion.from, pendingPromotion.to, type);
                pendingPromotion = null;
            }
        });
        container.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

function showGameOverModal(msg, victor = 'Player') {
    const modal = document.getElementById('gameover-modal');
    const msgEl = document.getElementById('gameover-msg');
    const scoreEl = document.getElementById('gameover-score');
    if (!modal || !msgEl) return;
    msgEl.textContent = msg;
    if (scoreEl) scoreEl.textContent = victor;
    modal.classList.remove('hidden');
}

// =========================================================
// 4. 5 DAILY CASTLE PUZZLES ENGINE (1 ATTEMPT PER DAY)
// =========================================================

const PUZZLES = [
    {
        id: 0,
        title: "Daily Puzzle #1: Back-Rank Mate",
        turn: "⚪ White to move & deliver Back-Rank Checkmate",
        setup: () => {
            const b = Array(8).fill(null).map(() => Array(8).fill(null));
            b[0][6] = { type: 'k', color: 'black' };
            b[1][5] = { type: 'p', color: 'black' };
            b[1][6] = { type: 'p', color: 'black' };
            b[1][7] = { type: 'p', color: 'black' };
            b[7][0] = { type: 'r', color: 'white' };
            b[7][6] = { type: 'k', color: 'white' };
            return b;
        },
        solution: { from: { r: 7, c: 0 }, to: { r: 0, c: 0 } },
        hint: "Deliver Back-Rank checkmate along row 8 with your Rook!"
    },
    {
        id: 1,
        title: "Daily Puzzle #2: Scholar's Queen Mate",
        turn: "⚪ White Queen to move & deliver Checkmate",
        setup: () => {
            const b = Array(8).fill(null).map(() => Array(8).fill(null));
            b[0][4] = { type: 'k', color: 'black' };
            b[0][3] = { type: 'q', color: 'black' };
            b[0][2] = { type: 'b', color: 'black' };
            b[1][3] = { type: 'p', color: 'black' };
            b[1][4] = { type: 'p', color: 'black' };
            b[4][2] = { type: 'b', color: 'white' };
            b[5][5] = { type: 'q', color: 'white' };
            b[7][4] = { type: 'k', color: 'white' };
            return b;
        },
        solution: { from: { r: 5, c: 5 }, to: { r: 1, c: 5 } },
        hint: "Strike f7 with your Queen, backed by the Bishop on c4 for checkmate!"
    },
    {
        id: 2,
        title: "Daily Puzzle #3: Smothered Mate",
        turn: "⚪ White Knight to move & deliver Smothered Checkmate",
        setup: () => {
            const b = Array(8).fill(null).map(() => Array(8).fill(null));
            b[0][7] = { type: 'k', color: 'black' };
            b[0][6] = { type: 'r', color: 'black' };
            b[1][6] = { type: 'p', color: 'black' };
            b[1][7] = { type: 'p', color: 'black' };
            b[3][4] = { type: 'n', color: 'white' };
            b[7][6] = { type: 'k', color: 'white' };
            return b;
        },
        solution: { from: { r: 3, c: 4 }, to: { r: 1, c: 5 } },
        hint: "Jump your Knight to f7! The enemy King is trapped by its own pieces."
    },
    {
        id: 3,
        title: "Daily Puzzle #4: Anastasia's Mate",
        turn: "⚪ White Rook to move & deliver Checkmate on h-file",
        setup: () => {
            const b = Array(8).fill(null).map(() => Array(8).fill(null));
            b[1][7] = { type: 'k', color: 'black' };
            b[1][5] = { type: 'p', color: 'black' };
            b[1][6] = { type: 'p', color: 'black' };
            b[1][4] = { type: 'n', color: 'white' };
            b[3][0] = { type: 'r', color: 'white' };
            b[7][6] = { type: 'k', color: 'white' };
            return b;
        },
        solution: { from: { r: 3, c: 0 }, to: { r: 3, c: 7 } },
        hint: "Slide your Rook to h5! The Knight on e7 seals off g8 and g6."
    },
    {
        id: 4,
        title: "Daily Puzzle #5: Arabian Mate",
        turn: "⚪ White Rook to move & deliver Arabian Checkmate",
        setup: () => {
            const b = Array(8).fill(null).map(() => Array(8).fill(null));
            b[0][7] = { type: 'k', color: 'black' };
            b[2][5] = { type: 'n', color: 'white' };
            b[1][1] = { type: 'r', color: 'white' };
            b[7][6] = { type: 'k', color: 'white' };
            return b;
        },
        solution: { from: { r: 1, c: 1 }, to: { r: 1, c: 7 } },
        hint: "Move your Rook to h7! The Knight on f6 defends the Rook and covers g8."
    }
];

function getDailyPuzzleStorageKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `royal_daily_puzzles_${year}-${month}-${day}`;
}

function getCompletedPuzzlesToday() {
    try {
        const key = getDailyPuzzleStorageKey();
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function isPuzzleCompletedToday(idx) {
    const completed = getCompletedPuzzlesToday();
    return completed.includes(idx);
}

function markPuzzleCompletedToday(idx) {
    try {
        const key = getDailyPuzzleStorageKey();
        const completed = getCompletedPuzzlesToday();
        if (!completed.includes(idx)) {
            completed.push(idx);
            localStorage.setItem(key, JSON.stringify(completed));
            lordProfile.puzzles++;
            saveProfile();
            if (completed.length === PUZZLES.length) {
                updatePuzzleStreakOnCompletion();
            }
        }
    } catch (e) {}
}

function getTodayDateStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getYesterdayDateStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPuzzleStreakData() {
    try {
        const raw = localStorage.getItem('royal_puzzle_streak');
        return raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };
    } catch (e) {
        return { streak: 0, lastDate: '' };
    }
}

function updatePuzzleStreakOnCompletion() {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();
    let data = getPuzzleStreakData();
    
    if (data.lastDate === today) {
        return;
    }
    
    if (data.lastDate === yesterday) {
        data.streak = (data.streak || 0) + 1;
    } else {
        data.streak = 1;
    }
    data.lastDate = today;
    localStorage.setItem('royal_puzzle_streak', JSON.stringify(data));
    renderPuzzleStreak();
    checkAndUnlockAchievements();
}

function renderPuzzleStreak() {
    const streakCountEl = document.getElementById('puzzle-streak-count');
    const streakTierEl = document.getElementById('puzzle-streak-tier');
    const streakSubEl = document.getElementById('puzzle-streak-sub');
    if (!streakCountEl) return;
    
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();
    let data = getPuzzleStreakData();
    
    let currentStreak = data.streak || 0;
    if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterday) {
        currentStreak = 0;
    }
    
    streakCountEl.textContent = `${currentStreak} Day Streak`;
    
    let tier = '⚡ Sparky Tactician';
    if (currentStreak >= 14) tier = '🌌 Cyber Sovereign';
    else if (currentStreak >= 7) tier = '👑 Electro Master';
    else if (currentStreak >= 3) tier = '⚡ Volt Champion';
    
    if (streakTierEl) streakTierEl.textContent = tier;
    
    const completedList = getCompletedPuzzlesToday();
    if (streakSubEl) {
        if (completedList.length === PUZZLES.length) {
            streakSubEl.innerHTML = '🔥 All 5 daily puzzles cleared! Streak safely secured.';
        } else {
            const left = PUZZLES.length - completedList.length;
            streakSubEl.textContent = `Clear ${left} more puzzle${left > 1 ? 's' : ''} today to advance your streak!`;
        }
    }
}

function renderPuzzleProgressPills() {
    const container = document.getElementById('puzzle-progress-pills');
    if (!container) return;
    container.innerHTML = '';
    
    const completed = getCompletedPuzzlesToday();
    
    PUZZLES.forEach((pz, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'puzzle-pill';
        if (idx === currentPuzzleIdx) pill.classList.add('active');
        if (completed.includes(idx)) pill.classList.add('completed');
        
        pill.textContent = completed.includes(idx) ? '✓' : (idx + 1);
        pill.title = completed.includes(idx) ? `Daily Puzzle #${idx + 1} (Completed)` : `Daily Puzzle #${idx + 1}`;
        
        pill.addEventListener('click', () => {
            currentPuzzleIdx = idx;
            renderCurrentPuzzle();
        });
        
        container.appendChild(pill);
    });
}

function renderCurrentPuzzle() {
    const pz = PUZZLES[currentPuzzleIdx];
    if (!pz) return;
    
    renderPuzzleStreak();
    renderPuzzleProgressPills();
    
    const lvlTag = document.getElementById('puzzle-level-tag');
    const solvedBadge = document.getElementById('puzzle-solved-badge');
    const turnText = document.getElementById('puzzle-turn-text');
    const boardEl = document.getElementById('puzzle-board');
    const feedbackEl = document.getElementById('puzzle-feedback');
    if (!lvlTag || !turnText || !boardEl) return;
    
    const isCompleted = isPuzzleCompletedToday(currentPuzzleIdx);
    const completedList = getCompletedPuzzlesToday();
    
    lvlTag.textContent = pz.title;
    if (solvedBadge) solvedBadge.classList.toggle('hidden', !isCompleted);
    
    if (feedbackEl) {
        if (completedList.length === PUZZLES.length) {
            feedbackEl.innerHTML = '<span style="color:#22c55e;">🏆 All 5 Daily Puzzles Solved Today! Grandmaster tactics achieved.</span>';
        } else if (isCompleted) {
            feedbackEl.innerHTML = '<span style="color:#22c55e;">✅ Solved! You have completed this puzzle today.</span>';
        } else {
            feedbackEl.textContent = '';
        }
    }
    
    turnText.textContent = isCompleted ? 'Completed for today (Cannot repeat)' : pz.turn;
    boardEl.innerHTML = '';
    
    const pzBoard = pz.setup();
    if (isCompleted) {
        pzBoard[pz.solution.to.r][pz.solution.to.c] = pzBoard[pz.solution.from.r][pz.solution.from.c];
        pzBoard[pz.solution.from.r][pz.solution.from.c] = null;
    }
    
    let pzSelected = null;
    
    function drawPzBoard() {
        boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                sq.className = `square ${isLight ? 'light' : 'dark'}`;
                
                if (pzSelected && pzSelected.r === r && pzSelected.c === c) {
                    sq.classList.add('selected');
                }
                
                const piece = pzBoard[r][c];
                if (piece) {
                    const pEl = document.createElement('div');
                    pEl.className = 'piece-svg';
                    pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                    sq.appendChild(pEl);
                }
                
                sq.addEventListener('click', () => {
                    if (isCompleted) {
                        showToast('✅ Puzzle already completed today!', 'info');
                        return;
                    }
                    
                    if (pzSelected) {
                        if (pzSelected.r === r && pzSelected.c === c) {
                            pzSelected = null;
                            drawPzBoard();
                            return;
                        }
                        
                        if (piece && piece.color === 'white') {
                            pzSelected = { r, c };
                            drawPzBoard();
                            return;
                        }
                        
                        if (pzSelected.r === pz.solution.from.r && pzSelected.c === pz.solution.from.c &&
                            r === pz.solution.to.r && c === pz.solution.to.c) {
                            
                            pzBoard[r][c] = pzBoard[pzSelected.r][pzSelected.c];
                            pzBoard[pzSelected.r][pzSelected.c] = null;
                            pzSelected = null;
                            markPuzzleCompletedToday(currentPuzzleIdx);
                            audio.victory();
                            showToast(`🎉 Checkmate! Daily Puzzle #${currentPuzzleIdx + 1} Solved!`, 'success');
                            renderCurrentPuzzle();
                        } else {
                            showToast('❌ Incorrect move. Try again!', 'error');
                            audio.defeat();
                            pzSelected = null;
                            drawPzBoard();
                        }
                    } else if (piece && piece.color === 'white') {
                        pzSelected = { r, c };
                        drawPzBoard();
                    }
                });
                boardEl.appendChild(sq);
            }
        }
    }
    
    drawPzBoard();
}

// =========================================================
// 6. NAVIGATION & TAB SWITCHING
// =========================================================

function switchTab(tabId) {
    currentTab = tabId;
    
    document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    const targetScreen = document.getElementById(`screen-${tabId === 'battle' ? 'arena' : tabId}`);
    const targetNavBtn = document.getElementById(`nav-btn-${tabId}`);
    
    if (targetScreen) targetScreen.classList.add('active');
    if (targetNavBtn) targetNavBtn.classList.add('active');
    
    const headerSub = document.getElementById('header-mode-subtitle');
    const banner = document.getElementById('turn-message');
    const turnWidget = document.getElementById('turn-banner');
    const turnDot = document.getElementById('turn-dot');
    
    if (tabId === 'home') {
        if (headerSub) headerSub.textContent = 'Match Setup';
        if (turnWidget) turnWidget.style.display = 'none';
        pauseGame();
    } else if (tabId === 'arena' || tabId === 'battle') {
        if (turnWidget) turnWidget.style.display = 'flex';
        if (headerSub) headerSub.textContent = '2-Player Arena';
        draw2PlayerBoard();
        if (fx2p) fx2p.resize();
        if (isMatchActive && !isGameOver) {
            resumeGame();
        } else {
            updateHUD();
        }
    } else if (tabId === 'puzzles') {
        if (headerSub) headerSub.textContent = 'Daily Tactics & Puzzles';
        if (turnWidget) turnWidget.style.display = 'none';
        pauseGame();
        renderCurrentPuzzle();
    } else if (tabId === 'profile') {
        if (headerSub) headerSub.textContent = 'Player Profile & Stats';
        if (turnWidget) turnWidget.style.display = 'none';
        pauseGame();
        updateProfileUI();
    }
}


// =========================================================
// 7. EVENT LISTENERS & INITIALIZATION
// =========================================================

function syncSettingsCheckboxes() {
    ['modal-sound-toggle', 'pref-sound-toggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = royalSettings.sound;
    });
    ['modal-vibrate-toggle', 'pref-vibrate-toggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = royalSettings.vibration;
    });
    ['modal-coords-toggle', 'pref-coords-toggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = royalSettings.coords;
    });
    ['modal-eval-toggle', 'pref-eval-toggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = royalSettings.evalBar;
    });
    const evalWrapper = document.getElementById('eval-bar-wrapper');
    if (evalWrapper) evalWrapper.style.display = royalSettings.evalBar ? 'flex' : 'none';
    audio.enabled = royalSettings.sound;
}

function bindCheckbox(id, key, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
        royalSettings[key] = el.checked;
        localStorage.setItem(`royal_chess_${key}`, el.checked);
        syncSettingsCheckboxes();
        if (onChange) onChange();
        triggerHaptic('move');
    });
}

function setupEventListeners() {
    // Bottom Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
    
    // HOME SCREEN CONTROLS
        
    // 2P Play Mode: vs AI vs Pass & Play
    const modeAiBtn = document.getElementById('home-2p-mode-ai');
    const modeLocalBtn = document.getElementById('home-2p-mode-local');
    const pNameSec = document.getElementById('home-player-name-section');
    const localNamesSec = document.getElementById('home-local-names-section');
    const sideSec = document.getElementById('home-side-select-section');
    const diffSec = document.getElementById('home-ai-difficulty-section');
    
    if (modeAiBtn && modeLocalBtn) {
        modeAiBtn.addEventListener('click', () => {
            modeAiBtn.classList.add('active');
            modeLocalBtn.classList.remove('active');
            gameMode = 'ai';
            if (pNameSec) pNameSec.classList.remove('hidden');
            if (localNamesSec) localNamesSec.classList.add('hidden');
            if (sideSec) sideSec.classList.remove('hidden');
            if (diffSec) diffSec.classList.remove('hidden');
        });
        modeLocalBtn.addEventListener('click', () => {
            modeLocalBtn.classList.add('active');
            modeAiBtn.classList.remove('active');
            gameMode = 'local';
            if (pNameSec) pNameSec.classList.add('hidden');
            if (localNamesSec) localNamesSec.classList.remove('hidden');
            if (sideSec) sideSec.classList.add('hidden');
            if (diffSec) diffSec.classList.add('hidden');
        });
    }
    
    // Timer speed selection (Default: None = 0)
    document.querySelectorAll('#home-timer-group .clock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#home-timer-group .clock-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            matchClockLimit = parseInt(btn.dataset.time, 10) || 0;
        });
    });
    
    // Command Colors (White, Random, Black)
    const sideWhite = document.getElementById('home-side-white');
    const sideRand = document.getElementById('home-side-random');
    const sideBlack = document.getElementById('home-side-black');
    if (sideWhite && sideRand && sideBlack) {
        [sideWhite, sideRand, sideBlack].forEach(btn => {
            btn.addEventListener('click', () => {
                [sideWhite, sideRand, sideBlack].forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const s = btn.dataset.side;
                if (s === 'random') {
                    playerSide = Math.random() < 0.5 ? 'white' : 'black';
                } else {
                    playerSide = s;
                }
                botSide = playerSide === 'white' ? 'black' : 'white';
            });
        });
    }
    
    // Home Board Orientation / Flip Board Setting
    const flipNormalBtn = document.getElementById('home-flip-normal-btn');
    const flipFlippedBtn = document.getElementById('home-flip-flipped-btn');
    if (flipNormalBtn && flipFlippedBtn) {
        flipNormalBtn.addEventListener('click', () => {
            flipNormalBtn.classList.add('active');
            flipFlippedBtn.classList.remove('active');
            isManualFlipped = false;
        });
        flipFlippedBtn.addEventListener('click', () => {
            flipFlippedBtn.classList.add('active');
            flipNormalBtn.classList.remove('active');
            isManualFlipped = true;
        });
    }
    document.querySelectorAll('.bot-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.bot-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            difficulty = parseInt(card.dataset.diff, 10) || 2;
        });
    });
    
        
    // COMMENCE BATTLE ⚔️ (HOME START BUTTON)
    const homeStartBtn = document.getElementById('home-start-btn');
    if (homeStartBtn) {
        homeStartBtn.addEventListener('click', () => {
            // Save player name
            const nameInput = document.getElementById('home-player-name');
            const customName = nameInput?.value?.trim();
            if (customName) {
                lordProfile.name = customName;
                saveProfile();
            }
            
            // Switch to Arena tab and start match
            switchTab('arena');
            startNew2PlayerGame();
        });
    }
    
    // In-game Action Buttons
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (history.length === 0 || isGameOver || isGamePaused) return;
            if (replayIndex !== -1) returnToLiveGame();
            
            if (aiMoveTimeout) {
                clearTimeout(aiMoveTimeout);
                aiMoveTimeout = null;
            }
            
            // In vs AI mode: if it's player's turn, undo both AI and player moves
            if (gameMode === 'ai' && history.length >= 2 && turn === playerSide) {
                history.pop();
                if (moveHistoryNotation.length > 0) moveHistoryNotation.pop();
                const prev = history.pop();
                board = prev.board;
                turn = prev.turn;
                lastMove = prev.lastMove;
                captured = prev.captured;
                clockTimes = prev.clockTimes;
                if (moveHistoryNotation.length > 0) moveHistoryNotation.pop();
            } else {
                const prev = history.pop();
                board = prev.board;
                turn = prev.turn;
                lastMove = prev.lastMove;
                captured = prev.captured;
                clockTimes = prev.clockTimes;
                if (moveHistoryNotation.length > 0) moveHistoryNotation.pop();
            }
            
            renderMoveHistoryChips();
            updateHUD();
            updateClockDisplay();
            draw2PlayerBoard();
            audio.move();
            triggerHaptic('move');
            showToast('Move Undone ↩️');
        });
    }
    
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.addEventListener('click', () => {
            if (isGameOver || isGamePaused) return;
            const legals = getAllLegalMoves(turn, board);
            if (legals.length > 0) {
                const m = legals[Math.floor(Math.random() * legals.length)];
                activeHint = m.from;
                draw2PlayerBoard();
                audio.powerup();
                triggerHaptic('move');
                showToast('💡 Hint: Consider moving the highlighted piece!');
                setTimeout(() => {
                    activeHint = null;
                    draw2PlayerBoard();
                }, 3000);
            }
        });
    }
    
    // Draw Offers
    const drawBtn = document.getElementById('draw-btn');
    const drawModal = document.getElementById('draw-modal');
    const drawConfirmBtn = document.getElementById('draw-confirm-btn');
    const drawCancelBtn = document.getElementById('draw-cancel-btn');
    const drawRespondModal = document.getElementById('draw-respond-modal');
    const drawAcceptBtn = document.getElementById('draw-accept-btn');
    const drawDeclineBtn = document.getElementById('draw-decline-btn');
    
    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            if (isGameOver || isGamePaused) return;
            if (drawModal) drawModal.classList.remove('hidden');
        });
    }
    if (drawCancelBtn) {
        drawCancelBtn.addEventListener('click', () => {
            if (drawModal) drawModal.classList.add('hidden');
        });
    }
    if (drawConfirmBtn) {
        drawConfirmBtn.addEventListener('click', () => {
            if (drawModal) drawModal.classList.add('hidden');
            if (isGameOver || isGamePaused) return;
            
            if (gameMode === 'ai') {
                const vals = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 };
                let score = 0;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const p = board[r][c];
                        if (p) score += (p.color === botSide ? 1 : -1) * vals[p.type];
                    }
                }
                const bot = BOT_PERSONALITIES[difficulty] || BOT_PERSONALITIES[2];
                if (score <= 0.8) {
                    isGameOver = true;
                    stopClock();
                    showGameOverModal(`Peace Treaty Signed! ${bot.name} accepted your Royal Draw. 🤝`, 'Royal Draw');
                    audio.victory();
                    triggerHaptic('victory');
                    lordProfile.matches++;
                    saveProfile();
                } else {
                    showToast(`${bot.name} declined: "The kingdom shall be mine!" ⚔️`, 'error');
                    audio.defeat();
                    triggerHaptic('check');
                }
            } else {
                const nextPlayer = turn === 'white' ? playerNames.black : playerNames.white;
                const desc = document.getElementById('draw-respond-desc');
                if (desc) desc.textContent = `${playerNames[turn]} has offered a draw. Does ${nextPlayer} accept?`;
                if (drawRespondModal) drawRespondModal.classList.remove('hidden');
            }
        });
    }
    if (drawAcceptBtn) {
        drawAcceptBtn.addEventListener('click', () => {
            if (drawRespondModal) drawRespondModal.classList.add('hidden');
            isGameOver = true;
            stopClock();
            showGameOverModal('Peace Treaty Signed! Both players agreed to a Royal Draw. 🤝', 'Royal Draw');
            audio.victory();
            triggerHaptic('victory');
            lordProfile.matches++;
            saveProfile();
        });
    }
    if (drawDeclineBtn) {
        drawDeclineBtn.addEventListener('click', () => {
            if (drawRespondModal) drawRespondModal.classList.add('hidden');
            showToast('Draw offer declined! The battle rages on ⚔️');
        });
    }
    
    // Resignation
    const resignBtn = document.getElementById('resign-btn');
    const resignModal = document.getElementById('resign-modal');
    const resignConfirmBtn = document.getElementById('resign-confirm-btn');
    const resignCancelBtn = document.getElementById('resign-cancel-btn');
    
    if (resignBtn) {
        resignBtn.addEventListener('click', () => {
            if (isGameOver || isGamePaused) return;
            const sub = document.getElementById('resign-modal-sub');
            if (sub) {
                const oppName = turn === 'white' ? playerNames.black : playerNames.white;
                sub.textContent = `Are you sure you wish to resign? Victory will be conceded to ${oppName}.`;
            }
            if (resignModal) resignModal.classList.remove('hidden');
        });
    }
    if (resignCancelBtn) {
        resignCancelBtn.addEventListener('click', () => {
            if (resignModal) resignModal.classList.add('hidden');
        });
    }
    if (resignConfirmBtn) {
        resignConfirmBtn.addEventListener('click', () => {
            if (resignModal) resignModal.classList.add('hidden');
            if (isGameOver || isGamePaused) return;
            isGameOver = true;
            stopClock();
            const winnerColor = turn === 'white' ? 'black' : 'white';
            const winnerName = playerNames[winnerColor];
            showGameOverModal(`${playerNames[turn]} resigned! ${winnerName} claims victory!`, winnerName);
            if (winnerColor === playerSide) {
                onMatchConcluded('win', playerNames[turn === 'white' ? 'black' : 'white'], history.length);
            } else {
                onMatchConcluded('loss', playerNames[turn === 'white' ? 'black' : 'white'], history.length);
            }
        });
    }
    
    // Match Options & Theme Modal
    const matchOptionsBtn = document.getElementById('match-options-btn');
    const matchOptionsModal = document.getElementById('match-options-modal');
    const matchOptionsCloseBtn = document.getElementById('match-options-close-btn');
    const matchOptionsDoneBtn = document.getElementById('match-options-done-btn');
    const flipBoardBtn = document.getElementById('flip-board-btn');
    
    if (matchOptionsBtn) {
        matchOptionsBtn.addEventListener('click', () => {
            syncSettingsCheckboxes();
            if (matchOptionsModal) matchOptionsModal.classList.remove('hidden');
        });
    }
    if (matchOptionsCloseBtn) matchOptionsCloseBtn.addEventListener('click', () => matchOptionsModal.classList.add('hidden'));
    if (matchOptionsDoneBtn) matchOptionsDoneBtn.addEventListener('click', () => matchOptionsModal.classList.add('hidden'));
    if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', () => {
            isManualFlipped = !isManualFlipped;
            draw2PlayerBoard();
            showToast(isManualFlipped ? 'Board Flipped (Black View) 🔄' : 'Board Reset (White View) 🔄');
            triggerHaptic('move');
        });
    }
    
    // Android Home Screen Widget Customizer & Native Sync
    const widgetCard = document.getElementById('widget-preview-card');
    const widgetTitleText = document.getElementById('wp-title-text');
    const widgetSubText = document.getElementById('wp-sub-text');
    const widgetTitleInput = document.getElementById('widget-title-input');
    const widgetSubInput = document.getElementById('widget-sub-input');
    const widgetPresetChips = document.querySelectorAll('#widget-preset-chips .widget-preset-chip');
    const widgetStyleBtns = document.querySelectorAll('#widget-style-toggle-grid button');
    const widgetSaveBtn = document.getElementById('widget-save-btn');
    const wpPlayBtn = document.getElementById('wp-play-btn');
    const wpPuzzleBtn = document.getElementById('wp-puzzle-btn');

    // Load saved widget settings
    let savedWidgetTitle = localStorage.getItem('electro_widget_title') || 'ELECTRO KING ⚡';
    let savedWidgetSub = localStorage.getItem('electro_widget_subtitle') || '⚡ Ready to Battle';
    let savedWidgetStyle = localStorage.getItem('electro_widget_style') || 'cyber';

    if (widgetTitleInput) widgetTitleInput.value = savedWidgetTitle;
    if (widgetTitleText) widgetTitleText.textContent = savedWidgetTitle;
    if (widgetSubInput) widgetSubInput.value = savedWidgetSub;
    if (widgetSubText) widgetSubText.textContent = savedWidgetSub;
    if (widgetCard) widgetCard.className = `widget-preview-item style-${savedWidgetStyle}`;

    // Select active style button
    if (widgetStyleBtns.length > 0) {
        widgetStyleBtns.forEach(btn => {
            if (btn.dataset.wstyle === savedWidgetStyle) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    // Live Title Input
    if (widgetTitleInput) {
        widgetTitleInput.addEventListener('input', (e) => {
            const val = e.target.value.trim() || 'ELECTRO KING ⚡';
            if (widgetTitleText) widgetTitleText.textContent = val;
        });
    }

    // Live Subtitle Input
    if (widgetSubInput) {
        widgetSubInput.addEventListener('input', (e) => {
            const val = e.target.value.trim() || '⚡ Ready to Battle';
            if (widgetSubText) widgetSubText.textContent = val;
            if (widgetPresetChips.length > 0) {
                widgetPresetChips.forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.preset === e.target.value);
                });
            }
        });
    }

    // Preset Chips
    if (widgetPresetChips.length > 0) {
        widgetPresetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                widgetPresetChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const preset = chip.dataset.preset;
                if (widgetSubInput) widgetSubInput.value = preset;
                if (widgetSubText) widgetSubText.textContent = preset;
                triggerHaptic('move');
            });
        });
    }

    // Style Selector Buttons
    if (widgetStyleBtns.length > 0) {
        widgetStyleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                widgetStyleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                savedWidgetStyle = btn.dataset.wstyle || 'cyber';
                if (widgetCard) widgetCard.className = `widget-preview-item style-${savedWidgetStyle}`;
                triggerHaptic('move');
            });
        });
    }

    // Save and Apply to Android Widgets
    if (widgetSaveBtn) {
        widgetSaveBtn.addEventListener('click', () => {
            const title = (widgetTitleInput ? widgetTitleInput.value.trim() : '') || 'ELECTRO KING ⚡';
            const subtitle = (widgetSubInput ? widgetSubInput.value.trim() : '') || '⚡ Ready to Battle';
            const style = savedWidgetStyle || 'cyber';

            localStorage.setItem('electro_widget_title', title);
            localStorage.setItem('electro_widget_subtitle', subtitle);
            localStorage.setItem('electro_widget_style', style);

            if (window.AndroidBridge && typeof window.AndroidBridge.updateAndroidWidgets === 'function') {
                window.AndroidBridge.updateAndroidWidgets(title, subtitle, style);
            }
            showToast('⚡ Widget Settings Saved! Applied to Preview.', 'success');
            triggerHaptic('strike');
        });
    }

    // Interactive Preview Buttons
    if (wpPlayBtn) wpPlayBtn.addEventListener('click', () => switchTab('home'));
    if (wpPuzzleBtn) wpPuzzleBtn.addEventListener('click', () => switchTab('puzzles'));
    
    // Replay Stepper buttons
    const repStartBtn = document.getElementById('replay-start-btn');
    const repPrevBtn = document.getElementById('replay-prev-btn');
    const repNextBtn = document.getElementById('replay-next-btn');
    const repEndBtn = document.getElementById('replay-end-btn');
    const repReturnBtn = document.getElementById('replay-return-btn');
    
    if (repStartBtn) repStartBtn.addEventListener('click', () => showReplayMove(0));
    if (repPrevBtn) {
        repPrevBtn.addEventListener('click', () => {
            const cur = replayIndex === -1 ? history.length - 1 : replayIndex;
            showReplayMove(cur - 1);
        });
    }
    if (repNextBtn) {
        repNextBtn.addEventListener('click', () => {
            if (replayIndex === -1) return;
            if (replayIndex + 1 >= history.length) {
                returnToLiveGame();
            } else {
                showReplayMove(replayIndex + 1);
            }
        });
    }
    if (repEndBtn) repEndBtn.addEventListener('click', () => returnToLiveGame());
    if (repReturnBtn) repReturnBtn.addEventListener('click', () => returnToLiveGame());
    
    // Theme Card buttons (both on Home, Options Modal, and Profile)
    document.querySelectorAll('.theme-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.theme;
            applyTheme(t);
            showToast(`Theme: ${t.charAt(0).toUpperCase() + t.slice(1)} Applied 🎨`);
            triggerHaptic('move');
        });
    });
    
    // Settings Checkbox Sync
    bindCheckbox('modal-sound-toggle', 'sound', () => { audio.enabled = royalSettings.sound; });
    bindCheckbox('pref-sound-toggle', 'sound', () => { audio.enabled = royalSettings.sound; });
    bindCheckbox('modal-vibrate-toggle', 'vibration');
    bindCheckbox('pref-vibrate-toggle', 'vibration');
    bindCheckbox('modal-coords-toggle', 'coords', () => draw2PlayerBoard());
    bindCheckbox('pref-coords-toggle', 'coords', () => draw2PlayerBoard());
    bindCheckbox('modal-eval-toggle', 'evalBar', () => {
        const ew = document.getElementById('eval-bar-wrapper');
        if (ew) ew.style.display = royalSettings.evalBar ? 'flex' : 'none';
    });
    bindCheckbox('pref-eval-toggle', 'evalBar', () => {
        const ew = document.getElementById('eval-bar-wrapper');
        if (ew) ew.style.display = royalSettings.evalBar ? 'flex' : 'none';
    });
    
    // In-Game Menu Button -> PAUSE & RETURN TO HOME
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            pauseGame();
            const pModal = document.getElementById('pause-modal');
            if (pModal) pModal.classList.remove('hidden');
        });
    }
    
    // Pause Modal Buttons
    const pauseResumeBtn = document.getElementById('pause-resume-btn');
    const pauseHomeBtn = document.getElementById('pause-home-btn');
    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => {
            document.getElementById('pause-modal').classList.add('hidden');
            resumeGame();
        });
    }
    if (pauseHomeBtn) {
        pauseHomeBtn.addEventListener('click', () => {
            document.getElementById('pause-modal').classList.add('hidden');
            switchTab('home');
        });
    }
    
        
    // 5 Daily Puzzles Action Buttons
    const puzzlePrevBtn = document.getElementById('puzzle-prev-btn');
    const puzzleNextBtn = document.getElementById('puzzle-next-btn');
    const puzzleResetBtn = document.getElementById('puzzle-reset-btn');
    const puzzleHintBtn = document.getElementById('puzzle-hint-btn');
    
    if (puzzlePrevBtn) {
        puzzlePrevBtn.addEventListener('click', () => {
            currentPuzzleIdx = (currentPuzzleIdx + PUZZLES.length - 1) % PUZZLES.length;
            renderCurrentPuzzle();
        });
    }
    if (puzzleNextBtn) {
        puzzleNextBtn.addEventListener('click', () => {
            currentPuzzleIdx = (currentPuzzleIdx + 1) % PUZZLES.length;
            renderCurrentPuzzle();
        });
    }
    if (puzzleResetBtn) {
        puzzleResetBtn.addEventListener('click', () => {
            renderCurrentPuzzle();
        });
    }
    if (puzzleHintBtn) {
        puzzleHintBtn.addEventListener('click', () => {
            const pz = PUZZLES[currentPuzzleIdx];
            if (pz && pz.hint) {
                showToast(`💡 Hint: ${pz.hint}`, 'info');
                audio.powerup();
            }
        });
    }
    
    // Profile Edit
    const authBtn = document.getElementById('profile-auth-btn');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close-btn');
    const authSubmit = document.getElementById('auth-submit-btn');
    
    if (authBtn) authBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    if (authClose) authClose.addEventListener('click', () => authModal.classList.add('hidden'));
    if (authSubmit) {
        authSubmit.addEventListener('click', () => {
            const val = document.getElementById('auth-username-input').value.trim();
            if (val) {
                lordProfile.name = val;
                saveProfile();
                authModal.classList.add('hidden');
                showToast(`Name saved: ${val} 👑`, 'success');
            }
        });
    }

    // Profile Avatar Picker Modal
    const avatarPickerBtn = document.getElementById('avatar-picker-btn');
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const avatarCloseBtn = document.getElementById('avatar-close-btn');
    const avatarCancelBtn = document.getElementById('avatar-cancel-btn');
    const avatarSaveBtn = document.getElementById('avatar-save-btn');
    const modalUploadBtn = document.getElementById('modal-upload-btn');
    const modalDefaultAvatarBtn = document.getElementById('modal-default-avatar-btn');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const modalPreviewEmoji = document.getElementById('modal-preview-emoji');
    const modalPreviewImg = document.getElementById('modal-preview-img');
    const modalPreviewLbl = document.getElementById('modal-preview-lbl');
    const avatarEmojiBtns = document.querySelectorAll('.avatar-emoji-grid .avatar-emoji-btn');

    let tempSelectedEmoji = lordProfile.avatar || '👑';
    let tempSelectedImgUrl = lordProfile.avatarUrl || '';

    function updateModalAvatarPreview(emoji, imgUrl) {
        if (imgUrl) {
            if (modalPreviewImg) {
                modalPreviewImg.src = imgUrl;
                modalPreviewImg.classList.remove('hidden');
            }
            if (modalPreviewEmoji) modalPreviewEmoji.classList.add('hidden');
            if (modalPreviewLbl) modalPreviewLbl.textContent = 'Custom Photo Selected (Circular Crop)';
        } else {
            if (modalPreviewEmoji) {
                modalPreviewEmoji.textContent = emoji || '👑';
                modalPreviewEmoji.classList.remove('hidden');
            }
            if (modalPreviewImg) modalPreviewImg.classList.add('hidden');
            if (modalPreviewLbl) modalPreviewLbl.textContent = 'Royal Icon Selected';
        }
    }

    function openAvatarModal() {
        tempSelectedEmoji = lordProfile.avatar || '👑';
        tempSelectedImgUrl = lordProfile.avatarUrl || '';
        updateModalAvatarPreview(tempSelectedEmoji, tempSelectedImgUrl);

        avatarEmojiBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.emoji === tempSelectedEmoji && !tempSelectedImgUrl);
        });

        if (avatarModal) avatarModal.classList.remove('hidden');
        triggerHaptic('move');
    }

    if (avatarPickerBtn) avatarPickerBtn.addEventListener('click', openAvatarModal);
    if (editAvatarBtn) editAvatarBtn.addEventListener('click', openAvatarModal);

    if (avatarCloseBtn) {
        avatarCloseBtn.addEventListener('click', () => {
            if (avatarModal) avatarModal.classList.add('hidden');
        });
    }

    if (avatarCancelBtn) {
        avatarCancelBtn.addEventListener('click', () => {
            if (avatarModal) avatarModal.classList.add('hidden');
        });
    }

    if (modalDefaultAvatarBtn) {
        modalDefaultAvatarBtn.addEventListener('click', () => {
            tempSelectedEmoji = '👑';
            tempSelectedImgUrl = '';
            avatarEmojiBtns.forEach(b => b.classList.toggle('active', b.dataset.emoji === '👑'));
            updateModalAvatarPreview('👑', '');
            showToast('Default royal avatar selected 👑');
            triggerHaptic('move');
        });
    }

    avatarEmojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarEmojiBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tempSelectedEmoji = btn.dataset.emoji;
            tempSelectedImgUrl = '';
            updateModalAvatarPreview(tempSelectedEmoji, '');
            triggerHaptic('move');
        });
    });

    if (modalUploadBtn && avatarFileInput) {
        modalUploadBtn.addEventListener('click', () => {
            avatarFileInput.click();
        });
    }

    function processProfileImage(file) {
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
            showToast('⚠️ Please select a valid JPG, PNG, or WebP image.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('⚠️ Image too large! Please choose an image under 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => {
            showToast('⚠️ Error reading image file.', 'error');
        };
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => {
                showToast('⚠️ Invalid image file.', 'error');
            };
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 256;
                    canvas.height = 256;
                    const ctx = canvas.getContext('2d');
                    const minSide = Math.min(img.naturalWidth, img.naturalHeight);
                    const sx = (img.naturalWidth - minSide) / 2;
                    const sy = (img.naturalHeight - minSide) / 2;
                    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    
                    tempSelectedImgUrl = dataUrl;
                    avatarEmojiBtns.forEach(b => b.classList.remove('active'));
                    updateModalAvatarPreview(tempSelectedEmoji, tempSelectedImgUrl);
                    showToast('Photo loaded! Tap CONFIRM & SAVE to apply 📷', 'success');
                } catch (err) {
                    showToast('⚠️ Could not crop image.', 'error');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                processProfileImage(file);
            }
        });
    }

    if (avatarSaveBtn) {
        avatarSaveBtn.addEventListener('click', () => {
            lordProfile.avatar = tempSelectedEmoji;
            lordProfile.avatarUrl = tempSelectedImgUrl;

            localStorage.setItem('electro_profile_avatar', tempSelectedEmoji);
            localStorage.setItem('electro_profile_avatar_url', tempSelectedImgUrl);

            applyProfileAvatarUI();

            if (avatarModal) avatarModal.classList.add('hidden');
            showToast('Profile Picture Updated! 👑', 'success');
            triggerHaptic('strike');
        });
    }

    // Preferences & Reset Statistics Handlers
    const orientSelect = document.getElementById('pref-orientation-select');
    if (orientSelect) {
        orientSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            isManualFlipped = val === 'black';
            localStorage.setItem('electro_board_orientation', val);
            draw2PlayerBoard();
            showToast(isManualFlipped ? 'Board Flipped (Black View) 🔄' : 'Board Standard (White View) 🔄');
            triggerHaptic('move');
        });
    }

    const restoreDefaultsBtn = document.getElementById('pref-restore-defaults-btn');
    if (restoreDefaultsBtn) {
        restoreDefaultsBtn.addEventListener('click', () => {
            applyTheme('cyber');
            showToast('Default appearance restored: ⚡ Electro Theme', 'success');
            triggerHaptic('move');
        });
    }

    const resetStatsBtn = document.getElementById('pref-reset-stats-btn');
    const resetStatsModal = document.getElementById('reset-stats-modal');
    const resetConfirmBtn = document.getElementById('reset-stats-confirm-btn');
    const resetCancelBtn = document.getElementById('reset-stats-cancel-btn');

    if (resetStatsBtn && resetStatsModal) {
        resetStatsBtn.addEventListener('click', () => {
            resetStatsModal.classList.remove('hidden');
            triggerHaptic('move');
        });
    }
    if (resetCancelBtn && resetStatsModal) {
        resetCancelBtn.addEventListener('click', () => {
            resetStatsModal.classList.add('hidden');
        });
    }
    if (resetConfirmBtn && resetStatsModal) {
        resetConfirmBtn.addEventListener('click', () => {
            lordProfile.matches = 0;
            lordProfile.wins = 0;
            lordProfile.losses = 0;
            lordProfile.draws = 0;
            lordProfile.currentStreak = 0;
            lordProfile.bestStreak = 0;
            lordProfile.rating = 1200;
            
            lordProfile.botRecords = {
                1: { w: 0, l: 0, d: 0 },
                2: { w: 0, l: 0, d: 0 },
                3: { w: 0, l: 0, d: 0 },
                4: { w: 0, l: 0, d: 0 }
            };
            localStorage.removeItem('electro_game_history');
            saveProfile();
            resetStatsModal.classList.add('hidden');
            showToast('Career statistics reset successfully.', 'info');
            triggerHaptic('strike');
        });
    }
    
    const gameoverHomeBtn = document.getElementById('gameover-home-btn');
    const restartBtn = document.getElementById('gameover-restart-btn');
    if (gameoverHomeBtn) {
        gameoverHomeBtn.addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.add('hidden');
            switchTab('home');
        });
    }
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.add('hidden');
            startNew2PlayerGame();
        });
    }
}

function startNew2PlayerGame() {
    isGameOver = false;
    isGamePaused = false;
    isMatchActive = true;
    turn = 'white';
    selectedSquare = null;
    lastMove = null;
    history = [];
    captured = { white: [], black: [] };
    activeHint = null;
    moveHistoryNotation = [];
    if (aiMoveTimeout) {
        clearTimeout(aiMoveTimeout);
        aiMoveTimeout = null;
    }
    
    const bot = BOT_PERSONALITIES[difficulty] || BOT_PERSONALITIES[2];
    
    if (gameMode === 'local') {
        const p1Val = document.getElementById('home-p1-name')?.value.trim();
        const p2Val = document.getElementById('home-p2-name')?.value.trim();
        playerNames.white = p1Val || lordProfile.name || 'Player 1';
        playerNames.black = p2Val || 'Player 2';
        
        const oppAvatar = document.getElementById('top-player-avatar');
        const oppTag = document.getElementById('opponent-name-tag');
        const oppSub = document.getElementById('opponent-sub-tag');
        const myAvatar = document.getElementById('bottom-player-avatar');
        const myTag = document.getElementById('player-name-tag');
        const mySub = document.getElementById('player-sub-tag');
        
        if (oppAvatar) oppAvatar.textContent = '⚫';
        if (oppTag) oppTag.textContent = playerNames.black;
        if (oppSub) oppSub.textContent = 'Black Army';
        if (myAvatar) myAvatar.textContent = '⚪';
        if (myTag) myTag.textContent = playerNames.white;
        if (mySub) mySub.textContent = 'White Army';
    } else {
        const pName = lordProfile.name || 'Player';
        playerNames[playerSide] = pName;
        playerNames[botSide] = bot.name;
        
        const oppAvatar = document.getElementById('top-player-avatar');
        const oppTag = document.getElementById('opponent-name-tag');
        const oppSub = document.getElementById('opponent-sub-tag');
        const myAvatar = document.getElementById('bottom-player-avatar');
        const myTag = document.getElementById('player-name-tag');
        const mySub = document.getElementById('player-sub-tag');
        
        if (oppAvatar) oppAvatar.textContent = bot.icon;
        if (oppTag) oppTag.textContent = bot.name;
        if (oppSub) oppSub.textContent = `AI Bot • ${bot.rating}`;
        if (myAvatar) myAvatar.textContent = '👑';
        if (myTag) myTag.textContent = pName;
        if (mySub) mySub.textContent = 'Grandmaster';
    }
    
    replayIndex = -1;
    const repBanner = document.getElementById('replay-notice-banner');
    if (repBanner) repBanner.classList.add('hidden');
    renderMoveHistoryChips();
    
    init2PlayerBoard();
    updateHUD();
    draw2PlayerBoard();
    startClock();
    if (fx2p) fx2p.resize();
    triggerHaptic('move');
    
    if (gameMode === 'ai' && botSide === 'white') {
        aiMoveTimeout = setTimeout(make2PlayerAIMove, 500);
    }
}


const ROYAL_ACHIEVEMENTS = [
    {
        id: 'first_win',
        icon: '⚡',
        title: 'First Victory',
        desc: 'Claim your first Classic victory',
        check: (p) => (p.wins || 0) >= 1
    },
    {
        id: 'five_played',
        icon: '⚔️',
        title: 'Five Games Played',
        desc: 'Complete 5 recorded chess matches',
        check: (p) => (p.matches || 0) >= 5
    },
    {
        id: 'ten_wins',
        icon: '🏆',
        title: 'Ten Victories',
        desc: 'Achieve 10 total match victories',
        check: (p) => (p.wins || 0) >= 10
    },
    {
        id: 'winning_streak',
        icon: '🔥',
        title: 'Winning Streak',
        desc: 'Win 3 consecutive matches in a row',
        check: (p) => (p.bestStreak || 0) >= 3 || (p.currentStreak || 0) >= 3
    },
    {
        id: 'knight_slayer',
        icon: '🛡️',
        title: 'Knight Offline',
        desc: 'Defeat CyberKnight (~1200 Elo)',
        check: (p) => Boolean(p.botRecords && p.botRecords[2] && p.botRecords[2].w >= 1)
    },
    {
        id: 'king_subdued',
        icon: '🌌',
        title: 'Electro Overload',
        desc: 'Defeat ElectroKing (~2200 Elo)',
        check: (p) => Boolean(p.botRecords && p.botRecords[4] && p.botRecords[4].w >= 1)
    },
    {
        id: 'puzzle_master_3',
        icon: '👑',
        title: 'Tactics Maestro',
        desc: 'Solve 3 or more Daily Chess Tactics puzzles',
        check: (p) => (p.puzzles || 0) >= 3
    },
    {
        id: 'puzzle_master',
        icon: '🧩',
        title: 'Puzzle Solver',
        desc: 'Solve 5 Daily Chess Tactics puzzles',
        check: (p) => (p.puzzles || 0) >= 5
    }
];

function checkAndUnlockAchievements() {
    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    const countEl = document.getElementById('achievements-count');
    if (!grid) return;
    grid.innerHTML = '';
    
    let unlockedCount = 0;
    ROYAL_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = Boolean(ach.check(lordProfile));
        if (isUnlocked) unlockedCount++;
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="ach-card-top">
                <div class="ach-title-group">
                    <span class="ach-icon">${ach.icon}</span>
                    <span class="ach-title">${ach.title}</span>
                </div>
                <span class="ach-badge ${isUnlocked ? 'unlocked' : 'locked'}">${isUnlocked ? '⚡ Unlocked' : '🔒 Locked'}</span>
            </div>
            <span class="ach-desc">${ach.desc}</span>
        `;
        grid.appendChild(card);
    });

    if (countEl) countEl.textContent = `${unlockedCount} / ${ROYAL_ACHIEVEMENTS.length} Unlocked`;
}

function renderGameHistoryUI() {
    const listEl = document.getElementById('profile-history-list');
    if (!listEl) return;
    try {
        const games = JSON.parse(localStorage.getItem('electro_game_history') || '[]');
        if (games.length === 0) {
            listEl.innerHTML = `
                <div class="history-empty-state" id="history-empty-state">
                    <span>⚔️ No recorded games yet. Play a match to build your history!</span>
                </div>
            `;
            return;
        }
        listEl.innerHTML = '';
        games.slice(0, 10).forEach(g => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const badgeClass = g.result === 'Victory' ? 'win' : (g.result === 'Defeat' ? 'loss' : 'draw');
            item.innerHTML = `
                <div class="history-item-left">
                    <span class="history-item-title">${g.opponent}</span>
                    <span class="history-item-meta">${g.date} • ${g.mode} • ${g.moves} moves</span>
                </div>
                <span class="history-result-badge ${badgeClass}">${g.result}</span>
            `;
            listEl.appendChild(item);
        });
    } catch (e) {
        console.error('Error rendering history:', e);
    }
}

function applyProfileAvatarUI() {
    const profEmoji = document.getElementById('profile-avatar');
    const profImg = document.getElementById('profile-avatar-img');
    const myMatchAvatar = document.getElementById('bottom-player-avatar');

    if (lordProfile.avatarUrl) {
        if (profImg) {
            profImg.src = lordProfile.avatarUrl;
            profImg.classList.remove('hidden');
        }
        if (profEmoji) profEmoji.classList.add('hidden');
        if (myMatchAvatar) {
            myMatchAvatar.innerHTML = `<img src="${lordProfile.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        }
    } else {
        if (profImg) profImg.classList.add('hidden');
        if (profEmoji) {
            profEmoji.textContent = lordProfile.avatar || '👑';
            profEmoji.classList.remove('hidden');
        }
        if (myMatchAvatar) {
            myMatchAvatar.textContent = lordProfile.avatar || '👑';
        }
    }
}

function loadProfile() {
    const savedName = localStorage.getItem('royal_player_name') || localStorage.getItem('electro_player_name');
    if (savedName && savedName !== 'Lord Sovereign') {
        lordProfile.name = savedName;
    } else {
        lordProfile.name = 'Viaan';
    }
    
    lordProfile.avatar = localStorage.getItem('electro_profile_avatar') || '👑';
    lordProfile.avatarUrl = localStorage.getItem('electro_profile_avatar_url') || '';
    lordProfile.matches = parseInt(localStorage.getItem('electro_stat_matches') || '0', 10);
    lordProfile.wins = parseInt(localStorage.getItem('electro_stat_wins') || '0', 10);
    lordProfile.losses = parseInt(localStorage.getItem('electro_stat_losses') || '0', 10);
    lordProfile.draws = parseInt(localStorage.getItem('electro_stat_draws') || '0', 10);
    lordProfile.currentStreak = parseInt(localStorage.getItem('electro_stat_current_streak') || '0', 10);
    lordProfile.bestStreak = parseInt(localStorage.getItem('electro_stat_best_streak') || '0', 10);
    lordProfile.rating = parseInt(localStorage.getItem('electro_player_rating') || '1200', 10);
        lordProfile.puzzles = parseInt(localStorage.getItem('royal_puzzles_solved') || '0', 10);
    
    try {
        const savedRecs = localStorage.getItem('royal_bot_records');
        if (savedRecs) {
            lordProfile.botRecords = JSON.parse(savedRecs);
        }
    } catch (e) {}

    const orientSelect = document.getElementById('pref-orientation-select');
    if (orientSelect) {
        const savedOrient = localStorage.getItem('electro_board_orientation') || 'white';
        orientSelect.value = savedOrient;
        isManualFlipped = savedOrient === 'black';
    }
    
    const homeInput = document.getElementById('home-player-name');
            const authInput = document.getElementById('auth-username-input');
    
    if (homeInput) homeInput.value = lordProfile.name;
            if (authInput) authInput.value = lordProfile.name;
    
    updateProfileUI();
}

function saveProfile() {
    if (lordProfile.name) {
        localStorage.setItem('royal_player_name', lordProfile.name);
        localStorage.setItem('electro_player_name', lordProfile.name);
    }
    if (lordProfile.avatar) {
        localStorage.setItem('electro_profile_avatar', lordProfile.avatar);
    }
    if (lordProfile.avatarUrl !== undefined) {
        localStorage.setItem('electro_profile_avatar_url', lordProfile.avatarUrl);
    }
    localStorage.setItem('electro_stat_matches', String(lordProfile.matches || 0));
    localStorage.setItem('electro_stat_wins', String(lordProfile.wins || 0));
    localStorage.setItem('electro_stat_losses', String(lordProfile.losses || 0));
    localStorage.setItem('electro_stat_draws', String(lordProfile.draws || 0));
    localStorage.setItem('electro_stat_current_streak', String(lordProfile.currentStreak || 0));
    localStorage.setItem('electro_stat_best_streak', String(lordProfile.bestStreak || 0));
    localStorage.setItem('electro_player_rating', String(lordProfile.rating || 1200));
        
    if (lordProfile.botRecords) {
        localStorage.setItem('royal_bot_records', JSON.stringify(lordProfile.botRecords));
    }
    updateProfileUI();
}

function updateProfileUI() {
    applyProfileAvatarUI();
    const pName = document.getElementById('profile-name');
    const pRating = document.getElementById('player-rating-badge');
    const statMatches = document.getElementById('stat-matches');
    const statWins = document.getElementById('stat-wins');
    const statLosses = document.getElementById('stat-losses');
    const statDraws = document.getElementById('stat-draws');
    const statWinrate = document.getElementById('stat-winrate');
    const statCurrentStreak = document.getElementById('stat-current-streak');
    const statBestStreak = document.getElementById('stat-best-streak');
    const statPuzzles = document.getElementById('stat-puzzles');
    const botDefeatedCount = document.getElementById('bot-total-defeated');
    
    if (pName) pName.textContent = lordProfile.name;
    if (pRating) {
        const r = lordProfile.rating || 1200;
        pRating.textContent = `⚡ ${r} Elo • ${getRatingTitle(r)}`;
    }
    if (statMatches) statMatches.textContent = lordProfile.matches || 0;
    if (statWins) statWins.textContent = lordProfile.wins || 0;
    if (statLosses) statLosses.textContent = lordProfile.losses || 0;
    if (statDraws) statDraws.textContent = lordProfile.draws || 0;
    if (statWinrate) {
        const m = lordProfile.matches || 0;
        const w = lordProfile.wins || 0;
        statWinrate.textContent = m > 0 ? `${Math.round((w / m) * 100)}%` : '0%';
    }
    if (statCurrentStreak) statCurrentStreak.textContent = lordProfile.currentStreak || 0;
    if (statBestStreak) statBestStreak.textContent = lordProfile.bestStreak || 0;
    if (statPuzzles) statPuzzles.textContent = lordProfile.puzzles || 0;
    
    // Opponent Computer Records
    let totalBotsDefeated = 0;
    if (lordProfile.botRecords) {
        for (let d = 1; d <= 4; d++) {
            const el = document.getElementById(`rec-bot-${d}`);
            if (el && lordProfile.botRecords[d]) {
                const rec = lordProfile.botRecords[d];
                el.textContent = `${rec.w || 0}W - ${rec.l || 0}L - ${rec.d || 0}D`;
                if ((rec.w || 0) > 0) totalBotsDefeated++;
            }
        }
    }
    if (botDefeatedCount) botDefeatedCount.textContent = `${totalBotsDefeated} / 4 Defeated`;

    renderGameHistoryUI();
    renderAchievements();
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2400);
}

// =========================================================
// 8. BOOTSTRAPPING (STARTS CLEANLY ON HOME)
// =========================================================

window.addEventListener('DOMContentLoaded', () => {
    fx2p = new CastleFX('fx-canvas');
        
    applyTheme(royalSettings.theme);
    syncSettingsCheckboxes();
    loadProfile();
    setupEventListeners();
    init2PlayerBoard();
        
    // Sync widgets to native Android with official Electro King branding
    if (window.AndroidBridge && typeof window.AndroidBridge.updateAndroidWidgets === 'function') {
        const title = localStorage.getItem('electro_widget_title') || 'ELECTRO KING ⚡';
        const subtitle = localStorage.getItem('electro_widget_subtitle') || '⚡ Ready to Battle';
        const style = localStorage.getItem('electro_widget_style') || 'cyber';
        window.AndroidBridge.updateAndroidWidgets(title, subtitle, style);
    }
    
    // Open HOME SCREEN FIRST on launch!
    switchTab('home');
    console.log('Electro King initialized successfully on Home screen with theme ' + royalSettings.theme);
});
