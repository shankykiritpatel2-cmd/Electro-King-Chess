// =========================================================
// ELECTRO KING 👑 - CASTLE REALM EDITION
// Royal Medieval Chess & Four Kingdoms Engine
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

    spark(x, y, count = 18, color = '#ffd700') {
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

    shockwave(x, y, color = '#ef4444') {
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

    lightningDefeat(x, y, color = '#ffd700', secondary = '#38bdf8') {
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
let fx4p = null;

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
    let fill = '#fffdfa';
    let stroke = '#d4af37';
    
    if (color === 'white') {
        fill = '#fffdfa';
        stroke = '#d4af37';
    } else if (color === 'black') {
        fill = '#1a202c';
        stroke = '#b82e38';
    } else if (color === 'red') {
        fill = '#450a0a';
        stroke = '#ef4444';
    } else if (color === 'blue') {
        fill = '#082f49';
        stroke = '#38bdf8';
    } else if (color === 'gold') {
        fill = '#422006';
        stroke = '#facc15';
    } else if (color === 'green') {
        fill = '#052e16';
        stroke = '#22c55e';
    }
    
    const fn = PIECE_SVGS[type];
    return fn ? fn(fill, stroke) : '';
}

// --- GLOBAL STATE ---
let currentTab = 'home'; // App starts on HOME!
let arenaSubMode = '2p'; // '2p' or '4p'
let lordProfile = {
    name: localStorage.getItem('electro_player_name') || 'Player',
    avatar: '👑',
    avatarUrl: '',
    matches: 0,
    wins: 0,
    fourWins: 0,
    puzzles: 0,
    botRecords: {
        1: { w: 0, l: 0 },
        2: { w: 0, l: 0 },
        3: { w: 0, l: 0 },
        4: { w: 0, l: 0 }
    }
};

// --- ROYAL SETTINGS & HAPTIC ENGINE ---
const royalSettings = {
    theme: localStorage.getItem('royal_chess_theme') || 'castle',
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
    if (!['castle', 'wood', 'obsidian', 'cyber'].includes(themeName)) themeName = 'castle';
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
let playerNames = { white: lordProfile.name, black: 'Sir Galahad' };
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
    1: { name: 'Squire Leon', rating: '~600 Elo', icon: '🛡️' },
    2: { name: 'Sir Galahad', rating: '~1200 Elo', icon: '⚔️' },
    3: { name: 'Lady Morgana', rating: '~1700 Elo', icon: '🏰' },
    4: { name: 'King Arthur', rating: '~2200 Elo', icon: '👑' }
};

// 4-Player Realm State
const FOUR_KINGDOMS = ['red', 'blue', 'gold', 'green'];
const FOUR_KINGDOM_NAMES = {
    red: 'Red Lord',
    blue: 'Blue Baron',
    gold: 'Gold Emperor',
    green: 'Green Duke'
};
let fourBoard = [];
let fourTurn = 'red';
let fourSelected = null;
let fourLastMove = null;
let fourArmies = {
    red: { alive: true, count: 16 },
    blue: { alive: true, count: 16 },
    gold: { alive: true, count: 16 },
    green: { alive: true, count: 16 }
};
let fourMode = 'ai'; // 'ai', 'pass'
let isHumanDefeated4P = false;
let isFourMatchActive = false;
let fourEliminationOrder = [];

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
                lordProfile.wins++;
                if (gameMode === 'ai') {
                    if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0}, 2:{w:0,l:0}, 3:{w:0,l:0}, 4:{w:0,l:0} };
                    if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0 };
                    lordProfile.botRecords[difficulty].w++;
                }
                audio.victory();
                triggerHaptic('victory');
            } else {
                if (gameMode === 'ai') {
                    if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0}, 2:{w:0,l:0}, 3:{w:0,l:0}, 4:{w:0,l:0} };
                    if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0 };
                    lordProfile.botRecords[difficulty].l++;
                }
                audio.defeat();
                triggerHaptic('check');
            }
        } else {
            showGameOverModal('Stalemate! The royal duel ends in a draw.', 'Draw');
            triggerHaptic('move');
        }
        lordProfile.matches++;
        saveProfile();
        checkAndUnlockAchievements();
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
        // Squire Leon (~600 Elo): Random with occasional capture
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (difficulty === 2) {
        // Sir Galahad (~1200 Elo): Prefer captures, checks, and center control
        const captureMoves = allMoves.filter(m => board[m.to.r][m.to.c] !== null);
        chosenMove = captureMoves.length > 0 ? captureMoves[Math.floor(Math.random() * captureMoves.length)] : allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (difficulty === 3) {
        // Lady Morgana (~1700 Elo): Material evaluation with center weighting
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
        // King Arthur (~2200 Elo): Deep tactical calculation with king safety
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
    if (banner && isMatchActive) {
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
// 4. 14x14 FOUR KINGDOMS CHESS ENGINE & BOARD
// =========================================================

function isVoidSquare(r, c) {
    if (r < 3 && c < 3) return true;
    if (r < 3 && c > 10) return true;
    if (r > 10 && c < 3) return true;
    if (r > 10 && c > 10) return true;
    return false;
}

function onFourBoard(r, c) {
    return r >= 0 && r < 14 && c >= 0 && c < 14 && !isVoidSquare(r, c);
}

function initFourPlayerBoard() {
    fourBoard = Array(14).fill(null).map(() => Array(14).fill(null));
    fourTurn = 'red';
    fourSelected = null;
    fourLastMove = null;
    isHumanDefeated4P = false;
    isFourMatchActive = true;
    fourEliminationOrder = [];
    
    const podiumModal = document.getElementById('four-podium-modal');
    if (podiumModal) podiumModal.classList.add('hidden');
    const elimBanner = document.getElementById('four-elim-banner');
    if (elimBanner) elimBanner.classList.add('hidden');
    
    fourArmies = {
        red: { alive: true, count: 16 },
        blue: { alive: true, count: 16 },
        gold: { alive: true, count: 16 },
        green: { alive: true, count: 16 }
    };
    
    const backPieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const backPiecesMirror = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
    
    // Red (South) - Rows 13 & 12, Columns 3..10
    for (let c = 3; c <= 10; c++) {
        fourBoard[12][c] = { type: 'p', color: 'red', dir: 'up', hasMoved: false };
        fourBoard[13][c] = { type: backPieces[c - 3], color: 'red', hasMoved: false };
    }
    
    // Gold (North) - Rows 0 & 1, Columns 3..10
    for (let c = 3; c <= 10; c++) {
        fourBoard[1][c] = { type: 'p', color: 'gold', dir: 'down', hasMoved: false };
        fourBoard[0][c] = { type: backPieces[c - 3], color: 'gold', hasMoved: false };
    }
    
    // Blue (West) - Columns 0 & 1, Rows 3..10
    for (let r = 3; r <= 10; r++) {
        fourBoard[r][1] = { type: 'p', color: 'blue', dir: 'right', hasMoved: false };
        fourBoard[r][0] = { type: backPiecesMirror[r - 3], color: 'blue', hasMoved: false };
    }
    
    // Green (East) - Columns 13 & 12, Rows 3..10
    for (let r = 3; r <= 10; r++) {
        fourBoard[r][12] = { type: 'p', color: 'green', dir: 'left', hasMoved: false };
        fourBoard[r][13] = { type: backPiecesMirror[r - 3], color: 'green', hasMoved: false };
    }
    
    updateFourHUD();
    drawFourBoard();
}

function getFourMoves(r, c) {
    const piece = fourBoard[r][c];
    if (!piece) return [];
    const moves = [];
    const color = piece.color;
    
    if (piece.type === 'p') {
        let dr = 0, dc = 0;
        if (piece.dir === 'up') dr = -1;
        else if (piece.dir === 'down') dr = 1;
        else if (piece.dir === 'right') dc = 1;
        else if (piece.dir === 'left') dc = -1;
        
        const nr = r + dr, nc = c + dc;
        if (onFourBoard(nr, nc) && !fourBoard[nr][nc]) {
            moves.push({ r: nr, c: nc });
            if (!piece.hasMoved && onFourBoard(r + 2 * dr, c + 2 * dc) && !fourBoard[r + 2 * dr][c + 2 * dc]) {
                moves.push({ r: r + 2 * dr, c: c + 2 * dc });
            }
        }
        
        let capDeltas = dr !== 0 ? [[dr, -1], [dr, 1]] : [[-1, dc], [1, dc]];
        capDeltas.forEach(([cdr, cdc]) => {
            const tr = r + cdr, tc = c + cdc;
            if (onFourBoard(tr, tc) && fourBoard[tr][tc] && fourBoard[tr][tc].color !== color) {
                moves.push({ r: tr, c: tc });
            }
        });
    } else if (piece.type === 'n') {
        const knightDeltas = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        knightDeltas.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (onFourBoard(tr, tc) && (!fourBoard[tr][tc] || fourBoard[tr][tc].color !== color)) {
                moves.push({ r: tr, c: tc });
            }
        });
    } else if (piece.type === 'b') {
        slideFourMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves, color);
    } else if (piece.type === 'r') {
        slideFourMoves(r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves, color);
    } else if (piece.type === 'q') {
        slideFourMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], moves, color);
    } else if (piece.type === 'k') {
        const kingDeltas = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        kingDeltas.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (onFourBoard(tr, tc) && (!fourBoard[tr][tc] || fourBoard[tr][tc].color !== color)) {
                moves.push({ r: tr, c: tc });
            }
        });
    }
    
    return moves;
}

