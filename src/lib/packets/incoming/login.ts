import { IncomingPacket } from '../packet';
import { PacketType } from '../packet-type';
import { PacketBuffer } from '../packet-buffer';

export class LoginPacket implements IncomingPacket {
  id = PacketType.login;

  name: string;
  version: number;

  read(buffer: PacketBuffer): void {
    this.name = buffer.readString();
    this.version = buffer.readInt32();
  }
}
