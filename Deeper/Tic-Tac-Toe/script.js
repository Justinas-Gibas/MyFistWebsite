const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('reset');
let currentPlayer = 'X';
let board = Array(9).fill(null);

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        if (!board[index]) {
            board[index] = currentPlayer;
            cell.textContent = currentPlayer;
            if (checkWin()) {
                alert(`${currentPlayer} wins!`);
                resetGame();
            } else if (board.every(cell => cell)) {
                alert('It\'s a draw!');
                resetGame();
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    });
});

resetButton.addEventListener('click', resetGame);

function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

function resetGame() {
    board.fill(null);
    cells.forEach(cell => cell.textContent = '');
    currentPlayer = 'X';
}
