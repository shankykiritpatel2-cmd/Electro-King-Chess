// --- GAME CONFIGURATION & VALUES ---
const PIECE_VALUES = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 10000 };
const CAPTURE_POINTS = { 'p': 5, 'n': 30, 'b': 20, 'r': 30, 'q': 50 };
const UNICODE_PIECES = {
    white: { 'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙' },
    black: { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
};

// --- GAME STATE ---
let board = []; // 8x8 array. Elements: null or { type, color, hasMoved }
let turn = 'white'; // 'white' or 'black'
let selectedSquare = null; // { r, c }
let lastMove = null; // { from: {r,c}, to: {r,c}, piece: {type, color} }
let history = []; // Stack of states for undo
let captured = { white: [], black: [] }; // White pieces captured by black, etc.
let gameMode = 'ai'; // 'ai' or 'local'
let playerSide = 'white'; // 'white', 'black', or 'random'
let botSide = 'black'; // Bot side for AI mode
let difficulty = 2; // 1: Beginner, 2: Easy, 3: Hard, 4: Difficult
let playerNames = { white: 'Player 1', black: 'ElectroBot 🤖' };
let matchScore = 0;
let careerPoints = 0;
let soundEnabled = true;
let isGameOver = false;
let pendingPromotion = null; // { from: {r,c}, to: {r,c} } - pauses turn for promotion pick
let activeHint = null; // { from: {r,c}, to: {r,c} }

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

    // Mobile haptics where supported
    if (navigator.vibrate) {
        if (type === 'move') navigator.vibrate(15);
        else if (type === 'capture') navigator.vibrate([25, 30, 40]);
        else if (type === 'check') navigator.vibrate([40, 50, 40]);
        else if (type === 'win') navigator.vibrate([60, 40, 60, 40, 100]);
    }

    if (type === 'move') {
        // High-tech tactile piece slide
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

        // Crisp snap click
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(900, now);
        clickGain.gain.setValueAtTime(0.05, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        clickOsc.start(now);
        clickOsc.stop(now + 0.03);
    } else if (type === 'capture') {
        // Heavy punchy laser bass impact
        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.connect(subGain);
        subGain.connect(audioCtx.destination);
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(220, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        subGain.gain.setValueAtTime(0.2, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        sub.start(now);
        sub.stop(now + 0.18);

        // Cyber spark crackle
        const zap = audioCtx.createOscillator();
        const zapGain = audioCtx.createGain();
        zap.connect(zapGain);
        zapGain.connect(audioCtx.destination);
        zap.type = 'square';
        zap.frequency.setValueAtTime(750, now);
        zap.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        zapGain.gain.setValueAtTime(0.08, now);
        zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        zap.start(now);
        zap.stop(now + 0.12);
    } else if (type === 'check') {
        // Dramatic triple sci-fi alarm sting
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
        // Uplifting futuristic synthwave chord arpeggio
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
        // Futuristic cyber scanner chime
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
        // Glitch rewind sound
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

// --- CORE CHESS ENGINE RULES ---

// Setup initial board
function initBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Back rows
    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
        board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
    }
    
    // Pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: 'p', color: 'black', hasMoved: false };
        board[6][col] = { type: 'p', color: 'white', hasMoved: false };
    }
}

// Get copy of current board state
function cloneBoard(currentBoard) {
    return currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
}

// Helper: check if square coordinates are valid
function onBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Check if square is attacked by any attackerColor pieces
function isSquareAttackedBy(targetR, targetC, attackerColor, testBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p && p.color === attackerColor) {
                // Pawns diagonal attacks only
                if (p.type === 'p') {
                    const dir = attackerColor === 'white' ? -1 : 1;
                    if (targetR === r + dir && (targetC === c - 1 || targetC === c + 1)) {
                        return true;
                    }
                } else {
                    // For other pieces, getRawMoves captures the exact attack paths!
                    // Crucial: Pass 'true' for ignoringCastling to prevent infinite mutual recursion loops
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

// Generate basic moves ignoring checks
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
            
            // Move 1 step forward
            const step1R = r + dir;
            if (onBoard(step1R, c) && !testBoard[step1R][c]) {
                moves.push({ r: step1R, c: c });
                // Move 2 steps from start
                const step2R = r + 2 * dir;
                if (r === startRow && !testBoard[step2R][c]) {
                    moves.push({ r: step2R, c: c });
                }
            }
            
            // Standard captures
            const captureCols = [c - 1, c + 1];
            captureCols.forEach(col => {
                if (onBoard(step1R, col)) {
                    const target = testBoard[step1R][col];
                    if (target && target.color === oppositeColor) {
                        moves.push({ r: step1R, c: col });
                    }
                }
            });

            // --- EN PASSANT RULE ---
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

            // --- CASTLING RULE ---
            // King must not have moved, and must not currently be in check
            // Crucial: Only compute castling moves if ignoringCastling flag is false to terminate mutual recursion loops
            if (!ignoringCastling && !piece.hasMoved && !isKingInCheck(color, testBoard)) {
                // Kingside Castling
                const rookK = testBoard[r][7];
                if (rookK && rookK.type === 'r' && rookK.color === color && !rookK.hasMoved) {
                    if (!testBoard[r][5] && !testBoard[r][6]) {
                        if (!isSquareAttackedBy(r, 5, oppositeColor, testBoard) && 
                            !isSquareAttackedBy(r, 6, oppositeColor, testBoard)) {
                            moves.push({ r: r, c: 6, isCastling: true });
                        }
                    }
                }

                // Queenside Castling
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

// Helper: slider piece logic
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
                break; // Hit a piece, path blocked
            }
            tr += dr;
            tc += dc;
        }
    });
}

