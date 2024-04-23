import { Action, isMovePawn, isPlaceWall, WallType } from './action';
import { adjacentCoords, AlgebraicCoordinate, Coordinate, coordinateInDir, coordinateToAlgebraic, columnNumericValue, numericColumnToChar } from './coordinate';
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
    private _horizontalWalls: Set<AlgebraicCoordinate> = new Set();
    private _verticalWalls: Set<AlgebraicCoordinate> = new Set();

    constructor({ numCols = 9, numRows = 9, numPlayers = 2, wallsPerPlayer = 10 }: GameOptions = {}) {
        this._numCols = numCols;
        this._numRows = numRows;
        this._numPlayers = numPlayers;
        this._playerWallsRemaining = Array(numPlayers).fill(wallsPerPlayer);
        this._playerToMove = 1;
        this._moveNumber = 1;
        this._playerPositions = this.initialPlayerPositions();
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

    public validPawnMoveActions(): Array<Action> {
        const validActions: Array<Action> = [];
        const coordinate = this._playerPositions[this._playerToMove - 1];

        for (const dir of this.dirs()) {
            // Check if the pawn can move in the given direction. If it can, simply add to the list and stop.
            if (this.pawnCanMove(coordinate, dir)) {
                const validPawnMoveDest = coordinateInDir(coordinate, dir);
                validActions.push({ coordinate: validPawnMoveDest });
                continue;
            }

            // If the pawn can't move, but there is no pawn in the way, then it must be the wall or edge of the board so stop here.
            const destCoord = coordinateInDir(coordinate, dir);
            if (!this.hasPawn(destCoord)) {
                continue;
            }

            // There is a pawn in the way so check if it can jump over it.
            if (this.pawnCanMove(destCoord, dir)) {
                const validPawnMoveDest = coordinateInDir(destCoord, dir);
                validActions.push({ coordinate: validPawnMoveDest });
                continue;
            }

            // There is a pawn in the way and it can't jump over it, so check the adjacent (left or right) directions.
            for (const coordinate of adjacentCoords(destCoord, dir)) {
                if (this.pawnCanMove(coordinate, dir)) {
                    const validPawnMoveDest = coordinateInDir(coordinate, dir);
                    validActions.push({ coordinate: validPawnMoveDest });
                }
            }
        }

        return validActions;
    }

    public validWallActions(): Array<Action> {
        return this.wallPlacements();
    }

    public validActions(): Array<Action> {
        return this.validPawnMoveActions().concat(this.validWallActions());
    }

    public moveNumber(): number {
        return this._moveNumber;
    }

    private wallPlacements(): Array<Action> {
        return [WallType.Horizontal, WallType.Vertical].flatMap(wallType => {
            const oppositeWallType = wallType === WallType.Horizontal ? WallType.Vertical : WallType.Horizontal;
            const offsets = wallType === WallType.Horizontal ? [Direction.Left, Direction.Right] : [Direction.Up, Direction.Down];
            const collidesWithExistingWall = (coordinate: Coordinate) => this.hasWall(coordinate, wallType) || this.hasWall(coordinate, oppositeWallType) || offsets.some(offset => this.hasWall(coordinateInDir(coordinate, offset), wallType));

            const wallPlacements: Array<Action> = [];
            for (let row = 1; row < this._numRows; row++) {
                for (let column = 1; column < this._numCols; column++) {
                    const coordinate = { column: numericColumnToChar(column), row };
                    if (!collidesWithExistingWall(coordinate)) {
                        wallPlacements.push({ coordinate, wallType });
                    }
                }
            }

            return wallPlacements;
        });
    }

    private updatePlayerToMove() {
        this._playerToMove = (this._playerToMove % this._numPlayers) + 1;
        if (this._playerToMove === 1) {
            this._moveNumber += 1;
        }
    }

    private pawnCanMove(coordinate: Coordinate, dir: Direction): boolean {
        const destCoord = coordinateInDir(coordinate, dir);

        const isInBounds = this.isInBounds(destCoord);
        if (!isInBounds) {
            return false;
        }

        const occupiedByPawn = this.hasPawn(destCoord);
        if (occupiedByPawn) {
            return false;
        }

        // Walls are in notation of the coordinate that is in the bottom left of the wall.
        // When moving up, check if there is a wall on the cell that the pawn is in or the cell to the left.
        // When moving down, check if there is a wall on the cell below the pawn or the cell to the left of it.
        // When moving to the right, check if there is a wall on the cell of the pawn or the cell below it.
        // When moving to the left, check if there is a wall on the cell to the left of the pawn or the cell below it.
        const wallType = dir === Direction.Up || dir === Direction.Down ? WallType.Horizontal : WallType.Vertical;
        const wallOffsetDir = dir === Direction.Up || dir === Direction.Down ? Direction.Left : Direction.Down;
        const wallCoord = dir === Direction.Up || dir === Direction.Right ? coordinate : destCoord;
        const wallOffsetCoord = coordinateInDir(wallCoord, wallOffsetDir);
        const blockedByWall = this.hasWall(wallCoord, wallType) || this.hasWall(wallOffsetCoord, wallType);

        return !blockedByWall;
    }

    private isInBounds({ column, row }: Coordinate) {
        const numericColumn = columnNumericValue(column);
        return row >= 1 && row <= this._numRows && numericColumn >= 1 && numericColumn <= this._numCols;
    }

    private hasWall(coordinate: Coordinate, wallType: WallType): boolean {
        const wallCoordinates = wallType === WallType.Horizontal ? this._horizontalWalls : this._verticalWalls;
        return wallCoordinates.has(coordinateToAlgebraic(coordinate));
    }

    private hasPawn({ column, row }: Coordinate): boolean {
        return this._playerPositions.some(({ column: playerPosColumn, row: playerPositionRow }) => column === playerPosColumn && row === playerPositionRow);
    }

    private dirs = (): Array<Direction> => [Direction.Up, Direction.Right, Direction.Down, Direction.Left];

    private initialPlayerPositions(): Coordinate[] {
        const playerPositions: Coordinate[] = [];
        const middleRow = Math.floor((this._numRows + 1) / 2);
        const middleColumn = numericColumnToChar(Math.floor((this._numCols + 1) / 2));

        playerPositions[0] = { column: middleColumn, row: 1 };

        if (this._numPlayers >= 2) {
            playerPositions[1] = { column: middleColumn, row: this._numRows };
        }

        if (this._numPlayers >= 3) {
            playerPositions[2] = { column: 'a', row: middleRow };
        }

        if (this._numPlayers >= 4) {
            playerPositions[3] = { column: numericColumnToChar(this._numCols), row: middleRow };
        }

        return playerPositions;
    }
}
