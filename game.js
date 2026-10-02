// =========================================================
// ELECTRO KING 👑 - CASTLE REALM EDITION
// Royal Medieval Chess & Four Kingdoms Engine
// =========================================================

// --- ROYAL GOLD PARTICLE FX SYSTEM ---
class CastleFX {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
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

    spark(x, y, count = 20, color = '#d4af37') {
        if (!this.ctx) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
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
                size: 3,
                color
            });
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
            console.warn('Audio play error:', e);
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
let currentTab = 'arena';
let arenaSubMode = '2p'; // '2p' or '4p'
let lordProfile = {
    name: 'Lord Sovereign',
    avatar: '👑',
    avatarUrl: '',
    matches: 0,
    wins: 0,
    fourWins: 0,
    puzzles: 0
};

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
let playerNames = { white: 'Lord Sovereign', black: 'Sir Galahad 🤖' };
let isGameOver = false;
let pendingPromotion = null;
let activeHint = null;
let clockInterval = null;
let clockTimes = { white: 180, black: 180 };
let matchClockLimit = 180;
let moveHistoryNotation = [];

const BOT_PERSONALITIES = {
    1: { name: 'Squire Leon 🛡️', rating: '~600 Elo' },
    2: { name: 'Sir Galahad ⚔️', rating: '~1200 Elo' },
    3: { name: 'Lady Morgana 🏰', rating: '~1700 Elo' },
    4: { name: 'King Arthur 👑', rating: '~2200 Elo' }
};

// =========================================================
// 1. CLASSIC 2-PLAYER ENGINE
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

function onBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getRawMoves(r, c, testBoard = board) {
    const piece = testBoard[r][c];
    if (!piece) return [];
    const moves = [];
    const color = piece.color;
    const enemyColor = color === 'white' ? 'black' : 'white';
    
    if (piece.type === 'p') {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        if (onBoard(r + dir, c) && !testBoard[r + dir][c]) {
            moves.push({ r: r + dir, c: c });
            if (r === startRow && onBoard(r + 2 * dir, c) && !testBoard[r + 2 * dir][c]) {
                moves.push({ r: r + 2 * dir, c: c });
            }
        }
        [-1, 1].forEach(dc => {
            const tr = r + dir, tc = c + dc;
            if (onBoard(tr, tc) && testBoard[tr][tc] && testBoard[tr][tc].color === enemyColor) {
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
            if (onBoard(tr, tc) && (!testBoard[tr][tc] || testBoard[tr][tc].color === enemyColor)) {
                moves.push({ r: tr, c: tc });
            }
        });
    } else if (piece.type === 'b') {
        slideMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], testBoard, moves, enemyColor);
    } else if (piece.type === 'r') {
        slideMoves(r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], testBoard, moves, enemyColor);
    } else if (piece.type === 'q') {
        slideMoves(r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], testBoard, moves, enemyColor);
    } else if (piece.type === 'k') {
        const kingDeltas = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        kingDeltas.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (onBoard(tr, tc) && (!testBoard[tr][tc] || testBoard[tr][tc].color === enemyColor)) {
                moves.push({ r: tr, c: tc });
            }
        });
        // Castling
        if (!piece.hasMoved && !isKingInCheck(color, testBoard)) {
            if (testBoard[r][7] && !testBoard[r][7].hasMoved && !testBoard[r][5] && !testBoard[r][6]) {
                if (!isSquareAttackedBy(r, 5, enemyColor, testBoard) && !isSquareAttackedBy(r, 6, enemyColor, testBoard)) {
                    moves.push({ r, c: 6, isCastle: 'kingside' });
                }
            }
            if (testBoard[r][0] && !testBoard[r][0].hasMoved && !testBoard[r][1] && !testBoard[r][2] && !testBoard[r][3]) {
                if (!isSquareAttackedBy(r, 3, enemyColor, testBoard) && !isSquareAttackedBy(r, 2, enemyColor, testBoard)) {
                    moves.push({ r, c: 2, isCastle: 'queenside' });
                }
            }
        }
    }
    
    return moves;
}

function slideMoves(r, c, directions, testBoard, moves, enemyColor) {
    directions.forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (onBoard(tr, tc)) {
            if (!testBoard[tr][tc]) {
                moves.push({ r: tr, c: tc });
            } else {
                if (testBoard[tr][tc].color === enemyColor) {
                    moves.push({ r: tr, c: tc });
                }
                break;
            }
            tr += dr;
            tc += dc;
        }
    });
}

function isSquareAttackedBy(targetR, targetC, attackerColor, testBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = testBoard[r][c];
            if (piece && piece.color === attackerColor) {
                if (piece.type === 'p') {
                    const dir = attackerColor === 'white' ? -1 : 1;
                    if (r + dir === targetR && (c - 1 === targetC || c + 1 === targetC)) {
                        return true;
                    }
                } else if (piece.type === 'k') {
                    if (Math.abs(r - targetR) <= 1 && Math.abs(c - targetC) <= 1) return true;
                } else {
                    const moves = getRawMoves(r, c, testBoard);
                    if (moves.some(m => m.r === targetR && m.c === targetC)) return true;
                }
            }
        }
    }
    return false;
}

