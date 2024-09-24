// Get canvas context
const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
const tileSize = 60;
let selectedPiece = null;
let turn = 'w';
const statusDiv = document.getElementById('status');
let gameOver = false;
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

// Load images
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

// Draw the board
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

// Instantiate the MoveValidator
const moveValidator = new MoveValidator(board, canCastle, enPassantTarget);

// Handle click events
canvas.addEventListener('click', event => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    const clickedPiece = board[row][col];

    if (selectedPiece) {
        // Move logic
        if (moveValidator.isValidMove(selectedPiece.row, selectedPiece.col, row, col, turn)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            turn = turn === 'w' ? 'b' : 'w';
            statusDiv.textContent = `${turn === 'w' ? "White's" : "Black's"} turn`;
            // Update the validator's state
            moveValidator.updateState(board, canCastle, enPassantTarget);
        } 
        selectedPiece = null;

        if (moveValidator.isCheckmate(turn)) {
            statusDiv.textContent = `${turn === 'w' ? "Black" : "White"} wins by checkmate!`;
            gameOver = true;
        }
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

// Move the piece
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

// MoveValidator Class
function MoveValidator(board, canCastle, enPassantTarget) {
    this.board = board;
    this.canCastle = canCastle;
    this.enPassantTarget = enPassantTarget;

    this.updateState = function(board, canCastle, enPassantTarget) {
        this.board = board;
        this.canCastle = canCastle;
        this.enPassantTarget = enPassantTarget;
    };

    this.isValidMove = function(fromRow, fromCol, toRow, toCol, turn) {
        const movingPiece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        if (targetPiece && targetPiece[0] === turn) return false; // Can't capture own piece

        const pieceType = movingPiece[1]; // 'P', 'R', 'N', 'B', 'Q', 'K'
        const dir = turn === 'w' ? -1 : 1; // Direction for pawns

        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;

        // First, check basic movement rules
        let valid = false;
        switch (pieceType) {
            case 'P':
                // Pawns
                if (deltaCol === 0) {
                    // Moving forward
                    if ((deltaRow === dir) && !targetPiece) {
                        valid = true;
                    }
                    // Double move from starting position
                    else if ((fromRow === (turn === 'w' ? 6 : 1)) && (deltaRow === 2 * dir) && !targetPiece && !this.board[fromRow + dir][fromCol]) {
                        valid = true;
                    }
                } else if (Math.abs(deltaCol) === 1 && deltaRow === dir) {
                    // Capturing diagonally
                    if (targetPiece && targetPiece[0] !== turn) {
                        valid = true;
                    }
                    // En Passant
                    else if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
                        valid = true;
                    }
                }
                break;
            case 'R':
                // Rooks
                if (deltaRow === 0 || deltaCol === 0) {
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
                        valid = true;
                    }
                }
                break;
            case 'N':
                // Knights
                if ((Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) || (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2)) {
                    valid = true;
                }
                break;
            case 'B':
                // Bishops
                if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
                        valid = true;
                    }
                }
                break;
            case 'Q':
                // Queens
                if ((deltaRow === 0 || deltaCol === 0) || (Math.abs(deltaRow) === Math.abs(deltaCol))) {
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
                        valid = true;
                    }
                }
                break;
            case 'K':
                // Kings
                if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
                    valid = true;
                }
                // Castling
                else if (deltaRow === 0 && Math.abs(deltaCol) === 2) {
                    if (this.canCastle[`${turn}K`] && this.isCastlingMove(fromRow, fromCol, toRow, toCol, turn)) {
                        valid = true;
                    }
                }
                break;
        }

        if (!valid) return false;

        // Simulate the move
        const capturedPiece = this.board[toRow][toCol];
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = '';

        // Check if own king is in check
        const kingInCheck = this.isKingInCheck(turn);

        // Revert the move
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = capturedPiece;

        // If king is in check after the move, it's invalid
        if (kingInCheck) return false;

        return true;
    };

    this.isPathClear = function(fromRow, fromCol, toRow, toCol) {
        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;

        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);

        let currentRow = fromRow + stepRow;
        let currentCol = fromCol + stepCol;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== '') {
                return false;
            }
            currentRow += stepRow;
            currentCol += stepCol;
        }

        return true;
    };

    this.isKingInCheck = function(color) {
        // Find the king's position
        let kingPosition = null;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === `${color}K`) {
                    kingPosition = { row, col };
                    break;
                }
            }
            if (kingPosition) break;
        }

        if (!kingPosition) return true; // King is captured (should not happen in a valid game)

        // Check all opponent's pieces to see if any can attack the king
        const opponentColor = color === 'w' ? 'b' : 'w';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece[0] === opponentColor) {
                    if (this.canPieceAttackSquare(row, col, kingPosition.row, kingPosition.col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    this.canPieceAttackSquare = function(fromRow, fromCol, toRow, toCol) {
        const movingPiece = this.board[fromRow][fromCol];
        const pieceType = movingPiece[1];
        const color = movingPiece[0];
        const dir = color === 'w' ? -1 : 1;

        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;

        switch (pieceType) {
            case 'P':
                // Pawns capture diagonally forward
                if (deltaRow === dir && Math.abs(deltaCol) === 1) {
                    return true;
                }
                break;
            case 'R':
                // Rooks
                if (deltaRow === 0 || deltaCol === 0) {
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
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
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
                        return true;
                    }
                }
                break;
            case 'Q':
                // Queens
                if ((deltaRow === 0 || deltaCol === 0) || (Math.abs(deltaRow) === Math.abs(deltaCol))) {
                    if (this.isPathClear(fromRow, fromCol, toRow, toCol)) {
                        return true;
                    }
                }
                break;
            case 'K':
                // Kings
                if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
                    return true;
                }
                break;
        }

        return false;
    };

    this.isCastlingMove = function(fromRow, fromCol, toRow, toCol, turn) {
        const kingSide = toCol === 6;
        const queenSide = toCol === 2;

        if (this.isKingInCheck(turn)) return false; // Can't castle if in check

        if (kingSide) {
            // King-side castling
            const rook = this.board[fromRow][7];
            if (rook === `${turn}R` && this.canCastle[`${turn}R7`]) {
                // Check if squares between king and rook are empty
                if (this.board[fromRow][5] === '' && this.board[fromRow][6] === '') {
                    // Ensure squares are not under attack
                    if (!this.areSquaresUnderAttack(fromRow, [5,6], turn)) {
                        return true;
                    }
                }
            }
        } else if (queenSide) {
            // Queen-side castling
            const rook = this.board[fromRow][0];
            if (rook === `${turn}R` && this.canCastle[`${turn}R0`]) {
                if (this.board[fromRow][1] === '' && this.board[fromRow][2] === '' && this.board[fromRow][3] === '') {
                    if (!this.areSquaresUnderAttack(fromRow, [2,3], turn)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    this.areSquaresUnderAttack = function(row, cols, color) {
        for (let col of cols) {
            // Simulate king on the square
            const originalPiece = this.board[row][col];
            this.board[row][col] = `${color}K`;

            const inCheck = this.isKingInCheck(color);

            // Revert the piece
            this.board[row][col] = originalPiece;

            if (inCheck) return true;
        }
        return false;
    };

    this.isCheckmate = function(color) {
        // First, check if the king is in check
        if (!this.isKingInCheck(color)) {
            return false; // Not in check, so cannot be checkmate
        }

        // Iterate over all pieces of the given color
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece[0] === color) {
                    // Try moving this piece to all possible squares
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            // Skip if moving to the same square
                            if (fromRow === toRow && fromCol === toCol) continue;

                            // Check if the move is valid
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol, color)) {
                                // Found a valid move, so not checkmate
                                return false;
                            }
                        }
                    }
                }
            }
        }

        // No valid moves found, so it's checkmate
        return true;
    };
}
