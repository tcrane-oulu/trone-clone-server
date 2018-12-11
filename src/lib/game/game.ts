import { Emitter, EventListener } from '../util/emitter';
import { GameState } from '../models/game-state';
import println from '../log/log';
import chalk from 'chalk';
import { Player } from './player';
import { TickPacket } from '../packets/outgoing/tick';
import { Direction } from '../models/direction';
import { SPEED_TILES_PER_TICK, TICK_RATE, MAP_SIZE } from '../globals';
import { PlayerUpdate } from '../packets/incoming/player-update';
import { Coordinate, outOfBounds } from '../models/coordinate';
import { DeathPacket } from '../packets/outgoing/death-packet';
import { EndGamePacket } from '../packets/outgoing/end-game';

/**
 * This state is used to make sure all of the clients which were in
 * the lobby send a loadgameack.
 */
export class Game extends Emitter implements GameState {
  // this state does not accept new connections.
  accept = false;

  listeners: Map<number, EventListener>;
  grid: boolean[][];
  lastTiles: Map<number, Coordinate>;
  tickInterval: any;

  constructor(readonly players: Map<number, Player>) {
    super();
    this.lastTiles = new Map();
    // init grid
    this.grid = [];
    for (let x = 0; x <= MAP_SIZE; x++) {
      this.grid[x] = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        this.grid[x][y] = false;
      }
    }
    println('Map', 'Created grid.');
    this.listeners = new Map();
    // attach the player update listeners.
    for (const player of players.values()) {
      // set up the initial positions.
      const floored = player.info.position.floor();
      this.lastTiles.set(player.client.id, floored);
      this.grid[floored.x][floored.y] = true;
      const listener = player.client.io.on('packet', (packet: PlayerUpdate) => {
        if (!(packet instanceof PlayerUpdate)) {
          // at this point we only care about player updates.
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
          // nothing more to see here.
          return;
        }
        player.info.direction = packet.newDirection;
      });
      this.listeners.set(player.client.id, listener);
    }
    // start sending ticks straight away.
    this.tickInterval = setInterval(() => {
      const tick = new TickPacket([...players.values()].filter((p) => !p.dead).map((i) => i.info));
      const deaths = this.updatePositions();
      const deathPackets = [];
      if (deaths.length > 0) {
        // process any deaths.
        for (const id of deaths) {
          if (this.listeners.has(id)) {
            this.listeners.get(id).remove();
            this.listeners.delete(id);
          }
          this.players.get(id).dead = true;
          const deathPacket = new DeathPacket(id);
          deathPackets.push(deathPacket);
        }
        println('Game', `Killed ${deaths.join(', ')}`);
      }
      let aliveCount = 0;
      for (const player of players.values()) {
        if (!player.dead) {
          aliveCount++;
        }
        player.client.io.send(tick);
        for (const death of deathPackets) {
          player.client.io.send(death);
        }
      }
      // if there are 0 or 1 alive players left, the game is over.
      if (aliveCount <= 1) {
        let winner: Player;
        if (aliveCount === 1) {
          // we have a winner.
          winner = [...players.values()].filter((p) => !p.dead)[0];
        }
        let endGame: EndGamePacket;
        if (winner) {
          endGame = new EndGamePacket(winner.client.id, winner.name);
        } else {
          endGame = new EndGamePacket(-1, 'Tie');
        }
        for (const player of players.values()) {
          player.client.io.send(endGame);
        }
        if (this.tickInterval) {
          clearInterval(this.tickInterval);
          this.tickInterval = undefined;
        }
        setTimeout(() => {
          this.emit('next', undefined); // this session is over.
        }, 1000);
      }
    }, 1000 / TICK_RATE);
  }

  destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    for (const [id, listener] of this.listeners) {
      listener.remove();
      this.listeners.delete(id);
    }
    println('Game', chalk.red('Destroyed game'));
  }

  /**
   * Updates the positions of players and returns the ids of any players who died.
   */
  private updatePositions(): number[] {
    const deaths: number[] = [];
    for (const player of this.players.values()) {
      if (player.dead) {
        continue;
      }
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
      // check map bounds.
      if (outOfBounds(player.info.position)) {
        // kill and continue, we don't want to check active tiles if they are out of bounds.
        deaths.push(player.client.id);
        continue;
      }

      // check if they have stepped onto an active tile
      const floored = player.info.position.floor();
      if (this.grid[floored.x][floored.y]) {
        // that they weren't already standing on
        const lastTile = this.lastTiles.get(player.client.id);
        if (lastTile.x !== floored.x || lastTile.y !== floored.y) {
          // they are dead.
          deaths.push(player.info.id);
        }
      } else {
        // the tile is now active.
        this.grid[floored.x][floored.y] = true;
      }
      // always set the last tile.
      this.lastTiles.set(player.client.id, floored);
    }
    return deaths;
  }
}
