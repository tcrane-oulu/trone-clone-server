import { LobbyClient } from './lobby-client';
import { LobbyInfoPacket } from '../packets/outgoing/lobby-info';
import { Game } from '../game/game';
import { LobbyUpdate } from '../packets/incoming/lobby-update';
import { IncomingPacket } from '../packets/packet';
import { PlayerInfo } from '../packets/data/player-info';
import println from '../log/log';

export class Lobby {
  readonly clients: Map<string, LobbyClient>;

  constructor() {
    this.clients = new Map<string, LobbyClient>();
    this.clients.set('Testing Guy', {
      io: null,
      info: new PlayerInfo('Testing Guy', true),
    });
  }

  addClient(clientInfo: LobbyClient) {
    if (this.clients.has(clientInfo.info.name)) {
      // pretty crude, might fix later with regex.
      clientInfo.info.name += ' 1';
    }
    // add the client and let everyone know a new client is connected.
    this.clients.set(clientInfo.info.name, clientInfo);
    this.broadcastUpdate();
    const handleClose = () => {
      const name = clientInfo.info.name;
      println(name, 'disconnected from the lobby');
      this.clients.delete(name);
    };
    const handleUpdate = (packet: IncomingPacket) => {
      if (packet instanceof LobbyUpdate) {
        clientInfo.info.ready = packet.ready;
      }
      // send the update to everyone else
      this.broadcastUpdate();

      // check if we can start the game.
      if (this.clients.size >= 2) {
        if (![...this.clients.values()].some((lc) => !lc.info.ready)) {
          // remove the listeners first.
          for (const client of this.clients.values()) {
            if (client.io) {
              client.io.removeListener('packet', handleUpdate);
              client.io.removeListener('close', handleClose);
            }
          }
          // now we can start.
          this.createGame();
        }
      }
    };
    // attach a listener so we know if they updated their info.
    if (clientInfo.io) {
      clientInfo.io.on('packet', handleUpdate);
      clientInfo.io.once('close', handleClose);
    }
  }

  createGame() {
    // clone the players.
    const players = new Map(this.clients);
    this.clients.clear();
    // start the new game.
    const game = new Game(players);
    game.start();
  }

  private broadcastUpdate() {
    const lobbyInfo = new LobbyInfoPacket();
    lobbyInfo.playerInfo = [...this.clients.values()].map((lc) => lc.info);
    for (const client of this.clients.values()) {
      // send lobby info.
      if (client.io) {
        client.io.send(lobbyInfo, 'Sending lobby info to client.');
      }
    }
  }
}
