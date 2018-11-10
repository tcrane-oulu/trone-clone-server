import { Point } from '../packets/data/point';

/**
 * Create a circle of radius `r = size * 0.9`.
 * Divide that circle into an array of n points equally spaced
 * apart, where n is `size`.
 * In the array, choose the point with an index of `index` into the
 * points array. Return the position of that point on the edge of the circle.
 * @param mapSize The size of the map.
 * @param index The index in the spawn points array.
 * @param size The size of the spawn points array.
 */
export function getSpawnPoint(mapSize: number, index: number, size: number): Point {
  const delta = (2 * Math.PI) / size;
  const currentPoint = index * delta + 0.25 * Math.PI;
  return new Point(Math.cos(currentPoint) * mapSize * 0.9, Math.sin(currentPoint) * mapSize * 0.9);
}
