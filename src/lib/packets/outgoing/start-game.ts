import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class StartGamePacket implements OutgoingPacket {
  id = PacketType.startGame;

  /**
   * The time in milliseconds at which the game will start.
   */
  startTime: number;

  constructor(startTime: number) {
    this.startTime = startTime;
  }

  write(buffer: PacketBuffer) {
    buffer.writeInt32(this.startTime);
  }
}