function findKing(color, testBoard = board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p && p.type === 'k' && p.color === color) return { r, c };
        }
    }
    return null;
}

function isKingInCheck(color, testBoard = board) {
    const k = findKing(color, testBoard);
    if (!k) return false;
    const enemy = color === 'white' ? 'black' : 'white';
    return isSquareAttackedBy(k.r, k.c, enemy, testBoard);
}

function cloneBoard(currentBoard) {
    return currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getLegalMoves(r, c, testBoard = board) {
    const piece = testBoard[r][c];
    if (!piece) return [];
    const raw = getRawMoves(r, c, testBoard);
    const color = piece.color;
    
    return raw.filter(m => {
        const nextBoard = cloneBoard(testBoard);
        const movingPiece = nextBoard[r][c];
        nextBoard[m.r][m.c] = { ...movingPiece, hasMoved: true };
        nextBoard[r][c] = null;
        
        if (m.isCastle === 'kingside') {
            nextBoard[r][5] = { ...nextBoard[r][7], hasMoved: true };
            nextBoard[r][7] = null;
        } else if (m.isCastle === 'queenside') {
            nextBoard[r][3] = { ...nextBoard[r][0], hasMoved: true };
            nextBoard[r][0] = null;
        }
        
        return !isKingInCheck(color, nextBoard);
    });
}

function getAllLegalMoves(color, testBoard = board) {
    const all = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (testBoard[r][c] && testBoard[r][c].color === color) {
                const legals = getLegalMoves(r, c, testBoard);
                legals.forEach(m => {
                    all.push({ from: { r, c }, to: m });
                });
            }
        }
    }
    return all;
}

function draw2PlayerBoard() {
    const el = document.getElementById('chessboard');
    if (!el) return;
    el.innerHTML = '';
    
    const kingInCheckLoc = isKingInCheck(turn, board) ? findKing(turn, board) : null;
    const selectedMoves = selectedSquare ? getLegalMoves(selectedSquare.r, selectedSquare.c) : [];
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const isLight = (r + c) % 2 === 0;
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            sq.dataset.r = r;
            sq.dataset.c = c;
            
            if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                sq.classList.add('selected');
            }
            if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
                sq.classList.add('last-move');
            }
            if (kingInCheckLoc && kingInCheckLoc.r === r && kingInCheckLoc.c === c) {
                sq.classList.add('check-square');
            }
            if (activeHint && activeHint.from.r === r && activeHint.from.c === c) {
                sq.classList.add('hint-from');
            }
            if (activeHint && activeHint.to.r === r && activeHint.to.c === c) {
                sq.classList.add('hint-to');
            }
            
            // Move indicator dots
            const destMove = selectedMoves.find(m => m.r === r && m.c === c);
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
            
            // Piece
            const piece = board[r][c];
            if (piece) {
                const pieceWrapper = document.createElement('div');
                pieceWrapper.className = 'piece-svg animate-land';
                pieceWrapper.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pieceWrapper);
            }
            
            sq.addEventListener('click', () => handle2PlayerSquareClick(r, c));
            el.appendChild(sq);
        }
    }
    
    updateEvalBar();
}

