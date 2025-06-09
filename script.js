const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const status = document.getElementById('status');
const restartButton = document.getElementById('restartButton');
const resetScoreButton = document.getElementById('resetScoreButton');
const themeToggle = document.getElementById('themeToggle');
const playerXInput = document.getElementById('playerX');
const playerOInput = document.getElementById('playerO');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const timerElement = document.getElementById('timer');
const movesLeftElement = document.getElementById('movesLeft');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const toggleStatsButton = document.getElementById('toggleStats');
const statsContent = document.getElementById('statsContent');
const historyList = document.getElementById('historyList');
const modeButtons = document.querySelectorAll('.mode-btn');

// Audio elements
const placeSound = document.getElementById('placeSound');
const winSound = document.getElementById('winSound');
const drawSound = document.getElementById('drawSound');

// Game state
let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];
let scores = { X: 0, O: 0 };
let gameMode = 'classic';
let timer = null;
let timeLeft = 30;
let movesLeft = 9;
let moveHistory = [];
let redoStack = [];
let gameStats = {
    totalGames: 0,
    xWins: 0,
    oWins: 0,
    draws: 0,
    totalTime: 0
};

// Audio handling
function playSound(sound) {
    try {
        if (sound && sound.play) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Audio playback failed:', error);
            });
        }
    } catch (error) {
        console.log('Audio error:', error);
    }
}

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Theme handling
function setTheme(isDark) {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    themeToggle.checked = savedTheme === 'dark';
    setTheme(savedTheme === 'dark');
}

themeToggle.addEventListener('change', (e) => {
    setTheme(e.target.checked);
});

// Game mode handling
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        gameMode = button.dataset.mode;
        restartGame();
    });
});

