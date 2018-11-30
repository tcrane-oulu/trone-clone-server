import { PlayerInfo } from '../packets/data/player-info';
import { Client } from '../models/client';

export class Player {
  client: Client;
  name: string;
  info: PlayerInfo;
  dead: boolean;

  constructor(client: Client, name: string, info: PlayerInfo) {
    this.client = client;
    this.name = name;
    this.info = info;
    this.dead = false;
  }
}
