import { Game } from './game';

describe('Game', () => {
    let game: Game;

    beforeEach(() => {
        game = new Game();
    });

    test('numRows getter', () => {
        expect(game.numRows()).toBe(9);
    });

    test('numWalls getter and setter', () => {
        expect(game.numWalls({ playerNum: 1 })).toBe(10);
        game.numWalls({ playerNum: 1, numWallsRemaining: 8 });
        expect(game.numWalls({ playerNum: 1 })).toBe(8);
    });

    test('playerToMove getter and setter', () => {
        expect(game.playerToMove()).toBe(1);
        game.playerToMove({ playerNum: 1 });
        expect(game.playerToMove()).toBe(1);
    });

    describe('updatePlayerToMove', () => {
        for (let numPlayers = 1; numPlayers <= 10; numPlayers++) {
            test(`should correctly update player to move for ${numPlayers} players`, () => {
                const game = new Game({ numPlayers });

                for (let i = 1; i <= numPlayers; i++) {
                    expect(game.playerToMove()).toBe(i);
                    expect(game.moveNumber()).toBe(1);
                    game.takeAction({ coordinate: { row: 0, column: 'a' } });
                }

                // After all players have moved, it should be player 1's turn again
                expect(game.playerToMove()).toBe(1);
                expect(game.moveNumber()).toBe(2);
            });
        }
    });
});