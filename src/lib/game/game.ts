import { LobbyClient } from '../lobby/lobby-client';
import { LoadGamePacket } from '../packets/outgoing/load-game';
import { IncomingPacket } from '../packets/packet';
import { LoadGameAck } from '../packets/incoming/load-game-ack';
import { FailurePacket, FailureCode } from '../packets/outgoing/failure';
// import { StartGamePacket } from '../packets/outgoing/start-game';
import { Player } from './player';
import { getSpawnPoint } from '../util/get-spawn-point';
import println from '../log/log';
import { PacketType } from '../packets/packet-type';
import { Direction } from '../models/direction';
import { PlayerInfo } from '../packets/data/player-info';
import { TickPacket } from '../packets/outgoing/tick';

const MAP_SIZE = 200;
const TICK_RATE = 128;
const SPEED_TILES_PER_TICK = 2 / TICK_RATE;

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

      const info = new PlayerInfo();
      info.id = id;
      info.position = getSpawnPoint(200, i++, players.size);
      info.direction = Direction.Right;

      this.players.set(id, new Player(player[1].io, player[1].info.name, info));
    }
  }

  sendStartGame() {
    // const startTime = new StartGamePacket(Date.now() + 6000);
    // for (const pl of this.players.values()) {
    //   if (pl.io) {
    //     pl.io.send(startTime, 'StartTime packet to start the game at the specified time.');
    //   }
    // }
    // testing, just start the game straight away.
    this.runGame();
    // setTimeout(() => {
    // }, 6000);
  }

  // TODO: implement fully
  runGame() {
    // handle disconnections.
    for (const player of this.players.values()) {
      if (player.io) {
        player.io.socket.once('close', () => {
          player.io = null;
        });
      }
    }
    const tick = new TickPacket([...this.players.values()].map((i) => i.info));
    // send ticks every TICK_RATE ms
    const tickLoop = setInterval(() => {
      for (const [id, player] of this.players) {
        // change the pos of the car according to the direction.
        // move this code somewhere else at some point.
        switch (player.info.direction) {
          case Direction.Right:
            player.info.position.x += SPEED_TILES_PER_TICK;
            break;
          case Direction.Left:
            player.info.position.x -= SPEED_TILES_PER_TICK;
            break;
          case Direction.Up:
            player.info.position.y += SPEED_TILES_PER_TICK;
            break;
          case Direction.Down:
            player.info.position.y -= SPEED_TILES_PER_TICK;
            break;
        }
        if (player.io) {
          player.io.send(tick, `Game tick for ${id}`);
        }
      }
      // the logic for ending the game here is
      // beyond broken fix this at some point.
      if (this.players.size === 1) {
        // end game
        clearInterval(tickLoop);
      }
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
      println('Game', 'Ack timeout reached, ready to start the game.');
      this.sendStartGame();
    }, 30_000);

    for (const player of this.players.values()) {
      if (!player.io) {
        awaitingAck.delete(player.info.id);
        continue;
      }
      const loadGame = new LoadGamePacket(player.info.id, MAP_SIZE);
      player.io.send(loadGame, 'LoadGame packet to prompt clients to load game scene ');
      player.io.once('packet', (packet: IncomingPacket) => {
        if (!(packet instanceof LoadGameAck)) {
          player.io.emit('error', new Error('No LoadGameAck received.'));
          println('Player', `Should've received LoadGameAck but received ${PacketType[packet.id]}`);
          player.io = null;
          awaitingAck.delete(player.info.id);
        } else {
          if (packet.clientId !== player.info.id) {
            const failure = new FailurePacket(FailureCode.IncorrectClientId, 'Incorrect client id provided for game.');
            player.io.send(failure, 'Player did not send correct client id in LoadGameAck.');
            player.io.emit('error', new Error('Invalid client id provided for game.'));
            player.io = null;
            awaitingAck.delete(player.info.id);
            return;
          }
          // send initial tick to tell the player about the game.
          println('Game', 'Sending initial tick for player');
          const initialTick = new TickPacket([...this.players.values()].map((i) => i.info));
          if (player.io) {
            player.io.send(initialTick, 'Initial tick packet.');
          }
          awaitingAck.delete(player.info.id);
          if (awaitingAck.size === 0) {
            clearTimeout(waitingForPlayersTimer);
            println('Game', 'All players have acked. Ready to start the game.');
            this.sendStartGame();
          }
        }
      });
    }
  }
}