function handle2PlayerSquareClick(r, c) {
    if (isGameOver) return;
    if (gameMode === 'ai' && turn === botSide) return;
    
    const clickedPiece = board[r][c];
    
    if (selectedSquare) {
        const legalMoves = getLegalMoves(selectedSquare.r, selectedSquare.c);
        const targetMove = legalMoves.find(m => m.r === r && m.c === c);
        
        if (targetMove) {
            execute2PlayerMove(selectedSquare, targetMove);
            selectedSquare = null;
            activeHint = null;
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
    
    if (movingPiece.type === 'p' && (to.r === 0 || to.r === 7) && !promoPiece) {
        pendingPromotion = { from, to };
        showPromotionModal(movingPiece.color);
        return;
    }
    
    const capturedPiece = board[to.r][to.c];
    
    // Sparkle FX on piece landing
    const sqEl = document.querySelector(`.square[data-r="${to.r}"][data-c="${to.c}"]`);
    if (sqEl && fx2p) {
        const rect = sqEl.getBoundingClientRect();
        const canvasRect = fx2p.canvas.getBoundingClientRect();
        const px = rect.left - canvasRect.left + rect.width / 2;
        const py = rect.top - canvasRect.top + rect.height / 2;
        if (capturedPiece) {
            fx2p.shockwave(px, py, '#ef4444');
        } else {
            fx2p.spark(px, py, 14, '#d4af37');
        }
    }
    
    if (capturedPiece) {
        captured[movingPiece.color].push(capturedPiece);
        audio.capture();
    } else {
        audio.move();
    }
    
    history.push({
        board: cloneBoard(board),
        turn,
        lastMove,
        captured: { white: [...captured.white], black: [...captured.black] }
    });
    
    if (to.isCastle === 'kingside') {
        board[from.r][5] = { ...board[from.r][7], hasMoved: true };
        board[from.r][7] = null;
    } else if (to.isCastle === 'queenside') {
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
    }
    
    const nextLegals = getAllLegalMoves(turn, board);
    if (nextLegals.length === 0) {
        isGameOver = true;
        stopClock();
        if (isKingInCheck(turn, board)) {
            const winner = turn === 'white' ? 'black' : 'white';
            const winnerName = playerNames[winner];
            showGameOverModal(`Checkmate! ${winnerName} reigns victorious!`);
            if (winner === playerSide) {
                lordProfile.wins++;
                audio.victory();
            } else {
                audio.defeat();
            }
        } else {
            showGameOverModal('Stalemate! The royal duel ends in a draw.');
        }
        lordProfile.matches++;
        saveProfile();
        return;
    }
    
    if (gameMode === 'ai' && turn === botSide && !isGameOver) {
        setTimeout(make2PlayerAIMove, 450);
    }
}

function make2PlayerAIMove() {
    if (isGameOver || turn !== botSide) return;
    const allMoves = getAllLegalMoves(botSide, board);
    if (allMoves.length === 0) return;
    
    let chosenMove = null;
    
    if (difficulty === 1) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (difficulty === 2) {
        const captureMoves = allMoves.filter(m => board[m.to.r][m.to.c] !== null);
        chosenMove = captureMoves.length > 0 ? captureMoves[Math.floor(Math.random() * captureMoves.length)] : allMoves[Math.floor(Math.random() * allMoves.length)];
    } else {
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
    const container = document.getElementById('history-chips');
    if (!container) return;
    
    if (moveHistoryNotation.length === 1) container.innerHTML = '';
    const chip = document.createElement('span');
    chip.className = 'history-chip active';
    const num = Math.ceil(moveHistoryNotation.length / 2);
    chip.textContent = moveHistoryNotation.length % 2 === 1 ? `${num}. ${notation}` : notation;
    
    container.querySelectorAll('.history-chip.active').forEach(c => c.classList.remove('active'));
    container.appendChild(chip);
    container.scrollLeft = container.scrollWidth;
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
    
    const capWhite = document.getElementById('captured-by-white');
    const capBlack = document.getElementById('captured-by-black');
    if (capWhite) {
        capWhite.innerHTML = captured.white.map(p => `<div class="captured-piece-mini">${getPieceSvg('black', p.type)}</div>`).join('');
    }
    if (capBlack) {
        capBlack.innerHTML = captured.black.map(p => `<div class="captured-piece-mini">${getPieceSvg('white', p.type)}</div>`).join('');
    }
    
    const clkW = document.getElementById('clock-white');
    const clkB = document.getElementById('clock-black');
    if (clkW) clkW.classList.toggle('active', turn === 'white' && matchClockLimit > 0);
    if (clkB) clkB.classList.toggle('active', turn === 'black' && matchClockLimit > 0);
}

function startClock() {
    stopClock();
    if (matchClockLimit <= 0) {
        document.getElementById('time-white').textContent = '♾️';
        document.getElementById('time-black').textContent = '♾️';
        return;
    }
    clockTimes = { white: matchClockLimit, black: matchClockLimit };
    updateClockDisplay();
    clockInterval = setInterval(() => {
        if (isGameOver) return;
        clockTimes[turn]--;
        updateClockDisplay();
        if (clockTimes[turn] <= 0) {
            stopClock();
            isGameOver = true;
            const winner = turn === 'white' ? 'black' : 'white';
            showGameOverModal(`Time expired! ${playerNames[winner]} wins on time!`);
            audio.defeat();
        }
    }, 1000);
}

function stopClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = null;
}

function updateClockDisplay() {
    const format = t => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const tw = document.getElementById('time-white');
    const tb = document.getElementById('time-black');
    if (tw) tw.textContent = format(clockTimes.white);
    if (tb) tb.textContent = format(clockTimes.black);
}

function showPromotionModal(color) {
    const modal = document.getElementById('promotion-modal');
    const container = document.getElementById('promo-options');
    if (!modal || !container) return;
    container.innerHTML = '';
    
    ['q', 'r', 'b', 'n'].forEach(type => {
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

function showGameOverModal(msg) {
    const modal = document.getElementById('gameover-modal');
    const desc = document.getElementById('gameover-msg');
    if (!modal || !desc) return;
    desc.textContent = msg;
    modal.classList.remove('hidden');
}

// =========================================================
// 2. FOUR KINGDOMS / 4-PLAYER INTEGRATED ENGINE
// =========================================================

const FOUR_KINGDOMS = ['red', 'blue', 'gold', 'green'];
const FOUR_KINGDOM_NAMES = {
    red: 'Red Lord (South)',
    blue: 'Blue Baron (West)',
    gold: 'Gold Emperor (North)',
    green: 'Green Duke (East)'
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
let fourMode = 'ai';

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
    fourArmies = {
        red: { alive: true, count: 16 },
        blue: { alive: true, count: 16 },
        gold: { alive: true, count: 16 },
        green: { alive: true, count: 16 }
    };
    
    const backPieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const backPiecesMirror = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
    
    // Red (South)
    for (let c = 3; c <= 10; c++) {
        fourBoard[12][c] = { type: 'p', color: 'red', dir: 'up', hasMoved: false };
        fourBoard[13][c] = { type: backPieces[c - 3], color: 'red', hasMoved: false };
    }
    
    // Gold (North)
    for (let c = 3; c <= 10; c++) {
        fourBoard[1][c] = { type: 'p', color: 'gold', dir: 'down', hasMoved: false };
        fourBoard[0][c] = { type: backPieces[c - 3], color: 'gold', hasMoved: false };
    }
    
    // Blue (West)
    for (let r = 3; r <= 10; r++) {
        fourBoard[r][1] = { type: 'p', color: 'blue', dir: 'right', hasMoved: false };
        fourBoard[r][0] = { type: backPiecesMirror[r - 3], color: 'blue', hasMoved: false };
    }
    
    // Green (East)
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
    
    const selectedMoves = fourSelected ? getFourMoves(fourSelected.r, fourSelected.c) : [];
    
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
    if (isVoidSquare(r, c)) return;
    if (fourMode === 'ai' && fourTurn !== 'red') return;
    
    const clickedPiece = fourBoard[r][c];
    
    if (fourSelected) {
        const moves = getFourMoves(fourSelected.r, fourSelected.c);
        const targetMove = moves.find(m => m.r === r && m.c === c);
        
        if (targetMove) {
            executeFourMove(fourSelected, targetMove);
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
        const victor = aliveKingdoms[0];
        showGameOverModal(`🏆 ${FOUR_KINGDOM_NAMES[victor]} has conquered the Four Kingdoms Realm!`);
        if (victor === 'red') {
            lordProfile.fourWins++;
            saveProfile();
            audio.victory();
        }
        return;
    }
    
    if (fourMode === 'ai' && fourTurn !== 'red') {
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
    showToast(`${FOUR_KINGDOM_NAMES[color]} King was captured! Kingdom Eliminated!`, 'error');
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            if (fourBoard[r][c] && fourBoard[r][c].color === color) {
                fourBoard[r][c] = null;
            }
        }
    }
}

function makeFourAIMove() {
    if (fourTurn === 'red' || !fourArmies[fourTurn].alive) return;
    
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
    const badge = document.getElementById('four-turn-badge');
    const text = document.getElementById('four-turn-text');
    if (text) text.textContent = `${FOUR_KINGDOM_NAMES[fourTurn]}'s Turn`;
    if (badge) {
        const dot = badge.querySelector('.kingdom-dot');
        if (dot) dot.className = `kingdom-dot ${fourTurn}`;
    }
    
    FOUR_KINGDOMS.forEach(k => {
        const card = document.getElementById(`hud-k-${k}`);
        const statusEl = document.getElementById(`k-status-${k}`);
        if (card) {
            card.classList.toggle('active-turn', fourTurn === k && fourArmies[k].alive);
            card.classList.toggle('eliminated', !fourArmies[k].alive);
        }
        if (statusEl) {
            statusEl.textContent = fourArmies[k].alive ? `${fourArmies[k].count} Army` : 'Fallen';
        }
    });
}

// =========================================================
// 3. CASTLE TACTICS & OPENINGS MASTER
// =========================================================

const PUZZLES = [
    {
        title: 'Puzzle #1: Scholar\'s Mate',
        instruction: '⚪ White Queen to move & checkmate on f7',
        board: [
            ['r', null, 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', null, 'p', 'p', 'p'],
            [null, null, 'n', null, null, null, null, null],
            [null, null, null, null, 'p', null, null, null],
            [null, null, 'B', null, 'P', null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', null, 'P', 'P', 'P'],
            ['R', 'N', 'B', null, 'K', null, 'N', 'R']
        ],
        extraWhiteQueen: { r: 4, c: 7 },
        solution: { from: { r: 4, c: 7 }, to: { r: 1, c: 5 } }
    },
    {
        title: 'Puzzle #2: Back-Rank Mate',
        instruction: '⚪ White Rook to move & checkmate on d8',
        board: [
            [null, null, null, null, null, 'r', 'k', null],
            ['p', 'p', 'p', null, null, 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', null, null, 'P', 'P', 'P'],
            [null, null, null, 'R', null, null, 'K', null]
        ],
        solution: { from: { r: 7, c: 3 }, to: { r: 0, c: 3 } }
    }
];

let currentPuzzleIdx = 0;
let puzzleBoardState = [];
let puzzleSelected = null;

function renderCurrentPuzzle() {
    const p = PUZZLES[currentPuzzleIdx];
    document.getElementById('puzzle-level-tag').textContent = p.title;
    document.getElementById('puzzle-turn-text').textContent = p.instruction;
    document.getElementById('puzzle-feedback').textContent = '';
    
    puzzleBoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sym = p.board[r][c];
            if (sym) {
                const isW = sym === sym.toUpperCase();
                puzzleBoardState[r][c] = { type: sym.toLowerCase(), color: isW ? 'white' : 'black' };
            }
        }
    }
    if (p.extraWhiteQueen) {
        puzzleBoardState[p.extraWhiteQueen.r][p.extraWhiteQueen.c] = { type: 'q', color: 'white' };
    }
    
    drawPuzzleBoard();
}

function drawPuzzleBoard() {
    const el = document.getElementById('puzzle-board');
    if (!el) return;
    el.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const isLight = (r + c) % 2 === 0;
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            
            if (puzzleSelected && puzzleSelected.r === r && puzzleSelected.c === c) {
                sq.classList.add('selected');
            }
            
            const piece = puzzleBoardState[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = 'piece-svg';
                pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pEl);
            }
            
            sq.addEventListener('click', () => handlePuzzleClick(r, c));
            el.appendChild(sq);
        }
    }
}

function handlePuzzleClick(r, c) {
    const p = PUZZLES[currentPuzzleIdx];
    const piece = puzzleBoardState[r][c];
    
    if (puzzleSelected) {
        if (puzzleSelected.r === p.solution.from.r && puzzleSelected.c === p.solution.from.c &&
            r === p.solution.to.r && c === p.solution.to.c) {
            puzzleBoardState[r][c] = puzzleBoardState[puzzleSelected.r][puzzleSelected.c];
            puzzleBoardState[puzzleSelected.r][puzzleSelected.c] = null;
            puzzleSelected = null;
            drawPuzzleBoard();
            document.getElementById('puzzle-feedback').innerHTML = '<span style="color:#22c55e;">👑 Masterful! Brilliant Checkmate!</span>';
            audio.victory();
            lordProfile.puzzles++;
            saveProfile();
            return;
        } else {
            document.getElementById('puzzle-feedback').innerHTML = '<span style="color:#ef4444;">❌ Incorrect move, rethink your tactic!</span>';
            puzzleSelected = null;
            drawPuzzleBoard();
        }
    } else {
        if (piece && piece.color === 'white') {
            puzzleSelected = { r, c };
            drawPuzzleBoard();
        }
    }
}

// Openings Master
const OPENINGS_DATA = {
    italian: {
        title: 'Italian Game (Giuoco Piano)',
        desc: 'One of the oldest chess openings. Develops the Bishop to c4 to target the weak f7 square.',
        moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
        notation: '1. e4 e5 2. Nf3 Nc6 3. Bc4'
    },
    sicilian: {
        title: 'Sicilian Defense (Open)',
        desc: 'The most popular counter-attacking defense against White’s 1. e4.',
        moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4'],
        notation: '1. e4 c5 2. Nf3 d6 3. d4'
    },
    queens_gambit: {
        title: 'Queen\'s Gambit',
        desc: 'White offers the c4 pawn to dominate the critical central board squares.',
        moves: ['d2d4', 'd7d5', 'c2c4'],
        notation: '1. d4 d5 2. c4'
    },
    ruy_lopez: {
        title: 'Ruy Lopez (Spanish Opening)',
        desc: 'Classical mastery. White pins the knight guarding Black’s e5 pawn.',
        moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
        notation: '1. e4 e5 2. Nf3 Nc6 3. Bb5'
    },
    french: {
        title: 'French Defense',
        desc: 'Solid pawn structure preparing immediate counterplay with ...d5.',
        moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5'],
        notation: '1. e4 e6 2. d4 d5'
    },
    scandinavian: {
        title: 'Scandinavian Defense',
        desc: 'Directly challenges White\'s center pawn on move 1.',
        moves: ['e2e4', 'd7d5'],
        notation: '1. e4 d5'
    }
};

let currentOpeningKey = 'italian';
let currentOpeningStep = 0;
let openingsBoardState = [];

function initOpeningsBoard() {
    openingsBoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
        openingsBoardState[0][c] = { type: backRow[c], color: 'black' };
        openingsBoardState[1][c] = { type: 'p', color: 'black' };
        openingsBoardState[6][c] = { type: 'p', color: 'white' };
        openingsBoardState[7][c] = { type: backRow[c], color: 'white' };
    }
}

function parseAlgToCoord(str) {
    const files = { a:0, b:1, c:2, d:3, e:4, f:5, g:6, h:7 };
    const fc = files[str[0]];
    const fr = 8 - parseInt(str[1]);
    const tc = files[str[2]];
    const tr = 8 - parseInt(str[3]);
    return { from: { r: fr, c: fc }, to: { r: tr, c: tc } };
}

function drawOpeningsBoard() {
    const el = document.getElementById('openings-board');
    if (!el) return;
    el.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const isLight = (r + c) % 2 === 0;
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            
            const piece = openingsBoardState[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.className = 'piece-svg';
                pEl.innerHTML = getPieceSvg(piece.color, piece.type);
                sq.appendChild(pEl);
            }
            el.appendChild(sq);
        }
    }
}

