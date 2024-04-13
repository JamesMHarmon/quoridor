import { Action, isMovePawn, isPlaceWall, WallType } from './action';
import { AlgebraicCoordinate, Coordinate, coordinateToAlgebraic } from './coordinate';
import { Direction } from './direction';

export interface GameOptions {
    numCols?: number;
    numRows?: number;
    numPlayers?: number;
    wallsPerPlayer?: number;
}

export interface GameState {
    numCols: number;
    numRows: number;
    playerToMove: number;
    moveNumber: number;
    numPlayers: number;
    playerWallsRemaining: Array<number>;
    playerPositions: Array<Coordinate>;
    horizontalWalls: Array<Coordinate>;
    verticalWalls: Array<Coordinate>;
}

export class Game {
    private _numCols: number;
    private _numRows: number;
    private _playerToMove: number;
    private _moveNumber: number;
    private _numPlayers: number;
    private _playerWallsRemaining: Array<number>;
    private _playerPositions: Array<Coordinate>;
    private _horizontalWalls: Set<AlgebraicCoordinate>;
    private _verticalWalls: Set<AlgebraicCoordinate>;

    constructor({ numCols = 9, numRows = 9, numPlayers = 2, wallsPerPlayer = 10 }: GameOptions = {}) {
        this._numCols = numCols;
        this._numRows = numRows;
        this._numPlayers = numPlayers;
        this._playerWallsRemaining = Array(numPlayers).fill(wallsPerPlayer);
        this._playerToMove = 1;
        this._moveNumber = 1;
    }

    public numWalls({ playerNum }: { playerNum: number }): number;
    public numWalls({ playerNum, numWallsRemaining }: { playerNum: number, numWallsRemaining: number }): void;
    public numWalls({ playerNum, numWallsRemaining }: { playerNum: number, numWallsRemaining?: number }): number | void {
        if (numWallsRemaining !== undefined) {
            this._playerWallsRemaining[playerNum - 1] = numWallsRemaining;
        } else {
            return this._playerWallsRemaining[playerNum - 1];
        }
    }

    public playerToMove(): number;
    public playerToMove({ playerNum }: { playerNum: number }): void;
    public playerToMove({ playerNum }: { playerNum?: number } = {}): number | void {
        if (playerNum !== undefined) {
            this._playerToMove = playerNum;
        } else {
            return this._playerToMove;
        }
    }

    public numColumns = (): number => this._numCols;

    public numRows = (): number => this._numRows;

    public numPlayers = (): number => this._numPlayers;

    public takeAction(action: Action) {
        if (isMovePawn(action)) {
            this._playerPositions[this._playerToMove - 1] = { ...action.coordinate };
        }

        if (isPlaceWall(action)) {
            const algebraicCoordinate = coordinateToAlgebraic(action.coordinate);
            const walls = action.wallType === WallType.Horizontal ? this._horizontalWalls : this._verticalWalls;
            walls.add(algebraicCoordinate);
            this._playerWallsRemaining[this._playerToMove - 1] -= 1;
        }

        this.updatePlayerToMove();
    }

    public validMoveActions(): Array<Action> {
        const validActions: Array<Action> = [];
        const originPawnCoord = this._playerPositions[this._playerToMove - 1];

        // Generate all possible pawn moves. This array is used as a stack to track which moves are left to check.
        // Additional checks are needed in the case that a pawn is blocked by a another pawn.
        const pawnCoordDirs = this.dirs().map(dir => [originPawnCoord, dir] as [Coordinate, Direction]);

        for (const [coordinate, dir] of pawnCoordDirs) {
            // Check if the pawn can move in the given direction. If it can, simply add to the list and stop.
            if (this.pawnCanMove(coordinate, dir)) {
                validActions.push({ coordinate });
                continue;
            }

            // If the pawn can't move, but there is no pawn in the way, then it must be the wall or edge of the board so stop here.
            const destCoord = coordinateInDir(coordinate, dir);
            if (!this.hasPawn(destCoord)) {
                continue;
            }

            // There is a pawn in the way so check if it can jump over it.
            if (this.pawnCanMove(destCoord, dir)) {
                validActions.push({ coordinate: destCoord });
                continue;
            }

            // There is a pawn in the way and it can't jump over it, so check the adjacent (left or right) directions.
            for (const coordinate of adjacentCoords(destCoord)) {
                if (this.pawnCanMove(coordinate, dir)) {
                    validActions.push({ coordinate });
                }
            }
        }

        return validActions;
    }

    public validWallActions(): Array<Action> {
        return [];
    }

    public validActions(): Array<Action> {
        return this.validMoveActions().concat(this.validWallActions());
    }

    public moveNumber(): number {
        return this._moveNumber;
    }

    private updatePlayerToMove() {
        this._playerToMove = (this._playerToMove % this._numPlayers) + 1;
        if (this._playerToMove === 1) {
            this._moveNumber += 1;
        }
    }

    private pawnCanMove(coordinate: Coordinate, dir: Direction): boolean {

    }

    private hasWall(coordinate: Coordinate, wallType: WallType): boolean {
    }

    private hasPawn(coordinate: Coordinate): boolean {
    }

    private dirs = (): Array<Direction> => [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
}
