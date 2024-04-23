import { Direction } from "./direction";
import { Coordinate, coordinateToAlgebraic, coordinateInDir } from "./coordinate";

describe('coordinateToAlgebraic', () => {
    it('should convert a coordinate to algebraic notation', () => {
        const coordinate: Coordinate = { column: 'a', row: 1 };
        expect(coordinateToAlgebraic(coordinate)).toEqual('a1');
        expect(coordinateToAlgebraic(coordinate)).toBe('a1');
    });
});

describe('coordinateInDir', () => {
    it('should return the correct coordinate when moving up', () => {
        const coordinate: Coordinate = { column: 'b', row: 2 };
        expect(coordinateInDir(coordinate, Direction.Up)).toEqual({ column: 'b', row: 3 });
    });

    it('should return the correct coordinate when moving down', () => {
        const coordinate: Coordinate = { column: 'b', row: 2 };
        expect(coordinateInDir(coordinate, Direction.Down)).toEqual({ column: 'b', row: 1 });
    });

    it('should return the correct coordinate when moving left', () => {
        const coordinate: Coordinate = { column: 'b', row: 2 };
        expect(coordinateInDir(coordinate, Direction.Left)).toEqual({ column: 'a', row: 2 });
    });

    it('should return the correct coordinate when moving right', () => {
        const coordinate: Coordinate = { column: 'b', row: 2 };
        expect(coordinateInDir(coordinate, Direction.Right)).toEqual({ column: 'c', row: 2 });
    });
});