// Find King position
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

// Check if King of "color" is currently in check
function isKingInCheck(color, testBoard = board) {
    const kingPos = findKing(color, testBoard);
    if (!kingPos) return false;
    
    const oppositeColor = color === 'white' ? 'black' : 'white';
    return isSquareAttackedBy(kingPos.r, kingPos.c, oppositeColor, testBoard);
}

// Generate fully LEGAL moves (ensuring the king isn't left or placed in check)
function getLegalMoves(r, c, testBoard = board) {
    const piece = testBoard[r][c];
    if (!piece) return [];
    
    const rawMoves = getRawMoves(r, c, testBoard);
    const legalMoves = [];
    
    rawMoves.forEach(move => {
        // Explicitly block moves that capture a King to prevent it from disappearing
        const targetPiece = testBoard[move.r][move.c];
        if (targetPiece && targetPiece.type === 'k') {
            return;
        }
        
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

// Collect ALL legal moves for a player's side
function getAllLegalMoves(color, testBoard = board) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = testBoard[r][c];
            if (piece && piece.color === color) {
                const moves = getLegalMoves(r, c, testBoard);
                moves.forEach(m => {
                    allMoves.push({
                        from: { r, c },
                        to: m,
                        piece: piece
                    });
                });
            }
        }
    }
    return allMoves;
}

// --- HIGH-PERFORMANCE CANVAS PARTICLE FX ENGINE ---
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
        if (!this.animId) {
            this.loop();
        }
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
        
        // Shockwave ring
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

        // Crisp neon sparks
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
                color: (i % 2 === 0) ? shockColor : '#ffb703'
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
        const colors = ['#00f5d4', '#9d4edd', '#ff0054', '#ffb703', '#ffffff'];
        
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
                color: '#ffb703',
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
            this.animId = null; // Clean stop when no particles
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

// --- DYNAMIC GRAPHICS / HUD RENDERERS ---

