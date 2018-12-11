import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class EndGamePacket implements OutgoingPacket {
  id = PacketType.endGame;
  /**
   * The id of the player who won the game.
   */
  winnerId: number;
  winnerName: string;

  constructor(winnerId: number, winnerName: string) {
    this.winnerId = winnerId;
    this.winnerName = winnerName;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeInt32(this.winnerId);
    buffer.writeString(this.winnerName);
  }
}
