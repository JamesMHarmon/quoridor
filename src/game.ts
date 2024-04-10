import { Action, isMovePawn, isPlaceWall, WallType } from './action';
import { AlgebraicCoordinate, Coordinate, coordinateToAlgebraic } from './coordinate';

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
        const pawnCoordinate = this._playerPositions[this._playerToMove - 1];

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
}
