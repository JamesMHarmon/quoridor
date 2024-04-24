import { Action, isMovePawn, isPlaceWall, PlaceWall, WallType } from './action';
import { adjacentCoords, AlgebraicCoordinate, Coordinate, coordinateInDir, coordinateToAlgebraic, columnNumericValue, numericColumnToChar, offsetCoordinate } from './coordinate';
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
            // If the pawn can't move, then it must be the wall or edge of the board so stop here.
            if (!this.pawnCanMove(coordinate, dir)) {
                continue;
            }

            // If the pawn can move and there is no pawn at the destination, then add the destination to the list of valid moves.
            const destCoord = coordinateInDir(coordinate, dir);
            const pawnAtDest = this.hasPawn(destCoord);
            if (!pawnAtDest) {
                const validPawnMoveDest = coordinateInDir(coordinate, dir);
                validActions.push({ coordinate: validPawnMoveDest });
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
        const playerNum = this.playerToMove();
        if (this.numWalls({ playerNum }) <= 0) {
            return [];
        }

        return [WallType.Horizontal, WallType.Vertical].flatMap(wallType => {
            const collidesWithExistingWall = (coordinate: Coordinate) => this.collidesWithExistingWall({ coordinate, wallType });
            const isWallBlocking = (coordinate: Coordinate) => this.isWallBlocking({ coordinate, wallType });

            const wallPlacements: Array<Action> = [];
            for (let row = 1; row < this._numRows; row++) {
                for (let column = 1; column < this._numCols; column++) {
                    const coordinate = { column: numericColumnToChar(column), row };
                    if (!collidesWithExistingWall(coordinate) && !isWallBlocking(coordinate)) {
                        wallPlacements.push({ coordinate, wallType });
                    }
                }
            }

            return wallPlacements;
        });
    }

    private collidesWithExistingWall({ coordinate, wallType }: PlaceWall): boolean {
        const isHorizontalWall = wallType === WallType.Horizontal;
        const oppositeWallType = isHorizontalWall ? WallType.Vertical : WallType.Horizontal;
        const offsetA = isHorizontalWall ? [Direction.Left] : [Direction.Up];
        const offsetB = isHorizontalWall ? [Direction.Right] : [Direction.Down];
        const noOffset = [];

        const candidates = [
            { offsets: noOffset, wallType },
            { offsets: noOffset, wallType: oppositeWallType },
            { offsets: offsetA, wallType },
            { offsets: offsetB, wallType }
        ];

        const collidesWithExistingWall = this.someWallAtOffsets(coordinate, candidates);
        return collidesWithExistingWall;
    }

    private canWallBlock({ coordinate, wallType }: PlaceWall): boolean {
        // If the wall does not connect two points, then it cannot block the path of a pawn.
        const { sideACandidates, sideBCandidates, middleCandidates } = this.touchingWallCandidates(wallType);

        const sideATouching = this.someWallAtOffsets(coordinate, sideACandidates);
        const sideBTouching = this.someWallAtOffsets(coordinate, sideBCandidates);
        const middleTouching = this.someWallAtOffsets(coordinate, middleCandidates);

        // Return true if any two or more of the sides are touching existing walls.
        return (sideATouching && sideBTouching) || (sideATouching && middleTouching) || (sideBTouching && middleTouching);
    }

    private isWallBlocking({ coordinate, wallType }: PlaceWall): boolean {
        if (!this.canWallBlock({ coordinate, wallType })) {
            return false;
        }

        const wallSet = wallType === WallType.Horizontal ? this._horizontalWalls : this._verticalWalls;
        const algebraicCoordinate = coordinateToAlgebraic(coordinate);
        let isBlocking = false;

        // Add the candidate wall to the set of walls and check if the goal is reachable for each player.
        wallSet.add(algebraicCoordinate);

        for (const [index, playerPosition] of this._playerPositions.entries()) {
            const playerNum = index + 1;
            const accessibleSquares = new Set<AlgebraicCoordinate>();
            const addCandidateMoves = (coord: Coordinate) => this.dirsBiassedTowardsGoal(playerNum).forEach(dir => candidateMoves.push([coord, dir]));
            const candidateMoves: [Coordinate, Direction][] = [];
            let goalReached = false;

            addCandidateMoves(playerPosition);
            accessibleSquares.add(coordinateToAlgebraic(playerPosition));

            while (candidateMoves.length) {
                const [candidateCoord, candidateDir] = candidateMoves.pop();

                if (this.isCoordinateGoal(playerNum, candidateCoord)) {
                    goalReached = true;
                    break;
                }

                const destCoord = coordinateInDir(candidateCoord, candidateDir);
                const algebraicDestCoord = coordinateToAlgebraic(destCoord);

                // This destination square has already been visited so we can ignore it.
                if (accessibleSquares.has(algebraicDestCoord)) {
                    continue;
                }

                if (this.pawnCanMove(candidateCoord, candidateDir)) {
                    accessibleSquares.add(algebraicDestCoord);
                    addCandidateMoves(destCoord);
                }
            }

            // Goal was never reached for the player, so the wall is blocking.
            if (!goalReached) {
                isBlocking = true;
                break;
            }
        }

        // Remove the candidate wall from the set of walls as it was added temporarily for validation of if a wall is blocking.
        wallSet.delete(algebraicCoordinate);

        return isBlocking;
    }

    private someWallAtOffsets = (coordinate: Coordinate, offsets: Array<WallOffset>): boolean => offsets.some((wallOffset) => this.wallAtOffset(coordinate, wallOffset));
    private wallAtOffset = (coordinate: Coordinate, { offsets, wallType }: WallOffset): boolean => this.hasWall(offsetCoordinate(coordinate, offsets), wallType);

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

    /// Returns the directions that a player should be biased towards moving in based on their player number.
    /// This is to help for efficiency reasons in performing goal reachability checks.
    private dirsBiassedTowardsGoal = (playerNum: number): Array<Direction> => {
        if (playerNum === 1) {
            return [Direction.Up, Direction.Right, Direction.Left, Direction.Down];
        } else if (playerNum === 2) {
            return [Direction.Down, Direction.Right, Direction.Left, Direction.Up];
        } else if (playerNum === 3) {
            return [Direction.Left, Direction.Up, Direction.Down, Direction.Right];
        } else if (playerNum === 4) {
            return [Direction.Right, Direction.Up, Direction.Down, Direction.Left];
        }

        return [];
    }

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

    /// Returns true if the coordinate is a goal for the player.
    private isCoordinateGoal(playerNum: number, { row, column }: Coordinate): boolean {
        if (playerNum === 1) {
            return row === this._numRows;
        } else if (playerNum === 2) {
            return row === 1;
        } else if (playerNum === 3) {
            return column === numericColumnToChar(this._numCols);
        } else if (playerNum === 4) {
            return column === 'a';
        }

        return false;
    }

    /// Returns the offsets and wall types that need to be checked for a wall that is touching another wall.
    private touchingWallCandidates(wallType: WallType): TouchingWallCandidates {
        const isHorizontalWall = wallType === WallType.Horizontal;
        const oppositeWallType = isHorizontalWall ? WallType.Vertical : WallType.Horizontal;
        const sideADirection = isHorizontalWall ? Direction.Up : Direction.Left;
        const sideBDirection = isHorizontalWall ? Direction.Down : Direction.Right;
        const perpendicularDirection = isHorizontalWall ? Direction.Up : Direction.Left;
        const perpendicularDirectionInverse = isHorizontalWall ? Direction.Down : Direction.Right;

        const sideCandidates = (sideDirection: Direction) => [
            { offsets: [sideDirection], wallType: oppositeWallType },
            { offsets: [perpendicularDirection, sideDirection], wallType: oppositeWallType },
            { offsets: [perpendicularDirectionInverse, sideDirection], wallType: oppositeWallType },
            { offsets: [sideDirection, sideDirection], wallType },
        ];

        const middleCandidates = () => [
            { offsets: [perpendicularDirection], wallType: oppositeWallType },
            { offsets: [perpendicularDirectionInverse], wallType: oppositeWallType },
        ];

        return {
            sideACandidates: sideCandidates(sideADirection),
            sideBCandidates: sideCandidates(sideBDirection),
            middleCandidates: middleCandidates()
        }
    }
}

type TouchingWallCandidates = {
    sideACandidates: Array<WallOffset>,
    sideBCandidates: Array<WallOffset>,
    middleCandidates: Array<WallOffset>
};

type WallOffset = { offsets: Array<Direction>, wallType: WallType };
