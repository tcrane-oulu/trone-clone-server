import { PacketIO } from '../packets/packetio';
import { PlayerInfo } from '../packets/data/player-info';

export class Player {
  io: PacketIO;
  name: string;
  info: PlayerInfo;

  constructor(io: PacketIO, name: string, info: PlayerInfo) {
    this.io = io;
    this.name = name;
    this.info = info;
  }
}