// Timer handling
function startTimer() {
    if (gameMode !== 'timed') return;
    
    timeLeft = 30;
    updateTimerDisplay();
    
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleTimeUp() {
    gameActive = false;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    playSound(drawSound);
}

// Move history handling
function addToHistory(cellIndex, player) {
    const move = {
        cellIndex,
        player,
        timestamp: new Date().toLocaleTimeString()
    };
    moveHistory.push(move);
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    moveHistory.forEach((move, index) => {
        const moveElement = document.createElement('div');
        moveElement.className = 'history-item';
        moveElement.innerHTML = `
            <span>Move ${index + 1}: ${move.player} at ${move.timestamp}</span>
        `;
        historyList.appendChild(moveElement);
    });
    historyList.scrollTop = historyList.scrollHeight;
}

// Undo/Redo handling
function undoMove() {
    if (moveHistory.length === 0 || !gameActive) return;
    
    const lastMove = moveHistory.pop();
    redoStack.push(lastMove);
    
    gameState[lastMove.cellIndex] = '';
    cells[lastMove.cellIndex].textContent = '';
    cells[lastMove.cellIndex].classList.remove('x', 'o');
    
    currentPlayer = lastMove.player;
    movesLeft++;
    updateMovesLeft();
    updateHistoryDisplay();
    updateStatus();
}

function redoMove() {
    if (redoStack.length === 0 || !gameActive) return;
    
    const move = redoStack.pop();
    moveHistory.push(move);
    
    gameState[move.cellIndex] = move.player;
    cells[move.cellIndex].textContent = move.player;
    cells[move.cellIndex].classList.add(move.player.toLowerCase());
    
    currentPlayer = move.player === 'X' ? 'O' : 'X';
    movesLeft--;
    updateMovesLeft();
    updateHistoryDisplay();
    updateStatus();
}

// Statistics handling
function updateStats(result) {
    gameStats.totalGames++;
    if (result === 'X') gameStats.xWins++;
    else if (result === 'O') gameStats.oWins++;
    else gameStats.draws++;
    
    document.getElementById('totalGames').textContent = gameStats.totalGames;
    document.getElementById('xWins').textContent = gameStats.xWins;
    document.getElementById('oWins').textContent = gameStats.oWins;
    document.getElementById('draws').textContent = gameStats.draws;
}

function updateMovesLeft() {
    movesLeftElement.textContent = `Moves Left: ${movesLeft}`;
}

// Player name handling
function updatePlayerNames() {
    const playerXName = playerXInput.value || 'Player X';
    const playerOName = playerOInput.value || 'Player O';
    
    scoreXElement.querySelector('.player-name').textContent = playerXName;
    scoreOElement.querySelector('.player-name').textContent = playerOName;
    
    updateStatus();
}

playerXInput.addEventListener('input', updatePlayerNames);
playerOInput.addEventListener('input', updatePlayerNames);

function updateStatus() {
    const playerXName = playerXInput.value || 'Player X';
    const playerOName = playerOInput.value || 'Player O';
    const currentPlayerName = currentPlayer === 'X' ? playerXName : playerOName;
    
    if (!gameActive) {
        if (checkWin()) {
            status.textContent = `${currentPlayerName} wins!`;
        } else if (checkDraw()) {
            status.textContent = "Game ended in a draw!";
        }
    } else {
        status.textContent = `${currentPlayerName}'s turn`;
    }
}

function updateScores() {
    scoreXElement.querySelector('.score-value').textContent = scores.X;
    scoreOElement.querySelector('.score-value').textContent = scores.O;
}

function handleCellClick(e) {
    const cell = e.target;
    const cellIndex = Array.from(cells).indexOf(cell);

    if (gameState[cellIndex] !== '' || !gameActive) return;

    gameState[cellIndex] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    
    // Play sound effect
    playSound(placeSound);
    
    // Update move history
    addToHistory(cellIndex, currentPlayer);
    redoStack = []; // Clear redo stack when new move is made
    
    movesLeft--;
    updateMovesLeft();

    if (checkWin()) {
        gameActive = false;
        scores[currentPlayer]++;
        updateScores();
        playSound(winSound);
        highlightWinningCells();
        updateStatus();
        updateStats(currentPlayer);
        triggerConfetti();
        if (timer) clearInterval(timer);
        return;
    }

    if (checkDraw()) {
        gameActive = false;
        playSound(drawSound);
        updateStatus();
        updateStats('draw');
        if (timer) clearInterval(timer);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    
    if (gameMode === 'timed') {
        startTimer();
    }
}

function checkWin() {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameState[index] === currentPlayer;
        });
    });
}

function checkDraw() {
    return gameState.every(cell => cell !== '');
}

function highlightWinningCells() {
    winningCombinations.forEach(combination => {
        if (combination.every(index => gameState[index] === currentPlayer)) {
            combination.forEach(index => {
                cells[index].classList.add('winning-cell');
            });
        }
    });
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function restartGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = ['', '', '', '', '', '', '', '', ''];
    movesLeft = 9;
    moveHistory = [];
    redoStack = [];
    updateMovesLeft();
    updateStatus();
    updateHistoryDisplay();
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winning-cell');
    });
    
    if (timer) clearInterval(timer);
    if (gameMode === 'timed') {
        startTimer();
    }
}

function resetScore() {
    scores = { X: 0, O: 0 };
    gameStats = {
        totalGames: 0,
        xWins: 0,
        oWins: 0,
        draws: 0,
        totalTime: 0
    };
    updateScores();
    updateStats();
    restartGame();
}

// Event Listeners
cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

restartButton.addEventListener('click', restartGame);
resetScoreButton.addEventListener('click', resetScore);
undoButton.addEventListener('click', undoMove);
redoButton.addEventListener('click', redoMove);

toggleStatsButton.addEventListener('click', () => {
    statsContent.style.display = statsContent.style.display === 'none' ? 'grid' : 'none';
    toggleStatsButton.querySelector('i').classList.toggle('fa-chevron-down');
    toggleStatsButton.querySelector('i').classList.toggle('fa-chevron-up');
});

// Initialize the game
updatePlayerNames();
updateScores();
updateMovesLeft(); 