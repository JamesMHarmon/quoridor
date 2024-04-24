import { Direction } from "./direction";

export interface Coordinate {
    row: number;
    column: string;
}

export type AlgebraicCoordinate = string;

export const parseCoordinate = (action: AlgebraicCoordinate): Coordinate => {
    return {
        column: action[0],
        row: parseInt(action[1]),
    }
}

export const coordinateToAlgebraic = ({ column, row }: Coordinate): AlgebraicCoordinate => `${column}${row}`;

export const coordinateInDir = ({ row, column }: Coordinate, dir: Direction): Coordinate => {
    switch (dir) {
        case Direction.Up:
            return { row: row + 1, column };
        case Direction.Down:
            return { row: row - 1, column };
        case Direction.Left:
            return { row, column: numericColumnToChar(columnNumericValue(column) - 1) };
        case Direction.Right:
            return { row, column: numericColumnToChar(columnNumericValue(column) + 1) };
    }
}

export const columnNumericValue = (column: string): number => column.charCodeAt(0) - charCodeA + 1;

export const numericColumnToChar = (column: number): string => String.fromCharCode(column + charCodeA - 1);

export const adjacentCoords = (coordinate: Coordinate, dir: Direction): Array<Coordinate> => {
    let coords: Array<Coordinate>;
    switch (dir) {
        case Direction.Up:
        case Direction.Down:
            coords = [coordinateInDir(coordinate, Direction.Left), coordinateInDir(coordinate, Direction.Right)]
            break;
        case Direction.Left:
        case Direction.Right:
            coords = [coordinateInDir(coordinate, Direction.Up), coordinateInDir(coordinate, Direction.Down)]
            break;
    }

    return coords;
}

export const offsetCoordinate = (coordinate: Coordinate, offsets: Array<Direction>) => offsets.reduce((coord, dir) => coordinateInDir(coord, dir), coordinate);

export const areCoordinatesEqual = (coord1: Coordinate, coord2: Coordinate): boolean => coord1.row === coord2.row && coord1.column === coord2.column;

const charCodeA = 'a'.charCodeAt(0);