// Create the 64 chessboard squares with coordinates
function drawBoard() {
    const boardElement = document.getElementById('chessboard');
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;
            
            // Ranks (1-8) along col 0
            if (c === 0) {
                const rankTag = document.createElement('span');
                rankTag.className = 'coord-tag coord-rank';
                rankTag.textContent = 8 - r;
                square.appendChild(rankTag);
            }

            // Files (a-h) along row 7
            if (r === 7) {
                const fileTag = document.createElement('span');
                fileTag.className = 'coord-tag coord-file';
                fileTag.textContent = String.fromCharCode(97 + c);
                square.appendChild(fileTag);
            }

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
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.className = sq.className.replace(/\b(selected|valid-move-marker|valid-move|capture-target|last-move-source|last-move-dest|in-check|hint-source|hint-dest|castling-rook-target)\b/g, '').trim();
        const marker = sq.querySelector('.valid-move-marker');
        if (marker) marker.remove();
    });
    
    // 1. King in Check highlight
    ['white', 'black'].forEach(side => {
        if (isKingInCheck(side)) {
            const kingPos = findKing(side);
            if (kingPos) {
                const sq = getSquareNode(kingPos.r, kingPos.c);
                if (sq) sq.classList.add('in-check');
            }
        }
    });

    // 2. Selection highlights
    if (selectedSquare) {
        const selNode = getSquareNode(selectedSquare.r, selectedSquare.c);
        if (selNode) selNode.classList.add('selected');
        
        const legal = getLegalMoves(selectedSquare.r, selectedSquare.c);
        legal.forEach(move => {
            const targetNode = getSquareNode(move.r, move.c);
            if (targetNode) {
                const isCapture = board[move.r][move.c] !== null || move.isEnPassant;
                if (isCapture) {
                    targetNode.classList.add('capture-target');
                } else {
                    targetNode.classList.add('valid-move');
                    const dot = document.createElement('div');
                    dot.className = 'valid-move-marker';
                    targetNode.appendChild(dot);
                }
            }
            if (move.isCastling) {
                const rookCol = move.c === 6 ? 7 : 0;
                const rookNode = getSquareNode(move.r, rookCol);
                if (rookNode) {
                    rookNode.classList.add('castling-rook-target');
                }
            }
        });
    }
    
    // 3. Last move trail
    if (lastMove) {
        const srcNode = getSquareNode(lastMove.from.r, lastMove.from.c);
        const destNode = getSquareNode(lastMove.to.r, lastMove.to.c);
        if (srcNode) srcNode.classList.add('last-move-source');
        if (destNode) destNode.classList.add('last-move-dest');
    }

    // 4. Suggestions highlight
    if (activeHint) {
        const srcNode = getSquareNode(activeHint.from.r, activeHint.from.c);
        const destNode = getSquareNode(activeHint.to.r, activeHint.to.c);
        if (srcNode) srcNode.classList.add('hint-source');
        if (destNode) destNode.classList.add('hint-dest');
    }
}

function getSquareNode(r, c) {
    return document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
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
    
    whiteCapturedList.innerHTML = '';
    blackCapturedList.innerHTML = '';
    
    captured.white.forEach(p => {
        const item = document.createElement('div');
        item.className = 'captured-item white';
        item.textContent = UNICODE_PIECES['white'][p.type];
        whiteCapturedList.appendChild(item);
    });
    
    captured.black.forEach(p => {
        const item = document.createElement('div');
        item.className = 'captured-item black';
        item.textContent = UNICODE_PIECES['black'][p.type];
        blackCapturedList.appendChild(item);
    });
    
    const undoBtn = document.getElementById('undo-btn');
    if (history.length > 0 && !isGameOver && careerPoints >= 100) {
        undoBtn.classList.remove('disabled');
    } else {
        undoBtn.classList.add('disabled');
    }

    const hintBtn = document.getElementById('hint-btn');
    const isPlayersTurn = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
    if (careerPoints >= 100 && isPlayersTurn && !isGameOver) {
        hintBtn.classList.remove('disabled');
    } else {
        hintBtn.classList.add('disabled');
    }
    
    const banner = document.getElementById('turn-banner');
    const msg = document.getElementById('turn-message');
    
    banner.className = `turn-banner ${turn === 'white' ? 'white-turn' : 'black-turn'}`;
    
    if (isGameOver) {
        msg.textContent = "MATCH FINISHED!";
    } else {
        const activeName = playerNames[turn];
        if (gameMode === 'ai' && turn === botSide) {
            msg.textContent = `${activeName} calculating... ⚡`;
        } else {
            msg.textContent = `${activeName}'s turn (${turn.toUpperCase()})`;
        }
    }
}

// Custom animations for popping floating point text values
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

