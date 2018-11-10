import { Writable } from '../packet';
import { PacketBuffer } from '../packet-buffer';

export class PlayerInfo implements Writable {
  /**
   * The name of this player.
   */
  name: string;
  /**
   * Whether or not this player is ready to start the game.
   */
  ready: boolean;

  constructor(name?: string, ready: boolean = false) {
    this.name = name;
    this.ready = ready;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeString(this.name);
    buffer.writeBoolean(this.ready);
  }
}
