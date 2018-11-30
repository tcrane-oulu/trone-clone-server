import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class DeathPacket implements OutgoingPacket {
  id = PacketType.death;
  /**
   * The id of the player who died.
   */
  playerId: number;

  constructor(playerId: number) {
    this.playerId = playerId;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeInt32(this.playerId);
  }
}