// --- GAME STATE STORAGE (UNDO & LOCALSTORAGE) ---

function pushHistory() {
    const snap = {
        board: cloneBoard(board),
        turn: turn,
        lastMove: lastMove ? { 
            from: { ...lastMove.from }, 
            to: { ...lastMove.to },
            piece: lastMove.piece ? { ...lastMove.piece } : null 
        } : null,
        captured: {
            white: [...captured.white],
            black: [...captured.black]
        },
        matchScore: matchScore
    };
    history.push(snap);
}

function handleUndo() {
    if (history.length === 0 || isGameOver) return;
    
    if (careerPoints < 100) {
        alert("You need at least 100 Career Points to undo a move!");
        return;
    }
    
    careerPoints -= 100;
    saveCareerPoints();
    floatPointsMessage(-100, null, null, true);
    
    activeHint = null; 
    
    if (gameMode === 'ai') {
        if (history.length >= 2) {
            history.pop(); // Pop AI turn
            const targetSnap = history.pop(); // Pop player turn
            restoreState(targetSnap);
        } else if (history.length === 1 && playerSide === 'black') {
            const targetSnap = history.pop();
            restoreState(targetSnap);
        }
    } else {
        const targetSnap = history.pop();
        restoreState(targetSnap);
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
    captured = {
        white: [...snap.captured.white],
        black: [...snap.captured.black]
    };
    matchScore = snap.matchScore;
}

// Load Career Points from LocalStorage
function loadCareerPoints() {
    const saved = localStorage.getItem('electro_king_career');
    careerPoints = saved ? parseInt(saved, 10) : 0;
}

// Save Career Points to LocalStorage
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

// --- INTERACTIVE SELECT & ACTIONS SYSTEM ---

function handleSquareClick(r, c) {
    if (isGameOver || pendingPromotion) return;
    if (gameMode === 'ai' && turn !== playerSide) return;
    
    const piece = board[r][c];
    
    // Selection state
    if (selectedSquare) {
        const moves = getLegalMoves(selectedSquare.r, selectedSquare.c);
        let destinationMatch = moves.find(m => m.r === r && m.c === c);
        
        // 1. King selected -> Player clicks Rook at (r, 7) or (r, 0) to castle
        const selPiece = board[selectedSquare.r][selectedSquare.c];
        if (!destinationMatch && selPiece && selPiece.type === 'k' && r === selectedSquare.r) {
            if (c === 7) {
                destinationMatch = moves.find(m => m.r === r && m.c === 6 && m.isCastling);
            } else if (c === 0) {
                destinationMatch = moves.find(m => m.r === r && m.c === 2 && m.isCastling);
            }
        }

        // 2. Rook selected -> Player clicks King or castling target square to castle
        if (!destinationMatch && selPiece && selPiece.type === 'r') {
            const kingPos = findKing(turn);
            if (kingPos && kingPos.r === selectedSquare.r) {
                const kingMoves = getLegalMoves(kingPos.r, kingPos.c);
                if (selectedSquare.c === 7 && (c === 4 || c === 6)) {
                    destinationMatch = kingMoves.find(m => m.r === kingPos.r && m.c === 6 && m.isCastling);
                    if (destinationMatch) {
                        selectedSquare = { r: kingPos.r, c: kingPos.c };
                    }
                } else if (selectedSquare.c === 0 && (c === 4 || c === 2)) {
                    destinationMatch = kingMoves.find(m => m.r === kingPos.r && m.c === 2 && m.isCastling);
                    if (destinationMatch) {
                        selectedSquare = { r: kingPos.r, c: kingPos.c };
                    }
                }
            }
        }
        
        if (destinationMatch) {
            executeMove(selectedSquare, destinationMatch);
            selectedSquare = null;
            return;
        }
    }
    
    // Selecting your own piece
    if (piece && piece.color === turn) {
        activeHint = null; 
        selectedSquare = { r, c };
        applyBoardHighlights();
    } else {
        selectedSquare = null;
        applyBoardHighlights();
    }
}

// Main execution process of a chess move
function executeMove(from, to, forcePromoType = null) {
    pushHistory(); 
    activeHint = null; 
    
    const activePiece = board[from.r][from.c];
    let isCapture = false;
    let pointsGained = 0;
    
    const isEnPassant = to.isEnPassant;
    const isCastling = to.isCastling;
    
    activePiece.hasMoved = true;
    
    // Spawn move energy trail
    FX.spawnMoveTrail(from, to, activePiece.color);

    // --- 1. EN PASSANT EXECUTION ---
    if (isEnPassant) {
        isCapture = true;
        const capturedPawn = board[from.r][to.c];
        captured[capturedPawn.color].push(capturedPawn);
        board[from.r][to.c] = null; 
        
        FX.spawnCaptureBurst(to.r, to.c, activePiece.color);

        const isHuman = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
        if (isHuman) {
            pointsGained += CAPTURE_POINTS['p'];
        }
    } 
    // --- 2. STANDARD CAPTURES EXECUTION ---
    else {
        const targetPiece = board[to.r][to.c];
        if (targetPiece) {
            isCapture = true;
            captured[targetPiece.color].push(targetPiece);
            
            FX.spawnCaptureBurst(to.r, to.c, activePiece.color);

            const isHuman = (gameMode === 'local') || (gameMode === 'ai' && turn === playerSide);
            if (isHuman) {
                pointsGained += CAPTURE_POINTS[targetPiece.type] || 0;
            }
        }
    }
    
    // Move main piece on board
    board[to.r][to.c] = activePiece;
    board[from.r][from.c] = null;
    
    lastMove = { 
        from, 
        to, 
        piece: { type: activePiece.type, color: activePiece.color } 
    };
    
    // --- 3. CASTLING ROOK RELOCATION ---
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
    
    // Pawn Promotion checks
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
        if (kingPos) {
            FX.spawnCheckSparks(kingPos.r, kingPos.c);
        }
    } else {
        playSound(isCapture ? 'capture' : 'move');
    }
    
    // Only reward points if there are points gained (which is on player capture only)
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
        btn.className = 'promo-btn';
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

// Verify checkmate or stalemates
function checkGameOver() {
    const nextPlayer = turn === 'white' ? 'black' : 'white';
    const legalMoves = getAllLegalMoves(nextPlayer);
    
    if (legalMoves.length === 0) {
        isGameOver = true;
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
        } else {
            title = "STALEMATE (DRAW) 🤝";
            msg = "No legal moves left. The match is a draw.";
            points = 500;
            playSound('move');
        }
        
        let finalCareerPoints = 0;
        if (points > 0) {
            finalCareerPoints = addCareerPoints(points);
        }
        
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-msg').textContent = msg;
        document.getElementById('gameover-score').textContent = matchScore;
        document.getElementById('gameover-career').textContent = `+${finalCareerPoints} Pts`;
        document.getElementById('gameover-modal').classList.remove('hidden');
    }
}

