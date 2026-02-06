// ============================================================
// Block Blaster - Complete Game Logic
// ============================================================

(function () {
    'use strict';

    // === Constants ===
    const GRID_SIZE = 8;
    const PIECES_PER_ROUND = 3;
    const POINTS_PER_BLOCK = 1;
    const POINTS_PER_LINE = 10;
    const COMBO_MULTIPLIER = 10;
    const STREAK_BONUS = 10;

    // === Color palette for pieces ===
    const COLORS = [
        'color-red', 'color-blue', 'color-green', 'color-yellow',
        'color-purple', 'color-orange', 'color-cyan', 'color-pink',
        'color-indigo', 'color-teal', 'color-lime'
    ];

    // === Piece Definitions ===
    const PIECE_DEFS = [
        // Singles
        { shape: [[1]], weight: 3 },
        // Horizontal lines
        { shape: [[1, 1]], weight: 4 },
        { shape: [[1, 1, 1]], weight: 5 },
        { shape: [[1, 1, 1, 1]], weight: 3 },
        { shape: [[1, 1, 1, 1, 1]], weight: 1 },
        // Vertical lines
        { shape: [[1], [1]], weight: 4 },
        { shape: [[1], [1], [1]], weight: 5 },
        { shape: [[1], [1], [1], [1]], weight: 3 },
        { shape: [[1], [1], [1], [1], [1]], weight: 1 },
        // Squares
        { shape: [[1, 1], [1, 1]], weight: 4 },
        { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 1 },
        // L-shapes (all 4 rotations, tall)
        { shape: [[1, 0], [1, 0], [1, 1]], weight: 3 },
        { shape: [[0, 1], [0, 1], [1, 1]], weight: 3 },
        { shape: [[1, 1], [1, 0], [1, 0]], weight: 3 },
        { shape: [[1, 1], [0, 1], [0, 1]], weight: 3 },
        // L-shapes (flat)
        { shape: [[1, 0, 0], [1, 1, 1]], weight: 2 },
        { shape: [[1, 1, 1], [1, 0, 0]], weight: 2 },
        { shape: [[0, 0, 1], [1, 1, 1]], weight: 2 },
        { shape: [[1, 1, 1], [0, 0, 1]], weight: 2 },
        // Small L-shapes (2x2 corners)
        { shape: [[1, 1], [0, 1]], weight: 3 },
        { shape: [[1, 1], [1, 0]], weight: 3 },
        { shape: [[1, 0], [1, 1]], weight: 3 },
        { shape: [[0, 1], [1, 1]], weight: 3 },
        // T-shapes
        { shape: [[1, 1, 1], [0, 1, 0]], weight: 2 },
        { shape: [[0, 1, 0], [1, 1, 1]], weight: 2 },
        { shape: [[1, 0], [1, 1], [1, 0]], weight: 2 },
        { shape: [[0, 1], [1, 1], [0, 1]], weight: 2 },
        // S/Z shapes
        { shape: [[1, 1, 0], [0, 1, 1]], weight: 2 },
        { shape: [[0, 1, 1], [1, 1, 0]], weight: 2 },
        { shape: [[1, 0], [1, 1], [0, 1]], weight: 2 },
        { shape: [[0, 1], [1, 1], [1, 0]], weight: 2 },
        // Rectangles
        { shape: [[1, 1], [1, 1], [1, 1]], weight: 1 },
        { shape: [[1, 1, 1], [1, 1, 1]], weight: 1 },
    ];

    // Build weighted pool for random selection
    const PIECE_POOL = [];
    PIECE_DEFS.forEach(function (def, idx) {
        for (let i = 0; i < def.weight; i++) {
            PIECE_POOL.push(idx);
        }
    });

    // === Game State ===
    let grid = [];
    let currentPieces = [null, null, null];
    let score = 0;
    let bestScore = 0;
    let streak = 0;
    let gameOver = false;
    let clearAnimating = false;

    // === Drag State ===
    let dragging = false;
    let dragPieceIndex = -1;
    let dragPieceData = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragElement = null;
    let lastGhostRow = -1;
    let lastGhostCol = -1;
    let isTouch = false;
    let boardCellSize = 0;
    let boardGap = 3;
    let boardPadding = 6;

    // === DOM References ===
    const boardEl = document.getElementById('board');
    const ghostLayerEl = document.getElementById('ghost-layer');
    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('best-score');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreEl = document.getElementById('final-score');
    const newBestEl = document.getElementById('new-best');
    const playAgainBtn = document.getElementById('play-again-btn');
    const comboDisplay = document.getElementById('combo-display');
    const comboText = document.getElementById('combo-text');
    const boardWrapper = document.getElementById('board-wrapper');

    // === Initialization ===
    function init() {
        bestScore = parseInt(localStorage.getItem('blockBlasterBest') || '0', 10);
        bestScoreEl.textContent = bestScore;
        createBoard();
        playAgainBtn.addEventListener('click', restartGame);
        window.addEventListener('resize', updateBoardMetrics);
        startNewGame();
    }

    function createBoard() {
        boardEl.innerHTML = '';
        ghostLayerEl.innerHTML = '';
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                boardEl.appendChild(cell);

                const ghostCell = document.createElement('div');
                ghostCell.classList.add('cell', 'ghost-cell-empty');
                ghostCell.dataset.row = r;
                ghostCell.dataset.col = c;
                ghostLayerEl.appendChild(ghostCell);
            }
        }
        // Compute cell size after layout settles
        requestAnimationFrame(updateBoardMetrics);
    }

    function updateBoardMetrics() {
        const firstCell = boardEl.querySelector('.cell');
        if (firstCell) {
            boardCellSize = firstCell.getBoundingClientRect().width;
        }
    }

    function startNewGame() {
        grid = Array.from({ length: GRID_SIZE }, function () {
            return Array(GRID_SIZE).fill(null);
        });
        currentPieces = [null, null, null];
        score = 0;
        streak = 0;
        gameOver = false;
        clearAnimating = false;
        updateScoreDisplay();
        renderBoard();
        gameOverOverlay.classList.add('hidden');
        dealNewPieces();
    }

    function restartGame() {
        startNewGame();
    }

    // === Piece Generation ===
    function getRandomPiece() {
        const idx = PIECE_POOL[Math.floor(Math.random() * PIECE_POOL.length)];
        const shape = PIECE_DEFS[idx].shape.map(function (row) { return row.slice(); });
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        return { shape: shape, color: color };
    }

    function dealNewPieces() {
        for (let i = 0; i < PIECES_PER_ROUND; i++) {
            currentPieces[i] = getRandomPiece();
        }
        renderPieces();

        if (!canAnyPieceBePlaced()) {
            setTimeout(function () { endGame(); }, 300);
        }
    }

    // === Rendering ===
    function renderBoard() {
        const cells = boardEl.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            // Strip all classes except 'cell'
            cell.className = 'cell';
            if (grid[r][c]) {
                cell.classList.add('filled', grid[r][c]);
            }
        });
    }

    function renderPieces() {
        for (let i = 0; i < PIECES_PER_ROUND; i++) {
            const slot = document.getElementById('slot-' + i);
            slot.innerHTML = '';
            const piece = currentPieces[i];
            if (!piece) continue;

            const preview = document.createElement('div');
            preview.classList.add('piece-preview');
            preview.dataset.index = i;
            const rows = piece.shape.length;
            const cols = piece.shape[0].length;
            preview.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
            preview.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('piece-cell');
                    if (piece.shape[r][c]) {
                        cell.classList.add(piece.color);
                    } else {
                        cell.classList.add('empty');
                    }
                    preview.appendChild(cell);
                }
            }

            preview.addEventListener('mousedown', onDragStart);
            preview.addEventListener('touchstart', onDragStart, { passive: false });
            slot.appendChild(preview);
        }
    }

    function updateScoreDisplay() {
        scoreEl.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreEl.textContent = bestScore;
            localStorage.setItem('blockBlasterBest', bestScore.toString());
        }
    }

    // === Board Metrics ===
    function getBoardMetrics() {
        const boardRect = boardEl.getBoundingClientRect();
        const innerW = boardRect.width - boardPadding * 2;
        const gapTotal = boardGap * (GRID_SIZE - 1);
        const cellW = (innerW - gapTotal) / GRID_SIZE;
        const stepX = cellW + boardGap;
        return {
            boardRect: boardRect,
            cellW: cellW,
            stepX: stepX,
            stepY: stepX // square
        };
    }

    // === Drag and Drop ===
    function onDragStart(e) {
        if (gameOver || clearAnimating) return;
        e.preventDefault();

        const preview = e.currentTarget;
        const index = parseInt(preview.dataset.index);
        if (!currentPieces[index]) return;

        isTouch = !!e.touches;
        dragging = true;
        dragPieceIndex = index;
        dragPieceData = currentPieces[index];
        preview.classList.add('dragging');

        updateBoardMetrics();
        const cellSize = boardCellSize;
        const rows = dragPieceData.shape.length;
        const cols = dragPieceData.shape[0].length;

        // Create floating drag element at board-cell size
        dragElement = document.createElement('div');
        dragElement.id = 'drag-piece';
        dragElement.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cellSize + 'px)';
        dragElement.style.gridTemplateRows = 'repeat(' + rows + ', ' + cellSize + 'px)';
        dragElement.style.gap = boardGap + 'px';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('piece-cell');
                cell.style.width = cellSize + 'px';
                cell.style.height = cellSize + 'px';
                if (dragPieceData.shape[r][c]) {
                    cell.classList.add(dragPieceData.color);
                } else {
                    cell.classList.add('empty');
                }
                dragElement.appendChild(cell);
            }
        }

        document.body.appendChild(dragElement);

        // Offset: center horizontally, above finger vertically
        const pieceW = cols * (cellSize + boardGap) - boardGap;
        const pieceH = rows * (cellSize + boardGap) - boardGap;
        dragOffsetX = pieceW / 2;
        dragOffsetY = isTouch ? pieceH + 40 : pieceH / 2;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        moveDragElement(clientX, clientY);
        updateGhost(clientX, clientY);

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('touchcancel', onDragCancel);
    }

    function onDragMove(e) {
        if (!dragging) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        moveDragElement(clientX, clientY);
        updateGhost(clientX, clientY);
    }

    function moveDragElement(clientX, clientY) {
        if (!dragElement) return;
        dragElement.style.left = (clientX - dragOffsetX) + 'px';
        dragElement.style.top = (clientY - dragOffsetY) + 'px';
    }

    function onDragEnd(e) {
        if (!dragging) return;
        e.preventDefault();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const pos = getGridPosition(clientX, clientY);
        if (pos && canPlace(dragPieceData.shape, pos.row, pos.col)) {
            placePiece(dragPieceIndex, pos.row, pos.col);
        }

        cleanupDrag();
    }

    function onDragCancel() {
        cleanupDrag();
    }

    function cleanupDrag() {
        if (dragElement && dragElement.parentNode) {
            dragElement.parentNode.removeChild(dragElement);
        }
        dragElement = null;

        const previews = document.querySelectorAll('.piece-preview.dragging');
        previews.forEach(function (p) { p.classList.remove('dragging'); });

        clearGhost();
        dragging = false;
        dragPieceIndex = -1;
        dragPieceData = null;
        lastGhostRow = -1;
        lastGhostCol = -1;

        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        document.removeEventListener('touchcancel', onDragCancel);
    }

    function getGridPosition(clientX, clientY) {
        if (!dragPieceData) return null;

        const m = getBoardMetrics();
        const pieceRows = dragPieceData.shape.length;
        const pieceCols = dragPieceData.shape[0].length;

        // Top-left of the drag piece in screen coordinates
        const pieceLeft = clientX - dragOffsetX;
        const pieceTop = clientY - dragOffsetY;

        // Map to grid coordinates
        const col = Math.round((pieceLeft - m.boardRect.left - boardPadding) / m.stepX);
        const row = Math.round((pieceTop - m.boardRect.top - boardPadding) / m.stepY);

        if (row < 0 || col < 0 || row + pieceRows > GRID_SIZE || col + pieceCols > GRID_SIZE) {
            return null;
        }

        return { row: row, col: col };
    }

    // === Ghost Preview ===
    function updateGhost(clientX, clientY) {
        const pos = getGridPosition(clientX, clientY);
        if (!pos) {
            if (lastGhostRow !== -1 || lastGhostCol !== -1) {
                clearGhost();
                lastGhostRow = -1;
                lastGhostCol = -1;
            }
            return;
        }

        if (pos.row === lastGhostRow && pos.col === lastGhostCol) return;
        lastGhostRow = pos.row;
        lastGhostCol = pos.col;

        clearGhost();

        const shape = dragPieceData.shape;
        const valid = canPlace(shape, pos.row, pos.col);
        const ghostCells = ghostLayerEl.querySelectorAll('.cell');

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const gr = pos.row + r;
                const gc = pos.col + c;
                if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) continue;
                const idx = gr * GRID_SIZE + gc;
                const cell = ghostCells[idx];
                if (valid) {
                    cell.classList.add('ghost', dragPieceData.color);
                    cell.style.removeProperty('background');
                } else {
                    cell.classList.add('ghost-invalid');
                    cell.style.removeProperty('background');
                }
            }
        }
    }

    function clearGhost() {
        const ghostCells = ghostLayerEl.querySelectorAll('.cell');
        ghostCells.forEach(function (cell) {
            cell.className = 'cell ghost-cell-empty';
            cell.style.background = 'transparent';
        });
    }

    // === Placement Logic ===
    function canPlace(shape, row, col) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const gr = row + r;
                const gc = col + c;
                if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
                if (grid[gr][gc] !== null) return false;
            }
        }
        return true;
    }

    function canPlaceAnywhere(shape) {
        for (let r = 0; r <= GRID_SIZE - shape.length; r++) {
            for (let c = 0; c <= GRID_SIZE - shape[0].length; c++) {
                if (canPlace(shape, r, c)) return true;
            }
        }
        return false;
    }

    function canAnyPieceBePlaced() {
        for (let i = 0; i < PIECES_PER_ROUND; i++) {
            if (currentPieces[i] && canPlaceAnywhere(currentPieces[i].shape)) {
                return true;
            }
        }
        return false;
    }

    function placePiece(pieceIndex, row, col) {
        const piece = currentPieces[pieceIndex];
        if (!piece) return;

        const shape = piece.shape;
        let blocksPlaced = 0;

        // Place blocks on grid data
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                grid[row + r][col + c] = piece.color;
                blocksPlaced++;
            }
        }

        // Score for placing blocks
        score += blocksPlaced * POINTS_PER_BLOCK;

        // Remove piece from tray
        currentPieces[pieceIndex] = null;

        // Render board with new blocks
        renderBoard();
        animatePlacement(shape, row, col);

        // Try haptic feedback
        if (navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) { /* ignore */ }
        }

        // Check and clear lines (clears grid data immediately, animates visually)
        const linesCleared = checkAndClearLines();

        if (linesCleared > 0) {
            streak++;
            const linePoints = linesCleared * POINTS_PER_LINE * GRID_SIZE;
            const comboBonus = (linesCleared > 1) ? (linesCleared - 1) * COMBO_MULTIPLIER * GRID_SIZE : 0;
            const streakBonus = (streak > 1) ? (streak - 1) * STREAK_BONUS : 0;
            score += linePoints + comboBonus + streakBonus;

            showCombo(linesCleared, streak);
            showScorePopup(linePoints + comboBonus + streakBonus);

            if (navigator.vibrate) {
                try { navigator.vibrate([20, 30, 20]); } catch (e) { /* ignore */ }
            }
        } else {
            streak = 0;
        }

        updateScoreDisplay();

        // Check if all 3 pieces used -> deal new ones
        const allUsed = currentPieces.every(function (p) { return p === null; });
        if (allUsed) {
            // Delay dealing to let clear animation play if any
            const delay = linesCleared > 0 ? 550 : 150;
            setTimeout(function () {
                dealNewPieces();
            }, delay);
        } else {
            renderPieces();
            // Check game over after any clear animation finishes
            const delay = linesCleared > 0 ? 550 : 50;
            setTimeout(function () {
                if (!canAnyPieceBePlaced()) {
                    endGame();
                }
            }, delay);
        }
    }

    function animatePlacement(shape, row, col) {
        const cells = boardEl.querySelectorAll('.cell');
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const idx = (row + r) * GRID_SIZE + (col + c);
                const cell = cells[idx];
                cell.classList.add('placed-pop');
                (function (el) {
                    setTimeout(function () { el.classList.remove('placed-pop'); }, 200);
                })(cell);
            }
        }
    }

    // === Line Clearing ===
    function checkAndClearLines() {
        const rowsToClear = [];
        const colsToClear = [];

        // Check rows
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r].every(function (cell) { return cell !== null; })) {
                rowsToClear.push(r);
            }
        }

        // Check columns
        for (let c = 0; c < GRID_SIZE; c++) {
            let full = true;
            for (let r = 0; r < GRID_SIZE; r++) {
                if (grid[r][c] === null) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        const totalLines = rowsToClear.length + colsToClear.length;
        if (totalLines === 0) return 0;

        // Collect cell indices to clear
        const toClear = new Set();
        rowsToClear.forEach(function (r) {
            for (let c = 0; c < GRID_SIZE; c++) {
                toClear.add(r * GRID_SIZE + c);
            }
        });
        colsToClear.forEach(function (c) {
            for (let r = 0; r < GRID_SIZE; r++) {
                toClear.add(r * GRID_SIZE + c);
            }
        });

        // Clear grid data IMMEDIATELY (so game logic checks are accurate)
        toClear.forEach(function (idx) {
            const r = Math.floor(idx / GRID_SIZE);
            const c = idx % GRID_SIZE;
            grid[r][c] = null;
        });

        // Play visual animation on the DOM (cells still show colors from last renderBoard)
        clearAnimating = true;
        const cells = boardEl.querySelectorAll('.cell');

        toClear.forEach(function (idx) {
            cells[idx].classList.add('flash');
        });

        setTimeout(function () {
            toClear.forEach(function (idx) {
                cells[idx].classList.add('clearing');
            });

            setTimeout(function () {
                // Re-render board to match grid data
                renderBoard();
                clearAnimating = false;
            }, 350);
        }, 150);

        return totalLines;
    }

    // === Score Popup ===
    function showScorePopup(points) {
        const popup = document.createElement('div');
        popup.classList.add('score-popup');
        popup.textContent = '+' + points;

        const boardRect = boardWrapper.getBoundingClientRect();
        popup.style.left = (boardRect.width / 2 - 30) + 'px';
        popup.style.top = (boardRect.height / 2) + 'px';

        boardWrapper.appendChild(popup);
        setTimeout(function () {
            if (popup.parentNode) popup.parentNode.removeChild(popup);
        }, 900);
    }

    // === Combo Display ===
    var comboTimer = null;

    function showCombo(lines, currentStreak) {
        var text = '';
        if (lines >= 4) {
            text = 'INCREDIBLE! \u00d7' + lines;
        } else if (lines === 3) {
            text = 'AMAZING! \u00d73';
        } else if (lines === 2) {
            text = 'DOUBLE!';
        } else if (currentStreak > 2) {
            text = 'STREAK \u00d7' + currentStreak;
        } else if (currentStreak === 2) {
            text = 'COMBO!';
        }

        if (!text) return;

        comboText.textContent = text;
        comboDisplay.classList.remove('hidden');

        // Force animation restart
        comboText.style.animation = 'none';
        void comboText.offsetHeight;
        comboText.style.animation = '';

        clearTimeout(comboTimer);
        comboTimer = setTimeout(function () {
            comboDisplay.classList.add('hidden');
        }, 1200);
    }

    // === Game Over ===
    function endGame() {
        gameOver = true;
        finalScoreEl.textContent = score;

        if (score >= bestScore && score > 0) {
            newBestEl.classList.remove('hidden');
        } else {
            newBestEl.classList.add('hidden');
        }

        gameOverOverlay.classList.remove('hidden');
    }

    // === Start ===
    init();

})();
