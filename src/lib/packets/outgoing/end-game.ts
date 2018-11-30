import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class EndGamePacket implements OutgoingPacket {
  id = PacketType.endGame;
  /**
   * The id of the player who won the game.
   */
  winnerId: number;

  constructor(winnerId: number) {
    this.winnerId = winnerId;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeInt32(this.winnerId);
  }
}