function stepOpeningMove(direction) {
    const opening = OPENINGS_DATA[currentOpeningKey];
    if (direction === 'next' && currentOpeningStep < opening.moves.length) {
        const move = parseAlgToCoord(opening.moves[currentOpeningStep]);
        openingsBoardState[move.to.r][move.to.c] = openingsBoardState[move.from.r][move.from.c];
        openingsBoardState[move.from.r][move.from.c] = null;
        currentOpeningStep++;
        audio.move();
    } else if (direction === 'reset') {
        initOpeningsBoard();
        currentOpeningStep = 0;
    }
    drawOpeningsBoard();
}

// =========================================================
// 4. PROFILE & LOCALSTORAGE PERSISTENCE
// =========================================================

function loadProfile() {
    try {
        const raw = localStorage.getItem('electro_king_lord_profile');
        if (raw) {
            lordProfile = { ...lordProfile, ...JSON.parse(raw) };
        }
    } catch (e) {
        console.warn('Could not load profile:', e);
    }
    updateProfileUI();
}

function saveProfile() {
    try {
        localStorage.setItem('electro_king_lord_profile', JSON.stringify(lordProfile));
    } catch (e) {
        console.warn('Could not save profile:', e);
    }
    updateProfileUI();
}

function updateProfileUI() {
    const pName = document.getElementById('profile-name');
    const hudName = document.getElementById('hud-lord-name');
    const pNameTag = document.getElementById('player-name-tag');
    const pMatches = document.getElementById('stat-matches');
    const pWins = document.getElementById('stat-wins');
    const pRate = document.getElementById('stat-winrate');
    const pFourWins = document.getElementById('stat-four-wins');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (pName) pName.textContent = lordProfile.name;
    if (hudName) hudName.textContent = lordProfile.name;
    if (pNameTag) pNameTag.textContent = lordProfile.name;
    if (pMatches) pMatches.textContent = lordProfile.matches;
    if (pWins) pWins.textContent = lordProfile.wins;
    if (pFourWins) pFourWins.textContent = lordProfile.fourWins;
    if (avatarEl) avatarEl.textContent = lordProfile.avatar;
    
    if (pRate) {
        const rate = lordProfile.matches > 0 ? Math.round((lordProfile.wins / lordProfile.matches) * 100) : 0;
        pRate.textContent = `${rate}%`;
    }
    
    playerNames.white = lordProfile.name;
}

