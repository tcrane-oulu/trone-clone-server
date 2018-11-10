import { Coordinate } from '../../models/coordinate';
import { DuplexPacket } from '../packet';
import { PacketBuffer } from '../packet-buffer';

export class Point implements Coordinate, DuplexPacket {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  angleTo(coordinate: Coordinate): number {
    const dX = coordinate.x - this.x;
    const dY = coordinate.y - this.y;
    const angleRad = Math.atan2(dY, dX);
    return angleRad * 180 / Math.PI;
  }

  read(buffer: PacketBuffer) {
    this.x = buffer.readFloat();
    this.y = buffer.readFloat();
  }

  write(buffer: PacketBuffer) {
    buffer.writeFloat(this.x);
    buffer.writeFloat(this.y);
  }
}
