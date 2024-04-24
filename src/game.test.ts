import { parseAction, actionToAlgebraic } from './action';
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

    describe('validPawnMoveActions', () => {
        test('should return valid pawn moves', () => {
            const game = new Game();
            let validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'e', row: 2 } },
                { coordinate: { column: 'f', row: 1 } },
                { coordinate: { column: 'd', row: 1 } },
            ]);

            game.takeAction(parseAction('e2'));

            validActions = game.validPawnMoveActions();
            expect(validActions).toEqual([
                { coordinate: { column: 'f', row: 9 } },
                { coordinate: { column: 'e', row: 8 } },
                { coordinate: { column: 'd', row: 9 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall on the right', () => {
            const game = new Game();

            game.takeAction(parseAction('e1v'));
            game.takeAction(parseAction('e8'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'e', row: 2 } },
                { coordinate: { column: 'd', row: 1 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall on the left', () => {
            const game = new Game();

            game.takeAction(parseAction('d1v'));
            game.takeAction(parseAction('e8'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'e', row: 2 } },
                { coordinate: { column: 'f', row: 1 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall above', () => {
            const game = new Game();

            game.takeAction(parseAction('d1h'));
            game.takeAction(parseAction('e8'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'f', row: 1 } },
                { coordinate: { column: 'd', row: 1 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall above 2', () => {
            const game = new Game();

            game.takeAction(parseAction('e1h'));
            game.takeAction(parseAction('e8'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'f', row: 1 } },
                { coordinate: { column: 'd', row: 1 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall below', () => {
            const game = new Game();

            game.takeAction(parseAction('d8h'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'f', row: 9 } },
                { coordinate: { column: 'd', row: 9 } },
            ]);
        });

        test('should return valid pawn moves if blocked by wall below 2', () => {
            const game = new Game();

            game.takeAction(parseAction('e8h'));

            const validActions = game.validPawnMoveActions();

            expect(validActions).toEqual([
                { coordinate: { column: 'f', row: 9 } },
                { coordinate: { column: 'd', row: 9 } },
            ]);
        });


        test('should return valid pawn moves if on edge of board', () => {
            const game = new Game();

            game.takeAction(parseAction('a1'));
            game.playerToMove({ playerNum: 1 });

            let validActions = game.validPawnMoveActions();
            expect(validActions).toEqual([
                { coordinate: { column: 'a', row: 2 } },
                { coordinate: { column: 'b', row: 1 } },
            ]);

            game.takeAction(parseAction('i9'));
            game.playerToMove({ playerNum: 1 });

            validActions = game.validPawnMoveActions();
            expect(validActions).toEqual([
                { coordinate: { column: 'i', row: 8 } },
                { coordinate: { column: 'h', row: 9 } },
            ]);
        });

    });

    describe('validWallActions', () => {
        test('It should return all valid wall placements actions', () => {
            const game = new Game();
            let validActions = game.validWallActions().map(actionToAlgebraic);
            expect(validActions.length).toBe(128);

            game.takeAction(parseAction('e2h'));
            validActions = game.validWallActions().map(actionToAlgebraic);

            const invalidActions = ['e2v', 'e2h', 'd2h', 'f2h'];
            invalidActions.forEach(invalidAction => expect(validActions).not.toContain(invalidAction));

            expect(validActions.length).toBe(124);
        });

        test('It should return all valid wall placements actions vertical', () => {
            const game = new Game();
            let validActions = game.validWallActions().map(actionToAlgebraic);
            expect(validActions.length).toBe(128);

            game.takeAction(parseAction('e3v'));
            validActions = game.validWallActions().map(actionToAlgebraic);

            const invalidActions = ['e3h', 'e4v', 'e3v', 'e2v'];
            invalidActions.forEach(invalidAction => expect(validActions).not.toContain(invalidAction));

            expect(validActions.length).toBe(124);
        });

        test('It should return all valid wall placements that do not block p1 from reaching goal.', () => {
            const game = new Game();
            let validActions = game.validWallActions().map(actionToAlgebraic);

            game.takeAction(parseAction('a2h'));
            game.takeAction(parseAction('c2h'));
            game.takeAction(parseAction('e2h'));
            game.takeAction(parseAction('g2h'));
            game.takeAction(parseAction('h2v'));

            validActions = game.validWallActions().map(actionToAlgebraic);

            const invalidActions = ['h3h'];
            invalidActions.forEach(invalidAction => expect(validActions).not.toContain(invalidAction));

            expect(validActions.length).toBe(111);

            game.takeAction(parseAction('b2'));
            game.takeAction(parseAction('b8'));

            validActions = game.validWallActions().map(actionToAlgebraic);
            expect(validActions).toContain('h3h');
            expect(validActions.length).toBe(113);
        });

        test('It should return no valid wall placements if p1 has no walls remaining.', () => {
            const game = new Game({ wallsPerPlayer: 1 });

            let validActions = game.validWallActions().map(actionToAlgebraic);
            expect(validActions.length).toBe(128);

            game.takeAction(parseAction('e2h'));
            game.takeAction(parseAction('e8'));

            validActions = game.validWallActions().map(actionToAlgebraic);
            expect(validActions.length).toBe(0);
        });
    });

    describe('takeAction', () => {
        test('It should allow for algebraic notation', () => {
            game.takeAction('e2');
            expect(game.playerPosition({ playerNum: 1 })).toEqual({ column: 'e', row: 2 });
        });
    });
});