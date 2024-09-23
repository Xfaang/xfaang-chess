const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
const tileSize = 60;
let selectedPiece = null;
let turn = 'w';
const statusDiv = document.getElementById('status');

// Initialize board matrix
let board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

// Variables to keep track of moves for castling and en passant
let moveHistory = [];
let canCastle = {
    'wK': true,
    'wR0': true, // Rook on a1
    'wR7': true, // Rook on h1
    'bK': true,
    'bR0': true, // Rook on a8
    'bR7': true  // Rook on h8
};
let enPassantTarget = null;

// Load images (same as before)
const pieceImages = {};
const pieceTypes = ['P','R','N','B','Q','K'];
const colors = ['w','b'];
let imagesToLoad = 12;
let imagesLoaded = 0;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === imagesToLoad) {
        drawBoard();
    }
}

colors.forEach(color => {
    pieceTypes.forEach(type => {
        const img = new Image();
        img.src = `images/${color}${type}.png`;
        img.onload = imageLoaded;
        pieceImages[`${color}${type}`] = img;
    });
});

// Draw the board (same as before)
function drawBoard() {
    for(let row = 0; row < 8; row++) {
        for(let col = 0; col < 8; col++) {
            // Draw tiles
            if ((row + col) % 2 === 0) {
                ctx.fillStyle = '#f0d9b5';
            } else {
                ctx.fillStyle = '#b58863';
            }
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

            // Draw pieces
            const piece = board[row][col];
            if(piece) {
                const img = pieceImages[piece];
                ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

// Handle click events (same as before)
canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    const clickedPiece = board[row][col];

    if (selectedPiece) {
        // Move logic
        if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            turn = turn === 'w' ? 'b' : 'w';
            statusDiv.textContent = `${turn === 'w' ? "White's" : "Black's"} turn`;
        }
        selectedPiece = null;
        drawBoard();
    } else {
        // Select piece logic
        if (clickedPiece && clickedPiece[0] === turn) {
            selectedPiece = { row, col, piece: clickedPiece };
            drawBoard();
            // Highlight selected tile
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }
});

// Validate move (updated)
function isValidMove(fromRow, fromCol, toRow, toCol) {
    const movingPiece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];

    if (targetPiece && targetPiece[0] === turn) return false; // Can't capture own piece

    const pieceType = movingPiece[1]; // 'P', 'R', 'N', 'B', 'Q', 'K'
    const dir = turn === 'w' ? -1 : 1; // Direction for pawns

    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    switch (pieceType) {
        case 'P':
            // Pawns
            if (deltaCol === 0) {
                // Moving forward
                if ((deltaRow === dir) && !targetPiece) {
                    return true;
                }
                // Double move from starting position
                if ((fromRow === (turn === 'w' ? 6 : 1)) && (deltaRow === 2 * dir) && !targetPiece && !board[fromRow + dir][fromCol]) {
                    return true;
                }
            } else if (Math.abs(deltaCol) === 1 && deltaRow === dir) {
                // Capturing diagonally
                if (targetPiece && targetPiece[0] !== turn) {
                    return true;
                }
                // En Passant
                if (enPassantTarget && enPassantTarget.row === toRow && enPassantTarget.col === toCol) {
                    return true;
                }
            }
            break;
        case 'R':
            // Rooks
            if (deltaRow === 0 || deltaCol === 0) {
                if (isPathClear(fromRow, fromCol, toRow, toCol)) {
                    return true;
                }
            }
            break;
        case 'N':
            // Knights
            if ((Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) || (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2)) {
                return true;
            }
            break;
        case 'B':
            // Bishops
            if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
                if (isPathClear(fromRow, fromCol, toRow, toCol)) {
                    return true;
                }
            }
            break;
        case 'Q':
            // Queens
            if ((deltaRow === 0 || deltaCol === 0) || (Math.abs(deltaRow) === Math.abs(deltaCol))) {
                if (isPathClear(fromRow, fromCol, toRow, toCol)) {
                    return true;
                }
            }
            break;
        case 'K':
            // Kings
            if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
                return true;
            }
            // Castling
            if (deltaRow === 0 && Math.abs(deltaCol) === 2) {
                if (canCastle[`${turn}K`] && isCastlingMove(fromRow, fromCol, toRow, toCol)) {
                    return true;
                }
            }
            break;
    }

    return false;
}

