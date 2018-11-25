import { Socket } from 'net';
import { PacketBuffer } from './packet-buffer';
import { OutgoingPacket, IncomingPacket } from './packet';
import { PacketMap } from './packet-map';
import { PacketType } from './packet-type';
import { Emitter } from '../util/emitter';

export class PacketIO extends Emitter {
  incomingBuffer: PacketBuffer;
  outgoingBuffer: PacketBuffer;

  // tslint:disable-next-line:no-console
  constructor(readonly socket: Socket) {
    super();
    this.incomingBuffer = new PacketBuffer(5);
    this.outgoingBuffer = new PacketBuffer(1024);
    // there might not be a socket if this is was created for a dummy client.
    if (this.socket) {
      socket.on('data', this.onData.bind(this));
    }
  }

  send(packet: OutgoingPacket): void {
    if (!this.socket || !this.socket.writable) {
      return;
    }
    if (!packet) {
      return;
    }
    this.outgoingBuffer.data.writeInt8(packet.id, 0);
    this.outgoingBuffer.bufferIndex = 5;
    packet.write(this.outgoingBuffer);
    this.outgoingBuffer.resizeBuffer(this.outgoingBuffer.bufferIndex);
    this.outgoingBuffer.data.writeInt32BE(this.outgoingBuffer.length, 1);
    this.socket.write(this.outgoingBuffer.data.slice(0, this.outgoingBuffer.length));
  }

  destroy(error?: Error) {
    if (this.socket) {
      this.socket.destroy(error);
    }
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
        this.incomingBuffer.readInt32(); // skip the length

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
