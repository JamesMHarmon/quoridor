import { Coordinate, coordinateToAlgebraic, parseCoordinate } from './coordinate';

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

export const parseAction = (action: AlgebraicAction): Action => {
    const coordinate = parseCoordinate(action.slice(0, 2));

    if (action.length > 2) {
        const wallType = action[2] as WallType;
        return { wallType, coordinate };
    }

    return { coordinate };
}

export const isPlaceWall = (action: Action): action is PlaceWall => 'wallType' in action;

export const isMovePawn = (action: Action): action is MovePawn => !('wallType' in action);

export const actionToAlgebraic = (action: Action): AlgebraicAction => {
    const algebraicCoordinate = coordinateToAlgebraic(action.coordinate);

    if (isPlaceWall(action)) {
        const wallType = action.wallType === WallType.Horizontal ? 'h' : 'v';
        return `${algebraicCoordinate}${wallType}`;
    } else {
        return `${algebraicCoordinate}`;
    }
}