function slideFourMoves(r, c, directions, moves, color) {
    directions.forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (onFourBoard(tr, tc)) {
            if (!fourBoard[tr][tc]) {
                moves.push({ r: tr, c: tc });
            } else {
                if (fourBoard[tr][tc].color !== color) {
                    moves.push({ r: tr, c: tc });
                }
                break;
            }
            tr += dr;
            tc += dc;
        }
    });
}

function drawFourBoard() {
    const el = document.getElementById('four-chessboard');
    if (!el) return;
    el.innerHTML = '';
    
    const selectedMoves = (fourSelected && (!isHumanDefeated4P || fourMode === 'pass')) ? getFourMoves(fourSelected.r, fourSelected.c) : [];
    
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            const sq = document.createElement('div');
            
            if (isVoidSquare(r, c)) {
                sq.className = 'four-square void-square';
                el.appendChild(sq);
                continue;
            }
            
            const isLight = (r + c) % 2 === 0;
            sq.className = `four-square ${isLight ? 'light' : 'dark'}`;
            sq.dataset.r = r;
            sq.dataset.c = c;
            
            if (fourSelected && fourSelected.r === r && fourSelected.c === c) {
                sq.classList.add('selected');
            }
            if (fourLastMove && ((fourLastMove.from.r === r && fourLastMove.from.c === c) || (fourLastMove.to.r === r && fourLastMove.to.c === c))) {
                sq.classList.add('last-move');
            }
            
            const destMove = selectedMoves.find(m => m.r === r && m.c === c);
            if (destMove) {
                if (fourBoard[r][c]) {
                    const ring = document.createElement('div');
                    ring.className = 'capture-ring';
                    sq.appendChild(ring);
                } else {
                    const dot = document.createElement('div');
                    dot.className = 'move-dest-dot';
                    sq.appendChild(dot);
                }
            }
            
            const piece = fourBoard[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = 'piece-svg animate-land';
                pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pEl);
            }
            
            sq.addEventListener('click', () => handleFourSquareClick(r, c));
            el.appendChild(sq);
        }
    }
}

