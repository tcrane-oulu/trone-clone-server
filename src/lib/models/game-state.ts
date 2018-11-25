import { Emitter } from '../util/emitter';

export interface GameState extends Emitter {
  /**
   * Whether or not this state accepts new connections.
   * If this is false, then the server should create a
   * new session to handle new connections which occur.
   */
  accept: boolean;

  /**
   * Called by a session when it moves into another
   * state and thus no longer requires this state.
   */
  destroy(): void;
}
