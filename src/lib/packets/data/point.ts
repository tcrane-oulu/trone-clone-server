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

  read(buffer: PacketBuffer) {
    this.x = buffer.readFloat();
    this.y = buffer.readFloat();
  }

  write(buffer: PacketBuffer) {
    buffer.writeFloat(this.x);
    buffer.writeFloat(this.y);
  }
}
