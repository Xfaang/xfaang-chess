// Get canvas context
const canvas = document.getElementById('chessboard');
const startButton = document.getElementById('startButton');
const statusDiv = document.getElementById('status');
const commentDiv = document.getElementById('comment');
let gameStarted = false;
let gameOver = false;
let tileSize; // We'll calculate this dynamically
let boardSize; // The size of the canvas in pixels
let selectedPiece = null;
let turn = 'w';

let movesNumber = 0;
const commentAfter = 6; // comment will be given after this number of moves
const offsset = 4 // the first comment after this number of moves

// Variables to track promotion
let promotionSquare = null;
let promotionFromSquare = null;
let promotionColor = null;

startButton.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        statusDiv.textContent = `${turn === 'w' ? "White's" : "Black's"} turn`;
        startButton.style.display = 'none'; // Hide the start button
        chessClock.start(); // Start the chess clock
    }
});

let kings = 'xfaang';

const ctx = canvas.getContext('2d');
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

const initialTime = 300; // 5 minutes in seconds
const chessClock = new ChessClock(initialTime, onTimeOut);

// Instantiate the MoveValidator
const moveValidator = new MoveValidator(board, canCastle, enPassantTarget);


// Function to handle time-out
function onTimeOut(color) {
    statusDiv.textContent = `${color === 'w' ? 'Zientara' : 'Czubak'} ran out of time.`;
    gameOver = true;
    moveValidator.gameOver = true; // If you have such a property
    chessClock.pause();
}

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

function setImages() {
    colors.forEach(color => {
        pieceTypes.forEach(type => {
            const img = new Image();
            let src = `images/${color}${type}.png`;
            if (kings == 'xfaang') {
                if (type == 'K' ) {
                    if (color == 'w') {
                        src = "images/zientara.png";
                    } else {
                        src = "images/czubak.png";
                    };
                };
            } else if (kings == '') {
                if (type == 'K' ) {
                    if (color == 'b') {
                        src = "images/zientara.png";
                    } else {
                        src = "images/czubak.png";
                    };
                };
            }
            img.src = src;
            img.onload = imageLoaded;
            pieceImages[`${color}${type}`] = img;
        });
    });
}
setImages();

