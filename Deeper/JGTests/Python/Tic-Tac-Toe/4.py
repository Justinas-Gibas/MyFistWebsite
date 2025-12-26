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
    
    size = len(board)
    
    # 1. Try to win
    move = find_winning_move(board, "O")
    if move:
        board[move[0]][move[1]] = "O"
        return
    
    # 2. Block player from winning
    move = find_winning_move(board, "X")
    if move:
        board[move[0]][move[1]] = "O"
        return
    
    # 3. Take center if available
    center = size // 2
    if board[center][center] == " ":
        board[center][center] = "O"
        return
    
    # 4. Take a corner if available
    corners = [(0, 0), (0, size-1), (size-1, 0), (size-1, size-1)]
    empty_corners = [(row, colums) for row, colums in corners if board[row][colums] == " "]
    if empty_corners:
        move = random.choice(empty_corners)
        board[move[0]][move[1]] = "O"
        return
    
    # 5. Take any available space
    empty_cells = [(row, colum) for row in range(size) for colum in range(size) if board[row][colum] == " "]
    if empty_cells:
        move = random.choice(empty_cells)
        board[move[0]][move[1]] = "O"


            
def find_winning_move(board, player):
    
    # Check rows
    for row_counter in range(len(board)):
        if board[row_counter].count(player) == len(board) - 1 and board[row_counter].count(" ") == 1:
            return (row_counter, board[row_counter].index(" "))
    
    # Check columns
    for column_counter in range(len(board)):
        column = [board[row_counter][column_counter] for row_counter in range(len(board))]
        if column.count(player) == len(board) - 1 and column.count(" ") == 1:
            return (column.index(" "), column_counter)
    
    # Check main diagonal
    diagonal = [board[cordinate][cordinate] for cordinate in range(len(board))]  #0,0 1,1 2,2 
    if diagonal.count(player) == len(board) - 1 and diagonal.count(" ") == 1: # how many Xs and how many empty
        empty_row_cordinate = diagonal.index(" ") #position
        empty_colum_cordinate = diagonal.index(" ") #position
        return (empty_row_cordinate, empty_colum_cordinate)
    
    # Check anti-diagonal
    anti_diagonal = [board[cordinate][len(board)-1-cordinate] for cordinate in range(len(board))]  #0,2 1,1 2,0
    if anti_diagonal.count(player) == len(board) - 1 and anti_diagonal.count(" ") == 1: # how many Xs and how many empty
        empty_row_cordinate = anti_diagonal.index(" ") #position 
        empty_colum_cordinate = anti_diagonal.index(" ") #position 
        return (empty_row_cordinate, len(board)-1-empty_colum_cordinate)
    
    return None


def check_win(board, player):
    for row_counter in range(len(board)):
        # check rows
        if all(cell == player for cell in board[row_counter]):
            return True
        # check columns
        if all([board[column_counter][row_counter] == player for column_counter in range(len(board))]):
            return True
    # check diagonals
    if all(board[cordinate][cordinate] == player for cordinate in range(len(board))): # 0,0 1,1 2,2
        return True
    # check anti-diagonal
    if all(board[cordinate][len(board)-1-cordinate] == player for cordinate in range(len(board))): # 0,2 1,1 2,0
        return True
    # if no win
    return False

def main():

    size = 3
    board = [[" " for _ in range(size)] for _ in range(size)]

    while True:
        #print_board(board)
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