function handleFourSquareClick(r, c) {
    if (isGameOver || isGamePaused) return;
    if (fourMode === 'ai') {
        if (isHumanDefeated4P) return; // Human eliminated, prevent all moves!
        if (fourTurn !== 'red') return; // Not human turn
    }
    
    const clickedPiece = fourBoard[r][c];
    
    if (fourSelected) {
        if (fourSelected.r === r && fourSelected.c === c) {
            fourSelected = null;
            drawFourBoard();
            return;
        }
        
        const legals = getFourMoves(fourSelected.r, fourSelected.c);
        const chosen = legals.find(m => m.r === r && m.c === c);
        
        if (chosen) {
            executeFourMove(fourSelected, chosen);
            fourSelected = null;
            return;
        }
        
        if (clickedPiece && clickedPiece.color === fourTurn) {
            fourSelected = { r, c };
            drawFourBoard();
            return;
        }
        
        fourSelected = null;
        drawFourBoard();
    } else {
        if (clickedPiece && clickedPiece.color === fourTurn) {
            fourSelected = { r, c };
            drawFourBoard();
        }
    }
}

function executeFourMove(from, to) {
    const movingPiece = fourBoard[from.r][from.c];
    if (!movingPiece) return;
    
    const targetPiece = fourBoard[to.r][to.c];
    
    // Sparkle FX on 4-Player board
    const sqEl = document.querySelector(`.four-square[data-r="${to.r}"][data-c="${to.c}"]`);
    if (sqEl && fx4p) {
        const rect = sqEl.getBoundingClientRect();
        const canvasRect = fx4p.canvas.getBoundingClientRect();
        const px = rect.left - canvasRect.left + rect.width / 2;
        const py = rect.top - canvasRect.top + rect.height / 2;
        if (targetPiece) {
            fx4p.shockwave(px, py, '#ef4444');
        } else {
            fx4p.spark(px, py, 12, '#d4af37');
        }
    }
    
    if (targetPiece) {
        audio.capture();
        fourArmies[targetPiece.color].count--;
        if (targetPiece.type === 'k') {
            eliminateKingdom(targetPiece.color);
        }
    } else {
        audio.move();
    }
    
    let finalPiece = { ...movingPiece, hasMoved: true };
    if (movingPiece.type === 'p') {
        if (movingPiece.dir === 'up' && to.r <= 5) finalPiece.type = 'q';
        else if (movingPiece.dir === 'down' && to.r >= 8) finalPiece.type = 'q';
        else if (movingPiece.dir === 'right' && to.c >= 8) finalPiece.type = 'q';
        else if (movingPiece.dir === 'left' && to.c <= 5) finalPiece.type = 'q';
    }
    
    fourBoard[to.r][to.c] = finalPiece;
    fourBoard[from.r][from.c] = null;
    fourLastMove = { from, to };
    
    advanceFourTurn();
    updateFourHUD();
    drawFourBoard();
    
    const aliveKingdoms = FOUR_KINGDOMS.filter(k => fourArmies[k].alive);
    if (aliveKingdoms.length === 1) {
        showFourPodiumModal(aliveKingdoms[0]);
        return;
    }
    
    if (fourMode === 'ai' && fourTurn !== 'red' && !isGameOver) {
        setTimeout(makeFourAIMove, 450);
    }
}

function advanceFourTurn() {
    let curIdx = FOUR_KINGDOMS.indexOf(fourTurn);
    for (let i = 1; i <= 4; i++) {
        const nextIdx = (curIdx + i) % 4;
        const nextK = FOUR_KINGDOMS[nextIdx];
        if (fourArmies[nextK].alive) {
            fourTurn = nextK;
            break;
        }
    }
}