// =========================================================
// 5. TOAST & NAVIGATION
// =========================================================

function showToast(msg, type = 'info', duration = 2800) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    const screen = document.getElementById(`screen-${tabId}`);
    const navBtn = document.getElementById(`nav-btn-${tabId}`);
    if (screen) screen.classList.add('active');
    if (navBtn) navBtn.classList.add('active');
    
    if (tabId === 'arena') {
        if (arenaSubMode === '2p') {
            draw2PlayerBoard();
        } else {
            drawFourBoard();
        }
    } else if (tabId === 'puzzles') {
        renderCurrentPuzzle();
    }
}

function switchArenaSubMode(mode) {
    arenaSubMode = mode;
    const btn2p = document.getElementById('arena-toggle-2p');
    const btn4p = document.getElementById('arena-toggle-4p');
    const view2p = document.getElementById('view-2player-arena');
    const view4p = document.getElementById('view-4player-arena');
    
    if (mode === '2p') {
        if (btn2p) btn2p.classList.add('active');
        if (btn4p) btn4p.classList.remove('active');
        if (view2p) view2p.classList.remove('hidden');
        if (view4p) view4p.classList.add('hidden');
        draw2PlayerBoard();
        if (fx2p) fx2p.resize();
    } else {
        if (btn4p) btn4p.classList.add('active');
        if (btn2p) btn2p.classList.remove('active');
        if (view4p) view4p.classList.remove('hidden');
        if (view2p) view2p.classList.add('hidden');
        drawFourBoard();
        if (fx4p) fx4p.resize();
    }
}