// Helper function to check if the path between from and to is clear (same as before)
function isPathClear(fromRow, fromCol, toRow, toCol) {
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
    const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);

    let currentRow = fromRow + stepRow;
    let currentCol = fromCol + stepCol;

    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol] !== '') {
            return false;
        }
        currentRow += stepRow;
        currentCol += stepCol;
    }

    return true;
}

// Helper function to check for castling
function isCastlingMove(fromRow, fromCol, toRow, toCol) {
    const kingSide = toCol === 6;
    const queenSide = toCol === 2;

    if (isKingInCheck(turn)) return false; // Can't castle if in check

    if (kingSide) {
        // King-side castling
        const rook = board[fromRow][7];
        if (rook === `${turn}R` && canCastle[`${turn}R7`]) {
            // Check if squares between king and rook are empty
            if (board[fromRow][5] === '' && board[fromRow][6] === '') {
                // Ensure squares are not under attack (not implemented here)
                return true;
            }
        }
    } else if (queenSide) {
        // Queen-side castling
        const rook = board[fromRow][0];
        if (rook === `${turn}R` && canCastle[`${turn}R0`]) {
            if (board[fromRow][1] === '' && board[fromRow][2] === '' && board[fromRow][3] === '') {
                // Ensure squares are not under attack (not implemented here)
                return true;
            }
        }
    }

    return false;
}

// Move the piece (updated)
function movePiece(fromRow, fromCol, toRow, toCol) {
    const movingPiece = board[fromRow][fromCol];
    const pieceType = movingPiece[1];

    // Handle castling
    if (pieceType === 'K' && Math.abs(toCol - fromCol) === 2) {
        // Castling move
        if (toCol === 6) {
            // King-side castling
            board[toRow][6] = movingPiece;
            board[fromRow][fromCol] = '';
            // Move rook
            board[toRow][5] = board[toRow][7];
            board[toRow][7] = '';
        } else if (toCol === 2) {
            // Queen-side castling
            board[toRow][2] = movingPiece;
            board[fromRow][fromCol] = '';
            // Move rook
            board[toRow][3] = board[toRow][0];
            board[toRow][0] = '';
        }
        // Update castling rights
        canCastle[`${turn}K`] = false;
        canCastle[`${turn}R0`] = false;
        canCastle[`${turn}R7`] = false;
    } else {
        // Normal move
        // Handle en passant capture
        if (pieceType === 'P' && toCol !== fromCol && board[toRow][toCol] === '') {
            // En passant capture
            board[toRow][toCol] = movingPiece;
            board[fromRow][fromCol] = '';
            board[fromRow][toCol] = '';
        } else {
            board[toRow][toCol] = movingPiece;
            board[fromRow][fromCol] = '';
        }

        // Update castling rights if rook or king moves
        if (movingPiece === `${turn}K`) {
            canCastle[`${turn}K`] = false;
        } else if (movingPiece === `${turn}R`) {
            if (fromCol === 0) {
                canCastle[`${turn}R0`] = false;
            } else if (fromCol === 7) {
                canCastle[`${turn}R7`] = false;
            }
        }

        // Update en passant target
        if (pieceType === 'P' && Math.abs(toRow - fromRow) === 2) {
            enPassantTarget = { row: fromRow + (toRow - fromRow) / 2, col: fromCol };
        } else {
            enPassantTarget = null;
        }
    }

    // Add move to moveHistory
    moveHistory.push({
        fromRow,
        fromCol,
        toRow,
        toCol,
        movingPiece,
        capturedPiece: board[toRow][toCol]
    });
}

// Function to check if king is in check (simplified)
function isKingInCheck(color) {
    // Simplified version; in a full implementation, you'd need to check if any of the opponent's pieces can attack the king
    return false;
}

// Initial draw is handled after images are loaded