function eliminateKingdom(color) {
    fourArmies[color].alive = false;
    if (!fourEliminationOrder.includes(color)) {
        fourEliminationOrder.push(color);
    }
    
    // Dynamic floating elimination banner
    const elimBanner = document.getElementById('four-elim-banner');
    const elimText = document.getElementById('four-elim-text');
    if (elimBanner && elimText) {
        elimText.textContent = `💀 ${FOUR_KINGDOM_NAMES[color]} Has Fallen!`;
        elimBanner.classList.remove('hidden');
        clearTimeout(window._elimBannerTimeout);
        window._elimBannerTimeout = setTimeout(() => {
            elimBanner.classList.add('hidden');
        }, 3200);
    }
    
    // Board shake animation on the 4-player frame
    const frame = document.getElementById('four-board-frame');
    if (frame) {
        frame.classList.add('shake-board');
        setTimeout(() => frame.classList.remove('shake-board'), 500);
    }
    
    showToast(`${FOUR_KINGDOM_NAMES[color]} King was captured!`, 'error');
    
    // Find King coordinates for lightning defeat effect
    let kingSq = null;
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            if (fourBoard[r][c] && fourBoard[r][c].color === color && fourBoard[r][c].type === 'k') {
                kingSq = { r, c };
                break;
            }
        }
    }
    
    if (kingSq && fx4p) {
        const sqEl = document.querySelector(`.four-square[data-r="${kingSq.r}"][data-c="${kingSq.c}"]`);
        if (sqEl) {
            const rect = sqEl.getBoundingClientRect();
            const canvasRect = fx4p.canvas.getBoundingClientRect();
            const px = rect.left - canvasRect.left + rect.width / 2;
            const py = rect.top - canvasRect.top + rect.height / 2;
            fx4p.lightningDefeat(px, py, '#ef4444', '#ffd700');
            audio.strike();
        }
    }
    
    // Clear defeated army pieces
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            if (fourBoard[r][c] && fourBoard[r][c].color === color) {
                fourBoard[r][c] = null;
            }
        }
    }
    
    // IF HUMAN (RED) IS ELIMINATED: STOP ACTIVE GAMEPLAY IMMEDIATELY!
    if (color === 'red' && fourMode === 'ai') {
        isHumanDefeated4P = true;
        fourSelected = null;
        setTimeout(() => {
            showFourDefeatModal();
        }, 700);
    }
}

function showFourDefeatModal() {
    const modal = document.getElementById('four-defeat-modal');
    if (modal) modal.classList.remove('hidden');
    audio.defeat();
}

function showFourPodiumModal(victor) {
    const modal = document.getElementById('four-podium-modal');
    if (!modal) return;
    
    isGameOver = true;
    isFourMatchActive = false;
    
    const crests = { red: '🔴', blue: '🔵', gold: '🟡', green: '🟢' };
    
    const p1 = victor;
    const p2 = fourEliminationOrder[2] || FOUR_KINGDOMS.find(k => k !== p1) || 'blue';
    const p3 = fourEliminationOrder[1] || FOUR_KINGDOMS.find(k => k !== p1 && k !== p2) || 'gold';
    const p4 = fourEliminationOrder[0] || FOUR_KINGDOMS.find(k => k !== p1 && k !== p2 && k !== p3) || 'green';
    
    const n1 = document.getElementById('podium-name-1');
    const c1 = document.getElementById('podium-crest-1');
    if (n1) n1.textContent = FOUR_KINGDOM_NAMES[p1];
    if (c1) c1.textContent = crests[p1] || '👑';
    
    const n2 = document.getElementById('podium-name-2');
    const c2 = document.getElementById('podium-crest-2');
    if (n2) n2.textContent = FOUR_KINGDOM_NAMES[p2];
    if (c2) c2.textContent = crests[p2] || '⚔️';
    
    const n3 = document.getElementById('podium-name-3');
    const c3 = document.getElementById('podium-crest-3');
    if (n3) n3.textContent = FOUR_KINGDOM_NAMES[p3];
    if (c3) c3.textContent = crests[p3] || '🛡️';
    
    const n4 = document.getElementById('podium-name-4');
    const c4 = document.getElementById('podium-crest-4');
    if (n4) n4.textContent = FOUR_KINGDOM_NAMES[p4];
    if (c4) c4.textContent = crests[p4] || '💀';
    
    const sub = document.getElementById('four-podium-sub');
    if (sub) {
        sub.textContent = `${FOUR_KINGDOM_NAMES[p1]} reigns supreme over all 4 Kingdoms!`;
    }
    
    if (p1 === 'red') {
        lordProfile.fourWins++;
        saveProfile();
        audio.victory();
        triggerHaptic('victory');
    } else {
        audio.defeat();
        triggerHaptic('check');
    }
    
    modal.classList.remove('hidden');
    checkAndUnlockAchievements();
}

