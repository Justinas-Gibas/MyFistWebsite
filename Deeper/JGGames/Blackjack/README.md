# Blackjack Game

A fully responsive blackjack game with sound effects and modular architecture.

## Features

- Responsive design that scales to fit any screen resolution
- Sound effects for game actions:
  - `music` - Background music during gameplay
  - `bet` - Sound when placing bets
  - `card-flip` - Sound effect for when a card is dealt or flipped
  - `win` - Sound effect for when the player wins
  - `lose` - Sound effect for when the player loses
  - `tie` - Sound effect for when the game is a tie
- Dynamic sound generation using Web Audio API (as a fallback if sound files aren't available)
- Modular code structure for better maintainability

## Code Structure

The game code has been separated into a modular file system:

1. `main.js` - Entry point and game flow management
2. `card.js` - Card and deck management
3. `player.js` - Player and dealer logic
4. `ui.js` - User interface and responsive design
5. `audio.js` - Sound management and dynamic sound generation

## Implementation Details

### Sound Generation

The game includes fallback sound generation using the Web Audio API. If the sound files are not found, the game will dynamically generate appropriate sounds for each action.

### Responsive Design

The game automatically scales to fit any screen resolution while maintaining the proper aspect ratio and playability on all devices.

## Future Enhancements

- Additional betting options (insurance, splitting pairs)
- Multiple player support
- Statistics tracking
- Custom card themes