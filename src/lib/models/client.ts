import { PacketIO } from '../packets/packetio';
import { createObjectId } from '../util/uuid';
import { Socket } from 'net';
import println from '../log/log';

export class Client {
  readonly io: PacketIO;
  readonly id: number;
  constructor(socket: Socket) {
    this.io = new PacketIO(socket);
    this.io.once('error', (err) => {
      println('Socket', err.message);
      this.io.destroy(err);
    });
    this.id = createObjectId();
  }
}
