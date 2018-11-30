import { MAP_SIZE } from '../globals';

export interface Coordinate {
  x: number;
  y: number;
}

export function outOfBounds(coord: Coordinate): boolean {
  return coord.x <= 0 || coord.x >= MAP_SIZE || coord.y <= 0 || coord.y >= MAP_SIZE;
}
