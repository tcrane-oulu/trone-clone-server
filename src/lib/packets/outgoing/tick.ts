import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';
import { PlayerInfo } from '../data/player-info';

export class TickPacket implements OutgoingPacket {
  id = PacketType.tick;

  // player info
  players: PlayerInfo[];

  constructor(players: PlayerInfo[] = []) {
    this.players = players;
  }

  write(buffer: PacketBuffer) {
    buffer.writeShort(this.players.length);
    for (const player of this.players) {
      player.write(buffer);
    }
  }
}
