import { PacketType } from './packet-type';
import { PacketBuffer } from './packet-buffer';

export interface Readable {
  read(buffer: PacketBuffer): void;
}

export interface Writable {
  write(buffer: PacketBuffer): void;
}

export interface Identifiable {
  id: PacketType;
}

export type IncomingPacket = Identifiable & Readable;
export type OutgoingPacket = Identifiable & Writable;
export type DuplexPacket = Readable & Writable;
