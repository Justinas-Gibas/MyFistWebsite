def main():
    import random
    user_move = input("Your move: ").split(",")

    user_x = int(user_move[0])
    user_y = int(user_move[1])

    # create board with alpha positions
    row0 = "    0   1   2  "
    row1 = "  ╭───┬───┬───╮"
    row2 = "0 │ a │ b │ c │"
    row3 = "  ├───┼───┼───┤"
    row4 = "1 │ d │ e │ f │"
    row5 = "  ├───┼───┼───┤"
    row6 = "2 │ g │ h │ i │"
    row7 = "  ╰───┴───┴───╯"

    board = [row0, row1, row2, row3, row4, row5, row6, row7]

    row_idx_map = {0: 2, 1: 4, 2: 6}
    col_idx_map = {0: 4, 1: 8, 2: 12}

    target_row_index = row_idx_map[user_x]
    target_col_index = col_idx_map[user_y]

    board[target_row_index] = (
        board[target_row_index][:target_col_index]
        + "X"
        + board[target_row_index][target_col_index + 1 :]
    )
   
    # determine target position
    if user_x == 0:
        row = row2
    elif user_x == 1:
        row = row4
    elif user_x == 2:
        row = row6


    if user_y == 0:
        target = row[4]
    elif user_y == 1:
        target = row[8]
    elif user_y == 2:
        target = row[12]

    print("Target:", target)
    # replace target with X
    

    letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i"]



    for line in board:
        print(line
            .replace("a", " ")
            .replace("b", " ")
            .replace("c", " ")
            .replace("d", " ")
            .replace("e", " ")
            .replace("f", " ")
            .replace("g", " ")
            .replace("h", " ")
            .replace("i", " ")
            )


    # generate bot move
    #bot_x = 0
    #bot_y = 0

    #print("Bot move:", bot_x, bot_y)

    #if three_in_a_row():
    #    print("You win"

    #print("You lose")

    # def print_board(board):
    # print("    0   1   2  ")
    # print("  ╭───┬───┬───╮")
    # for i in range(3):
    #     print(f"{i} │ {board[i][0]} │ {board[i][1]} │ {board[i][2]} │")
    #     if i < 2:
    #         print("  ├───┼───┼───┤")
    # print("  ╰───┴───┴───╯") 

main()
