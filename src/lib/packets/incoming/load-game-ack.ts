import { IncomingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class LoadGameAck implements IncomingPacket {
  id = PacketType.loadGameAck;

  clientId: number;

  read(buffer: PacketBuffer) {
    this.clientId = buffer.readInt32();
  }
}
