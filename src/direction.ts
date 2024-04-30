export enum Direction {
    Up,
    Down,
    Left,
    Right
}


export const dirs = (): Array<Direction> => [Direction.Up, Direction.Right, Direction.Down, Direction.Left];

/// Returns the directions that a player should be biased towards moving in based on their player number.
/// This is to help for efficiency reasons in performing goal reachability checks.
export const dirsBiassedTowardsGoal = (playerNum: number): Array<Direction> => {
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

export const perpendicularDirections = (dir: Direction): Array<Direction> => {
    switch (dir) {
        case Direction.Up:
        case Direction.Down:
            return [Direction.Left, Direction.Right]
            break;
        case Direction.Left:
        case Direction.Right:
            return [Direction.Up, Direction.Down]
            break;
    }
}
