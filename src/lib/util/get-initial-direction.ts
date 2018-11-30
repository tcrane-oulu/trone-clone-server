import { Direction } from '../models/direction';

// import { Point } from '../packets/data/point';
// import { Direction } from '../models/direction';

// export function getInitialDirection(mapSize: number, location: Point): Direction {
//   const midPoint = new Point(mapSize / 2, mapSize / 2);
//   const angle = location.angleTo(midPoint);
//   return Direction.Down;
// }

export function getInitialDirection(index: number, size: number): Direction {
  let dir = Direction.Left;
  const factor = index / size;
  if (factor <= 0.875 && factor > 0.625) {
    dir = Direction.Up;
  } else if (factor <= 0.625 && factor > 0.375) {
    dir = Direction.Right;
  } else if (factor > 0.125) {
    dir = Direction.Down;
  }
  return dir;
}
