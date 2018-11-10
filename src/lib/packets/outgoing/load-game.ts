import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class LoadGamePacket implements OutgoingPacket {
  id = PacketType.loadGame;

  clientId: number;
  mapSize: number;

  constructor(clientId?: number, mapSize?: number) {
    this.clientId = clientId;
    this.mapSize = mapSize;
  }

  write(buffer: PacketBuffer) {
    buffer.writeUnsignedByte(this.clientId);
    buffer.writeShort(this.mapSize);
  }
}