// Draw the board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Draw tiles
            ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

            // Draw pieces
            const piece = board[row][col];
            if (piece) {
                const img = pieceImages[piece];
                ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

// Function to resize the canvas and recalculate tile size
function resizeCanvas() {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const minDimension = Math.min(viewportWidth, viewportHeight);
    const boardDisplaySize = minDimension * 0.9;
    const maxBoardSize = 640;
    const displaySize = Math.min(boardDisplaySize, maxBoardSize);

    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';

    const ratio = window.devicePixelRatio || 1;

    canvas.width = displaySize * ratio;
    canvas.height = displaySize * ratio;

    tileSize = displaySize / 8;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    drawBoard();
}

// Call resizeCanvas initially
resizeCanvas();

canvas.addEventListener('pointerdown', handleInput);

function handleInput(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    const clickedPiece = board[row][col];

    if (!gameStarted || gameOver) {
        if(kings == 'xfaang') {
            kings = '';
        } else if (kings == '') {
            kings = 'regular';
        } else {
           kings = 'xfaang'; 
        };
        setImages();
        drawBoard();
        return;
    }

    if (selectedPiece) {
        // Move logic
        if (moveValidator.isValidMove(selectedPiece.row, selectedPiece.col, row, col, turn)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            turn = turn === 'w' ? 'b' : 'w';
            statusDiv.textContent = `${turn === 'w' ? "Zientara's" : "Czubaka's"} turn`;
            // Update the validator's state
            moveValidator.updateState(board, canCastle, enPassantTarget);
        } 
        selectedPiece = null;

        if (moveValidator.isCheckmate(turn)) {
            statusDiv.textContent = `${turn === 'w' ? "Black" : "White"} wins by checkmate! Xfaang Wins!`;
            chessClock.pause();
            gameOver = true;
        } else if (moveValidator.isStalemate(turn)) {
            statusDiv.textContent = "Stalemate! It's a draw. Xfaang still Wins!";
            chessClock.pause();
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
}

// Add event listener to handle window resize
window.addEventListener('resize', resizeCanvas);

// Function to prompt pawn promotion
function promptPawnPromotion(toRow, toCol, movingPiece, fromRow, fromCol) {
    promotionSquare = { row: toRow, col: toCol };
    promotionFromSquare = { fromRow: fromRow, fromCol: fromCol };
    promotionColor = movingPiece[0];
    
    const modal = document.getElementById('promotionModal');
    modal.style.display = 'block';
}

// Handle promotion selection
document.querySelectorAll('.promo-button').forEach(button => {
    button.addEventListener('click', () => {
        const selectedPieceType = button.getAttribute('data-piece');
        promotePawn(selectedPieceType);
    });
});

// Function to promote pawn
function promotePawn(pieceType) {
    const { row, col } = promotionSquare;
    const { fromRow, fromCol } = promotionFromSquare;
    
    // Determine the piece's color prefix
    const colorPrefix = promotionColor === 'w' ? 'w' : 'b';
    
    // Set the new piece on the board
    board[row][col] = colorPrefix + pieceType;
    
    board[fromRow][fromCol] = ''; // Remove the pawn from the board

    // Update move history with promotion
    const lastMove = moveHistory[moveHistory.length - 1];
    lastMove.promotedTo = board[row][col]; // e.g., 'wQ'
    
    // Hide the modal
    const modal = document.getElementById('promotionModal');
    modal.style.display = 'none';
    
    // Update the UI (redraw board, update move history display, etc.)
    drawBoard();
    updateMoveHistoryDisplay();
}

// Move the piece
function movePiece(fromRow, fromCol, toRow, toCol) {
    const movingPiece = board[fromRow][fromCol];
    const pieceType = movingPiece[1];

    // Update the clock
    chessClock.switchTurn();

    // If the game is over, pause the clock
    if (gameOver) {
        chessClock.pause();
    }

    // Check for pawn promotion
    if (movingPiece[1] === 'P') { // If the piece is a pawn
        if ((movingPiece[0] === 'w' && toRow === 0) || (movingPiece[0] === 'b' && toRow === 7)) {
            promptPawnPromotion(toRow, toCol, movingPiece, fromRow, fromCol);
            return; // Wait for promotion to complete
        }
    }
    

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

    updateMoveHistoryDisplay();
}

function generateMovesList(moveHistory) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const movesList = [];
    
    for (let i = 0; i < moveHistory.length; i++) {
        const move = moveHistory[i];
        const fromFile = files[move.fromCol];
        const fromRank = ranks[move.fromRow];
        const toFile = files[move.toCol];
        const toRank = ranks[move.toRow];
        const movingPiece = move.movingPiece; // e.g., 'wP', 'bN', etc.
        const capturedPiece = move.capturedPiece; // e.g., 'wP', 'bP', or '' if none

        // Determine the piece type and color
        const pieceType = movingPiece[1]; // 'P', 'N', 'B', 'R', 'Q', 'K'
        const movingColor = movingPiece[0]; // 'w' or 'b'
        let moveNotation = '';

        // Handle castling
        if (pieceType === 'K' && Math.abs(move.toCol - move.fromCol) === 2) {
            if (move.toCol === 6) {
                moveNotation = 'O-O'; // King-side castling
            } else if (move.toCol === 2) {
                moveNotation = 'O-O-O'; // Queen-side castling
            }
        } else {
            // Determine piece symbol (empty for pawns unless capturing)
            let pieceSymbol = pieceType !== 'P' ? pieceType : '';
            let captureSymbol = '';
            let disambiguation = ''; // For move disambiguation if needed

            // Determine if a capture has occurred
            let isCapture = false;
            if (capturedPiece !== '' && capturedPiece[0] !== movingColor) {
                isCapture = true;
            }

            // Check for captures
            if (isCapture) {
                captureSymbol = 'x';
                if (pieceType === 'P') {
                    // For pawn captures, include the file of departure
                    pieceSymbol = fromFile;
                }
            }

            // Check for pawn promotion
            let promotion = '';
            if (pieceType === 'P' && (move.toRow === 0 || move.toRow === 7)) {
                // Assume promotion to Queen; adjust as needed
                promotion = '=Q';
            }

            // Assemble move notation
            moveNotation = pieceSymbol + captureSymbol + toFile + toRank + promotion;
        }

        // Append move notation to moves list
        movesList.push(moveNotation);
    }

    // Format the moves into move numbers
    const formattedMovesList = [];
    for (let i = 0; i < movesList.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = movesList[i];
        const blackMove = movesList[i + 1] || '';
        formattedMovesList.push(`${moveNumber}. ${whiteMove} ${blackMove}`.trim());
    }

    return formattedMovesList;
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

        const opponentColor = turn === 'w' ? 'b' : 'w'; // Identify opponent

        if (kingSide) {
            // King-side castling
            const rook = this.board[fromRow][7];
            if (rook === `${turn}R` && this.canCastle[`${turn}R7`]) {
                // Check if squares between king and rook are empty
                if (this.board[fromRow][5] === '' && this.board[fromRow][6] === '') {
                    // Ensure squares are not under attack by opponent
                    if (!this.areSquaresUnderAttack(fromRow, [5,6], opponentColor)) {
                        return true;
                    }
                }
            }
        } else if (queenSide) {
            // Queen-side castling
            const rook = this.board[fromRow][0];
            if (rook === `${turn}R` && this.canCastle[`${turn}R0`]) {
                if (this.board[fromRow][1] === '' && this.board[fromRow][2] === '' && this.board[fromRow][3] === '') {
                    // Ensure squares are not under attack by opponent
                    if (!this.areSquaresUnderAttack(fromRow, [3,2], opponentColor)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    this.isSquareUnderAttack = function(row, col, attackerColor) {
        // Iterate over all squares on the board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece[0] === attackerColor) {
                    // If the piece belongs to the attacker, check if it can move to the target square
                    if (this.canPieceAttackSquare(r, c, row, col, attackerColor)) {
                        return true; // The square is under attack
                    }
                }
            }
        }
        return false; // No attacking piece found
    };

    this.areSquaresUnderAttack = function(row, cols, attackerColor) {
        for (let col of cols) {
            if (this.isSquareUnderAttack(row, col, attackerColor)) {
                return true; // Square is under attack
            }
        }
        return false; // None of the squares are under attack
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

    this.isStalemate = function(color) {
        // Check if the king is in check
        if (this.isKingInCheck(color)) {
            return false; // In check, so cannot be stalemate
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
                                // Found a valid move, so not stalemate
                                return false;
                            }
                        }
                    }
                }
            }
        }

        // No valid moves found, so it's stalemate
        return true;
    };
}

