import { Point } from './point';
import { Direction } from '../../models/direction';
import { DuplexPacket } from '../packet';
import { PacketBuffer } from '../packet-buffer';

export class PlayerInfo implements DuplexPacket {
  id: number;
  position: Point;
  direction: Direction;
  read(buffer: PacketBuffer): void {
    this.id = buffer.readInt32();
    this.position = new Point();
    this.position.read(buffer);
    this.direction = buffer.readByte();
  }
  write(buffer: PacketBuffer): void {
    buffer.writeInt32(this.id);
    this.position.write(buffer);
    buffer.writeByte(this.direction);
  }
}