// --- HINTS / SUGGESTIONS ENGINE ---

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
    
    // Use depth 3 for professional hints that don't hang pieces
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

// --- COMPUTER BOT AI CALCULATIONS (MINIMAX + PIECE SQUARE TABLES) ---

const PST = {
    p: [ // Pawns
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [ // Knights
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [ // Bishops
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [ // Rooks
        [  0,  0,  0,  0,  0,  0,  0,  0],
        [  5, 10, 10, 10, 10, 10, 10,  5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [  0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [ // Queens
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [ // King
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
    
    // Level 1: Beginner (🔵 Blue) - 85% simple random, 15% 1-ply capture
    if (difficulty === 1) {
        if (roll < 0.85) {
            chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else {
            chosenMove = getBestMoveMinimax(botSide, 1);
        }
    } 
    // Level 2: Easy (🟢 Green) - 60% random / simple, 40% 1-ply capture
    else if (difficulty === 2) {
        if (roll < 0.60) {
            chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else {
            chosenMove = getBestMoveMinimax(botSide, 1);
        }
    } 
    // Level 3: Hard (🔴 Red) - 100% full tactical Minimax Depth 3 with Alpha-Beta
    else if (difficulty === 3) {
        chosenMove = getBestMoveMinimax(botSide, 3);
    } 
    // Level 4: Difficult (🟣 Dark Purple) - 100% full master Minimax Depth 4 with Alpha-Beta
    else {
        chosenMove = getBestMoveMinimax(botSide, 4);
    }
    
    if (!chosenMove) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }
    
    executeMove(chosenMove.from, chosenMove.to);
}

// Evaluates static board state score from bot perspective with positional bonuses
function evaluateBoard(testBoard, botColor) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p) {
                let val = (PIECE_VALUES[p.type] || 0) * 10;
                
                // Add positional bonuses from Piece-Square Tables
                let posBonus = 0;
                if (PST[p.type]) {
                    const tableRow = (p.color === 'white') ? r : (7 - r);
                    posBonus = PST[p.type][tableRow][c];
                }
                
                const pieceScore = val + posBonus;
                
                if (p.color === botColor) {
                    score += pieceScore;
                } else {
                    score -= pieceScore;
                }
            }
        }
    }
    return score;
}

// Minimax with Alpha-Beta / Move-ordered lookahead
function getBestMoveMinimax(color, depth) {
    const allMoves = getAllLegalMoves(color);
    if (allMoves.length === 0) return null;
    
    // Simple move ordering: evaluate captures first to speed up alpha-beta pruning cuts
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
        
        if (move.to.isEnPassant) {
            tempBoard[move.from.r][move.to.c] = null;
        }
        tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
        tempBoard[move.from.r][move.from.c] = null;
        
        // Auto promote pawn to queen in simulation for accurate evaluation
        const movedPiece = tempBoard[move.to.r][move.to.c];
        if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
            movedPiece.type = 'q';
        }
        
        let score;
        if (depth > 1) {
            const oppColor = color === 'white' ? 'black' : 'white';
            score = getMinimaxScore(tempBoard, depth - 1, alpha, beta, false, color, oppColor);
        } else {
            score = evaluateBoard(tempBoard, color);
        }
        
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

// Recursive minimax score calculator with Alpha-Beta Pruning
function getMinimaxScore(testBoard, depth, alpha, beta, isMaximizing, botColor, activeColor) {
    if (depth === 0) {
        return evaluateBoard(testBoard, botColor);
    }
    
    const allMoves = getAllLegalMoves(activeColor, testBoard);
    if (allMoves.length === 0) {
        if (isKingInCheck(activeColor, testBoard)) {
            // If the king of activeColor has no moves and is in check, it is checkmate.
            // If the activeColor is the bot itself, that is checkmate against the bot (-99999).
            // If the activeColor is the player, that is checkmate against the player (+99999).
            return (activeColor === botColor) ? -99999 : 99999;
        }
        return 0; // Stalemate
    }
    
    const nextColor = activeColor === 'white' ? 'black' : 'white';
    
    // Sort moves for faster pruning: captures first
    allMoves.sort((a, b) => {
        const aCapture = testBoard[a.to.r][a.to.c] ? 1 : 0;
        const bCapture = testBoard[b.to.r][b.to.c] ? 1 : 0;
        return bCapture - aCapture;
    });
    
    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let i = 0; i < allMoves.length; i++) {
            const move = allMoves[i];
            const temp = cloneBoard(testBoard);
            if (move.to.isEnPassant) {
                temp[move.from.r][move.to.c] = null;
            }
            temp[move.to.r][move.to.c] = temp[move.from.r][move.from.c];
            temp[move.from.r][move.from.c] = null;
            
            // Auto promote pawn to queen in simulation for accurate evaluation
            const movedPiece = temp[move.to.r][move.to.c];
            if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
                movedPiece.type = 'q';
            }
            
            const score = getMinimaxScore(temp, depth - 1, alpha, beta, false, botColor, nextColor);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                break; // Beta cut-off
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let i = 0; i < allMoves.length; i++) {
            const move = allMoves[i];
            const temp = cloneBoard(testBoard);
            if (move.to.isEnPassant) {
                temp[move.from.r][move.to.c] = null;
            }
            temp[move.to.r][move.to.c] = temp[move.from.r][move.from.c];
            temp[move.from.r][move.from.c] = null;
            
            // Auto promote pawn to queen in simulation for accurate evaluation
            const movedPiece = temp[move.to.r][move.to.c];
            if (movedPiece && movedPiece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
                movedPiece.type = 'q';
            }
            
            const score = getMinimaxScore(temp, depth - 1, alpha, beta, true, botColor, nextColor);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) {
                break; // Alpha cut-off
            }
        }
        return minScore;
    }
}

// --- SETUP MODAL CONTROLLER & INITIALIZATION ---

function setupEvents() {
    const modeAi = document.getElementById('mode-ai-btn');
    const modeLocal = document.getElementById('mode-local-btn');
    const aiInputs = document.getElementById('ai-name-inputs');
    const localInputs = document.getElementById('local-name-inputs');
    const sideSection = document.getElementById('side-select-section');
    const diffSection = document.getElementById('difficulty-section');
    
    modeAi.onclick = () => {
        modeAi.classList.add('active');
        modeLocal.classList.remove('active');
        aiInputs.classList.remove('hidden');
        localInputs.classList.add('hidden');
        sideSection.classList.remove('hidden');
        diffSection.classList.remove('hidden');
        gameMode = 'ai';
    };
    
    modeLocal.onclick = () => {
        modeLocal.classList.add('active');
        modeAi.classList.remove('active');
        aiInputs.classList.add('hidden');
        localInputs.classList.remove('hidden');
        sideSection.classList.add('hidden');
        diffSection.classList.add('hidden');
        gameMode = 'local';
    };

    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
        btn.onclick = () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playerSide = btn.dataset.side;
        };
    });

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
        if (diffSlider) {
            diffSlider.style.setProperty('--diff-color', config.color);
            diffSlider.style.setProperty('--diff-glow', config.glow);
            diffSlider.style.background = `linear-gradient(90deg, ${config.color} 0%, ${config.color} ${(difficulty - 1) * 33.3}%, rgba(255,255,255,0.12) ${(difficulty - 1) * 33.3}%, rgba(255,255,255,0.12) 100%)`;
        }
    }

    if (diffSlider) {
        diffSlider.oninput = () => {
            updateDifficultyUI(diffSlider.value);
        };
        updateDifficultyUI(diffSlider.value || 2);
    }

    document.getElementById('undo-btn').onclick = handleUndo;
    document.getElementById('hint-btn').onclick = handleGetSuggestion;

    const soundBtn = document.getElementById('sound-btn');
    const soundIcon = document.getElementById('sound-icon');
    soundBtn.onclick = () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    };

    document.getElementById('menu-btn').onclick = () => {
        document.getElementById('setup-modal').classList.remove('hidden');
    };

    let hasStartedMatch = false;

    const closeBtn = document.getElementById('setup-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (!hasStartedMatch) {
                startNewGame();
            } else {
                document.getElementById('setup-modal').classList.add('hidden');
            }
        };
    }

    const setupModal = document.getElementById('setup-modal');
    if (setupModal) {
        setupModal.onclick = (e) => {
            if (e.target === setupModal) {
                if (!hasStartedMatch) {
                    startNewGame();
                } else {
                    setupModal.classList.add('hidden');
                }
            }
        };
    }

    document.getElementById('start-match-btn').onclick = startNewGame;
    
    document.getElementById('gameover-restart-btn').onclick = () => {
        document.getElementById('gameover-modal').classList.add('hidden');
        document.getElementById('setup-modal').classList.remove('hidden');
    };
}

function startNewGame() {
    initAudio(); 
    hasStartedMatch = true;
    
    if (gameMode === 'ai') {
        const rawName = document.getElementById('player-name-input').value.trim();
        const userName = rawName || 'Player 1';
        
        let activeSide = playerSide;
        if (playerSide === 'random') {
            activeSide = Math.random() < 0.5 ? 'white' : 'black';
        }
        playerSide = activeSide; // Crucial fix for Random Mode!
        
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
    setupEvents();
    updateHUD();
    
    initBoard();
    drawBoard();
    FX.init();

    const setupModal = document.getElementById('setup-modal');
    if (setupModal) {
        setupModal.classList.remove('hidden');
    }
};
