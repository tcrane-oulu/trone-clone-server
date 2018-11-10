import { Socket } from 'net';
import { PacketBuffer } from './packet-buffer';
import { EventEmitter } from 'events';
import { OutgoingPacket, IncomingPacket } from './packet';
import { PacketMap } from './packet-map';
import { PacketType } from './packet-type';
import chalk from 'chalk';
import { forSender } from '../log/log';

export class PacketIO extends EventEmitter {
  incomingBuffer: PacketBuffer;
  outgoingBuffer: PacketBuffer;
  logger: (str: string) => void;

  // tslint:disable-next-line:no-console
  constructor(readonly socket: Socket, readonly name: string) {
    super();
    this.incomingBuffer = new PacketBuffer(5);
    this.outgoingBuffer = new PacketBuffer(1024);
    socket.on('data', this.onData.bind(this));
    this.logger = forSender(chalk.gray(this.name + '::IO'));
  }

  send(packet: OutgoingPacket, reason: string): void {
    if (!reason) {
      this.emit('A reason is required to send a packet.');
      return;
    }
    if (!packet) {
      this.logger(`"${chalk.gray(`"${reason}"`)} - passed an undefined packet.`);
      return;
    }
    this.outgoingBuffer.data.writeInt8(packet.id, 0);
    this.outgoingBuffer.bufferIndex = 5;
    packet.write(this.outgoingBuffer);
    this.outgoingBuffer.resizeBuffer(this.outgoingBuffer.bufferIndex);
    this.outgoingBuffer.data.writeInt32BE(this.outgoingBuffer.length, 1);
    this.logger(`WRITE ${PacketType[packet.id]}, ${this.outgoingBuffer.length}`);
    this.socket.write(this.outgoingBuffer.data.slice(0, this.outgoingBuffer.length));
  }

  private onData(data: Buffer) {
    for (const byte of data) {
      this.checkBuffer();
      this.incomingBuffer.data[this.incomingBuffer.bufferIndex++] = byte;
    }
    this.checkBuffer();
  }

  private checkBuffer(): void {
    if (this.incomingBuffer.remaining === 0) {
      this.incomingBuffer.bufferIndex = 0;
      if (this.incomingBuffer.length === 5) {
        const id = this.incomingBuffer.readUnsignedByte();
        const size = this.incomingBuffer.readInt32();
        // check boundaries
        if (id < 0 || id > 255) {
          this.emit('error', new Error(`Socket ${this.socket.remoteAddress} sent an invalid packet id ${id}.`));
        }
        if (size < 0 || size > 65535) {
          this.emit('error', new Error(`Socket ${this.socket.localAddress} sent an invalid packet length ${size}.`));
        }
        this.incomingBuffer.resizeBuffer(size);
      } else {
        // get the header.
        const id = this.incomingBuffer.readUnsignedByte();
        const length = this.incomingBuffer.readInt32();
        this.logger(`READ ${PacketType[id]}, ${length}`);

        // create the packet
        let packet: IncomingPacket;
        try {
          packet = PacketMap.create(id);
        } catch (error) {
          this.emit('error', new Error(`Unable to create packet of type ${PacketType[id] || id} (${id})`));
        }
        if (packet) {
          packet.read(this.incomingBuffer);
          this.emit('packet', packet);
        }

        // reset the buffer.
        this.incomingBuffer.resizeBuffer(5);
        this.incomingBuffer.bufferIndex = 0;
      }
    }
  }
}