function makeFourAIMove() {
    if (fourTurn === 'red' || !fourArmies[fourTurn].alive || isGamePaused || isGameOver) return;
    
    const allMoves = [];
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            if (fourBoard[r][c] && fourBoard[r][c].color === fourTurn) {
                const moves = getFourMoves(r, c);
                moves.forEach(m => allMoves.push({ from: { r, c }, to: m }));
            }
        }
    }
    
    if (allMoves.length === 0) {
        eliminateKingdom(fourTurn);
        advanceFourTurn();
        updateFourHUD();
        drawFourBoard();
        const aliveKingdoms = FOUR_KINGDOMS.filter(k => fourArmies[k].alive);
        if (aliveKingdoms.length === 1) {
            showFourPodiumModal(aliveKingdoms[0]);
            return;
        }
        if (fourMode === 'ai' && fourTurn !== 'red') {
            setTimeout(makeFourAIMove, 450);
        }
        return;
    }
    
    const kingCaptures = allMoves.filter(m => fourBoard[m.to.r][m.to.c] && fourBoard[m.to.r][m.to.c].type === 'k');
    const pieceCaptures = allMoves.filter(m => fourBoard[m.to.r][m.to.c] !== null);
    
    let chosen = null;
    if (kingCaptures.length > 0) {
        chosen = kingCaptures[0];
    } else if (pieceCaptures.length > 0 && Math.random() < 0.6) {
        chosen = pieceCaptures[Math.floor(Math.random() * pieceCaptures.length)];
    } else {
        chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
    }
    
    executeFourMove(chosen.from, chosen.to);
}

function updateFourHUD() {
    const turnMsg = document.getElementById('turn-message');
    const turnDot = document.getElementById('turn-dot');
    const kColors = { red: '#ef4444', blue: '#38bdf8', gold: '#facc15', green: '#22c55e' };
    
    if (turnMsg) turnMsg.textContent = `${FOUR_KINGDOM_NAMES[fourTurn]}'s Turn`;
    if (turnDot) turnDot.style.backgroundColor = kColors[fourTurn] || 'var(--primary)';
    
    // Active Kingdom Turn Banner with kingdom crest and player name
    const turnBanner = document.getElementById('four-turn-banner');
    if (turnBanner) {
        turnBanner.className = `four-turn-banner ${fourTurn}`;
        const crest = { red: '🔴', blue: '🔵', gold: '🟡', green: '🟢' }[fourTurn] || '👑';
        const roleNote = (fourMode === 'ai' && fourTurn === 'red') ? ' (You)' : '';
        turnBanner.innerHTML = `<span class="crest">${crest}</span> <strong>${FOUR_KINGDOM_NAMES[fourTurn]}'s Turn${roleNote}</strong>`;
    }
    
    // Dynamic glowing perimeter border on board frame matching active kingdom
    const boardFrame = document.getElementById('four-board-frame');
    if (boardFrame) {
        boardFrame.className = `four-board-frame turn-${fourTurn}`;
    }
    
    FOUR_KINGDOMS.forEach(k => {
        const card = document.getElementById(`hud-k-${k}`);
        const status = document.getElementById(`k-status-${k}`);
        if (card) {
            card.classList.toggle('active-turn', fourTurn === k && fourArmies[k].alive);
            card.classList.toggle('eliminated', !fourArmies[k].alive);
        }
        if (status) {
            status.textContent = fourArmies[k].alive ? `${fourArmies[k].count} Army` : 'Defeated';
        }
    });
}

// =========================================================
// 5. 5 DAILY CASTLE PUZZLES ENGINE (1 ATTEMPT PER DAY)
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
    
    let tier = '⭐ Squire Tactician';
    if (currentStreak >= 14) tier = '👑 Grand Sovereign';
    else if (currentStreak >= 7) tier = '🏰 Castle Master';
    else if (currentStreak >= 3) tier = '⚔️ Knight Champion';
    
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
    
    if (tabId === 'home') {
        if (headerSub) headerSub.textContent = 'Castle Battle Setup';
        pauseGame();
    } else if (tabId === 'arena' || tabId === 'battle') {
        if (arenaSubMode === '2p') {
            if (headerSub) headerSub.textContent = 'Classic 2-Player Duel';
            draw2PlayerBoard();
            if (fx2p) fx2p.resize();
        } else {
            if (headerSub) headerSub.textContent = 'Four Kingdoms Realm';
            drawFourBoard();
            if (fx4p) fx4p.resize();
        }
        if (isMatchActive && !isGameOver) {
            resumeGame();
        }
    } else if (tabId === 'puzzles') {
        if (headerSub) headerSub.textContent = 'Castle Tactics Academy';
        pauseGame();
        renderCurrentPuzzle();
    } else if (tabId === 'profile') {
        if (headerSub) headerSub.textContent = 'Player Honor & Records';
        pauseGame();
        updateProfileUI();
    }
}