function updateMoveHistoryDisplay() {
    const movesListElement = document.getElementById('movesList');

    // Generate the formatted moves list
    let formattedMovesList = generateMovesList(moveHistory);

    // Clear the existing moves
    movesListElement.innerHTML = '';

    // Loop over formattedMovesList and add each move to the display
    formattedMovesList.forEach(move => {
        const listItem = document.createElement('li');
        listItem.textContent = move;
        movesListElement.appendChild(listItem);
    });
    
    movesNumber++;
    if ((movesNumber - offsset) % 6 == 0 || movesNumber == offsset) {
        sendMoveHistoryToAPI(movesList.innerHTML);
    }
}

const whiteClockElement = document.getElementById('whiteClock');
const blackClockElement = document.getElementById('blackClock');

whiteClockElement.addEventListener('click', () => {
    if (!gameStarted) {
        // Allow editing time only before the game starts
        chessClock.editTime('w');
    }
});

blackClockElement.addEventListener('click', () => {
    if (!gameStarted) {
        chessClock.editTime('b');
    }
});


function sendMoveHistoryToAPI(moveHistory) {
    const apiUrl = 'https://g1sqppheyd.execute-api.eu-central-1.amazonaws.com/prod/chat'; // Replace with your actual API endpoint

    const data = {
        stream: false,
        model: "llama3.1:70b", 
        messages: [
            {
                role: 'user',
                content: `You're a chess grandmaster, give a comment to this game: ${moveHistory} in max 3 sentences.`
            }
        ]
    };

   fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        const comment = result.message.content;
        commentDiv.textContent = comment;
    })
    .catch(error => {
        console.error('Error sending move history to API:', error);
    });
}

// Function to check if the user has already consented
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Function to hide the cookie consent popup
function hideCookieConsent() {
    const cookieConsent = document.getElementById('cookieConsent');
    if (cookieConsent) {
        cookieConsent.style.display = 'none';
    }
}

// Function to initialize cookie consent
function initCookieConsent() {
    const consent = getCookie('cookieConsent');
    if (consent === 'accepted') {
        return;
    } else if (consent !== 'declined') {
        // Show the consent popup
        const cookieConsent = document.getElementById('cookieConsent');
        if (cookieConsent) {
            cookieConsent.style.display = 'flex';
        }
    }
}

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', function() {
    initCookieConsent();

    const acceptButton = document.getElementById('acceptCookies');
    const declineButton = document.getElementById('declineCookies');

    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            setCookie('cookieConsent', 'accepted', 365);
            hideCookieConsent();
        });
    }

    if (declineButton) {
        declineButton.addEventListener('click', function() {
            setCookie('cookieConsent', 'declined', 365);
            hideCookieConsent();
        });
    }
});
