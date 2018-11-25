import { GameState } from '../models/game-state';
import { LobbyState } from '../lobby/lobby';
import { Client } from '../models/client';
import { Emitter } from '../util/emitter';
import println from '../log/log';

export class Session extends Emitter {

  readonly clients: Map<number, Client>;
  get canAccept(): boolean {
    if (!this.currentState) {
      return false;
    }
    return this.currentState.accept;
  }

  private currentState: GameState;

  constructor() {
    super();
    this.next(new LobbyState(this));
    this.clients = new Map();
  }

  accept(client: Client): void {
    this.clients.set(client.id, client);
    // make sure we know when they disconnect.
    client.io.socket.once('close', () => {
      // broadcast the event
      process.nextTick(() => {
        this.emit('leave', client);
      });
      this.clients.delete(client.id);
      if (this.clients.size === 0) {
        // if there are no more connections,
        // we can destroy this session.
        this.destroy();
      }
    });
    // broadcast the event
    process.nextTick(() => {
      this.emit('enter', client);
    });
  }

  private next(state: GameState) {
    println('Session', 'Entering new state.');
    if (this.currentState) {
      this.currentState.destroy();
    }
    this.currentState = state;
    this.currentState.once('next', this.next.bind(this));
  }

  private destroy(): void {
    // destroy all the connected sockets.
    for (const client of this.clients.values()) {
      client.io.destroy();
    }
    this.clients.clear();
    // place this session in an undefined state.
    if (this.currentState) {
      this.currentState.destroy();
    }
    this.currentState = undefined;

    // finally, emit the close event.
    process.nextTick(() => {
      this.emit('close');
    });
  }
}
