import { Point } from '../packets/data/point';
import { MAP_SIZE } from '../globals';

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
export function getSpawnPoint(index: number, size: number): Point {
  const delta = (2 * Math.PI) / size;
  const currentPoint = index * delta; // + 0.25 * Math.PI;
  const x = Math.cos(currentPoint) * (MAP_SIZE / 2) * 0.9 + (MAP_SIZE / 2);
  const y = Math.sin(currentPoint) * (MAP_SIZE / 2) * 0.9 + (MAP_SIZE / 2);
  return new Point(Math.floor(x) + 0.5, Math.floor(y) + 0.5);
}
