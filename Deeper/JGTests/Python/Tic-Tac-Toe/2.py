def main():

    board = [[" " for _ in range(3)] for _ in range(3)]

    while True:
        player_move(board)
        if check_win(board, "X"):
            print("You win!")
            break

        if all(cell != " " for row in board for cell in row):
            print("\n".join(["".join(row) for row in board]))
            print("It's a draw!")
            break

        bot_move(board)
        if check_win(board, "O"):
            print("You lose!")
            print("\n".join(["".join(row) for row in board]))
            break

        print("\n".join(["".join(row) for row in board]))
        
def player_move(board):
    user_move = input("Your move (row,col): ").split(",")
    user_x = int(user_move[0])
    user_y = int(user_move[1])
    board[user_x][user_y] = "X"

def bot_move(board):
    import random 
    # mini loop to find empty cell
    while True:
        bot_x = random.randint(0, 2)
        bot_y = random.randint(0, 2)
        if board[bot_x][bot_y] == " ":
            board[bot_x][bot_y] = "O"
            break
        
def check_win(board, player):
    # Check rows, columns and diagonals
    for i in range(len(board)):

        # check rows
        if all([cell == player for cell in board[i]]):
            return True
        
        # check columns
        if all([board[j][i] == player for j in range(3)]):
            return True
        
    # check diagonals
    if all([board[i][i] == player for i in range(3)]):
        return True
    
    # check anti-diagonal
    if all([board[i][3-1-i] == player for i in range(3)]):
        return True
    
    # if no win
    return False


main()
