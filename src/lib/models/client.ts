import { PacketIO } from '../packets/packetio';
import { createObjectId } from '../util/uuid';
import { Socket } from 'net';

export class Client {
  readonly io: PacketIO;
  readonly id: number;
  constructor(socket: Socket) {
    this.io = new PacketIO(socket);
    this.id = createObjectId();
  }
}
