import { PacketType } from './packet-type';
import { IncomingPacket } from './packet';
import { LoginPacket } from './incoming/login';
import { LoadGameAck } from './incoming/load-game-ack';
import { LobbyUpdate } from './incoming/lobby-update';

export class PacketMap {
  static create(id: PacketType): IncomingPacket {
    switch (id) {
      case PacketType.login:
        return new LoginPacket();
      case PacketType.loadGameAck:
        return new LoadGameAck();
      case PacketType.lobbyUpdate:
        return new LobbyUpdate();
    }
    throw new Error(`No packet mapped to the packet id ${PacketType[id]}`);
  }
}