function switchArenaSubMode(mode) {
    arenaSubMode = mode;
    const view2p = document.getElementById('view-2player-arena');
    const view4p = document.getElementById('view-4player-arena');
    const subTitle = document.getElementById('header-mode-subtitle');
    
    if (mode === '2p') {
        if (view2p) view2p.classList.remove('hidden');
        if (view4p) view4p.classList.add('hidden');
        if (subTitle) subTitle.textContent = 'Classic 2-Player Duel';
        draw2PlayerBoard();
        if (fx2p) fx2p.resize();
    } else {
        if (view4p) view4p.classList.remove('hidden');
        if (view2p) view2p.classList.add('hidden');
        if (subTitle) subTitle.textContent = 'Four Kingdoms Realm';
        drawFourBoard();
        if (fx4p) fx4p.resize();
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
    // Variation: 2-Player vs 4-Player
    const cat2p = document.getElementById('home-cat-2p');
    const cat4p = document.getElementById('home-cat-4p');
    const group2p = document.getElementById('home-2p-group');
    const group4p = document.getElementById('home-4p-group');
    
    if (cat2p && cat4p) {
        cat2p.addEventListener('click', () => {
            cat2p.classList.add('active');
            cat4p.classList.remove('active');
            group2p.classList.remove('hidden');
            group4p.classList.add('hidden');
            arenaSubMode = '2p';
        });
        cat4p.addEventListener('click', () => {
            cat4p.classList.add('active');
            cat2p.classList.remove('active');
            group4p.classList.remove('hidden');
            group2p.classList.add('hidden');
            arenaSubMode = '4p';
        });
    }
    
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
    
    // Bot Knight selection
    document.querySelectorAll('.bot-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.bot-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            difficulty = parseInt(card.dataset.diff, 10) || 2;
        });
    });
    
    // 4P Mode (vs 3 Bots vs Pass & Play)
    const fourAiBtn = document.getElementById('home-4p-ai-btn');
    const fourPassBtn = document.getElementById('home-4p-pass-btn');
    const fourAiNameSec = document.getElementById('home-4p-ai-name-section');
    const fourPassNamesSec = document.getElementById('home-4p-pass-names-section');
    
    if (fourAiBtn && fourPassBtn) {
        fourAiBtn.addEventListener('click', () => {
            fourAiBtn.classList.add('active');
            fourPassBtn.classList.remove('active');
            fourMode = 'ai';
            if (fourAiNameSec) fourAiNameSec.classList.remove('hidden');
            if (fourPassNamesSec) fourPassNamesSec.classList.add('hidden');
        });
        fourPassBtn.addEventListener('click', () => {
            fourPassBtn.classList.add('active');
            fourAiBtn.classList.remove('active');
            fourMode = 'pass';
            if (fourAiNameSec) fourAiNameSec.classList.add('hidden');
            if (fourPassNamesSec) fourPassNamesSec.classList.remove('hidden');
        });
    }
    
    // COMMENCE BATTLE ⚔️ (HOME START BUTTON)
    const homeStartBtn = document.getElementById('home-start-btn');
    if (homeStartBtn) {
        homeStartBtn.addEventListener('click', () => {
            // Save player name
            const nameInput = document.getElementById('home-player-name');
            const fourNameInput = document.getElementById('home-4p-player-name');
            const fourRedInput = document.getElementById('home-4p-name-red');
            const customName = (arenaSubMode === '4p' ? (fourMode === 'pass' ? fourRedInput?.value : fourNameInput?.value) : nameInput?.value)?.trim();
            if (customName) {
                lordProfile.name = customName;
                saveProfile();
            }
            
            // Switch to Arena tab first so elements are visible
            switchTab('arena');
            
            if (arenaSubMode === '2p') {
                switchArenaSubMode('2p');
                startNew2PlayerGame();
            } else {
                switchArenaSubMode('4p');
                startNew4PlayerGame();
            }
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
                lordProfile.wins++;
                if (gameMode === 'ai') {
                    if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0}, 2:{w:0,l:0}, 3:{w:0,l:0}, 4:{w:0,l:0} };
                    if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0 };
                    lordProfile.botRecords[difficulty].w++;
                }
                audio.victory();
                triggerHaptic('victory');
            } else {
                if (gameMode === 'ai') {
                    if (!lordProfile.botRecords) lordProfile.botRecords = { 1:{w:0,l:0}, 2:{w:0,l:0}, 3:{w:0,l:0}, 4:{w:0,l:0} };
                    if (!lordProfile.botRecords[difficulty]) lordProfile.botRecords[difficulty] = { w: 0, l: 0 };
                    lordProfile.botRecords[difficulty].l++;
                }
                audio.defeat();
                triggerHaptic('check');
            }
            lordProfile.matches++;
            saveProfile();
            checkAndUnlockAchievements();
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
    
    // 4-Player Rules
    const rulesBtn = document.getElementById('four-rules-btn');
    const rulesModal = document.getElementById('four-rules-modal');
    const rulesOkBtn = document.getElementById('four-rules-ok-btn');
    const rulesClose = document.getElementById('four-rules-close-btn');
    if (rulesBtn) rulesBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
    if (rulesOkBtn) rulesOkBtn.addEventListener('click', () => rulesModal.classList.add('hidden'));
    if (rulesClose) rulesClose.addEventListener('click', () => rulesModal.classList.add('hidden'));
    
    const fourResetBtn = document.getElementById('four-reset-btn');
    if (fourResetBtn) fourResetBtn.addEventListener('click', () => initFourPlayerBoard());
    
    const fourAiStepBtn = document.getElementById('four-ai-step-btn');
    if (fourAiStepBtn) fourAiStepBtn.addEventListener('click', () => makeFourAIMove());
    
    // 4-Player Defeat Modal Buttons
    const fourDefeatHomeBtn = document.getElementById('four-defeat-home-btn');
    const fourDefeatRestartBtn = document.getElementById('four-defeat-restart-btn');
    if (fourDefeatHomeBtn) {
        fourDefeatHomeBtn.addEventListener('click', () => {
            document.getElementById('four-defeat-modal').classList.add('hidden');
            switchTab('home');
        });
    }
    if (fourDefeatRestartBtn) {
        fourDefeatRestartBtn.addEventListener('click', () => {
            document.getElementById('four-defeat-modal').classList.add('hidden');
            initFourPlayerBoard();
        });
    }
    
    // 4-Player Podium Modal Buttons
    const podiumHomeBtn = document.getElementById('podium-home-btn');
    const podiumRestartBtn = document.getElementById('podium-restart-btn');
    if (podiumHomeBtn) {
        podiumHomeBtn.addEventListener('click', () => {
            const modal = document.getElementById('four-podium-modal');
            if (modal) modal.classList.add('hidden');
            switchTab('home');
        });
    }
    if (podiumRestartBtn) {
        podiumRestartBtn.addEventListener('click', () => {
            const modal = document.getElementById('four-podium-modal');
            if (modal) modal.classList.add('hidden');
            initFourPlayerBoard();
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
            if (arenaSubMode === '2p') {
                startNew2PlayerGame();
            } else {
                startNew4PlayerGame();
            }
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
        if (oppSub) oppSub.textContent = `AI Knight • ${bot.rating}`;
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

function startNew4PlayerGame() {
    isGameOver = false;
    isGamePaused = false;
    isHumanDefeated4P = false;
    isFourMatchActive = true;
    isMatchActive = true;
    if (aiMoveTimeout) {
        clearTimeout(aiMoveTimeout);
        aiMoveTimeout = null;
    }
    
    if (fourMode === 'pass') {
        const nRed = document.getElementById('home-4p-name-red')?.value.trim() || lordProfile.name || 'Player 1';
        const nBlue = document.getElementById('home-4p-name-blue')?.value.trim() || 'Player 2';
        const nGold = document.getElementById('home-4p-name-gold')?.value.trim() || 'Player 3';
        const nGreen = document.getElementById('home-4p-name-green')?.value.trim() || 'Player 4';
        
        FOUR_KINGDOM_NAMES.red = nRed;
        FOUR_KINGDOM_NAMES.blue = nBlue;
        FOUR_KINGDOM_NAMES.gold = nGold;
        FOUR_KINGDOM_NAMES.green = nGreen;
        
        const redEl = document.getElementById('k-name-red');
        const blueEl = document.getElementById('k-name-blue');
        const goldEl = document.getElementById('k-name-gold');
        const greenEl = document.getElementById('k-name-green');
        
        if (redEl) redEl.textContent = nRed;
        if (blueEl) blueEl.textContent = nBlue;
        if (goldEl) goldEl.textContent = nGold;
        if (greenEl) greenEl.textContent = nGreen;
    } else {
        const pName = document.getElementById('home-4p-player-name')?.value.trim() || lordProfile.name || 'Player';
        FOUR_KINGDOM_NAMES.red = pName;
        FOUR_KINGDOM_NAMES.blue = 'Blue Baron 🤖';
        FOUR_KINGDOM_NAMES.gold = 'Gold Emperor 🤖';
        FOUR_KINGDOM_NAMES.green = 'Green Duke 🤖';
        
        const redEl = document.getElementById('k-name-red');
        const blueEl = document.getElementById('k-name-blue');
        const goldEl = document.getElementById('k-name-gold');
        const greenEl = document.getElementById('k-name-green');
        
        if (redEl) redEl.textContent = pName;
        if (blueEl) blueEl.textContent = 'Blue Baron';
        if (goldEl) goldEl.textContent = 'Gold Emperor';
        if (greenEl) greenEl.textContent = 'Green Duke';
    }
    
    initFourPlayerBoard();
    if (fx4p) fx4p.resize();
}

const ROYAL_ACHIEVEMENTS = [
    {
        id: 'first_win',
        icon: '🛡️',
        title: 'First Blood',
        desc: 'Claim your first Classic victory',
        check: (p) => (p.wins || 0) >= 1
    },
    {
        id: 'knight_slayer',
        icon: '⚔️',
        title: 'Knight Slayer',
        desc: 'Defeat Sir Galahad (~1200 Elo)',
        check: (p) => (p.botRecords && p.botRecords[2] && p.botRecords[2].w >= 1)
    },
    {
        id: 'queen_tamer',
        icon: '🏰',
        title: 'Morgana Falls',
        desc: 'Defeat Lady Morgana (~1700 Elo)',
        check: (p) => (p.botRecords && p.botRecords[3] && p.botRecords[3].w >= 1)
    },
    {
        id: 'king_subdued',
        icon: '👑',
        title: 'Arthur Subdued',
        desc: 'Defeat King Arthur (~2200 Elo)',
        check: (p) => (p.botRecords && p.botRecords[4] && p.botRecords[4].w >= 1)
    },
    {
        id: 'realm_conqueror',
        icon: '🏆',
        title: 'Realm Conqueror',
        desc: 'Conquer the 4-Player Realm',
        check: (p) => (p.fourWins || 0) >= 1
    },
    {
        id: 'puzzle_master',
        icon: '🧩',
        title: 'Castle Tactician',
        desc: 'Solve 5 Daily Chess Puzzles',
        check: (p) => (p.puzzles || 0) >= 5
    },
    {
        id: 'streak_3',
        icon: '🔥',
        title: 'Royal Flame',
        desc: 'Maintain a 3-Day Puzzle Streak',
        check: (p) => {
            const s = getPuzzleStreakData();
            return (s.streak || 0) >= 3;
        }
    },
    {
        id: 'grand_sovereign',
        icon: '⚡',
        title: 'Grand Sovereign',
        desc: 'Achieve 10 total victories',
        check: (p) => ((p.wins || 0) + (p.fourWins || 0)) >= 10
    }
];

function checkAndUnlockAchievements() {
    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    ROYAL_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = ach.check(lordProfile);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <span class="ach-icon">${ach.icon}</span>
            <div class="ach-info">
                <span class="ach-title">${ach.title}</span>
                <span class="ach-desc">${ach.desc}</span>
            </div>
            <span class="ach-badge ${isUnlocked ? 'unlocked' : 'locked'}">${isUnlocked ? 'Unlocked' : 'Locked'}</span>
        `;
        grid.appendChild(card);
    });
}

function loadProfile() {
    const savedName = localStorage.getItem('royal_player_name') || localStorage.getItem('electro_player_name');
    if (savedName && savedName !== 'Lord Sovereign') {
        lordProfile.name = savedName;
    } else {
        lordProfile.name = 'Player';
    }
    
    try {
        const savedRecs = localStorage.getItem('royal_bot_records');
        if (savedRecs) {
            lordProfile.botRecords = JSON.parse(savedRecs);
        }
    } catch (e) {}
    
    const homeInput = document.getElementById('home-player-name');
    const fourInput = document.getElementById('home-4p-player-name');
    const fourRedInput = document.getElementById('home-4p-name-red');
    const authInput = document.getElementById('auth-username-input');
    
    if (homeInput) homeInput.value = lordProfile.name;
    if (fourInput) fourInput.value = lordProfile.name;
    if (fourRedInput) fourRedInput.value = lordProfile.name;
    if (authInput) authInput.value = lordProfile.name;
    
    updateProfileUI();
}

function saveProfile() {
    if (lordProfile.name) {
        localStorage.setItem('royal_player_name', lordProfile.name);
        localStorage.setItem('electro_player_name', lordProfile.name);
    }
    if (lordProfile.botRecords) {
        localStorage.setItem('royal_bot_records', JSON.stringify(lordProfile.botRecords));
    }
    updateProfileUI();
}

function updateProfileUI() {
    const pName = document.getElementById('profile-name');
    const statMatches = document.getElementById('stat-matches');
    const statWins = document.getElementById('stat-wins');
    const statWinrate = document.getElementById('stat-winrate');
    const statFourWins = document.getElementById('stat-four-wins');
    
    if (pName) pName.textContent = lordProfile.name;
    if (statMatches) statMatches.textContent = lordProfile.matches;
    if (statWins) statWins.textContent = lordProfile.wins;
    if (statWinrate) {
        const rate = lordProfile.matches > 0 ? Math.round((lordProfile.wins / lordProfile.matches) * 100) : 0;
        statWinrate.textContent = `${rate}%`;
    }
    if (statFourWins) statFourWins.textContent = lordProfile.fourWins;
    
    // Opponent Knights Head-to-Head Records
    if (lordProfile.botRecords) {
        for (let d = 1; d <= 4; d++) {
            const el = document.getElementById(`rec-bot-${d}`);
            if (el && lordProfile.botRecords[d]) {
                const rec = lordProfile.botRecords[d];
                el.textContent = `${rec.w || 0}W - ${rec.l || 0}L`;
            }
        }
    }
    
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
    fx4p = new CastleFX('four-fx-canvas');
    
    applyTheme(royalSettings.theme);
    syncSettingsCheckboxes();
    loadProfile();
    setupEventListeners();
    init2PlayerBoard();
    initFourPlayerBoard();
    
    // Open HOME SCREEN FIRST on launch!
    switchTab('home');
    console.log('Royal Chess: Castle Realm initialized successfully on Home screen with theme ' + royalSettings.theme);
});
