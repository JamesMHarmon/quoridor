# Quoridor

Quoridor is a TypeScript package that allows you to play a game of Quoridor. It provides a `Game` class with methods to manage the game state, get a list of valid actions as well as take actions.

## Usage

```typescript
import { Game, toAlgebraicNotation } from 'quoridor-engine';

// Initialize a new game.
let game = new Game();

// Check if a move is valid.
let isActionValid = game.isValid('e2');

// Take an action
game.takeAction('e2');

// Get a list of all valid actions.
let actions = game.validActions();

// Log the list of valid actions to the console in algebraic notation.
console.log(`Actions: ${actions.map(toAlgebraicNotation).join(', ')}`);

// Get or set the player to move.
let playerNum = games.playerToMove();

// Get or set the number of walls that a player has.
let numWalls = game.numWalls({ playerNum });

// Get or set a players position.
let position = game.playerPosition({ playerNum });

// Get or set the move number.
let moveNumber = game.moveNumber();
```

## Options

A `Game` allows for the following options, all of which are optional.

```typescript
new Game({
    numCols: 9; // The number of columns on the game board.
    numRows: 9; // The number of rows on the game board.
    numPlayers: 2; // The number of players in the game. Valid values are 2-4.
    wallsPerPlayer: 10; // The number of walls each player starts with.
});
```
