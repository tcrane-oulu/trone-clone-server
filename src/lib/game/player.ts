import { PacketIO } from '../packets/packetio';
import { Point } from '../packets/data/point';
import { Direction } from '../models/direction';

export class Player {
  io: PacketIO;
  id: number;
  name: string;
  position: Point;
  direction: Direction;

  constructor(io: PacketIO, id: number, name: string, position: Point) {
    this.io = io;
    this.id = id;
    this.name = name;
    this.position = position;
  }
}
