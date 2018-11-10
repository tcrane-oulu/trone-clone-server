import { IncomingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class LobbyUpdate implements IncomingPacket {
  id = PacketType.lobbyUpdate;

  ready: boolean;

  read(buffer: PacketBuffer) {
    this.ready = buffer.readBoolean();
  }
}
