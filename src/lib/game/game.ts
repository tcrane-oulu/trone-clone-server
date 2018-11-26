import { Emitter, EventListener } from '../util/emitter';
import { GameState } from '../models/game-state';
import println from '../log/log';
import chalk from 'chalk';
import { Player } from './player';
import { TickPacket } from '../packets/outgoing/tick';
import { Direction } from '../models/direction';
import { SPEED_TILES_PER_TICK, TICK_RATE } from '../globals';
import { PlayerUpdate } from '../packets/incoming/player-update';

/**
 * This state is used to make sure all of the clients which were in
 * the lobby send a loadgameack.
 */
export class Game extends Emitter implements GameState {
  // this state does not accept new connections.
  accept = false;

  listeners: EventListener[];

  constructor(players: Map<number, Player>) {
    super();
    this.listeners = [];
    // attach the player update listeners.
    for (const player of players.values()) {
      const listener = player.client.io.on('packet', (packet: PlayerUpdate) => {
        if (!(packet instanceof PlayerUpdate)) {
          return;
        }
        const dir = packet.newDirection;
        if (!Direction[dir]) {
          println('Game', `Player ${player.client.id} send an invalid direction`);
        }
        // if the player tries to "turn around" (e.g. going from Up to Down),
        // their direction will be equal to (currentDir + 2) % 4. So check that.
        if (packet.newDirection === (player.info.direction + 2) % 4) {
          println('Game', `Player ${player.client.id} tried to turn around.`);
          return;
          // nothing more to see here.
        }
        player.info.direction = packet.newDirection;
      });
      this.listeners.push(listener);
    }
    // start sending ticks straight away.
    const tick = new TickPacket([...players.values()].map((i) => i.info));
    setInterval(() => {
      for (const player of players.values()) {
        if (!player.info) {
          println('Game', `Player ${player.client.id} has undefined info`);
          continue;
        }
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
        player.client.io.send(tick);
      }
    }, 1000 / TICK_RATE);
  }

  destroy(): void {
    for (const listener of this.listeners) {
      listener.remove();
    }
    println('Game', chalk.red('Destroyed game'));
  }
}
