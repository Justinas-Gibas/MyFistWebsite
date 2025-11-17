import random

def print_board(board):
    print("    " + "   ".join(str(i) for i in range(len(board))) + "  ")

    print("  ╭" + "───┬" * (len(board) - 1) + "───╮")

    for i in range(len(board)):
        print(f"{i} │ " + " │ ".join(board[i]) + " │")

        if i < len(board) - 1:
            print("  ├" + "───┼" * (len(board) - 1) + "───┤")

    print("  ╰" + "───┴" * (len(board) - 1) + "───╯") 

def player_move(board):
     #user move
    user_move = input("Your move (row,col): ").split(",")
    user_x = int(user_move[0])
    user_y = int(user_move[1])
    if board[user_x][user_y] == " ":
        board[user_x][user_y] = "X"

def bot_move(board):
    while True:
        bot_x = random.randint(0, len(board)-1)
        bot_y = random.randint(0, len(board)-1)
        if board[bot_x][bot_y] == " ":
            board[bot_x][bot_y] = "O"
            break

def check_win(board, player):
    for i in range(len(board)):
        # check rows
        if all(cell == player for cell in board[i]):
            return True
        # check columns
        if all([board[j][i] == player for j in range(len(board))]):
            return True
    # check diagonals
    if all(board[i][i] == player for i in range(len(board))):
        return True
    # check anti-diagonal
    if all(board[i][len(board)-1-i] == player for i in range(len(board))):
        return True
    # if no win
    return False

def main():

    size = 5
    board = [[" " for _ in range(size)] for _ in range(size)]

    while True:
        player_move(board)
        if check_win(board, "X"):
            print_board(board)
            print("You win!")
            break

        if all(cell != " " for row in board for cell in row):
            print_board(board)
            print("It's a draw!")
            break
        
        bot_move(board)
        if check_win(board, "O"):
            print_board(board)
            print("You lose!")
            break

        print_board(board)

main()
