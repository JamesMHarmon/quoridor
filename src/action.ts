import { Coordinate, coordinateToAlgebraic } from './coordinate';

export type Action = MovePawn | PlaceWall;

export type AlgebraicAction = string;

export enum WallType {
    Vertical = 'v',
    Horizontal = 'h'
}

export interface PlaceWall {
    wallType: WallType;
    coordinate: Coordinate;
}

export interface MovePawn {
    coordinate: Coordinate;
}

export function isPlaceWall(action: Action): action is PlaceWall {
    return 'wallType' in action;
}

export function isMovePawn(action: Action): action is MovePawn {
    return !('wallType' in action);
}

export function actionToAlgebraic(action: Action): AlgebraicAction {
    const algebraicCoordinate = coordinateToAlgebraic(action.coordinate);

    if (isPlaceWall(action)) {
        const wallType = action.wallType === WallType.Horizontal ? 'h' : 'v';
        return `${algebraicCoordinate}${wallType}`;
    } else {
        return `${algebraicCoordinate}`;
    }
}
