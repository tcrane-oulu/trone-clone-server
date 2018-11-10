import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';
import { PlayerInfo } from '../data/player-info';

export class LobbyInfoPacket implements OutgoingPacket {
  id = PacketType.lobbyInfo;
  /**
   * Information about the players currently connected to the lobby.
   */
  playerInfo: PlayerInfo[];

  constructor(playerInfo: PlayerInfo[] = []) {
    this.playerInfo = playerInfo;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeShort(this.playerInfo.length);
    for (const info of this.playerInfo) {
      info.write(buffer);
    }
  }
}
