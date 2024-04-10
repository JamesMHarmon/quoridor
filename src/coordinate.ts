export interface Coordinate {
    row: number;
    column: string;
}

export type AlgebraicCoordinate = string;

export const coordinateToAlgebraic = ({ column, row }: Coordinate): AlgebraicCoordinate => `${column}${row}`;
