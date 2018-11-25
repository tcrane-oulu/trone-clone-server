import { Emitter, EventListener } from '../util/emitter';
import { GameState } from '../models/game-state';
import { LoadGamePacket } from '../packets/outgoing/load-game';
import { LoadGameAck } from '../packets/incoming/load-game-ack';
import println from '../log/log';
import chalk from 'chalk';
import { Player } from './player';
import { LobbyClient } from '../lobby/lobby-client';
import { PlayerInfo } from '../packets/data/player-info';
import { Direction } from '../models/direction';
import { getSpawnPoint } from '../util/get-spawn-point';
import { TickPacket } from '../packets/outgoing/tick';
import { Game } from './game';

/**
 * This state is used to make sure all of the clients which were in
 * the lobby send a loadgameack.
 */
export class LoadingState extends Emitter implements GameState {
  // this state does not accept new connections.
  accept = false;

  pending: Set<number>;
  listeners: EventListener[];

  constructor(clients: Map<number, LobbyClient>) {
    super();
    this.listeners = [];
    this.pending = new Set(clients.keys());
    const players = new Map<number, Player>();
    for (const [id, lc] of clients) {
      players.set(id, new Player(lc.client, lc.info.name, undefined));
    }
    // wait a maximum of 15 seconds for all responses before terminating the remaining connections.
    const timer = setTimeout(() => {
      for (const id of this.pending) {
        players.get(id).client.io.destroy(new Error('Timeout waiting for LoadGameAck.'));
      }
      println('LoadingState', 'Ack timeout reached. Starting the game.');
      // set up the remaining infos.
      this.sendFirstTick(players);
      this.startGame(players);
    }, 15_000);

    // the clients here are the ones who were in the lobby, so send them a loadgame packet.
    for (const client of [...clients.values()].map((lc) => lc.client)) {
      const loadGame = new LoadGamePacket(client.id, 200);
      client.io.send(loadGame);
      const listener = client.io.once('packet', (packet: LoadGameAck) => {
        this.pending.delete(client.id);
        if (!(packet instanceof LoadGameAck)) {
          client.io.destroy(new Error('Received incorrect response to LoadGame'));
        }
        if (packet.clientId !== client.id) {
          client.io.destroy(new Error('Received incorrect client id.'));
        } else {
          // if we received a good response, we can give this player the initial tick for their position.
          const player = players.get(client.id);
          // set up their player info.
          player.info = new PlayerInfo();
          player.info.direction = Direction.Left;
          player.info.id = player.client.id;
          player.info.position = getSpawnPoint(200, clients.size - this.pending.size, clients.size);
          this.sendFirstTick(players);
        }
        println('LoadingState', `Received response from ${client.id}`);
        // check if we have received all of the responses.
        if (this.pending.size === 0) {
          println('LoadingState', 'All responses received, starting game.');
          clearTimeout(timer);
          // we can start the game.
          this.startGame(players);
        }
      });
      this.listeners.push(listener);
      if (!client.io.socket) {
        const fakeReply = new LoadGameAck();
        fakeReply.clientId = client.id;
        setTimeout(() => {
          client.io.emit('packet', fakeReply);
        }, 2000);
      }
    }
  }

  destroy(): void {
    for (const listener of this.listeners) {
      listener.remove();
    }
    println('LoadingState', chalk.red('Destroyed loading state'));
  }

  private startGame(players: Map<number, Player>) {
    println('LoadingState', `Starting game with ${players.size} players.`);
    // starting the game just involves moving into the next state.
    const game = new Game(players);
    this.emit('next', game);
  }

  private sendFirstTick(players: Map<number, Player>) {
    const withInfo = [...players.values()].filter((player) => player.info);
    println('LoadingState', `Sending initial tick to ${withInfo.length} players.`);
    const tick = new TickPacket(withInfo.map((player) => player.info));
    for (const player of withInfo) {
      player.client.io.send(tick);
    }
  }
}
