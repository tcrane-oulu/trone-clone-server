import { LobbyClient } from '../lobby/lobby-client';
import { LoadGamePacket } from '../packets/outgoing/load-game';
import { IncomingPacket } from '../packets/packet';
import { LoadGameAck } from '../packets/incoming/load-game-ack';
import { FailurePacket, FailureCode } from '../packets/outgoing/failure';
import { StartGamePacket } from '../packets/outgoing/start-game';
import { Player } from './player';
import { getSpawnPoint } from '../util/get-spawn-point';
import println from '../log/log';
import { PacketType } from '../packets/packet-type';

const MAP_SIZE = 200;
const TICK_RATE = 1000 / 128;
// const SPEED_TILES_PER_TICK = 2 / TICK_RATE;

export class Game {

  players: Map<number, Player>;
  get nextId(): number {
    return this._id++;
  }
  // tslint:disable-next-line:variable-name
  private _id: number = 0;

  constructor(players: Map<string, LobbyClient>) {
    this.players = new Map();
    let i = 0;
    for (const player of players) {
      const id = this.nextId;
      this.players.set(id, new Player(
        player[1].io,
        id,
        player[1].info.name,
        getSpawnPoint(200, i++, players.size),
      ));
    }
  }

  sendStartGame() {
    const startTime = new StartGamePacket(Date.now() + 6000);
    for (const pl of this.players.values()) {
      if (pl.io) {
        pl.io.send(startTime, 'StartTime packet to start the game at the specified time.');
      }
    }
    setTimeout(() => {
      this.runGame();
    }, 6000);
  }

  // TODO: implement fully
  runGame() {
    // send ticks every 1000 / TICK_RATE ms
    const tickLoop = setInterval(() => {
      // end game
      clearInterval(tickLoop);
    }, 1000 / TICK_RATE);
  }

  start() {
    /**
     * Starting the game:
     *
     * First, send a LoadGamePacket to all players in the lobby.
     * Attach a packet listener and wait for the LoadGameAck.
     * At the same time, start a timer for 30 seconds.
     * Once all LoadGameAcks have been received, send the StartGameAck packet.
     * If there are unreceived acks once the timer is up, kick those players
     * If the first packet received is not an ack, kick those players.
     */
    const awaitingAck = new Set(this.players.keys());
    const waitingForPlayersTimer = setTimeout(() => {
      for (const id of awaitingAck) {
        if (this.players.get(id).io) {
          this.players.get(id).io.emit('error', new Error('Timeout waiting for LoadGameAck.'));
        }
        this.players.get(id).io = null;
      }
      this.sendStartGame();
    }, 30_000);

    for (const player of this.players.values()) {
      if (!player.io) {
        continue;
      }
      const loadGame = new LoadGamePacket(player.id, MAP_SIZE);
      player.io.send(loadGame, 'LoadGame packet to prompt clients to load game scene ');
      player.io.once('packet', (packet: IncomingPacket) => {
        if (!(packet instanceof LoadGameAck)) {
          player.io.emit('error', new Error('No LoadGameAck received.'));
          println('Player', PacketType[packet.id]);
          player.io = null;
          awaitingAck.delete(player.id);
        } else {
          if (packet.clientId !== player.id) {
            const failure = new FailurePacket(FailureCode.IncorrectClientId, 'Incorrect client id provided for game.');
            player.io.send(failure, 'Player did not send correct client id in LoadGameAck.');
            player.io.emit('error', new Error('Invalid client id provided for game.'));
            player.io = null;
            awaitingAck.delete(player.id);
            return;
          }
          awaitingAck.delete(player.id);
          if (awaitingAck.size === 0) {
            clearTimeout(waitingForPlayersTimer);
            this.sendStartGame();
          }
        }
      });
    }
  }
}
