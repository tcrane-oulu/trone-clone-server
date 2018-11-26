import { IncomingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';
import { Direction } from '../../models/direction';

export class PlayerUpdate implements IncomingPacket {
  id = PacketType.playerUpdate;

  newDirection: Direction;

  read(buffer: PacketBuffer) {
    this.newDirection = buffer.readByte();
  }
}
