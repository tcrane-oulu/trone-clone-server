import { OutgoingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class StartGamePacket implements OutgoingPacket {
  id = PacketType.startGame;

  /**
   * The number of seconds until the game starts.
   */
  startTime: number;

  constructor(startTime: number) {
    this.startTime = startTime;
  }

  write(buffer: PacketBuffer) {
    buffer.writeInt32(this.startTime);
  }
}
