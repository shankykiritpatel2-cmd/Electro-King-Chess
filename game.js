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
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
    } else if (type === 'capture') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'check') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.08);
        osc.frequency.setValueAtTime(440, now + 0.16);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'win') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g);
            g.connect(audioCtx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + idx * 0.08);
            g.gain.setValueAtTime(0.06, now + idx * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
            o.start(now + idx * 0.08);
            o.stop(now + idx * 0.08 + 0.2);
        });
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

// --- DYNAMIC GRAPHICS / HUD RENDERERS ---

// Create the 64 chessboard squares
function drawBoard() {
    const boardElement = document.getElementById('chessboard');
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
}

function applyBoardHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.className = sq.className.replace(/\b(selected|valid-move-marker|valid-move|capture-target|last-move-source|last-move-dest|in-check|hint-source|hint-dest)\b/g, '').trim();
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

function updateHUD() {
    document.getElementById('match-score').textContent = matchScore;
    document.getElementById('career-points').textContent = careerPoints;
    
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
        msg.textContent = `${activeName}'s turn (${turn.toUpperCase()})`;
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
        const destinationMatch = moves.find(m => m.r === r && m.c === c);
        
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
    
    // --- 1. EN PASSANT EXECUTION ---
    if (isEnPassant) {
        isCapture = true;
        const capturedPawn = board[from.r][to.c];
        captured[capturedPawn.color].push(capturedPawn);
        board[from.r][to.c] = null; 
        
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
            }
        } else if (to.c === 2) {
            const rook = board[row][0];
            if (rook) {
                rook.hasMoved = true;
                board[row][3] = rook;
                board[row][0] = null;
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
        playSound('move');
    } else {
        alert("No legal moves available to suggest!");
    }
}

// --- COMPUTER BOT AI CALCULATIONS (MINIMAX) ---

function makeComputerMove() {
    if (isGameOver || turn !== botSide) return;
    
    const allMoves = getAllLegalMoves(botSide);
    if (allMoves.length === 0) {
        checkGameOver();
        return;
    }
    
    let chosenMove = null;
    const roll = Math.random();
    
    // Beginner (1): 60% random moves, 40% minimax depth-2
    // Easy (2): 25% random moves, 75% minimax depth-2
    // Hard (3): 100% minimax depth-3 (looks 3 turns ahead)
    // Difficult (4): 100% minimax depth-4 (looks 4 turns ahead)
    if (difficulty === 1) {
        if (roll < 0.60) {
            chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else {
            chosenMove = getBestMoveMinimax(botSide, 2);
        }
    } else if (difficulty === 2) {
        if (roll < 0.25) {
            chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else {
            chosenMove = getBestMoveMinimax(botSide, 2);
        }
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

// Evaluates static board state score from bot perspective with positional bonuses
function evaluateBoard(testBoard, botColor) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = testBoard[r][c];
            if (p) {
                let val = PIECE_VALUES[p.type] || 0;
                
                // Add positional bonuses
                let bonus = 0;
                
                // 1. Center Control (incentivize controlling rows 3,4 and columns 2,3,4,5)
                if (r >= 3 && r <= 4 && c >= 2 && c <= 5) {
                    bonus += 1.5;
                }
                
                // 2. Pawn Advancement (encourages promotion & board space)
                if (p.type === 'p') {
                    if (p.color === 'white') {
                        bonus += (7 - r) * 0.5; // White pawns moving up
                    } else {
                        bonus += r * 0.5; // Black pawns moving down
                    }
                }
                
                // 3. Piece Development (incentivize developing knights & bishops off starting rank)
                if (p.type === 'n' || p.type === 'b') {
                    const startRow = p.color === 'white' ? 7 : 0;
                    if (r !== startRow) {
                        bonus += 2;
                    }
                }
                
                if (p.color === botColor) {
                    score += (val + bonus);
                } else {
                    score -= (val + bonus);
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
    const diffNames = ['Beginner', 'Easy', 'Hard', 'Difficult'];
    diffSlider.oninput = () => {
        difficulty = parseInt(diffSlider.value, 10);
        diffLabel.textContent = `⚙️ Bot Difficulty: ${diffNames[difficulty - 1]}`;
    };

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

    document.getElementById('start-match-btn').onclick = startNewGame;
    
    document.getElementById('gameover-restart-btn').onclick = () => {
        document.getElementById('gameover-modal').classList.add('hidden');
        document.getElementById('setup-modal').classList.remove('hidden');
    };
}

function startNewGame() {
    initAudio(); 
    
    if (gameMode === 'ai') {
        const rawName = document.getElementById('player-name-input').value.trim();
        const userName = rawName || 'Player 1';
        
        let activeSide = playerSide;
        if (playerSide === 'random') {
            activeSide = Math.random() < 0.5 ? 'white' : 'black';
        }
        
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
    if (gameMode === 'ai' && playerNames.black !== 'ElectroBot 🤖') {
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
};