// =========================================================
// 6. EVENT LISTENERS INITIALIZATION
// =========================================================

function setupEventListeners() {
    // Mode Switcher Widget in Arena
    const arena2pBtn = document.getElementById('arena-toggle-2p');
    const arena4pBtn = document.getElementById('arena-toggle-4p');
    if (arena2pBtn) arena2pBtn.addEventListener('click', () => switchArenaSubMode('2p'));
    if (arena4pBtn) arena4pBtn.addEventListener('click', () => switchArenaSubMode('4p'));
    
    // Bottom Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
    
    // In-game Action Buttons
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (history.length > 0 && !isGameOver) {
                const prev = history.pop();
                board = prev.board;
                turn = prev.turn;
                lastMove = prev.lastMove;
                captured = prev.captured;
                selectedSquare = null;
                activeHint = null;
                updateHUD();
                draw2PlayerBoard();
                showToast('Move Undone ↩️');
            }
        });
    }
    
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.addEventListener('click', () => {
            const legals = getAllLegalMoves(turn, board);
            if (legals.length > 0) {
                activeHint = legals[Math.floor(Math.random() * legals.length)];
                draw2PlayerBoard();
                showToast('💡 Tactical Advisor illuminated a move!');
            }
        });
    }
    
    const strikeBtn = document.getElementById('powerup-btn');
    if (strikeBtn) {
        strikeBtn.addEventListener('click', () => {
            audio.powerup();
            if (fx2p) {
                fx2p.shockwave(fx2p.canvas.width / 2, fx2p.canvas.height / 2, '#d4af37');
            }
            showToast('⚡ Royal Strike unleashed on the battlefield!');
        });
    }
    
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            document.getElementById('sound-icon').textContent = audio.enabled ? '🔊' : '🔇';
            showToast(audio.enabled ? 'Sound enabled 🔊' : 'Sound muted 🔇');
        });
    }
    
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            document.getElementById('setup-modal').classList.remove('hidden');
        });
    }
    
    const setupCloseBtn = document.getElementById('setup-close-btn');
    if (setupCloseBtn) {
        setupCloseBtn.addEventListener('click', () => {
            document.getElementById('setup-modal').classList.add('hidden');
        });
    }
    
    // 2-Player Setup Match Form
    document.querySelectorAll('.clock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.clock-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            matchClockLimit = parseInt(btn.dataset.time);
        });
    });
    
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playerSide = btn.dataset.side === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : btn.dataset.side;
            botSide = playerSide === 'white' ? 'black' : 'white';
        });
    });
    
    document.querySelectorAll('.bot-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.bot-card').forEach(b => b.classList.remove('active'));
            card.classList.add('active');
            difficulty = parseInt(card.dataset.diff);
            playerNames.black = `${BOT_PERSONALITIES[difficulty].name}`;
            const oppTag = document.getElementById('opponent-name-tag');
            if (oppTag) oppTag.textContent = playerNames.black;
        });
    });
    
    const startMatchBtn = document.getElementById('start-match-btn');
    if (startMatchBtn) {
        startMatchBtn.addEventListener('click', () => {
            document.getElementById('setup-modal').classList.add('hidden');
            startNew2PlayerGame();
        });
    }
    
    // 4-Player Controls
    const fourResetBtn = document.getElementById('four-reset-btn');
    if (fourResetBtn) {
        fourResetBtn.addEventListener('click', () => {
            initFourPlayerBoard();
            showToast('Four Kingdoms Realm Reset 🔄');
        });
    }
    
    const fourAIStepBtn = document.getElementById('four-ai-step-btn');
    if (fourAIStepBtn) {
        fourAIStepBtn.addEventListener('click', () => {
            makeFourAIMove();
        });
    }
    
    const fourRulesBtn = document.getElementById('four-rules-btn');
    if (fourRulesBtn) {
        fourRulesBtn.addEventListener('click', () => {
            document.getElementById('four-rules-modal').classList.remove('hidden');
        });
    }
    
    const fourRulesClose = document.getElementById('four-rules-close-btn');
    const fourRulesOk = document.getElementById('four-rules-ok-btn');
    if (fourRulesClose) fourRulesClose.addEventListener('click', () => document.getElementById('four-rules-modal').classList.add('hidden'));
    if (fourRulesOk) fourRulesOk.addEventListener('click', () => document.getElementById('four-rules-modal').classList.add('hidden'));
    
    // 4-Player Mode buttons
    const fourModeAIBtn = document.getElementById('four-mode-ai-btn');
    const fourModePassBtn = document.getElementById('four-mode-pass-btn');
    const fourModeOnlineBtn = document.getElementById('four-mode-online-btn');
    
    if (fourModeAIBtn) {
        fourModeAIBtn.addEventListener('click', () => {
            fourMode = 'ai';
            fourModeAIBtn.classList.add('active');
            fourModePassBtn.classList.remove('active');
            fourModeOnlineBtn.classList.remove('active');
            showToast('Mode: 🤖 vs 3 Kingdom Bots');
        });
    }
    if (fourModePassBtn) {
        fourModePassBtn.addEventListener('click', () => {
            fourMode = 'pass';
            fourModePassBtn.classList.add('active');
            fourModeAIBtn.classList.remove('active');
            fourModeOnlineBtn.classList.remove('active');
            showToast('Mode: 👥 Pass & Play');
        });
    }
    if (fourModeOnlineBtn) {
        fourModeOnlineBtn.addEventListener('click', () => {
            document.getElementById('four-lobby-modal').classList.remove('hidden');
        });
    }
    
    const lobbyClose = document.getElementById('four-lobby-close-btn');
    if (lobbyClose) lobbyClose.addEventListener('click', () => document.getElementById('four-lobby-modal').classList.add('hidden'));
    
    const hostTabBtn = document.getElementById('lobby-host-tab-btn');
    const joinTabBtn = document.getElementById('lobby-join-tab-btn');
    const hostView = document.getElementById('lobby-host-view');
    const joinView = document.getElementById('lobby-join-view');
    
    if (hostTabBtn && joinTabBtn) {
        hostTabBtn.addEventListener('click', () => {
            hostTabBtn.classList.add('active');
            joinTabBtn.classList.remove('active');
            hostView.classList.remove('hidden');
            joinView.classList.add('hidden');
        });
        joinTabBtn.addEventListener('click', () => {
            joinTabBtn.classList.add('active');
            hostTabBtn.classList.remove('active');
            joinView.classList.remove('hidden');
            hostView.classList.add('hidden');
        });
    }
    
    const hostLaunchBtn = document.getElementById('host-launch-match-btn');
    if (hostLaunchBtn) {
        hostLaunchBtn.addEventListener('click', () => {
            document.getElementById('four-lobby-modal').classList.add('hidden');
            initFourPlayerBoard();
            showToast('⚔️ Royal Realm Battle Commenced!');
        });
    }
    
    const joinActionBtn = document.getElementById('join-room-action-btn');
    if (joinActionBtn) {
        joinActionBtn.addEventListener('click', () => {
            const code = document.getElementById('join-code-input').value.trim();
            if (code) {
                document.getElementById('four-lobby-modal').classList.add('hidden');
                initFourPlayerBoard();
                showToast(`🛡️ Entered Realm Room: ${code}!`);
            } else {
                showToast('Please enter room code', 'error');
            }
        });
    }
    
    // Puzzles Tab Subnav
    const subPuzzlesBtn = document.getElementById('subnav-puzzles-btn');
    const subOpeningsBtn = document.getElementById('subnav-openings-btn');
    const puzzlesView = document.getElementById('puzzles-view-container');
    const openingsView = document.getElementById('openings-view-container');
    
    if (subPuzzlesBtn && subOpeningsBtn) {
        subPuzzlesBtn.addEventListener('click', () => {
            subPuzzlesBtn.classList.add('active');
            subOpeningsBtn.classList.remove('active');
            puzzlesView.classList.remove('hidden');
            openingsView.classList.add('hidden');
        });
        subOpeningsBtn.addEventListener('click', () => {
            subOpeningsBtn.classList.add('active');
            subPuzzlesBtn.classList.remove('active');
            openingsView.classList.remove('hidden');
            puzzlesView.classList.add('hidden');
            initOpeningsBoard();
            drawOpeningsBoard();
        });
    }
    
    const puzzleNextBtn = document.getElementById('puzzle-next-btn');
    if (puzzleNextBtn) {
        puzzleNextBtn.addEventListener('click', () => {
            currentPuzzleIdx = (currentPuzzleIdx + 1) % PUZZLES.length;
            renderCurrentPuzzle();
        });
    }
    const puzzleResetBtn = document.getElementById('puzzle-reset-btn');
    if (puzzleResetBtn) {
        puzzleResetBtn.addEventListener('click', () => renderCurrentPuzzle());
    }
    
    // Openings
    const openDropdown = document.getElementById('openings-dropdown');
    if (openDropdown) {
        openDropdown.addEventListener('change', (e) => {
            currentOpeningKey = e.target.value;
            const op = OPENINGS_DATA[currentOpeningKey];
            document.getElementById('opening-title').textContent = op.title;
            document.getElementById('opening-desc').textContent = op.desc;
            document.getElementById('opening-move-notation').textContent = op.notation;
            stepOpeningMove('reset');
        });
    }
    
    const openNextBtn = document.getElementById('opening-next-btn');
    const openResetBtn = document.getElementById('opening-reset-btn');
    if (openNextBtn) openNextBtn.addEventListener('click', () => stepOpeningMove('next'));
    if (openResetBtn) openResetBtn.addEventListener('click', () => stepOpeningMove('reset'));
    
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
                showToast(`Title saved: ${val} 👑`, 'success');
            }
        });
    }
    
    const restartBtn = document.getElementById('gameover-restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.add('hidden');
            startNew2PlayerGame();
        });
    }
}

function startNew2PlayerGame() {
    isGameOver = false;
    turn = 'white';
    selectedSquare = null;
    lastMove = null;
    history = [];
    captured = { white: [], black: [] };
    activeHint = null;
    moveHistoryNotation = [];
    
    init2PlayerBoard();
    updateHUD();
    draw2PlayerBoard();
    startClock();
    
    if (gameMode === 'ai' && botSide === 'white') {
        setTimeout(make2PlayerAIMove, 500);
    }
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
    fx2p = new CastleFX('fx-canvas');
    fx4p = new CastleFX('four-fx-canvas');
    
    loadProfile();
    setupEventListeners();
    init2PlayerBoard();
    initFourPlayerBoard();
    initOpeningsBoard();
    draw2PlayerBoard();
    startClock();
    console.log('Electro King: Castle Realm Edition initialized successfully!');
});
