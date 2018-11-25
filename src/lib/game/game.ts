import { Emitter, EventListener } from '../util/emitter';
import { GameState } from '../models/game-state';
import println from '../log/log';
import chalk from 'chalk';
import { Player } from './player';
import { TickPacket } from '../packets/outgoing/tick';
import { Direction } from '../models/direction';

// const MAP_SIZE = 200;
const TICK_RATE = 48;
const SPEED_TILES_PER_TICK = 2 / TICK_RATE;

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
